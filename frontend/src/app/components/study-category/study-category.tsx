'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, StudyCategoriesService, StudyCategory } from '@api';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/20/solid';
import { useModalContext } from '@context/modal/modal-context';
import StudyCategoryCreate from './study-category-create';
import useToast from '@context/toasts/toast-context';
import { Menu, Transition } from '@headlessui/react';
import classNames from 'classnames';
import React from 'react';

const StudyCategoryComponent = () => {
  const { addToast } = useToast();
  const { showModal } = useModalContext();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<StudyCategory[]>({
    queryKey: ['studyCategories'],
    queryFn: () => StudyCategoriesService.readStudyCategoriesStudyCategoriesGet(),
  });

  const updateStudyCategoryMutation = useMutation({
    mutationFn: (category: StudyCategory) => {
      if (category.id === undefined) {
        throw new Error('Category ID is undefined');
      }
      return StudyCategoriesService.updateStudyCategoryStudyCategoriesStudyCategoryIdPatch(category.id, {
        is_selected: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyCategories'] });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to update category';
      if (error instanceof ApiError) {
        errorMessage = error.body?.detail || errorMessage;
      }
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const selectCategory = (selectedCategory: StudyCategory) => {
    updateStudyCategoryMutation.mutate(selectedCategory);
  };

  const openCreateCategoryModal = () => {
    showModal({
      type: 'default',
      title: 'Create Work Category',
      message: 'Track how much time you spend on a subject or task.',
      content: <StudyCategoryCreate />,
    });
  };

  const activeCategory = categories.find((cat) => cat.is_selected);

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Menu as="div" className="relative w-full">
          <Menu.Button className="flex w-full items-center justify-between rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 ">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Category</h2>
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
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <Menu.Item key={category.id}>
                      {({ active }) => (
                        <button
                          type="button"
                          className={classNames(
                            active
                              ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300',
                            category.is_selected ? 'bg-blue-50 dark:bg-blue-900 font-semibold' : '',
                            'block w-full px-4 py-2 text-left text-sm',
                          )}
                          onClick={() => selectCategory(category)}
                        >
                          {category.title}
                        </button>
                      )}
                    </Menu.Item>
                  ))
                ) : (
                  <Menu.Item>
                    <div className="block w-full px-4 py-2 text-left text-sm text-gray-500 dark:text-gray-400">
                      No Categories
                    </div>
                  </Menu.Item>
                )}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        <button
          onClick={openCreateCategoryModal}
          className="ml-3 rounded-md p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 "
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
      {activeCategory && (
        <div className="mt-4 flex justify-center">
          <div className="w-2/3 text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{activeCategory.title}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyCategoryComponent;
