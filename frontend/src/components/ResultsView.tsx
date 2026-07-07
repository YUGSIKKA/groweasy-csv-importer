'use client';

import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import { ImportResponse, CrmRecord } from '../services/api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  RefreshCw,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';

interface ResultsViewProps {
  result: ImportResponse;
  onReset: () => void;
}

export default function ResultsView({ result, onReset }: ResultsViewProps) {
  const [globalFilter, setGlobalFilter] = useState('');

  const records = useMemo(() => result.records, [result]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info: { getValue: () => unknown }) => (info.getValue() as string) || <span className="text-neutral-400">-</span>
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info: { getValue: () => unknown }) => (info.getValue() as string) || <span className="text-neutral-400">-</span>
      },
      {
        header: 'Phone',
        cell: (info: { row: { original: CrmRecord } }) => {
          const row = info.row.original;
          const code = row.country_code ? `${row.country_code} ` : '';
          const num = row.mobile_without_country_code || '';
          if (!num) return <span className="text-neutral-400">-</span>;
          return `${code}${num}`;
        }
      },
      {
        accessorKey: 'crm_status',
        header: 'Status',
        cell: (info: { getValue: () => unknown }) => {
          const status = info.getValue() as string;
          if (!status) return <span className="text-neutral-400">-</span>;
          const colors: Record<string, string> = {
            GOOD_LEAD_FOLLOW_UP: 'bg-emerald-50 text-emerald-750 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
            DID_NOT_CONNECT: 'bg-amber-50 text-amber-750 border-amber-250 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
            BAD_LEAD: 'bg-red-50 text-red-750 border-red-250 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30',
            SALE_DONE: 'bg-indigo-50 text-indigo-750 border-indigo-250 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30'
          };
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status] || 'bg-neutral-50 text-neutral-600'}`}>
              {status.replace(/_/g, ' ')}
            </span>
          );
        }
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: (info: { getValue: () => unknown }) => (info.getValue() as string) || <span className="text-neutral-400">-</span>
      },
      {
        accessorKey: 'city',
        header: 'City/State',
        cell: (info: { row: { original: CrmRecord } }) => {
          const row = info.row.original;
          const parts = [row.city, row.state].filter(Boolean);
          return parts.length > 0 ? parts.join(', ') : <span className="text-neutral-400">-</span>;
        }
      },
      {
        accessorKey: 'data_source',
        header: 'Source',
        cell: (info: { getValue: () => unknown }) => {
          const val = info.getValue() as string;
          return val ? (
            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
              {val}
            </span>
          ) : (
            <span className="text-neutral-400">-</span>
          );
        }
      },
      {
        accessorKey: 'crm_note',
        header: 'Notes',
        cell: (info: { getValue: () => unknown }) => {
          const val = info.getValue() as string;
          return (
            <div className="max-w-[200px] truncate text-xs" title={val}>
              {val || <span className="text-neutral-400">-</span>}
            </div>
          );
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data: records,
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

  const exportToJson = () => {
    const jsonStr = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `imported_crm_leads_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCsv = () => {
    const csvStr = Papa.unparse(records);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `imported_crm_leads_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            Import Job Completed
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            AI has successfully standardized the fields and mapped records to the GrowEasy target CRM.
          </p>
        </div>

        <button
          onClick={onReset}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 self-start cursor-pointer"
        >
          <RefreshCw size={16} />
          Import new file
        </button>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rows */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <FolderOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Rows
            </p>
            <h4 className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
              {result.totalRows}
            </h4>
          </div>
        </div>

        {/* Successfully Imported */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Successfully Imported
            </p>
            <h4 className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
              {result.imported}
            </h4>
          </div>
        </div>

        {/* Skipped */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Skipped Records
            </p>
            <h4 className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
              {result.skipped}
            </h4>
          </div>
        </div>

        {/* Failed AI Batches */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className={`p-3 rounded-xl ${result.failedBatches > 0 ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Failed AI Batches
            </p>
            <h4 className={`text-2xl font-bold mt-0.5 ${result.failedBatches > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>
              {result.failedBatches}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Extracted Records Table */}
      <div className="glass-panel rounded-2xl p-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h3 className="font-bold text-neutral-800 dark:text-neutral-200">
            Extracted Lead Records
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToJson}
              disabled={records.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileCode size={14} />
              Export JSON
            </button>
            <button
              onClick={exportToCsv}
              disabled={records.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search mapped records..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No contacts were successfully mapped. Check system prompt logs.
          </div>
        ) : (
          <>
            {/* Table wrapper */}
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

            {/* Pagination Controls */}
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
    </div>
  );
}
