import { apiClient } from './api';

export const emailService = {
  extractEmails: (startDate, endDate) =>
    apiClient.post('/api/extract-emails', { startDate, endDate }),
  processQueue: (emails) => apiClient.post('/api/process-queue', { emails }),
};
