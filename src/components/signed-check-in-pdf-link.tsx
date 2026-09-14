import { useState, type ReactNode } from "react";
import { inspectionsApi } from "@/api/inspections.api.ts";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export function SignedCheckInPdfLink({
  inspectionId,
  className,
  children,
}: {
  inspectionId: string;
  className?: string;
  children?: ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await inspectionsApi.openSignedPdf(inspectionId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open agreement PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={loading}
      aria-busy={loading}
      className={cn(
        "inline-flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {loading ? "Opening PDF..." : (children ?? "View agreement PDF")}
    </button>
  );
}
