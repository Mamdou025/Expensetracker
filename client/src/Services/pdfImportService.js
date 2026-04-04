import { apiClient } from './api';

export const pdfImportService = {
  parsePdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload('/api/import-pdf', formData);
  },

  confirmImport: (transactions) =>
    apiClient.post('/api/import-pdf/confirm', { transactions }),
};
