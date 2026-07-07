import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface ImportResponse {
  success: boolean;
  totalRows: number;
  imported: number;
  skipped: number;
  failedBatches: number;
  records: CrmRecord[];
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Uploads the CSV file to the backend import endpoint.
 * Monitors upload progress through a callback.
 */
export async function uploadAndImportCsv(
  file: File,
  onUploadProgress: (progress: number) => void
): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('csv', file);

  const response = await api.post<ImportResponse>('/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const total = progressEvent.total || file.size;
      const current = progressEvent.loaded;
      const percentCompleted = Math.round((current * 100) / total);
      onUploadProgress(percentCompleted);
    },
  });

  return response.data;
}
