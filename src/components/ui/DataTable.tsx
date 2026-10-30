import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={`skel-${i}`}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={`skel-${i}-${j}`} className="px-4 py-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage,
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  const { t } = useLanguage();
  return (
    <div className="jdv-data-table overflow-x-auto rounded-2xl border border-border bg-card text-card-foreground">
      <table className="w-full border-collapse text-sm text-card-foreground">
        <thead>
          <tr className="border-b border-border bg-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <TableSkeleton cols={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-muted-foreground"
              >
                {emptyMessage ?? t('sh.noData')}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`bg-card text-card-foreground transition-colors hover:bg-muted/70 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-card-foreground ${col.className ?? ''}`}>
                    {col.render
                      ? col.render(row)
                      : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
