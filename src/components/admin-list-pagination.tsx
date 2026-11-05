import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

type AdminListPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

export function AdminListPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: AdminListPaginationProps) {
  if (total <= 0 || totalPages <= 1) return null;

  const safePages = Math.max(1, totalPages);
  const currentPage = Math.min(Math.max(1, page), safePages);
  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-foreground font-medium px-2">
          Page {currentPage} of {safePages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= safePages}
          onClick={() => onPageChange(currentPage + 1)}
          className="cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
