"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { ToastProvider } from "@/lib/toast-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <ToastProvider>
      <AppNavbar />
      <main className="container-page py-6 sm:py-10">{children}</main>
    </ToastProvider>
  );
}
