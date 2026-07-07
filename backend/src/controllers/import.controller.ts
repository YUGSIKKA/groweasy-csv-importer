import { Request, Response } from 'express';
import fs from 'fs';
import { parseCsvStream } from '../parser/csv.parser';
import { AiService } from '../services/ai.service';
import { crmRecordSchema } from '../validators/crm.validator';
import { CrmRecord } from '../types/crm';
import { logger } from '../utils/logger';

const aiService = new AiService();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Controller to handle CSV imports.
 * Streams the CSV, splits it into batches of 25, runs LLM extraction, and validates outputs.
 */
export async function importCsvHandler(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    return;
  }

  logger.info({ filename: file.filename, size: file.size }, 'Upload started: CSV file received');

  let totalRows = 0;
  let imported = 0;
  let skipped = 0;
  let failedBatches = 0;
  const processedRecords: CrmRecord[] = [];

  try {
    // Process CSV in batches of 25
    await parseCsvStream(file.path, async (batch, batchIndex) => {
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let mappedRecords: CrmRecord[] = [];

      while (attempts < maxAttempts && !success) {
        try {
          attempts++;
          mappedRecords = await aiService.processBatch(batch);
          success = true;
        } catch (error: any) {
          logger.warn(
            { batchIndex, attempt: attempts, error: error.message },
            'Batch LLM request failed. Retrying...'
          );

          if (attempts < maxAttempts) {
            // Exponential backoff: 1s, 2s, 4s
            const backoffMs = Math.pow(2, attempts - 1) * 1000;
            await delay(backoffMs);
          }
        }
      }

      if (!success) {
        logger.error({ batchIndex }, 'Batch failed permanently after 3 attempts');
        failedBatches++;
        // If batch fails, we skip all 25 records
        skipped += batch.length;
        return;
      }

      // Validate each record parsed by AI
      for (const record of mappedRecords) {
        const validation = crmRecordSchema.safeParse(record);
        if (validation.success) {
          processedRecords.push(validation.data as CrmRecord);
          imported++;
        } else {
          // If Zod validation fails, record is skipped
          skipped++;
          logger.debug(
            { record, errors: validation.error.format() },
            'Record skipped due to Zod validation failure'
          );
        }
      }
    }, 25);

    // Get final row count
    totalRows = imported + skipped;

    logger.info(
      { totalRows, imported, skipped, failedBatches },
      'Import job completed successfully'
    );

    res.status(200).json({
      success: true,
      totalRows,
      imported,
      skipped,
      failedBatches,
      records: processedRecords
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Fatal error during CSV import process');
    res.status(500).json({
      success: false,
      error: 'Failed to process import job',
      message: error.message
    });
  } finally {
    // Clean up temporary file asynchronously
    fs.unlink(file.path, (err) => {
      if (err) {
        logger.error({ path: file.path, error: err.message }, 'Failed to delete temp file');
      } else {
        logger.debug({ path: file.path }, 'Temporary upload file deleted');
      }
    });
  }
}
