import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { useAtom } from 'jotai';

import {
  DailyGoal,
  DailyGoalsService,
  SessionCountersService,
  SessionCounter as SessionCounterType,
  StudyBlock,
  StudyBlocksService,
  StudyBlockUpdate,
  StudyCategoriesService,
  StudyCategory,
  TimeSettings,
  TimeSettingsService,
} from '@api';
import { getCurrentUTC, getTodayDateRange, toLocalTime, toUTC } from '@utils/dateUtils';
import SessionCounterModal from '../session-counter/session-counter-modal';
import TimeSettingsModal from '../time-settings/time-settings-view';
import { useModalContext } from '@app/context/modal/modal-context';
import SessionCounter from '../session-counter/session-counter';
import { createMutationErrorHandler } from '@utils/httpUtils';
import { TimerMode, timerModeAtom } from '../../store/atoms';
import useToast from '@context/toasts/toast-context';

// Constants and utility functions
const QUERY_KEYS = {
  studyCategories: 'studyCategories',
  dailyGoals: 'dailyGoals',
  studyBlocks: 'studyBlocks',
  sessionCounters: 'sessionCounters',
  timeSettings: 'timeSettings',
};

const minutesToSeconds = (minutes: number) => minutes * 60;
const secondsToMilliseconds = (seconds: number) => seconds * 1000;
const millisecondsToSeconds = (milliseconds: number) => Math.floor(milliseconds / 1000);

const DEFAULT_DURATION = minutesToSeconds(60);
const FINAL_BELL_BUFFER = 5000;

type TimerState = {
  time: number;
  isActive: boolean;
  isBreakMode: boolean;
  studyBlockId: number | null;
};

const Timer: React.FC = () => {
  const { addToast } = useToast();
  const { showModal } = useModalContext();
  const handleMutationError = createMutationErrorHandler(addToast);
  const queryClient = useQueryClient();
  const dateRange = getTodayDateRange();
  const [audio, setAudio] = useState<{
    break: HTMLAudioElement | null;
    interval: HTMLAudioElement | null;
    end: HTMLAudioElement | null;
  }>({
    break: null,
    interval: null,
    end: null,
  });

  const [mode, setMode] = useAtom(timerModeAtom);
  const [timerState, setTimerState] = useState<TimerState>({
    time: DEFAULT_DURATION,
    isActive: false,
    isBreakMode: false,
    studyBlockId: null,
  });
  const [initialTimeSet, setInitialTimeSet] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  // Queries
  const { data: categoriesData } = useQuery<StudyCategory[]>({
    queryKey: [QUERY_KEYS.studyCategories],
    queryFn: () => StudyCategoriesService.readStudyCategoriesStudyCategoriesGet(),
  });

  const { data: dailyGoalsData } = useQuery<DailyGoal[]>({
    queryKey: [QUERY_KEYS.dailyGoals],
    queryFn: () => DailyGoalsService.readDailyGoalsDailyGoalsGet(),
  });

  const { data: studyBlocksData } = useQuery<StudyBlock[]>({
    queryKey: [QUERY_KEYS.studyBlocks, dateRange.start_time, dateRange.end_time],
    queryFn: () => StudyBlocksService.queryStudyBlocksStudyBlocksQueryPost(dateRange),
  });

  const { data: sessionCountersData = [] } = useQuery<SessionCounterType[]>({
    queryKey: [QUERY_KEYS.sessionCounters],
    queryFn: () => SessionCountersService.readSessionCountersSessionCountersGet(),
  });

  const { data: timeSettingsData } = useQuery<TimeSettings[]>({
    queryKey: [QUERY_KEYS.timeSettings],
    queryFn: () => TimeSettingsService.readTimeSettingsListTimeSetttingsGet(),
  });

  const activeCategory = categoriesData?.find((cat) => cat.is_selected);
  const activeDailyGoal = dailyGoalsData?.find((goal) => goal.is_selected);
  const activeSessionCounter = sessionCountersData?.find((counter) => counter.is_selected);
  const activeTimeSettings = timeSettingsData?.find((settings) => settings.is_selected);

  const createStudyBlockMutation = useMutation({
    mutationFn: StudyBlocksService.createStudyBlockStudyBlocksPost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.studyBlocks] });
      return data;
    },
    onError: handleMutationError('create study block'),
  });

  const updateStudyBlockMutation = useMutation({
    mutationFn: ({ id, block }: { id: number; block: StudyBlockUpdate }) =>
      StudyBlocksService.updateStudyBlockStudyBlocksStudyBlockIdPatch(id, block),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.studyBlocks] });
    },
    onError: handleMutationError('update study block'),
  });

  const createSessionCounterMutation = useMutation({
    mutationFn: (counter: { target: number; completed: number; is_selected: boolean }) =>
      SessionCountersService.createSessionCounterSessionCountersPost(counter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sessionCounters] });
    },
    onError: handleMutationError('create session counter'),
  });

  const updateSessionCounterMutation = useMutation({
    mutationFn: (counter: { id: number; completed: number }) =>
      SessionCountersService.updateSessionCounterSessionCountersSessionCounterIdPatch(counter.id, {
        completed: counter.completed,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sessionCounters] });
    },
    onError: handleMutationError('update session counter'),
  });

  const updateFavicon = useCallback((state: 'default' | 'active' | 'break') => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link && link.href !== `/images/favicon-${state}.ico`) {
      link.href = `/images/favicon-${state}.ico`;
    }
  }, []);

  useEffect(() => {
    if (timerState.isActive && !timerState.isBreakMode) {
      updateFavicon('active');
    } else if (timerState.isActive && timerState.isBreakMode) {
      updateFavicon('break');
    } else {
      updateFavicon('default');
    }
  }, [timerState.isActive, timerState.isBreakMode, updateFavicon]);

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const workerCode = `
      let interval = null;
      self.onmessage = (e) => {
        if (e.data === 'start') {
          interval = self.setInterval(() => {
            self.postMessage('tick');
          }, 1000);
        } else if (e.data === 'stop') {
          if (interval !== null) {
            self.clearInterval(interval);
            interval = null;
          }
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  useEffect(() => {
    setAudio({
      break: new Audio('/audio/break_chime.mp3'),
      interval: new Audio('/audio/interval_chime.mp3'),
      end: new Audio('/audio/end_chime.mp3'),
    });

    return () => {
      Object.values(audio).forEach((audioElement) => {
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
        }
      });
    };
  }, []);

  const playChime = useCallback(
    (type: 'break' | 'interval' | 'end') => {
      if (audio[type] && activeTimeSettings?.is_sound !== false) {
        audio[type]?.play().catch((error) => console.error(`Error playing ${type} audio:`, error));
      }
    },
    [audio, activeTimeSettings?.is_sound],
  );

  const handleTimerFinished = useCallback(
    async (newCompleted: number) => {
      playChime('end');
      sendNotification('Timer Finished', 'Time to take a break!');

      if (activeSessionCounter) {
        await updateSessionCounterMutation.mutateAsync({
          id: activeSessionCounter.id,
          completed: newCompleted,
        });
      }

      const longBreakInterval = activeTimeSettings?.long_break_interval || 2;
      const breakDuration =
        newCompleted % longBreakInterval === 0
          ? activeTimeSettings?.long_break_duration || 30
          : activeTimeSettings?.short_break_duration || 5;

      setTimerState((prev) => ({
        ...prev,
        isBreakMode: true,
        time: minutesToSeconds(breakDuration),
      }));
    },
    [
      playChime,
      sendNotification,
      activeSessionCounter,
      activeTimeSettings?.long_break_interval,
      activeTimeSettings?.long_break_duration,
      activeTimeSettings?.short_break_duration,
      updateSessionCounterMutation,
    ],
  );

  const completeDueStudyBlock = useCallback(
    async (studyBlockId: number, endTime: string) => {
      await updateStudyBlockMutation.mutateAsync({
        id: studyBlockId,
        block: { end_time: endTime },
      });

      if (activeSessionCounter) {
        await updateSessionCounterMutation.mutateAsync({
          id: activeSessionCounter.id,
          completed: activeSessionCounter.completed + 1,
        });
      }
    },
    [updateStudyBlockMutation, activeSessionCounter, updateSessionCounterMutation],
  );

  const stopTimer = useCallback(
    async (completed = false) => {
      if (timerState.studyBlockId && !timerState.isBreakMode) {
        await updateStudyBlockMutation.mutateAsync({
          id: timerState.studyBlockId,
          block: { end_time: getCurrentUTC() },
        });
      }

      if (!completed) {
        setTimerState((prev) => ({
          ...prev,
          isActive: false,
          isBreakMode: false,
          studyBlockId: null,
          time:
            mode === TimerMode.Countdown
              ? activeTimeSettings?.duration
                ? minutesToSeconds(activeTimeSettings.duration)
                : DEFAULT_DURATION
              : 0,
        }));
        if (workerRef.current) workerRef.current.postMessage('stop');
      }

      if (completed && mode === TimerMode.Countdown) {
        const newCompleted = (activeSessionCounter?.completed || 0) + 1;
        await handleTimerFinished(newCompleted);
      }
    },
    [
      timerState.studyBlockId,
      timerState.isBreakMode,
      activeSessionCounter,
      mode,
      updateStudyBlockMutation,
      handleTimerFinished,
      activeTimeSettings,
    ],
  );

  const handleTick = useCallback(() => {
    setTimerState((prev) => {
      const newTime = mode === TimerMode.Countdown ? Math.max(prev.time - 1, 0) : prev.time + 1;
      if (
        prev.isActive &&
        !prev.isBreakMode &&
        activeTimeSettings?.sound_interval &&
        activeTimeSettings.is_sound !== false
      ) {
        const elapsedTime = mode === TimerMode.Countdown ? (activeTimeSettings.duration || 0) * 60 - newTime : newTime;
        const remainingTime = secondsToMilliseconds(mode === TimerMode.Countdown ? newTime : elapsedTime);
        if (
          remainingTime > FINAL_BELL_BUFFER &&
          elapsedTime > 0 &&
          elapsedTime % minutesToSeconds(activeTimeSettings.sound_interval) === 0
        ) {
          playChime('interval');
        }
      }

      if (mode === TimerMode.Countdown && newTime === 0) {
        if (prev.isBreakMode) {
          stopTimer();
          sendNotification('Break Finished', 'Time to start working!');
          playChime('break');
        } else {
          stopTimer(true);
        }
      }

      return { ...prev, time: newTime };
    });
  }, [
    mode,
    activeTimeSettings?.sound_interval,
    activeTimeSettings?.is_sound,
    activeTimeSettings?.duration,
    playChime,
    stopTimer,
    sendNotification,
  ]);

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.onmessage = handleTick;
    }
  }, [handleTick]);

  useEffect(() => {
    if (!timerState.isActive && initialTimeSet) {
      const newTime = activeTimeSettings
        ? minutesToSeconds(activeTimeSettings.duration || DEFAULT_DURATION / 60)
        : DEFAULT_DURATION;

      setTimerState((prev) => ({
        ...prev,
        time: newTime,
      }));
    }
  }, [activeTimeSettings, initialTimeSet, timerState.isActive]);

  useEffect(() => {
    if (!studyBlocksData || !timeSettingsData || !sessionCountersData || initialTimeSet) return;

    const incompleteBlock = studyBlocksData.find((block) => !block.end_time);

    if (incompleteBlock) {
      const startTime = toLocalTime(incompleteBlock.start_time).getTime();
      const elapsedMilliseconds = Date.now() - startTime;
      let newTime;
      let duration;
      if (incompleteBlock.is_countdown) {
        duration = activeTimeSettings?.duration ? minutesToSeconds(activeTimeSettings.duration) : DEFAULT_DURATION;
        newTime = secondsToMilliseconds(duration) - elapsedMilliseconds;
        if (newTime <= 0) {
          const durationInMilliseconds = secondsToMilliseconds(duration);
          const finalTime = new Date(startTime + durationInMilliseconds);
          const finalTimeUTC = toUTC(finalTime);
          completeDueStudyBlock(incompleteBlock.id, finalTimeUTC);
          setInitialTimeSet(true);
          return;
        }
      } else {
        newTime = elapsedMilliseconds;
      }
      setTimerState((prev) => ({
        ...prev,
        studyBlockId: incompleteBlock.id,
        time: millisecondsToSeconds(newTime),
        isActive: true,
      }));
      setMode(incompleteBlock.is_countdown ? TimerMode.Countdown : TimerMode.OpenSession);
      if (workerRef.current) workerRef.current.postMessage('start');
    } else if (activeTimeSettings) {
      setTimerState((prev) => ({
        ...prev,
        time: minutesToSeconds(activeTimeSettings.duration || DEFAULT_DURATION / 60),
      }));
    }

    setInitialTimeSet(true);
  }, [
    studyBlocksData,
    timeSettingsData,
    sessionCountersData,
    initialTimeSet,
    activeTimeSettings,
    activeSessionCounter,
    completeDueStudyBlock,
    setMode,
  ]);

  useEffect(() => {
    const formattedTime = formatTime(timerState.time);
    let title = 'Timer';

    if (timerState.isActive || timerState.isBreakMode) {
      if (timerState.isBreakMode) {
        title = `${formattedTime} - BREAK`;
      } else if (mode === TimerMode.Countdown) {
        title = `${formattedTime} - ${activeSessionCounter ? activeSessionCounter.completed + 1 : 1}/${activeSessionCounter ? activeSessionCounter.target : 5
          }`;
      } else {
        title = formattedTime;
      }
    }

    document.title = title;

    return () => {
      document.title = 'Timer';
    };
  }, [timerState, activeSessionCounter, mode]);

  const startTimer = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    if (!activeSessionCounter) {
      await createSessionCounterMutation.mutateAsync({
        completed: 0,
        target: 5,
        is_selected: true,
      });
    }

    const newBlock = await createStudyBlockMutation.mutateAsync({
      is_countdown: mode === TimerMode.Countdown,
      daily_goal_id: activeDailyGoal?.id,
      study_category_id: activeCategory?.id,
    });

    if (workerRef.current) workerRef.current.postMessage('start');

    setTimerState((prev) => ({
      ...prev,
      isActive: true,
      studyBlockId: newBlock.id,
    }));
  };

  const toggleMode = () => {
    if (timerState.isActive) return;
    setMode((prevMode) => {
      const newMode = prevMode === TimerMode.Countdown ? TimerMode.OpenSession : TimerMode.Countdown;
      const newTime =
        newMode === TimerMode.Countdown
          ? activeTimeSettings?.duration
            ? minutesToSeconds(activeTimeSettings.duration)
            : DEFAULT_DURATION
          : 0;
      setTimerState((prev) => ({ ...prev, time: newTime }));
      return newMode;
    });
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isButtonDisabled = (timerMode: TimerMode) => {
    return timerState.isActive && mode !== timerMode;
  };

  const openSettingsModal = () => {
    showModal({
      type: 'default',
      title: 'Time Settings Menu',
      message: 'Select from different time settings. Customise the timer to your preferences.',
      content: <TimeSettingsModal />,
    });
  };

  const openSessionsModal = () => {
    showModal({
      type: 'default',
      title: 'Streak Counter',
      message: 'Set a goal for how many pomodoro cycles you want to complete in your study session, and blow past it!',
      content: <SessionCounterModal />,
    });
  };

  const resetSessionCounter = () => {
    if (activeSessionCounter) {
      createSessionCounterMutation.mutate({ target: activeSessionCounter.target, completed: 0, is_selected: true });
    }
  };

  return (
    <>
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
        <div className="flex flex-col items-center">
          {!timerState.isBreakMode && (
            <div className="mb-4 flex space-x-4">
              {Object.values(TimerMode).map((timerMode) => (
                <button
                  key={timerMode}
                  onClick={toggleMode}
                  disabled={isButtonDisabled(timerMode)}
                  className={classNames(
                    'text-sm font-medium transition-colors',
                    mode === timerMode
                      ? 'text-blue-500 font-semibold'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                    isButtonDisabled(timerMode) && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {timerMode}
                </button>
              ))}
            </div>
          )}
          {timerState.isBreakMode && (
            <p className="mb-2 text-lg font-medium text-blue-500">
              {timerState.time > minutesToSeconds(activeTimeSettings?.short_break_duration || 5)
                ? 'Long Break'
                : 'Short Break'}
            </p>
          )}
          <p className="mb-2 text-6xl font-bold text-gray-900 dark:text-white mb-4">{formatTime(timerState.time)}</p>
          <div className="flex space-x-3 h-10">
            {!timerState.isActive && (
              <button
                onClick={openSettingsModal}
                className="flex items-center justify-center rounded-full px-4 h-full transition-colors bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                <span className="whitespace-nowrap">Settings</span>
              </button>
            )}
            {!timerState.isBreakMode && (
              <button
                onClick={timerState.isActive ? () => stopTimer() : startTimer}
                className={classNames(
                  'flex items-center justify-center rounded-full px-6 h-full text-sm font-semibold text-white transition-colors',
                  timerState.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600',
                )}
              >
                {timerState.isActive ? 'Stop' : 'Start'}
              </button>
            )}
            {timerState.isBreakMode && (
              <button
                onClick={() => stopTimer()}
                className="flex items-center justify-center rounded-full px-6 h-full text-sm font-semibold text-white transition-colors bg-red-500 hover:bg-red-600"
              >
                End
              </button>
            )}
          </div>
        </div>
      </div>
      {mode === TimerMode.Countdown && (
        <div className='rounded-lg bg-white dark:bg-gray-800 p-6 shadow'>
          <SessionCounter
            target={activeSessionCounter ? activeSessionCounter.target : 5}
            completed={activeSessionCounter ? activeSessionCounter.completed : 0}
            isActive={timerState.isActive}
            isBreak={timerState.isBreakMode}
            onReset={resetSessionCounter}
            onClick={openSessionsModal}
          />
        </div>
      )}
    </>
  );
};

export default Timer;
