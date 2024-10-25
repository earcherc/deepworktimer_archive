'use client';

import {
  ArrowPathIcon,
  BellIcon,
  BoltIcon,
  ClockIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid';
import { ApiError, TimeSettingsCreate as TimeSettingsCreateType, TimeSettingsService } from '@api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModalContext } from '@context/modal/modal-context';
import { Control, Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import useToast from '@context/toasts/toast-context';
import React, { useEffect, useMemo } from 'react';
import { Switch } from '@headlessui/react';
import { Tooltip } from 'react-tooltip';
import * as yup from 'yup';

// Validation schema
const schema = yup.object().shape({
  is_countdown: yup.boolean().required(),
  duration: yup
    .number()
    .nullable()
    .when('is_countdown', {
      is: true,
      then: (schema) => schema.required('Duration is required').min(1, 'Must be at least 1'),
    }),
  short_break_duration: yup
    .number()
    .nullable()
    .when('is_countdown', {
      is: true,
      then: (schema) => schema.required('Short break duration is required').min(1, 'Must be at least 1'),
    }),
  long_break_duration: yup
    .number()
    .nullable()
    .when('is_countdown', {
      is: true,
      then: (schema) => schema.required('Long break duration is required').min(1, 'Must be at least 1'),
    }),
  long_break_interval: yup
    .number()
    .nullable()
    .when('is_countdown', {
      is: true,
      then: (schema) => schema.required('Long break interval is required').min(2, 'Must be at least 2'),
    }),
  is_sound: yup.boolean().nullable(),
  sound_interval: yup.number().nullable().min(1, 'Must be at least 1'),
});

// Input component
const Input: React.FC<{
  name: keyof TimeSettingsCreateType;
  label: string;
  control: Control<TimeSettingsCreateType>;
  icon: React.ElementType;
  tooltipContent: string;
  unit: string;
}> = ({ name, label, control, icon: Icon, tooltipContent, unit }) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <div className="py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className="h-5 w-5 text-gray-400" />
            <label className="ml-2 font-bold">{label}</label>
            <QuestionMarkCircleIcon
              data-tooltip-id={`tooltip-${name}`}
              className="h-4 w-4 text-gray-400 ml-1 cursor-help"
            />
            <Tooltip id={`tooltip-${name}`} content={tooltipContent} />
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <input
                type="number"
                {...field}
                value={field.value === null || field.value === undefined ? '' : field.value.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === '' ? null : Number(value));
                }}
                className={`w-16 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${error ? 'border-red-500' : ''
                  }`}
              />
              <span className="text-sm text-gray-500">{unit}</span>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
          </div>
        </div>
      </div>
    )}
  />
);

const TimeSettingsCreate: React.FC = () => {
  const { hideModal } = useModalContext();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo<TimeSettingsCreateType>(
    () => ({
      is_countdown: true,
      duration: 50,
      short_break_duration: 2,
      long_break_duration: 30,
      long_break_interval: 4,
      is_sound: true,
      sound_interval: undefined,
    }),
    [],
  );

  const { control, handleSubmit, watch, setValue, reset } = useForm<TimeSettingsCreateType>({
    resolver: yupResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  const isCountdown = watch('is_countdown');

  useEffect(() => {
    if (isCountdown) {
      reset({
        ...defaultValues,
        is_countdown: true,
        sound_interval: undefined,
      });
    } else {
      reset({
        is_countdown: false,
        duration: undefined,
        short_break_duration: undefined,
        long_break_duration: undefined,
        long_break_interval: undefined,
        is_sound: true,
        sound_interval: 20,
      });
    }
  }, [defaultValues, isCountdown, reset]);

  const createTimeSettingsMutation = useMutation({
    mutationFn: (newSettings: TimeSettingsCreateType) =>
      TimeSettingsService.createTimeSettingsTimeSetttingsPost(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSettings'] });
      hideModal();
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to create time settings';
      if (error instanceof ApiError) {
        errorMessage = error.body?.detail || errorMessage;
      }
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const onSubmit = (data: TimeSettingsCreateType) => {
    createTimeSettingsMutation.mutate(data);
  };

  const handleModeChange = (mode: boolean) => {
    setValue('is_countdown', mode);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 text-gray-400" />
          <label className="ml-2 font-bold">Mode</label>
          <QuestionMarkCircleIcon data-tooltip-id="tooltip-mode" className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
          <Tooltip id="tooltip-mode" content="Choose between countdown or stopwatch" />
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleModeChange(true)}
            className={`px-3 py-1 rounded-md ${isCountdown ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Timer
          </button>
          <button
            type="button"
            onClick={() => handleModeChange(false)}
            className={`px-3 py-1 rounded-md ${!isCountdown ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Stopwatch
          </button>
        </div>
      </div>

      {isCountdown && (
        <>
          <Input
            name="duration"
            label="Duration"
            control={control}
            icon={PlayIcon}
            tooltipContent="Duration of each work session (minutes)"
            unit="m"
          />
          <Input
            name="short_break_duration"
            label="Short break duration"
            control={control}
            icon={PauseIcon}
            tooltipContent="Duration of short breaks between work sessions (minutes)"
            unit="m"
          />
          <Input
            name="long_break_duration"
            label="Long break duration"
            control={control}
            icon={MoonIcon}
            tooltipContent="Duration of long break after completing multiple sessions (minutes)"
            unit="m"
          />
          <Input
            name="long_break_interval"
            label="Take long break after"
            control={control}
            icon={ArrowPathIcon}
            tooltipContent="Number of work sessions before a long break"
            unit="x"
          />
        </>
      )}

      <div className="py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BellIcon className="h-5 w-5 text-gray-400" />
            <label className="ml-2 font-bold">End bell</label>
            <QuestionMarkCircleIcon
              data-tooltip-id="tooltip-end-bell"
              className="h-4 w-4 text-gray-400 ml-1 cursor-help"
            />
            <Tooltip id="tooltip-end-bell" content="Play a sound at end of each session" />
          </div>
          <Controller
            name="is_sound"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value ?? false}
                onChange={(checked) => field.onChange(checked)}
                className={`${field.value ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full`}
              >
                <span
                  className={`${field.value ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white`}
                />
              </Switch>
            )}
          />
        </div>
      </div>

      <div className="py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BoltIcon className="h-5 w-5 text-gray-400" />
            <label className="ml-2 font-bold">Reminder sound interval</label>
            <QuestionMarkCircleIcon
              data-tooltip-id="tooltip-reminder-sound"
              className="h-4 w-4 text-gray-400 ml-1 cursor-help"
            />
            <Tooltip
              id="tooltip-reminder-sound"
              content="Play sound at regularly spaced intervals (minutes) through session"
            />
          </div>
          <Controller
            name="sound_interval"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={field.value !== undefined && field.value !== null}
                    onChange={(checked) => field.onChange(checked ? 20 : null)}
                    className={`${field.value !== undefined && field.value !== null ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                  >
                    <span
                      className={`${field.value !== undefined && field.value !== null ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white`}
                    />
                  </Switch>
                  {field.value !== undefined && field.value !== null && (
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={field.value === undefined || field.value === null ? '' : field.value}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          field.onChange(newValue === '' ? null : Number(newValue));
                        }}
                        className={`w-16 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${error ? 'border-red-500' : ''
                          }`}
                      />
                      <span className="text-sm text-gray-500">m</span>
                    </div>
                  )}
                </div>
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </div>
            )}
          />
        </div>
      </div>

      <div className="flex w-full space-x-2 mt-6">
        <button
          type="button"
          onClick={hideModal}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Create
        </button>
      </div>
    </form>
  );
};

export default TimeSettingsCreate;
