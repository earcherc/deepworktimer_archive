'use client';

import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';
import useToast from '@context/toasts/toast-context';
import ProgressBar from './progress-bar';
import classNames from 'classnames';

const Toast = ({ toast }: { toast: Toast }) => {
  const { removeToast, pauseToast, resumeToast } = useToast();

  const handleMouseEnter = () => {
    pauseToast(toast.id);
  };

  const handleMouseLeave = () => {
    resumeToast(toast.id);
  };

  const toastTypeClasses: Record<string, ToastType> = {
    success: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      progressColor: 'bg-green-500',
      icon: <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />,
    },
    error: {
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      progressColor: 'bg-red-500',
      icon: <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />,
    },
    warning: {
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      progressColor: 'bg-yellow-500',
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />,
    },
    default: {
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-800',
      progressColor: 'bg-gray-500',
      icon: null,
    },
  };

  const { bgColor, textColor, progressColor, icon } = toastTypeClasses[toast.type] || toastTypeClasses.default;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={classNames('relative z-60 mt-1 w-full max-w-xs rounded-md p-3', bgColor)}
    >
      <div className="flex">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3">
          <p className={classNames('text-sm font-medium', textColor)}>{toast.content}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => removeToast(toast.id)}
              type="button"
              className={classNames(
                'inline-flex rounded-md p-1.5',
                textColor,
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-50',
              )}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <ProgressBar
        key={toast.id}
        isPaused={toast.isPaused}
        progressColor={progressColor}
        autoCloseDelay={toast.autoCloseDelay}
      />
    </div>
  );
};

export default Toast;
