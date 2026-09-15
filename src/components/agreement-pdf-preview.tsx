import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { isMobileBrowser, openPdfUrl } from "@/lib/openPdf.ts";

export function AgreementPdfPreview({
  url,
  filename,
  title = "Booking Terms & Conditions",
  error = false,
}: {
  url: string | null;
  filename: string;
  title?: string;
  error?: boolean;
}) {
  const mobile = isMobileBrowser();

  const handleOpen = () => {
    if (!url) return;
    openPdfUrl(url, filename);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/40 px-3 py-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        {url ? (
          <Button type="button" size="sm" className="h-8 shrink-0 cursor-pointer" onClick={handleOpen}>
            Open PDF
          </Button>
        ) : null}
      </div>
      {url ? (
        mobile ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              The agreement is ready. Mobile browsers cannot show PDFs inside this screen — tap Open PDF to view it.
            </p>
            <Button type="button" className="cursor-pointer" onClick={handleOpen}>
              Open PDF
            </Button>
          </div>
        ) : (
          <iframe
            key={url}
            src={url}
            title={title}
            className="h-72 w-full bg-white"
          />
        )
      ) : (
        <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-muted-foreground">
          {error ? "Failed to load agreement PDF" : "Loading agreement PDF..."}
        </div>
      )}
    </div>
  );
}
