'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, CloudUpload, Cpu, FileJson, Sparkles } from 'lucide-react';

interface ProgressScreenProps {
  uploadProgress: number;
  totalRows: number;
}

const STAGES = [
  { id: 'uploading', label: 'Uploading file', icon: CloudUpload },
  { id: 'parsing', label: 'Parsing CSV data', icon: FileJson },
  { id: 'batching', label: 'Preparing batches (25 rows/batch)', icon: Sparkles },
  { id: 'processing', label: 'AI Extraction & Mapping', icon: Cpu },
  { id: 'finalizing', label: 'Finalizing CRM format', icon: CheckCircle2 }
];

export default function ProgressScreen({ uploadProgress, totalRows }: ProgressScreenProps) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [processingPercent, setProcessingPercent] = useState(0);

  const totalBatches = Math.ceil(totalRows / 25);

  useEffect(() => {
    if (uploadProgress < 100) {
      setActiveStageIndex(0);
    } else if (uploadProgress === 100 && activeStageIndex === 0) {
      // Move to Parsing
      setActiveStageIndex(1);
      
      // Simulate parsing
      const timer1 = setTimeout(() => {
        setActiveStageIndex(2); // Move to Batching
        
        const timer2 = setTimeout(() => {
          setActiveStageIndex(3); // Move to AI Processing
        }, 1200);

        return () => clearTimeout(timer2);
      }, 1000);

      return () => clearTimeout(timer1);
    }
  }, [uploadProgress, activeStageIndex]);

  // Handle stage 3 (AI Processing) simulated progress
  useEffect(() => {
    if (activeStageIndex === 3) {
      const durationPerBatch = 1500; // ~1.5s per batch
      const totalEstimatedTime = Math.max(totalBatches * durationPerBatch, 5000); // at least 5s
      const intervalMs = 100;
      const step = (intervalMs / totalEstimatedTime) * 100;

      const interval = setInterval(() => {
        setProcessingPercent((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95; // Hold at 95 until API finishes and moves to finalize
          }
          return prev + step;
        });
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [activeStageIndex, totalBatches]);

  // Estimate records processed based on processingPercent
  const estimatedProcessedRecords = Math.min(
    Math.round((processingPercent / 100) * totalRows),
    totalRows - 1
  );

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
          Mapping CRM Contacts
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Please wait while our AI engine standardizes and imports your list.
        </p>
      </div>

      {/* Main Progress Ring/Bar */}
      <div className="relative mb-10">
        <div className="flex justify-between items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
          <span>
            {activeStageIndex === 0 
              ? `Uploading: ${uploadProgress}%` 
              : activeStageIndex === 3 
                ? `AI processing: ${Math.round(processingPercent)}%`
                : STAGES[activeStageIndex].label
            }
          </span>
          {activeStageIndex === 3 && (
            <span>
              ~{estimatedProcessedRecords} of {totalRows} records
            </span>
          )}
        </div>
        <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800/60 rounded-full overflow-hidden border border-neutral-200/20">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full"
            initial={{ width: '0%' }}
            animate={{
              width: 
                activeStageIndex === 0
                  ? `${uploadProgress}%`
                  : activeStageIndex === 1
                    ? '100%'
                    : activeStageIndex === 2
                      ? '100%'
                      : activeStageIndex === 3
                        ? `${processingPercent}%`
                        : '100%'
            }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="space-y-4">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isCompleted = activeStageIndex > idx;
          const isActive = activeStageIndex === idx;

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/10'
                  : isCompleted
                    ? 'border-neutral-200/50 dark:border-neutral-800/50 opacity-70'
                    : 'border-transparent opacity-40'
              }`}
            >
              <div
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : isActive
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 pulse-dot'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400'
                }`}
              >
                {isActive && idx !== 4 ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Icon size={18} />
                )}
              </div>

              <div className="flex-1">
                <h4
                  className={`text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-neutral-850 dark:text-white'
                      : isCompleted
                        ? 'text-neutral-500 dark:text-neutral-400 line-through'
                        : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  {stage.label}
                </h4>
                {isActive && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {idx === 0 && 'Sending raw CSV payload to server...'}
                    {idx === 1 && 'Parsing headers and scanning data rows...'}
                    {idx === 2 && `Splitting list into ${totalBatches} batches...`}
                    {idx === 3 && `Analyzing context. Running parallel models...`}
                    {idx === 4 && 'Consolidating records and cleaning enums...'}
                  </p>
                )}
              </div>

              {isCompleted && (
                <div className="text-emerald-500">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
