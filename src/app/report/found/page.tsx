import { FoundItemForm } from "@/components/forms/found-item-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ReportFoundPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <FoundItemForm />
    </div>
  );
}
