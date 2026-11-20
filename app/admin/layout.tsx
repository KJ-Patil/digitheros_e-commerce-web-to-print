import React from "react";
import { AdminNav } from "@/components/navigation/admin-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { DemoNotice } from "@/components/ui/demo-notice";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F1317] text-[#E0E6ED]">
      <DemoNotice
        module="ADMIN PRODUCTION FLOOR"
        note="Internal operational pipeline. Production files remain locked until customer proof approval is signed."
      />
      <AdminNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
