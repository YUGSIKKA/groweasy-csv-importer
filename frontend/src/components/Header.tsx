'use client';

import ThemeToggle from './ThemeToggle';
import { Database } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/75 dark:bg-neutral-950/75 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Database size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
              GrowEasy Importer
            </h1>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase font-mono">
              AI-Powered CRM Mapper
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
            <span className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Documentation</span>
            <span className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">CRM Integrations</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">
              v1.0
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
