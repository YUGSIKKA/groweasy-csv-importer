import { z } from 'zod';
import { VALID_CRM_STATUSES, VALID_DATA_SOURCES } from '../types/crm';

export const crmRecordSchema = z.object({
  created_at: z.string().default('').transform((val) => {
    if (!val) return '';
    const date = new Date(val);
    return isNaN(date.getTime()) ? '' : date.toISOString();
  }),
  name: z.string().default(''),
  email: z.string().default(''),
  country_code: z.string().default(''),
  mobile_without_country_code: z.string().default(''),
  company: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  country: z.string().default(''),
  lead_owner: z.string().default(''),
  crm_status: z.string().default('').transform((val) => {
    const status = val?.toUpperCase().trim();
    if (VALID_CRM_STATUSES.includes(status as any)) {
      return status as any;
    }
    return '';
  }),
  crm_note: z.string().default(''),
  data_source: z.string().default('').transform((val) => {
    const source = val?.toLowerCase().trim();
    if (VALID_DATA_SOURCES.includes(source as any)) {
      return source as any;
    }
    return '';
  }),
  possession_time: z.string().default(''),
  description: z.string().default('')
}).refine((data) => {
  // If no email AND no mobile/phone exist, this record is invalid (must be skipped)
  const hasEmail = data.email && data.email.trim().length > 0;
  const hasPhone = data.mobile_without_country_code && data.mobile_without_country_code.trim().length > 0;
  return hasEmail || hasPhone;
}, {
  message: "Record must have at least an email or a mobile number to be imported"
});

export const crmBatchSchema = z.array(crmRecordSchema);

export type ValidatedCrmRecord = z.infer<typeof crmRecordSchema>;
