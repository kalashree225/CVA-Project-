"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      fetchUser();
    }
  }, [isAuthenticated, router, fetchUser]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-white relative overflow-hidden">
      {/* Creative Background Layers */}
      <div className="absolute inset-0 digital-grid pointer-events-none" />
      <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full pointer-events-none" />

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
