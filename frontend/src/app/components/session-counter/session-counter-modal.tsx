import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModalContext } from '@app/context/modal/modal-context';
import { ApiError, SessionCountersService } from '@api';
import useToast from '@context/toasts/toast-context';
import React, { useState } from 'react';

const SessionCounterModal: React.FC = () => {
  const { hideModal } = useModalContext();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [target, setTarget] = useState(5);

  const createSessionCounterMutation = useMutation({
    mutationFn: (newCounter: { target: number; is_selected: boolean }) =>
      SessionCountersService.createSessionCounterSessionCountersPost(newCounter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionCounters'] });
      hideModal();
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof ApiError
          ? error.body?.detail || 'Failed to create session counter'
          : 'Failed to create session counter';
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const handleCreate = () => {
    createSessionCounterMutation.mutate({ target, is_selected: true });
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < target; i++) {
      dots.push(<div key={i} className="w-3 h-3 rounded-full bg-blue-500"></div>);
    }
    return dots;
  };

  return (
    <>
      <p className="text-center text-gray-600 mb-1">Target: {target}</p>
      <div className="flex items-center justify-between space-x-4 mb-6">
        <button
          onClick={() => setTarget(Math.max(1, target - 1))}
          className="text-2xl font-bold text-blue-500 bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center"
        >
          -
        </button>
        <div className="flex-grow flex justify-center space-x-2">{renderDots()}</div>
        <button
          onClick={() => setTarget(target + 1)}
          className="text-2xl font-bold text-blue-500 bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center"
        >
          +
        </button>
      </div>
      <div className="flex justify-center space-x-2 w-full">
        <button
          onClick={hideModal}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Create
        </button>
      </div>
    </>
  );
};

export default SessionCounterModal;
