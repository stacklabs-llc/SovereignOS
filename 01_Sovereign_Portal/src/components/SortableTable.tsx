import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface ColumnConfig<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface SortableTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  defaultSortField?: string;
  defaultSortOrder?: 'asc' | 'desc';
  onRowClick?: (item: T) => void;
  selectedRowKey?: (item: T) => boolean;
  theme?: 'neon' | 'glass';
}

export function SortableTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchKeys = [],
  defaultSortField,
  defaultSortOrder = 'asc',
  onRowClick,
  selectedRowKey,
  theme = 'glass'
}: SortableTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | undefined>(defaultSortField);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || searchKeys.length === 0) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      return searchKeys.some(key => {
        const val = item[key];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings/other
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortOrder === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortField, sortOrder]);

  const tableClasses = theme === 'neon'
    ? 'w-full text-left border-collapse text-xs text-slate-300'
    : 'w-full text-left border-collapse text-xs text-stone-300 font-mono';

  const thClasses = (sortable: boolean) => {
    const base = "py-3 px-4 uppercase tracking-widest text-[9px] font-bold border-b select-none transition-colors ";
    const themeStyle = theme === 'neon'
      ? "border-white/5 bg-[#0b101f] text-slate-400 hover:text-white"
      : "border-[#b18a66]/20 bg-black/45 text-stone-400 hover:text-[#fbbf24]";
    return base + themeStyle + (sortable ? " cursor-pointer" : "");
  };

  const trClasses = (isSelected: boolean) => {
    const base = "border-b transition-colors duration-150 ";
    const themeStyle = theme === 'neon'
      ? `border-white/5 bg-[#080d19]/40 hover:bg-[#111a36]/50 ${isSelected ? "bg-[#111a36]/60 text-white" : ""}`
      : `border-[#b18a66]/10 bg-black/20 hover:bg-[#b18a66]/5 ${isSelected ? "bg-[#b18a66]/10 text-white border-l-2 border-l-[#fbbf24]" : ""}`;
    return base + themeStyle + (onRowClick ? " cursor-pointer" : "");
  };

  const tdClasses = "py-3 px-4 align-middle";

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {searchKeys.length > 0 && (
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-1.5 rounded-lg text-xs outline-none transition-all ${
              theme === 'neon'
                ? 'bg-[#03060c] border border-white/10 text-white focus:border-[#38bdf8]/60 placeholder-slate-600'
                : 'bg-black/60 border border-[#b18a66]/30 text-white focus:border-[#fbbf24] placeholder-gray-600 font-mono'
            }`}
          />
        </div>
      )}

      <div className={`overflow-x-auto rounded-xl border ${
        theme === 'neon' ? 'border-white/5 bg-[#080d19]' : 'border-[#b18a66]/20 bg-black/40'
      }`}>
        <table className={tableClasses}>
          <thead>
            <tr>
              {columns.map((col) => {
                const sortable = col.sortable !== false;
                const isSorted = sortField === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => sortable && handleSort(col.key)}
                    className={thClasses(sortable)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      {sortable && (
                        <span className="opacity-70">
                          {isSorted ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#38bdf8]" /> : <ArrowDown className="w-3 h-3 text-[#38bdf8]" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-slate-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-500 italic">
                  No matches found.
                </td>
              </tr>
            ) : (
              sortedData.map((item, idx) => {
                const isSelected = selectedRowKey ? selectedRowKey(item) : false;
                return (
                  <tr
                    key={item.sys_id || idx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={trClasses(isSelected)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={tdClasses}>
                        {col.render ? col.render(item) : (item[col.key] !== undefined && item[col.key] !== null ? String(item[col.key]) : '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
