'use client';

import {
  ApiError,
  DailyGoal,
  DailyGoalsService,
  StudyBlock,
  StudyBlocksService,
  StudyCategoriesService,
  StudyCategory,
} from '@api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatToLocalTime, toLocalTime, toUTC } from '@utils/dateUtils';
import { useModalContext } from '@context/modal/modal-context';
import useToast from '@context/toasts/toast-context';
import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';

interface StudyBlockEditProps {
  block: StudyBlock;
}

const StudyBlockEdit: React.FC<StudyBlockEditProps> = ({ block }) => {
  const initialEndTime = block.end_time ? format(toLocalTime(block.end_time), "yyyy-MM-dd'T'HH:mm:ss") : '';
  const [endTime, setEndTime] = useState(initialEndTime);
  const [rating, setRating] = useState(block.rating || 0);
  const [isEndTimeChanged, setIsEndTimeChanged] = useState(false);
  const { hideModal } = useModalContext();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [isFormChanged, setIsFormChanged] = useState(false);
  const isCurrentSession = !block.end_time;

  const { data: categories = [] } = useQuery<StudyCategory[]>({
    queryKey: ['studyCategories'],
    queryFn: () => StudyCategoriesService.readStudyCategoriesStudyCategoriesGet(),
  });

  const { data: goals = [] } = useQuery<DailyGoal[]>({
    queryKey: ['dailyGoals'],
    queryFn: () => DailyGoalsService.readDailyGoalsDailyGoalsGet(),
  });

  useEffect(() => {
    const isRatingChanged = rating !== (block.rating || 0);
    setIsFormChanged(isEndTimeChanged || isRatingChanged);
  }, [endTime, rating, block.rating, isEndTimeChanged]);

  const updateStudyBlockMutation = useMutation({
    mutationFn: (updatedBlock: Partial<StudyBlock>) =>
      StudyBlocksService.updateStudyBlockStudyBlocksStudyBlockIdPatch(block.id, updatedBlock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyBlocks'] });
      hideModal();
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to update study block';
      if (error instanceof ApiError) {
        errorMessage = error.body?.detail || errorMessage;
      }
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const deleteStudyBlockMutation = useMutation({
    mutationFn: () => StudyBlocksService.deleteStudyBlockStudyBlocksStudyBlockIdDelete(block.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyBlocks'] });
      hideModal();
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to delete study block';
      if (error instanceof ApiError) {
        errorMessage = error.body?.detail || errorMessage;
      }
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedBlock: Partial<StudyBlock> = {
      ...block,
      rating,
    };

    if (isEndTimeChanged) {
      const startTimeDate = toLocalTime(block.start_time);
      const endTimeDate = parseISO(endTime);

      if (endTimeDate < startTimeDate) {
        addToast({ type: 'error', content: 'End time must be greater than or equal to the start time.' });
        return;
      }

      const adjustedEndTime =
        endTimeDate.getTime() === startTimeDate.getTime() ? new Date(endTimeDate.getTime() + 1000) : endTimeDate;

      updatedBlock.end_time = toUTC(adjustedEndTime);
    }

    updateStudyBlockMutation.mutate(updatedBlock);
  };

  const handleDelete = () => {
    deleteStudyBlockMutation.mutate();
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
    setIsEndTimeChanged(true);
  };

  const category = categories.find((c) => c.id === block.study_category_id);
  const goal = goals.find((g) => g.id === block.daily_goal_id);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const ratingButtons = [1, 2, 3, 4, 5].map((value) => (
    <button
      key={value}
      type="button"
      onClick={() => setRating(value)}
      className={`px-3 py-1 border rounded-md transition-colors duration-200
      ${rating === value ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white text-gray-700 hover:bg-blue-100'}`}
    >
      {value}
    </button>
  ));

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 mb-8">
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <div className="text-left text-sm text-gray-700 space-y-3">
            <div>
              <strong>Start:</strong> {formatToLocalTime(toLocalTime(block.start_time), 'PPpp')}
            </div>
            <div>
              <strong>Category:</strong> {category?.title || 'No category selected'}
            </div>
            <div>
              <strong>Daily Goal:</strong> {goal ? formatMinutes(goal.total_minutes) : 'No goal selected'}
            </div>
          </div>
        </div>

        {!isCurrentSession && (
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-4">
              End
            </label>
            <input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={handleEndTimeChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              step="1"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Rating</label>
          <div className="mt-1 flex justify-between space-x-2">{ratingButtons}</div>
        </div>
      </form>

      <div className="flex w-full space-x-2">
        {!isCurrentSession && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        )}
        <button
          type="button"
          onClick={hideModal}
          className="w-full py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isFormChanged}
          className="w-full text-nowrap py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>
    </>
  );
};

export default StudyBlockEdit;
