'use client';

import { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, FileText, ArrowRight } from 'lucide-react';

interface CsvPreviewTableProps {
  file: File;
  onImportClick: () => void;
  onCancelClick: () => void;
}

export default function CsvPreviewTable({
  file,
  onImportClick,
  onCancelClick
}: CsvPreviewTableProps) {
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    Papa.parse(file, {
      preview: 100, // Read only the first 100 rows
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as Record<string, string>[];
        setData(parsedData);
        if (parsedData.length > 0) {
          setHeaders(Object.keys(parsedData[0]));
        }
        setLoading(false);
      },
      error: () => {
        setLoading(false);
      }
    });
  }, [file]);

  const columns = useMemo(() => {
    return headers.map((header) => ({
      accessorKey: header,
      header: header,
      cell: (info: { getValue: () => unknown }) => {
        const val = info.getValue();
        return typeof val === 'string' && val ? val : <span className="text-neutral-400 dark:text-neutral-600">-</span>;
      }
    }));
  }, [headers]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  return (
    <div className="w-full glass-panel rounded-2xl p-6 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-neutral-800 dark:text-neutral-200">
              {file.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Local preview of the first 100 rows • {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onCancelClick}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Choose another file
          </button>
          
          <button
            onClick={onImportClick}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
          >
            Import using AI
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search preview rows..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
        />
      </div>

      {loading ? (
        <div className="space-y-3 py-6">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          <div className="h-20 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-pulse" />
          <div className="h-20 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-pulse" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          No records could be parsed from this CSV.
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 max-h-[400px] overflow-y-auto relative">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-neutral-50 dark:bg-neutral-900/80 sticky top-0 z-10 border-b border-neutral-200/60 dark:border-neutral-800/60">
                <tr>
                  {table.getHeaderGroups()[0].headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3.5 font-semibold text-neutral-700 dark:text-neutral-300 select-none whitespace-nowrap bg-neutral-50 dark:bg-neutral-900"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/40 dark:divide-neutral-800/40">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 bg-white/40 dark:bg-neutral-950/20"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap max-w-[250px] truncate"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount() || 1} ({table.getFilteredRowModel().rows.length} records filtered)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
