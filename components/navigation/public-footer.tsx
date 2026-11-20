import React from "react";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="bg-[#12161A] text-[#E0E5EC] border-t border-[#27303A] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded bg-[#E65A28] text-white flex items-center justify-center font-mono font-bold text-xs">
                DH
              </span>
              <span className="font-bold tracking-tight text-white">DIGITAL HEROES</span>
            </div>
            <p className="text-xs text-[#9AA5B1] leading-relaxed">
              Transactional web-to-print platform across six dedicated print divisions. Real manufacturing
              automation from configured quote to factory floor output.
            </p>
            <p className="text-[11px] font-mono text-[#6A7684] mt-3">
              digitalheroes.co.in • 2026 Edition
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#A0ACB9] mb-3">
              Print Divisions
            </h4>
            <ul className="text-xs space-y-2 text-[#CCD5DF]">
              <li>01. Labels & Stickers</li>
              <li>02. Race & Event Numbers</li>
              <li>03. MTB Boards</li>
              <li>04. Commercial Stamps</li>
              <li>05. Laser Trophies & Awards</li>
              <li>06. Industrial Laser Cutting</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#A0ACB9] mb-3">
              Architecture & Flows
            </h4>
            <ul className="text-xs space-y-2 text-[#CCD5DF]">
              <li>
                <Link href="/customer/dashboard" className="hover:text-white transition-colors">
                  Customer Dashboard & Reorder
                </Link>
              </li>
              <li>
                <Link href="/admin/production" className="hover:text-white transition-colors">
                  Production Console & Pipeline
                </Link>
              </li>
              <li>
                <Link href="/design-system" className="hover:text-[#E65A28] transition-colors">
                  Boutique-Industrial UI System
                </Link>
              </li>
              <li className="text-[#8B98A6]">Server-Side PDF/PNG Engine</li>
              <li className="text-[#8B98A6]">CSV Variable-Data Batch Merge</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#A0ACB9] mb-3">
              System Status
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[#CAD4DF]">Module 1: UI System Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-[#A2ADB8]">Module 2: Supabase Schema (Next)</span>
              </div>
              <div className="pt-2 text-[11px] text-[#818E9C] border-t border-[#232B34]">
                Strict server authorization enforced across customer and admin zones.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#232B34] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7B8795]">
          <div>© 2026 Digital Heroes. Prototype Edition. All rights reserved.</div>
          <div className="font-mono text-[11px] mt-2 sm:mt-0">
            Stack: Next.js 16 • React 19 • Tailwind 4 • Supabase
          </div>
        </div>
      </div>
    </footer>
  );
}
