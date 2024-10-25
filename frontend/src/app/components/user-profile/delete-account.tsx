'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModalContext } from '@context/modal/modal-context';
import useToast from '@context/toasts/toast-context';
import { ApiError, UsersService } from '@api';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

export default function DeleteAccountForm() {
  const queryClient = useQueryClient();
  const Router = useRouter();
  const { showModal, hideModal } = useModalContext();
  const { addToast } = useToast();

  const { handleSubmit } = useForm();

  const deleteUserMutation = useMutation({
    mutationFn: () => UsersService.deleteAccountUsersDeleteAccountDelete(),
    onSuccess: () => {
      hideModal();
      queryClient.setQueryData(['currentUser'], null);
      Router.push('/');
    },
    onError: (error: unknown) => {
      let errorMessage = 'An error occurred while deleting user';
      if (error instanceof ApiError) {
        errorMessage = error.body?.detail || errorMessage;
      }
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const onSubmit = () => {
    showModal({
      type: 'danger',
      title: 'Confirm Account Deletion',
      message: 'Are you sure you want to delete your account? This action cannot be undone.',
      buttons: [
        {
          text: 'Delete Account',
          onClick: () => deleteUserMutation.mutate(),
          isPrimary: true,
        },
        {
          text: 'Cancel',
          onClick: hideModal,
        },
      ],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <button
        type="submit"
        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600"
      >
        Yes, delete my account
      </button>
    </form>
  );
}
