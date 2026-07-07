import fs from 'fs';
import csvParser from 'csv-parser';
import { pino } from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

interface ParseResult {
  totalRows: number;
  totalBatches: number;
}

/**
 * Parses a CSV file using node streams and yields batches of a specified size.
 * Pauses the stream during batch processing to avoid memory leaks or excessive resource use.
 * 
 * @param filePath Path to the uploaded CSV file
 * @param onBatch Async callback to process a batch
 * @param batchSize Number of records per batch (default 25)
 */
export async function parseCsvStream(
  filePath: string,
  onBatch: (batch: Record<string, any>[], batchIndex: number) => Promise<void>,
  batchSize: number = 25
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    let batchIndex = 0;
    let currentBatch: Record<string, any>[] = [];
    let processingPromise: Promise<void> = Promise.resolve();

    const readStream = fs.createReadStream(filePath);
    const parser = csvParser();

    const stream = readStream.pipe(parser);

    stream.on('data', (row) => {
      rowCount++;
      currentBatch.push(row);

      if (currentBatch.length === batchSize) {
        const batchToProcess = [...currentBatch];
        currentBatch = [];
        const currentIndex = batchIndex++;

        // Pause stream to apply backpressure while processing LLM call
        stream.pause();

        processingPromise = processingPromise
          .then(() => onBatch(batchToProcess, currentIndex))
          .then(() => {
            stream.resume();
          })
          .catch((err) => {
            logger.error({ batchIndex: currentIndex, error: err.message }, 'Error in batch processing stream callback');
            stream.destroy(err);
          });
      }
    });

    stream.on('end', async () => {
      try {
        // Wait for any active batch processing to complete
        await processingPromise;

        // Process any remaining records
        if (currentBatch.length > 0) {
          const batchToProcess = [...currentBatch];
          const currentIndex = batchIndex++;
          await onBatch(batchToProcess, currentIndex);
        }

        logger.info({ totalRows: rowCount, totalBatches: batchIndex }, 'Finished parsing CSV stream');
        resolve({ totalRows: rowCount, totalBatches: batchIndex });
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', (err) => {
      logger.error({ error: err.message }, 'CSV Stream parsing error');
      reject(err);
    });
  });
}
