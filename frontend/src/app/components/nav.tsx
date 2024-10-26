'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { ApiError, AuthenticationService, User, UsersService } from '@api';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { ThemeToggle } from '../components/theme-toggle';
import { usePathname, useRouter } from 'next/navigation';
import useToast from '@context/toasts/toast-context';
import classNames from 'classnames';
import { Fragment } from 'react';
import Link from 'next/link';

const navigation = [
  { name: 'Home', href: '/home' },
  { name: 'Profile', href: '/profile' },
  { name: 'Social', href: '/social' },
];

export default function Nav() {
  const { addToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'devmode';

  const { data: user } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => UsersService.readCurrentUserUsersMeGet(),
  });

  const logoutMutation = useMutation({
    mutationFn: AuthenticationService.logoutAuthLogoutPost,
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      router.push('/');
    },
    onError: (error: unknown) => {
      let errorMessage = 'An error occurred while logging out';
      if (error instanceof ApiError) {
        errorMessage = error.body?.detail || errorMessage;
      }
      addToast({ type: 'error', content: errorMessage });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const displayName = user
    ? user.first_name || user.username?.charAt(0).toUpperCase() + user.username?.slice(1)
    : 'Unknown';

  return (
    <Disclosure as="nav" className="sticky top-0 z-30 bg-white shadow-md md:shadown-none dark:bg-gray-800">
      {({ open }) => (
        <>
          <div className="mx-auto px-4">
            <div className="relative flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Disclosure.Button
                  id={'mobilemenu'}
                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:hidden"
                >
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
                <div className="flex items-center">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 78 78"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-400 dark:text-gray-900 hidden md:block"
                  >
                    <circle cx="39" cy="39" r="39" className="fill-current" />
                  </svg>
                  <h1 className="ml-4 font-semibold text-gray-900 dark:text-gray-200 hidden md:block">
                    {displayName}&apos;s Deep Work
                  </h1>
                </div>
                <div className="hidden md:flex md:items-center md:ml-6">
                  <div className="flex space-x-4">
                    {navigation.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            isActive
                              ? 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
                            'rounded-md px-3 py-2 text-sm font-medium',
                          )}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 mr-1">
                {commitHash && (
                  <a
                    href={`https://github.com/earcherc/deepworktimer/commit/${commitHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {commitHash.substring(0, 7)}
                  </a>
                )}
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-white"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>
                <ThemeToggle />
                <Menu as="div" className="relative">
                  <Menu.Button
                    id={'usermenu'}
                    className="flex items-center rounded-full bg-white text-sm dark:bg-gray-800"
                  >
                    <span className="sr-only">Open user menu</span>
                    <span className="font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white">
                      {displayName}
                    </span>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={classNames(
                              active ? 'bg-gray-100 dark:bg-gray-600' : '',
                              'block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200',
                            )}
                          >
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item, i) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Disclosure.Button
                    id={String(i)}
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      isActive
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
                      'block rounded-md px-3 py-2 text-base font-medium',
                    )}
                  >
                    {item.name}
                  </Disclosure.Button>
                );
              })}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
