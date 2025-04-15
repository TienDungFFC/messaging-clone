"use client";

import React from 'react';
import { Session } from 'next-auth';

interface AuthContextWrapperProps {
  children: React.ReactNode;
  session: Session | null;
}

const AuthContextWrapper = ({ children, session }: AuthContextWrapperProps) => {
  return (
    <>
      {children}
    </>
  );
};

export default AuthContextWrapper;
