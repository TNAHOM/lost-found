"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, PlusCircle, Compass, ShieldCheck } from "lucide-react";
import { useItems } from "@/lib/items-context";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { matches } = useItems();

  const strongMatchesCount = matches.filter((m) => m.overallScore >= 80).length;

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Compass },
    {
      href: "/matches",
      label: "Match Studio",
      icon: Sparkles,
      badge: strongMatchesCount > 0 ? strongMatchesCount : undefined,
    },
    { href: "/report/lost", label: "Report Lost", icon: PlusCircle },
    { href: "/report/found", label: "Report Found", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                Campus Lost & Found
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150 relative",
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-bold text-white shadow-xs">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions & Reset Button */}
        {/* <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToMockData}
            title="Reset to benchmark assessment dataset"
            className="hidden sm:inline-flex text-xs h-9 text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Demo</span>
          </Button>

          <Link href="/report/lost">
            <Button variant="default" size="sm" className="h-9 font-medium shadow-xs">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">File a Report</span>
              <span className="sm:hidden">Report</span>
            </Button>
          </Link>
        </div> */}
      </div>
    </header>
  );
}
