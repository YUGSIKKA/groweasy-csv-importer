import { buildSystemPrompt, buildUserPrompt } from '../ai/prompt';

describe('AI Prompt Builder Tests', () => {
  test('buildSystemPrompt contains CRM schema requirements and enums', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('GOOD_LEAD_FOLLOW_UP');
    expect(prompt).toContain('leads_on_demand');
    expect(prompt).toContain('country_code');
    expect(prompt).toContain('mobile_without_country_code');
    expect(prompt).toContain('crm_status');
    expect(prompt).toContain('crm_note');
  });

  test('buildUserPrompt properly serializes record arrays', () => {
    const mockRecords = [
      { name: 'John Doe', email: 'john@example.com', phone: '12345' },
      { name: 'Jane Smith', email: 'jane@example.com' }
    ];
    const prompt = buildUserPrompt(mockRecords);
    expect(prompt).toContain('John Doe');
    expect(prompt).toContain('jane@example.com');
  });
});
