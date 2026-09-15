import type { LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { cn } from "@/lib/utils.ts";

export type AdminTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headClassName?: string;
};

type AdminDataTableProps<T> = {
  columns: AdminTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  loadingRows?: number;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  noScroll?: boolean;
  onRowClick?: (row: T) => void;
  expandedKey?: string | null;
  renderExpandedRow?: (row: T) => ReactNode;
};

export function AdminDataTable<T>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  loadingRows = 5,
  emptyIcon: EmptyIcon,
  emptyMessage = "No records found",
  className,
  tableClassName,
  noScroll,
  onRowClick,
  expandedKey,
  renderExpandedRow,
}: AdminDataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-border/50 bg-card/60", className)}>
        <Table noScroll={noScroll} className={cn("min-w-[640px]", tableClassName)}>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((col) => (
                <TableHead key={col.id} className={col.headClassName}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: loadingRows }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="pointer-events-none">
                {columns.map((col, colIndex) => (
                  <TableCell key={col.id} className={col.className}>
                    <Skeleton
                      className={cn(
                        "h-3.5",
                        colIndex === 0 ? "w-24" : colIndex === columns.length - 1 ? "w-16 ml-auto" : "w-3/4",
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("text-center py-16 rounded-xl border border-border/50", className)}>
        {EmptyIcon && <EmptyIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />}
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/60", className)}>
      <Table noScroll={noScroll} className={cn("min-w-[640px]", tableClassName)}>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {columns.map((col) => (
              <TableHead key={col.id} className={col.headClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const rowKey = getRowKey(row);
            const isExpanded = expandedKey === rowKey;

            return (
              <Fragment key={rowKey}>
                <TableRow
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
                {isExpanded && renderExpandedRow && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="p-0 bg-muted/10">
                      {renderExpandedRow(row)}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
