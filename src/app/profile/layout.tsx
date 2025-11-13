import type { Metadata } from "next";
import React from 'react';

export const metadata: Metadata = {
  title: "Profile Settings - Asset Management Platform",
  description: "Manage your profile settings",
};

export default function ProfileLayout({
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

