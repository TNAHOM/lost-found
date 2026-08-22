import Link from "next/link";
import { Shield, Sparkles, Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white py-8 text-sm text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                University Campus Lost & Found System
              </p>
              <p className="text-xs text-slate-500">
                Multi-Factor Semantic Matching Engine • Powered by Explainable Scoring
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              Campus Security Verified
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Zero-LLM Explainability
            </span>
            <Link
              href="/matches"
              className="hover:text-slate-900 transition-colors font-medium text-blue-600"
            >
              Match Matrix
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
