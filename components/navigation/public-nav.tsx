import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#E2E1D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded bg-[#13171C] text-white flex items-center justify-center font-mono font-bold text-sm tracking-tight group-hover:bg-[#E65A28] transition-colors">
              DH
            </span>
            <div className="leading-tight">
              <span className="text-base font-bold tracking-tight text-[#13171C] block">
                DIGITAL HEROES
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#717E8C] uppercase block">
                Web-to-Print Floor
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-[#495462]">
            <Link href="/#divisions" className="hover:text-[#13171C] transition-colors">
              Divisions (6)
            </Link>
            <Link href="/#gallery" className="hover:text-[#13171C] transition-colors">
              Work Gallery
            </Link>
            <Link href="/#calculator" className="hover:text-[#13171C] transition-colors">
              Instant Pricing
            </Link>
            <Link href="/design-system" className="hover:text-[#E65A28] transition-colors text-[#E65A28] font-bold">
              UI System
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Auth / Roles
            </Button>
          </Link>
          <Link href="/customer/dashboard">
            <Button variant="outline" size="sm">
              Customer Portal
            </Button>
          </Link>
          <Link href="/admin/production">
            <Button variant="secondary" size="sm">
              Admin Pipeline
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
