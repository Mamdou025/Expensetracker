const splitCsvTags = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((tag) => (typeof tag === 'string' ? tag.split(',') : []))
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizeTags = (tags) => splitCsvTags(tags);

export const transformTransactionFromApi = (transaction = {}) => ({
  ...transaction,
  tags: normalizeTags(transaction.tags),
  amount: Number.parseFloat(transaction.amount ?? 0) || 0,
});

export const makeQueueItemId = (item = {}, indexHint = 0) => {
  const transaction = item?.transaction ?? {};

  const parts = [
    item?.sender,
    item?.subject,
    item?.email_datetime,
    transaction?.amount,
    transaction?.description,
    item?.email,
    transaction?.full_email,
  ]
    .map((part) => (part === undefined || part === null ? '' : String(part).trim()))
    .filter(Boolean);

  return parts.length > 0 ? parts.join('|') : `queue-item-${indexHint}`;
};

export const transformQueueItemFromApi = (item = {}, indexHint = 0) => {
  const transaction = transformTransactionFromApi(item?.transaction ?? {});

  return {
    ...item,
    transaction,
    queueId: item?.queueId || makeQueueItemId(item, indexHint),
  };
};
