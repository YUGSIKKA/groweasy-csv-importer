'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileCode, AlertCircle, X } from 'lucide-react';

interface CsvDropzoneProps {
  onFileSelect: (file: File) => void;
}

export default function CsvDropzone({ onFileSelect }: CsvDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      
      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];

      // Validate wrong extension
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Invalid file extension. Please upload a .csv file.');
        return;
      }

      // Validate empty file
      if (file.size === 0) {
        setError('The uploaded CSV file is empty. Please upload a valid CSV.');
        return;
      }

      // Validate size limit (20MB)
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size exceeds the 20MB limit. Please upload a smaller file.');
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        {...getRootProps()}
        className={`w-full min-h-[300px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : 'border-neutral-300 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20'
        }`}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={{ scale: isDragActive ? 1.08 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-sm ${
            isDragActive
              ? 'bg-indigo-600 text-white shadow-indigo-500/20'
              : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {isDragActive ? <Upload size={28} /> : <FileCode size={28} />}
        </motion.div>

        <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">
          {isDragActive ? 'Drop your CSV file here' : 'Upload your CRM lead list'}
        </h3>
        
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-6">
          Drag and drop your spreadsheet or click to browse. We support Facebook lead exports, Google Ads sheets, or any CRM exports.
        </p>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
          Accepts only .csv up to 20MB
        </div>
      </div>
    </div>
  );
}
