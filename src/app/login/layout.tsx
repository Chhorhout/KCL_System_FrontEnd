import type { Metadata } from "next";
import React from 'react';

export const metadata: Metadata = {
  title: "Login - Asset Management Platform",
  description: "Sign in to your account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}

