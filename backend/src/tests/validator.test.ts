import { crmRecordSchema } from '../validators/crm.validator';

describe('CRM Validator Schema Tests', () => {
  test('Valid record with email and phone passes validation', () => {
    const record = {
      name: 'John Doe',
      email: 'john@example.com',
      mobile_without_country_code: '1234567890',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: 'leads_on_demand'
    };

    const result = crmRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
      expect(result.data.data_source).toBe('leads_on_demand');
    }
  });

  test('Record with only email passes validation', () => {
    const record = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    const result = crmRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  test('Record with only phone passes validation', () => {
    const record = {
      name: 'John Doe',
      mobile_without_country_code: '1234567890'
    };
    const result = crmRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  test('Record missing both email and phone fails validation (should be skipped)', () => {
    const record = {
      name: 'John Doe',
      company: 'GrowEasy'
    };
    const result = crmRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  test('Invalid crm_status falls back to empty string', () => {
    const record = {
      email: 'john@example.com',
      crm_status: 'INVALID_STATUS'
    };
    const result = crmRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.crm_status).toBe('');
    }
  });

  test('Invalid data_source falls back to empty string', () => {
    const record = {
      email: 'john@example.com',
      data_source: 'unknown_source'
    };
    const result = crmRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data_source).toBe('');
    }
  });

  test('Date string validation and ISO transformation', () => {
    const record = {
      email: 'john@example.com',
      created_at: '2024-05-24'
    };
    const result = crmRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.created_at).toBe(new Date('2024-05-24').toISOString());
    }
  });
});
