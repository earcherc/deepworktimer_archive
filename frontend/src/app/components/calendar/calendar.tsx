'use client';

import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon } from '@heroicons/react/20/solid';
import { addDays, endOfDay, format, formatISO, isAfter, isToday, startOfDay, subDays } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { useModalContext } from '@context/modal/modal-context';
import CurrentTimeIndicator from './current-time-indicator';
import { calculateGridPosition } from '@utils/timeUtils';
import { StudyBlock, StudyBlocksService } from '@api';
import { useQuery } from '@tanstack/react-query';
import StudyBlockEdit from './study-block-edit';
import StudyBlockComponent from './study-block';
import TimeReset from './time-reset';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const MINUTES_PER_DAY = 1440;
const HOURS_PER_DAY = 24;

type DateRange = {
  start_time: string;
  end_time: string;
};

const Calendar: React.FC = () => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showModal } = useModalContext();

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    scrollToCurrentTime();
  }, []);

  const resetDate = () => {
    setCurrentDate(new Date());
  };

  const getDateRange = (currentDate: Date | null): DateRange | null => {
    if (!currentDate) return null;
    const startDate = startOfDay(currentDate);
    const endDate = endOfDay(currentDate);
    return {
      start_time: formatISO(startDate),
      end_time: formatISO(endDate),
    };
  };

  const dateRange = getDateRange(currentDate);

  const { data: studyBlocksData } = useQuery<StudyBlock[]>({
    queryKey: ['studyBlocks', dateRange?.start_time, dateRange?.end_time],
    queryFn: () =>
      dateRange ? StudyBlocksService.queryStudyBlocksStudyBlocksQueryPost(dateRange) : Promise.resolve([]),
    enabled: !!dateRange,
  });

  const sortedStudyBlocks = (): StudyBlock[] => {
    return [...(studyBlocksData || [])].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }

  const scrollToCurrentTime = () => {
    if (containerRef.current) {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      const scrollRatio = minutesSinceMidnight / MINUTES_PER_DAY;
      containerRef.current.scrollTop =
        scrollRatio * containerRef.current.scrollHeight - containerRef.current.clientHeight / 2;
    }
  };

  const calculateCenter = () => {
    if (containerRef.current) {
      const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
      return (scrollTop + clientHeight / 2) / scrollHeight;
    }
    return 0;
  };

  const handleZoom = (delta: number) => {
    if (containerRef.current) {
      const centerBefore = calculateCenter();

      setZoomLevel((prevZoom) => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom + delta));
        return Number(newZoom.toFixed(1));
      });

      setTimeout(() => {
        const { scrollHeight, clientHeight } = containerRef.current!;
        const newScrollTop = centerBefore * scrollHeight - clientHeight / 2;
        containerRef.current!.scrollTop = newScrollTop;
      }, 0);
    }
  };

  const openEditStudyBlockModal = (block: StudyBlock) => {
    showModal({
      type: 'default',
      title: 'Edit Study Block',
      message: 'Update study block details or add rating to keep track of your mental state.',
      content: <StudyBlockEdit block={block} />,
    });
  };

  const goToPreviousDay = () => {
    setCurrentDate((prevDate) => (prevDate ? subDays(prevDate, 1) : null));
  };

  const goToNextDay = () => {
    setCurrentDate((prevDate) => {
      if (!prevDate) return new Date();
      const nextDay = addDays(prevDate, 1);
      return isAfter(nextDay, new Date()) ? new Date() : nextDay;
    });
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden relative bg-white dark:bg-gray-900">
      <div className="absolute top-0 left-0 rounded-t-lg right-0 z-20 flex items-center justify-between py-1 px-4 bg-white dark:bg-gray-800">
        <button
          onClick={goToPreviousDay}
          className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3">
          {(!currentDate || !isToday(currentDate)) && (
            <button
              onClick={resetDate}
              className="flex items-center flex-nowrap p-1 px-2 rounded bg-gray-100 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Reset to today"
            >
              <span className='text-xs font-semibold'>Today</span>
            </button>
          )}
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {currentDate ? format(currentDate, 'MMMM d, yyyy') : ''}
          </span>
          <TimeReset currentDate={currentDate} onClick={scrollToCurrentTime} />
        </div>
        <button
          onClick={goToNextDay}
          disabled={currentDate ? isAfter(currentDate, new Date()) || isToday(currentDate) : false}
          className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow overflow-hidden">
        <div ref={containerRef} className="h-full overflow-auto hide-scrollbar">
          <div className="flex w-full flex-auto relative">
            <div className="w-14 flex-none bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700" />
            <div className="flex-1">
              <div className="grid flex-auto grid-cols-1 grid-rows-1">
                <div
                  className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-200 dark:divide-gray-700"
                  style={{ gridTemplateRows: `repeat(${HOURS_PER_DAY}, minmax(${6 * zoomLevel}rem, 1fr))` }}
                >
                  {Array.from({ length: HOURS_PER_DAY }).map((_, index) => (
                    <div key={index}>
                      <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-gray-500">
                        {index === 0 ? '12 AM' : `${index % 12 === 0 ? 12 : index % 12} ${index < 12 ? 'AM' : 'PM'}`}
                      </div>
                    </div>
                  ))}
                </div>
                <ol className="col-start-1 col-end-2 row-start-1 relative h-full">
                  {sortedStudyBlocks().map((block) => (
                    <StudyBlockComponent
                      key={block.id}
                      block={block}
                      calculatePosition={calculateGridPosition}
                      onClick={() => openEditStudyBlockModal(block)}
                    />
                  ))}
                </ol>
                <CurrentTimeIndicator />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full shadow-md p-1">
        <span className="text-gray-600 dark:text-gray-300 font-semibold px-2">{(zoomLevel * 100).toFixed(0)}%</span>
        <button
          onClick={() => handleZoom(-ZOOM_STEP)}
          disabled={zoomLevel <= MIN_ZOOM}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <MinusIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom(ZOOM_STEP)}
          disabled={zoomLevel >= MAX_ZOOM}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Calendar;
