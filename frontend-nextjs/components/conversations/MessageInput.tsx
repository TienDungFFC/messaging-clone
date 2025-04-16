"use client";

import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

type Props = {
  placeholder?: string;
  id: string;
  type?: string;
  required?: boolean;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function MessageInput({
  placeholder,
  id,
  type = "text",
  required,
  register,
  errors,
  onChange,
}: Props) {
  return (
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        autoComplete={id}
        placeholder={placeholder}
        className="text-black dark:text-white font-light py-2 px-4 bg-neutral-100 dark:bg-neutral-900 w-full rounded-full focus:outline-none"
        {...register(id, {
          required,
          onChange: (e) => {
            onChange?.(e);
          },
        })}
      />
    </div>
  );
}

export default MessageInput;
