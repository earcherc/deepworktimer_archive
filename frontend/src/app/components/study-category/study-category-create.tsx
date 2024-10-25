'use client';
import { ApiError, StudyCategoriesService, StudyCategoryCreate } from '@api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModalContext } from '@context/modal/modal-context';
import useToast from '@context/toasts/toast-context';
import { useForm } from 'react-hook-form';

const StudyCategoryCreateComponent = () => {
  const { addToast } = useToast();
  const { hideModal } = useModalContext();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<StudyCategoryCreate>({
    defaultValues: {
      title: '',
    },
  });

  const createStudyCategoryMutation = useMutation({
    mutationFn: (formData: StudyCategoryCreate) =>
      StudyCategoriesService.createStudyCategoryStudyCategoriesPost({ title: formData.title, is_selected: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyCategories'] });
      reset();
      hideModal();
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to create category';
      if (error instanceof ApiError) {
        errorMessage = error.body?.detail || errorMessage;
      }
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const onSubmit = (formData: StudyCategoryCreate) => {
    createStudyCategoryMutation.mutate(formData);
  };

  const capitalizeFirstLetter = (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-left text-sm font-medium leading-6 text-gray-900">
          Category Title
        </label>
        <div className="mt-2">
          <input
            {...register('title', {
              required: true,
              onChange: (e) => {
                const capitalized = capitalizeFirstLetter(e.target.value);
                setValue('title', capitalized);
              },
            })}
            type="text"
            name="title"
            id="title"
            className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Enter category title"
            disabled={createStudyCategoryMutation.isPending}
          />
          {errors.title && <span className="text-sm text-red-600">This field is required</span>}
        </div>
      </div>
      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="submit"
          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
          disabled={createStudyCategoryMutation.isPending}
        >
          {createStudyCategoryMutation.isPending ? 'Creating...' : 'Create'}
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

export default StudyCategoryCreateComponent;
