'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModalContext } from '@context/modal/modal-context';
import { Controller, useForm } from 'react-hook-form';
import useToast from '@context/toasts/toast-context';
import { ApiError, DailyGoalsService } from '@api';

interface FormData {
  hours: string;
  minutes: string;
}

const DailyGoalCreateComponent = () => {
  const { addToast } = useToast();
  const { hideModal } = useModalContext();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      hours: '2',
      minutes: '0',
    },
    mode: 'onChange',
  });

  const createDailyGoalMutation = useMutation({
    mutationFn: (formData: FormData) => {
      const hours = parseInt(formData.hours) || 0;
      const minutes = parseInt(formData.minutes) || 0;
      const totalMinutes = hours * 60 + minutes;

      if (totalMinutes === 0) {
        throw new Error('Total time must be at least 1 minute');
      }

      return DailyGoalsService.createDailyGoalDailyGoalsPost({
        total_minutes: totalMinutes,
        is_selected: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyGoals'] });
      hideModal();
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to create daily goal';
      if (error instanceof ApiError) {
        errorMessage = error.body?.detail || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const onSubmit = (data: FormData) => {
    createDailyGoalMutation.mutate(data);
  };

  const validateTotalTime = (hours: string, minutes: string) => {
    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    return totalMinutes > 0 || 'Total time must be at least 1 minute';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-center space-x-12">
        <Controller
          name="hours"
          control={control}
          rules={{
            validate: (value, formValues) => validateTotalTime(value, formValues.minutes),
          }}
          render={({ field }) => (
            <div className="w-16">
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                Hours
              </label>
              <input
                type="number"
                {...field}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  trigger('minutes');
                }}
                min="0"
                max="24"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          )}
        />
        <Controller
          name="minutes"
          control={control}
          rules={{
            validate: (value, formValues) => validateTotalTime(formValues.hours, value),
          }}
          render={({ field }) => (
            <div className="w-16">
              <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                Minutes
              </label>
              <input
                type="number"
                {...field}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  trigger('hours');
                }}
                min="0"
                max="59"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          )}
        />
      </div>

      {(errors.hours || errors.minutes) && (
        <p className="text-red-500 text-sm text-center mt-2">
          {errors.hours?.message || errors.minutes?.message || 'Invalid input'}
        </p>
      )}

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="submit"
          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
          disabled={createDailyGoalMutation.isPending}
        >
          {createDailyGoalMutation.isPending ? 'Creating...' : 'Create'}
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
          onClick={hideModal}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DailyGoalCreateComponent;
