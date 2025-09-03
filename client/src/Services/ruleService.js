import { apiClient } from './api';

export const ruleService = {
  create: (keyword, target_type, target_value) =>
    apiClient.post('/api/rules', { keyword, target_type, target_value }),
};

