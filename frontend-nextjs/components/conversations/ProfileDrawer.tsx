"use client";

import { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { IoClose, IoTrash } from "react-icons/io5";
import { format } from "date-fns";

import Avatar from "../Avatar";
import AvatarGroup from "../AvatarGroup";
import ConfirmModal from "../model/ConfirmModal";
import { Conversation } from "@/types";

interface User {
  userId: string;
  name: string;
  avatarUrl: string;
}

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: Conversation;
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ 
  isOpen, 
  onClose, 
  data 
}) => {
  const isGroup = data.type === 'group';
  const [confirmOpen, setConfirmOpen] = useState(false);

  const title = useMemo(() => {
    return data.name || data.otherUser?.name || "Unknown";
  }, [data.name, data.otherUser?.name]);

  const statusText = useMemo(() => {
    if (isGroup) {
      return `${data.participantIds.length} members`;
    }

    return 'Offline';
  }, [data.participantIds.length, isGroup]);

  const joinedDate = useMemo(() => {
    return format(new Date(data.createdAt || new Date()), 'PP');
  }, [data.createdAt]);

  return (
    <>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
        }}
      />
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div 
              className="
                fixed 
                inset-0 
                bg-black 
                bg-opacity-40
              " 
            />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-black py-6 shadow-xl">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-end">
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-white dark:bg-black text-gray-400 dark:text-gray-200 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              onClick={onClose}
                            >
                              <span className="sr-only">Close panel</span>
                              <IoClose size={24} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        <div className="flex flex-col items-center">
                          <div className="mb-2">
                            {isGroup ? (
                              <AvatarGroup users={[]} name={data.name} size="large" />
                            ) : (
                              <Avatar user={data.otherUser || { name: title }} />
                            )}
                          </div>
                          <div className="text-xl font-bold">{title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {statusText}
                          </div>
                          <div className="flex gap-10 my-8">
                            <div
                              onClick={() => setConfirmOpen(true)}
                              className="flex flex-col gap-3 items-center cursor-pointer hover:opacity-75"
                            >
                              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                                <IoTrash size={20} className="text-white" />
                              </div>
                              <div className="text-sm font-light text-neutral-600 dark:text-neutral-300">
                                Delete
                              </div>
                            </div>
                          </div>
                          <div className="w-full pb-5 pt-5 sm:px-0 sm:pt-0">
                            <dl className="space-y-8 px-4 sm:space-y-6 sm:px-6">
                              {isGroup && (
                                <div>
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 sm:w-40 sm:flex-shrink-0">
                                    Members
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:col-span-2">
                                    {data.participantIds.length}
                                  </dd>
                                </div>
                              )}
                              <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 sm:w-40 sm:flex-shrink-0">
                                  Created
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:col-span-2">
                                  <time dateTime={data.createdAt}>
                                    {joinedDate}
                                  </time>
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default ProfileDrawer;
