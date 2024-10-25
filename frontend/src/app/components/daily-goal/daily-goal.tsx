'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/20/solid';
import { useModalContext } from '@context/modal/modal-context';
import { ApiError, DailyGoal, DailyGoalsService } from '@api';
import useToast from '@context/toasts/toast-context';
import { Menu, Transition } from '@headlessui/react';
import DailyGoalCreate from './daily-goal-create';
import classNames from 'classnames';
import React from 'react';

const DailyGoalComponent = () => {
  const { addToast } = useToast();
  const { showModal } = useModalContext();
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery<DailyGoal[]>({
    queryKey: ['dailyGoals'],
    queryFn: () => DailyGoalsService.readDailyGoalsDailyGoalsGet(),
  });

  const updateDailyGoalMutation = useMutation({
    mutationFn: (goal: DailyGoal) => {
      return DailyGoalsService.updateDailyGoalDailyGoalsDailyGoalIdPatch(goal.id, goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyGoals'] });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to update goal';
      if (error instanceof ApiError) {
        errorMessage = error.body?.detail || errorMessage;
      }
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const selectGoal = (activeGoal: DailyGoal) => {
    updateDailyGoalMutation.mutate({ ...activeGoal, is_selected: true });
  };

  const openCreateGoalModal = () => {
    showModal({
      type: 'default',
      title: 'Today\'s Duration Goal',
      content: <DailyGoalCreate />,
      message: 'Create a goal for the duration you\'d like to work today.',
    });
  };

  const activeGoal = goals.find((goal) => goal.is_selected);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Menu as="div" className="relative w-full">
          <Menu.Button className="flex w-full items-center justify-between rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 ">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's duration goal</h2>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </Menu.Button>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {goals.length > 0 ? (
                  goals.map((goal) => (
                    <Menu.Item key={goal.id}>
                      {({ active }) => (
                        <button
                          type="button"
                          className={classNames(
                            active
                              ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300',
                            goal.is_selected ? 'bg-blue-50 dark:bg-blue-900 font-semibold' : '',
                            'w-full flex-nowrap px-4 py-2 text-left text-sm',
                          )}
                          onClick={() => selectGoal(goal)}
                        >
                          <div className="flex justify-center">
                            <div className="w-2/3 inline-flex items-center justify-center">
                              <span className="font-bold">{formatMinutes(goal.total_minutes)}</span>
                            </div>
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  ))
                ) : (
                  <Menu.Item>
                    <div className="block w-full px-4 py-2 text-left text-sm text-gray-500 dark:text-gray-400">
                      No Goals
                    </div>
                  </Menu.Item>
                )}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        <button
          onClick={openCreateGoalModal}
          className="ml-3 rounded-md p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 "
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
      {activeGoal && (
        <div className="mt-4 flex justify-center">
          <div className="w-2/3 text-center inline-flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatMinutes(activeGoal.total_minutes)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyGoalComponent;
