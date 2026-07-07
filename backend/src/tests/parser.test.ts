import fs from 'fs';
import path from 'path';
import { parseCsvStream } from '../parser/csv.parser';

describe('CSV Stream Parser Tests', () => {
  const tempFilePath = path.join(__dirname, 'test-temp.csv');

  beforeAll(() => {
    // Generate a temporary CSV file with 55 records
    const headers = 'FullName,EmailAddress,PhoneNumber,City,Company\n';
    let rows = '';
    for (let i = 1; i <= 55; i++) {
      rows += `User ${i},user${i}@example.com,+1 555-010${i},City ${i},Company ${i}\n`;
    }
    fs.writeFileSync(tempFilePath, headers + rows);
  });

  afterAll(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('Streams and batches CSV records successfully', async () => {
    const batches: any[][] = [];
    const { totalRows, totalBatches } = await parseCsvStream(
      tempFilePath,
      async (batch, index) => {
        batches.push(batch);
      },
      25
    );

    // 55 records split in batches of 25:
    // Batch 0: 25 records
    // Batch 1: 25 records
    // Batch 2: 5 records
    expect(totalRows).toBe(55);
    expect(totalBatches).toBe(3);
    expect(batches.length).toBe(3);
    expect(batches[0].length).toBe(25);
    expect(batches[1].length).toBe(25);
    expect(batches[2].length).toBe(5);

    // Verify first row mapping keys
    expect(batches[0][0]).toHaveProperty('FullName');
    expect(batches[0][0]).toHaveProperty('EmailAddress');
    expect(batches[0][0].FullName).toBe('User 1');
  });
});
