"use client";

import Button from "@/components/Button";
import Input from "@/components/input/Input";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { AiFillFacebook } from "react-icons/ai";
import { logError, logSuccess, logInfo } from "@/utils/logger";
import AuthSocialButton from "./AuthSocialButton";

type Variant = "LOGIN" | "REGISTER";

type Props = {};

function AuthForm({}: Props) {
  const { user, login, register: registerUser } = useAuth();
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>("LOGIN");
  const [isLoading, setIsLoading] = useState(false);

  const toggleVariant = useCallback(() => {
    if (variant === "LOGIN") {
      setVariant("REGISTER");
    } else {
      setVariant("LOGIN");
    }
  }, [variant]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsLoading(true);

    try {
      if (variant === "REGISTER") {
        // Use register method from useAuth
        const success = await registerUser(data.name, data.email, data.password);

        if (success) {
          logSuccess("Registered successfully!");
          router.push("/users");
        } else {
          logError("Registration failed");
        }
      } else {
        // Use login method from useAuth
        const result = await login(data.email, data.password);

        if (result.success) {
          logSuccess("Logged in successfully!");
          router.push("/users");
        } else {
          logError(result.message || "Login failed");
        }
      }
    } catch (error: any) {
      logError(error.response?.data?.message || "An error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const socialAction = (action: string) => {
    setIsLoading(true);
    
    // For demo purposes - social login isn't implemented
    logInfo(`${action} login coming soon!`);
    setIsLoading(false);
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white dark:bg-black px-4 py-8 shadow sm:rounded-lg sm:px-10">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {variant === "REGISTER" && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Input
                label="Name"
                errors={errors}
                id="name"
                type="text"
                register={register}
                disabled={isLoading}
              />
            </motion.div>
          )}
          <Input
            label="Email"
            errors={errors}
            id="email"
            type="email"
            register={register}
            disabled={isLoading}
          />
          <Input
            label="Password"
            errors={errors}
            id="password"
            type="password"
            register={register}
            disabled={isLoading}
          />
          <div>
            <Button disabled={isLoading} fullWidth type="submit">
              {variant === "LOGIN" ? "Sign in" : "Register"}
            </Button>
          </div>
        </form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-black px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <AuthSocialButton
              icon={FcGoogle}
              onClick={() => socialAction("google")}
            />
            <AuthSocialButton
              icon={AiFillFacebook}
              onClick={() => socialAction("facebook")}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-gray-500 items-center">
          <div>
            {variant === "LOGIN"
              ? "New to Messenger?"
              : "Already have an account?"}
          </div>
          <div onClick={toggleVariant} className="underline cursor-pointer">
            {variant === "LOGIN" ? "Create an account" : "Login"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
