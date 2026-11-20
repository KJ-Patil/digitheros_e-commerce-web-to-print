import React from "react";
import { CustomerNav } from "@/components/navigation/customer-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { DemoNotice } from "@/components/ui/demo-notice";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5EF]">
      <DemoNotice
        module="CUSTOMER PORTAL"
        note="Customer session active. Note: RLS policies in Module 2 will strictly isolate customer data from other accounts."
      />
      <CustomerNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
