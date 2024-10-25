'use client';

import { DailyGoal, DailyGoalsService, StudyCategoriesService, StudyCategory } from '@api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import StudyCategoryComponent from '../study-category/study-category';
import DailyGoalComponent from '../daily-goal/daily-goal';
import useToast from '@context/toasts/toast-context';
import Timer from '../timer/timer';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  const updateDailyGoalMutation = useMutation({
    mutationFn: (goal: DailyGoal) =>
      DailyGoalsService.updateDailyGoalDailyGoalsDailyGoalIdPatch(goal.id, goal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyGoals'] }),
    onError: () => addToast({ type: 'error', content: 'Failed to update daily goal' })
  });

  const updateStudyCategoryMutation = useMutation({
    mutationFn: (category: StudyCategory) =>
      StudyCategoriesService.updateStudyCategoryStudyCategoriesStudyCategoryIdPatch(category.id, {
        is_selected: false,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studyCategories'] }),
    onError: () => addToast({ type: 'error', content: 'Failed to update study category' })
  });

  const { data: categoriesData } = useQuery<StudyCategory[]>({
    queryKey: ['studyCategories'],
    queryFn: () => StudyCategoriesService.readStudyCategoriesStudyCategoriesGet(),
  });

  const { data: dailyGoalsData } = useQuery<DailyGoal[]>({
    queryKey: ['dailyGoals'],
    queryFn: () => DailyGoalsService.readDailyGoalsDailyGoalsGet(),
  });

  const hasActiveItems = Boolean(
    dailyGoalsData?.some(goal => goal.is_selected) ||
    categoriesData?.some(category => category.is_selected)
  );

  useEffect(() => {
    setVisible(hasActiveItems);
  }, [hasActiveItems]);

  const hideMetadata = async () => {
    const activeGoal = dailyGoalsData?.find(goal => goal.is_selected);
    if (activeGoal) {
      await updateDailyGoalMutation.mutateAsync({ ...activeGoal, is_selected: false });
    }

    const activeCategory = categoriesData?.find(category => category.is_selected);
    if (activeCategory) {
      await updateStudyCategoryMutation.mutateAsync(activeCategory);
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      <Timer />
      {visible && (
        <>
          <DailyGoalComponent />
          <StudyCategoryComponent />
        </>
      )}
      {visible && (
        <button
          onClick={hasActiveItems ? hideMetadata : () => setVisible(false)}
          className="w-full rounded-md bg-gray-200 dark:bg-gray-900 p-4 text-gray-700 dark:text-gray-400 
                 hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center"
        >
          Remove Additional Tags
        </button>
      )}
      {!visible && (
        <button
          onClick={() => setVisible(true)}
          className="w-full rounded-md bg-gray-200 dark:bg-gray-900 p-4 text-gray-700 dark:text-gray-400 
                 hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center"
        >
          Add Additional Tags
        </button>
      )}
    </div>
  );
}