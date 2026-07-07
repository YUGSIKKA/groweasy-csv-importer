'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, Layers, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import CsvDropzone from '../components/CsvDropzone';
import CsvPreviewTable from '../components/CsvPreviewTable';
import ProgressScreen from '../components/ProgressScreen';
import ResultsView from '../components/ResultsView';
import { uploadAndImportCsv, ImportResponse } from '../services/api';

type ImportStatus = 'idle' | 'preview' | 'importing' | 'results' | 'error';

export default function Home() {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    
    // Quick local parse to count total records
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setTotalRows(results.data.length);
        setStatus('preview');
      },
      error: () => {
        // Fallback if full parsing fails
        setTotalRows(100);
        setStatus('preview');
      }
    });
  };

  const handleImportStart = async () => {
    if (!file) return;

    setStatus('importing');
    setUploadProgress(0);
    setErrorMsg(null);

    try {
      const result = await uploadAndImportCsv(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        setImportResult(result);
        setStatus('results');
      } else {
        throw new Error('Server reported failure processing file.');
      }
    } catch (err: unknown) {
      let message = 'An error occurred while uploading and mapping your file.';
      if (err instanceof Error) {
        message = err.message;
      }
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
        if (axiosErr.response?.data?.message) {
          message = axiosErr.response.data.message;
        } else if (axiosErr.response?.data?.error) {
          message = axiosErr.response.data.error;
        }
      }
      setErrorMsg(message);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setFile(null);
    setTotalRows(0);
    setUploadProgress(0);
    setImportResult(null);
    setErrorMsg(null);
    setStatus('idle');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-16"
            >
              {/* Hero Section */}
              <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm">
                  <Sparkles size={14} className="animate-pulse" />
                  Now mapping with Gemini 1.5 Flash
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                  AI-Powered Universal{' '}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                    CSV Importer
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400">
                  Upload contacts, lead spreadsheets, or ad exports from any source. Our LLM-powered engine auto-detects, standardizes, and normalizes fields into your CRM schema instantly.
                </p>
              </div>

              {/* Upload Workspace */}
              <div className="max-w-3xl mx-auto">
                <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-xl">
                  <CsvDropzone onFileSelect={handleFileSelect} />
                </div>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="glass-panel p-6 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <Zap size={22} />
                  </div>
                  <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                    Zero Header Config
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No need to pre-format sheets. Map arbitrary columns like <i>&quot;Telephone&quot;</i> or <i>&quot;Contact Person&quot;</i> automatically.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <ShieldCheck size={22} />
                  </div>
                  <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                    Data Normalization
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Extracts phone country codes, parses messy JavaScript dates, and aggregates secondary emails into notes safely.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                    <Layers size={22} />
                  </div>
                  <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                    100,000+ Row Streaming
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Backend uses memory-efficient stream parsing to slice large imports into parallelized LLM batch operations.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'preview' && file && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto"
            >
              <CsvPreviewTable
                file={file}
                onImportClick={handleImportStart}
                onCancelClick={handleReset}
              />
            </motion.div>
          )}

          {status === 'importing' && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ProgressScreen uploadProgress={uploadProgress} totalRows={totalRows} />
            </motion.div>
          )}

          {status === 'results' && importResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsView result={importResult} onReset={handleReset} />
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto glass-panel p-8 rounded-2xl border-red-200 dark:border-red-900/50 shadow-xl text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-md shadow-red-500/10">
                <AlertCircle size={32} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                  Import Failed
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {errorMsg || 'An unknown error occurred during LLM mapping.'}
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  onClick={handleImportStart}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  Retry Import
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-6 border-t border-neutral-200/50 dark:border-neutral-850 bg-white/40 dark:bg-neutral-950/10 text-center text-xs text-neutral-500 dark:text-neutral-450">
        © {new Date().getFullYear()} GrowEasy CRM Systems. Built for high-growth sales teams.
      </footer>
    </div>
  );
}
