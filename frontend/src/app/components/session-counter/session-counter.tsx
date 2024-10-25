import { useModalContext } from '@app/context/modal/modal-context';
import useToast from '@app/context/toasts/toast-context';
import classNames from 'classnames';
import { FC } from 'react';
import { Tooltip } from 'react-tooltip';
import SessionCounterModal from './session-counter-modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../auth/utils';
import { createMutationErrorHandler } from '@utils/httpUtils';
import { useAtom } from 'jotai';
import { timerAtom } from '@app/store/atoms';
import { SessionCountersService, SessionCounter as SessionCounterType } from '@api';

const SessionCounter: FC = () => {
  const { addToast } = useToast();
  const { showModal } = useModalContext();
  const handleMutationError = createMutationErrorHandler(addToast);
  const queryClient = useQueryClient();
  const [timerState] = useAtom(timerAtom);

  const { data: sessionCountersData = [] } = useQuery<SessionCounterType[]>({
    queryKey: [QUERY_KEYS.sessionCounters],
    queryFn: () => SessionCountersService.readSessionCountersSessionCountersGet(),
  });

  const activeSessionCounter = sessionCountersData.find((counter) => counter.is_selected);
  const target = activeSessionCounter?.target ?? 5;
  const completed = activeSessionCounter?.completed ?? 0;

  const createSessionCounterMutation = useMutation({
    mutationFn: (counter: { target: number; completed: number; is_selected: boolean }) =>
      SessionCountersService.createSessionCounterSessionCountersPost(counter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sessionCounters] });
    },
    onError: handleMutationError('create session counter'),
  });

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
      createSessionCounterMutation.mutate({
        target: activeSessionCounter.target,
        completed: 0,
        is_selected: true
      });
    }
  };

  return (
    <div className='rounded-lg bg-white dark:bg-gray-800 p-6 shadow'>
      <h2 className='text-xl text-gray-900 dark:text-white text-center font-semibold mb-5'>
        Streak
      </h2>
      <div
        className='flex items-center mb-6'
        data-tooltip-id="session-counter-tooltip"
        data-tooltip-content={`Streak Counter: ${completed}/${target} completed`}
      >
        <div className="flex items-center flex-wrap gap-3 w-full justify-center">
          {[...Array(target)].map((val, i) => (
            <div
              key={val + i}
              className={classNames('w-4 h-4 rounded-full transition-colors duration-200', {
                'bg-gray-300 dark:bg-gray-600': i >= completed && !(i === completed && timerState.isActive),
                'bg-blue-500': i < completed,
                'relative overflow-hidden bg-gray-300 dark:bg-gray-600': i === completed && timerState.isActive,
              })}
            >
              {i === completed && timerState.isActive && !timerState.isBreakMode && (
                <div
                  className="absolute inset-0 bg-blue-500"
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          className={classNames(
            "flex-1 rounded-lg px-5 py-1 font-medium transition-all duration-200",
            !timerState.isActive
              ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white opacity-50 cursor-not-allowed"
          )}
          onClick={openSessionsModal}
        >
          Edit
        </button>
        {completed > 0 && (
          <button
            className={classNames(
              "flex-1 rounded-lg px-5 py-1 font-medium transition-all duration-200",
              !timerState.isActive
                ? "border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 hover:border-gray-300 dark:hover:border-gray-500 active:bg-gray-200 dark:active:bg-gray-600"
                : "border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 opacity-50 cursor-not-allowed"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!timerState.isActive) {
                resetSessionCounter();
              }
            }}
          >
            Reset
          </button>
        )}
      </div>

      <Tooltip
        id="session-counter-tooltip"
        delayShow={800}
        place="bottom"
        className='z-50'
      />
    </div>
  );
};

export default SessionCounter;