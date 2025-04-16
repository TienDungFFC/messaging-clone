"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { logError } from "@/utils/logger";

import Button from "../Button";
import Input from "../input/Input";
import Select from "../input/Select";
import Modal from "./Modal";
import { User } from "@/types";

import { getCurrentUser } from "@/utils/auth";

import createOrFindConversation from "@/services/conversationService";

type Props = {
  isOpen?: boolean;
  onClose: () => void;
  users: User[];
};

function GroupChatModal({ users, onClose, isOpen }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = getCurrentUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: "",
      members: [],
    },
  });

  const members = watch("members");


  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    // get list id in members
    const membersIds = data.members.map((member: any) => member.value);

    if (currentUser) {
      membersIds.push(currentUser.userId);
    }

    createOrFindConversation.createOrFindConversation(
      membersIds,
      data.name,
      true
    )
      .then((response) => {
        if (response.success && response.conversation) {
          onClose();

          router.push(`/conversations/${response.conversation.conversationId}`);
          router.refresh();
        } else {
          logError(response.message || "Failed to create conversation");
        }
      })
      .catch((error) => {
        logError("Something went wrong");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-12">
          <div className="border-b- border-gray-900/10 dark:border-gray-300 pb-12">
            <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
              Create a Group Chat
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Create a chat with more than 2 people.
            </p>
            <div className="mt-10 flex flex-col gap-y-8">
              <Input
                disabled={isLoading}
                label="Name"
                id="name"
                errors={errors}
                required
                register={register}
              />
              <Select
                disabled={isLoading}
                label="Members"
                options={users
                  .filter((user) => user.id !== currentUser?.userId)
                  .map((user) => ({
                    value: user.id,
                    label: user.name,
                  }))}
                onChange={(value) =>
                  setValue("members", value, {
                    shouldValidate: true,
                  })
                }
                value={members}
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <Button
            disabled={isLoading}
            onClick={onClose}
            type="button"
            secondary
          >
            Cancel
          </Button>
          <Button disabled={isLoading} type="submit">
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default GroupChatModal;
