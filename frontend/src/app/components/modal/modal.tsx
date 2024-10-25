'use client';

import { CheckIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useModalContext } from '@context/modal/modal-context';
import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment } from 'react';

const Modal = ({ children }: { children: React.ReactNode }) => {
  const { modalConfig, hideModal } = useModalContext();

  const modalTypeClasses = {
    success: {
      icon: <CheckIcon className="h-6 w-6 text-green-600" />,
      bgColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-500',
    },
    danger: {
      icon: <XCircleIcon className="h-6 w-6 text-red-600" />,
      bgColor: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-500',
    },
    warning: {
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />,
      bgColor: 'bg-yellow-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-500',
    },
    default: {
      icon: null,
      bgColor: 'bg-gray-100',
      buttonColor: 'bg-blue-600 hover:bg-blue-500',
    },
  };

  const { icon, bgColor, buttonColor } = modalConfig
    ? modalTypeClasses[modalConfig.type] || modalTypeClasses.default
    : modalTypeClasses.default;

  return (
    <Transition.Root show={!!modalConfig} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={hideModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 md:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 w-full max-w-lg sm:p-6">
                {icon && (
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${bgColor}`}>
                    {icon}
                  </div>
                )}
                <div className="text-center">
                  <Dialog.Title as="h2" className="text-lg font-semibold leading-6 text-gray-900">
                    {modalConfig?.title}
                  </Dialog.Title>
                  {modalConfig?.message && (
                    <p className="mt-2 text-sm max-w-md mx-auto text-gray-500">{modalConfig.message}</p>
                  )}
                </div>
                <div className="mt-4">{children}</div>
                {modalConfig && modalConfig.buttons && (
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    {modalConfig.buttons.map((button, index) => (
                      <button
                        key={index}
                        onClick={button.onClick}
                        className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold ${button.isPrimary
                          ? `${buttonColor} text-white`
                          : 'bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                          } sm:col-start-${button.isPrimary ? '2' : '1'}`}
                      >
                        {button.text}
                      </button>
                    ))}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Modal;
