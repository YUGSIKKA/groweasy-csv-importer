import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import OpenAI from 'openai';
import { buildSystemPrompt, buildUserPrompt } from '../ai/prompt';
import { CrmRecord } from '../types/crm';
import { logger } from '../utils/logger';

// Define the schema for structured outputs (in Gemini & OpenAI formats)
const crmRecordProperties = {
  created_at: { type: SchemaType.STRING, description: 'ISO date string or empty string' },
  name: { type: SchemaType.STRING },
  email: { type: SchemaType.STRING },
  country_code: { type: SchemaType.STRING },
  mobile_without_country_code: { type: SchemaType.STRING },
  company: { type: SchemaType.STRING },
  city: { type: SchemaType.STRING },
  state: { type: SchemaType.STRING },
  country: { type: SchemaType.STRING },
  lead_owner: { type: SchemaType.STRING },
  crm_status: { type: SchemaType.STRING, description: 'GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE, or empty' },
  crm_note: { type: SchemaType.STRING },
  data_source: { type: SchemaType.STRING, description: 'leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots, or empty' },
  possession_time: { type: SchemaType.STRING },
  description: { type: SchemaType.STRING }
};

const requiredFields = Object.keys(crmRecordProperties);

const geminiSchema = {
  type: SchemaType.ARRAY,
  description: 'List of mapped CRM records',
  items: {
    type: SchemaType.OBJECT,
    properties: crmRecordProperties,
    required: requiredFields
  }
};

const openAiSchema = {
  name: 'crm_batch_mapping',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      records: {
        type: 'array',
        items: {
          type: 'object',
          properties: crmRecordProperties,
          required: requiredFields,
          additionalProperties: false
        }
      }
    },
    required: ['records'],
    additionalProperties: false
  }
};

export class AiService {
  private provider: 'gemini' | 'openai';
  private geminiClient?: GoogleGenerativeAI;
  private openAiClient?: OpenAI;

  constructor() {
    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        logger.warn('OPENAI_API_KEY is not defined. Falling back to Gemini.');
        this.provider = 'gemini';
      } else {
        this.provider = 'openai';
        this.openAiClient = new OpenAI({ apiKey });
      }
    } else {
      this.provider = 'gemini';
    }

    if (this.provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.error('GEMINI_API_KEY is not defined. AI mapping calls will fail.');
      }
      this.geminiClient = new GoogleGenerativeAI(apiKey || '');
    }
  }

  /**
   * Process a batch of raw records with the configured AI provider.
   * Returns a list of mapped CRM records.
   */
  async processBatch(records: Record<string, any>[]): Promise<CrmRecord[]> {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(records);
    const startTime = Date.now();

    logger.info({ batchSize: records.length, provider: this.provider }, 'Sending batch to AI...');

    try {
      if (this.provider === 'openai' && this.openAiClient) {
        const response = await this.openAiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: openAiSchema
          },
          temperature: 0.1
        });

        const elapsed = Date.now() - startTime;
        logger.info({ elapsedMs: elapsed }, 'AI response received from OpenAI');

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('OpenAI returned an empty response.');
        }

        const parsed = JSON.parse(content);
        return parsed.records as CrmRecord[];
      } else {
        // Default to Gemini
        if (!this.geminiClient) {
          throw new Error('Gemini API client is not initialized.');
        }

        // Use gemini-2.5-flash for speed and structural outputs
        const model = this.geminiClient.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          systemInstruction: systemPrompt
        });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: geminiSchema,
            temperature: 0.1
          }
        });

        const elapsed = Date.now() - startTime;
        logger.info({ elapsedMs: elapsed }, 'AI response received from Gemini');

        const content = result.response.text();
        if (!content) {
          throw new Error('Gemini returned an empty response.');
        }

        return JSON.parse(content) as CrmRecord[];
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'AI batch processing failed');
      throw error;
    }
  }
}
