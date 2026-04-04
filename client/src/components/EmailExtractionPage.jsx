import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { emailService } from '../Services/emailService';
import { useTransactions } from '../hooks/useTransactions';
import { AlertTriangle } from 'lucide-react';
import EmailViewerModal from './common/EmailViewerModal';
import { transformQueueItemFromApi } from '../Services/transformers';

const EmailExtractionPage = () => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [queue, setQueue] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalHtml, setModalHtml] = useState('');

  const { refreshTransactions } = useTransactions();

  const loadEmails = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const data = await emailService.extractEmails(startDate, endDate);
      const normalizedQueue = (Array.isArray(data) ? data : []).map((item, idx) =>
        transformQueueItemFromApi(item, idx)
      );
      setQueue(normalizedQueue);
      setSelectedIds(normalizedQueue.map((item) => item.queueId));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to extract emails');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (queueId) => {
    setSelectedIds((prev) =>
      prev.includes(queueId) ? prev.filter((id) => id !== queueId) : [...prev, queueId]
    );
  };

  const selectAll = () => {
    setSelectedIds(queue.map((item) => item.queueId));
  };

  const clearSelection = () => setSelectedIds([]);

  const removeSelected = () => {
    setQueue((prev) => prev.filter((item) => !selectedIds.includes(item.queueId)));
    setSelectedIds([]);
  };

  const removeFromQueue = (queueIdToRemove) => {
    setQueue((prev) => prev.filter((item) => item.queueId !== queueIdToRemove));
    setSelectedIds((prev) => prev.filter((id) => id !== queueIdToRemove));
  };

  const viewEmail = (html) => {
    setModalHtml(html || '');
    setShowEmailModal(true);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setModalHtml('');
  };

  const clearQueue = () => {
    setQueue([]);
    setSelectedIds([]);
  };

  const processEmails = async (queueItems) => {
    if (queueItems.length === 0) return;
    setProcessing(true);
    setProgress(0);
    try {
      const processed = await emailService.processQueue(queueItems);
      if (Array.isArray(processed)) {
        const messages = processed
          .filter((p) => p.applied_rules && p.applied_rules.length > 0)
          .map(
            (p) =>
              `${p.transaction?.description || p.description || 'Unknown'}: ${p.applied_rules
                .map((r) => r.keyword)
                .join(', ')}`
          );
        if (messages.length > 0) {
          alert(`Applied rules:\n${messages.join('\n')}`);
        }
      }
      setProgress(queueItems.length);
      const processedIds = new Set(
        queueItems.map((item) => item.queueId).filter(Boolean)
      );
      setQueue((prev) => prev.filter((item) => !processedIds.has(item.queueId)));
      setSelectedIds([]);
      await refreshTransactions();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to process emails');
    } finally {
      setProcessing(false);
    }
  };

  const processSelected = () => {
    const selectedItems = queue
      .filter((item) => selectedIds.includes(item.queueId))
      .filter(Boolean);
    processEmails(selectedItems);
  };

  const processAll = () => {
    processEmails(queue);
  };

  const allSelected = queue.length > 0 && queue.every((item) => selectedIds.includes(item.queueId));

  const duplicateCount = queue.filter((item) => Boolean(item?.transaction?.duplicate)).length;
  const selectedCount = selectedIds.length;

  return (
    <>
      <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">{t('emailExtraction.startDate')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-700 rounded-lg px-4 py-3 bg-gray-800 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">{t('emailExtraction.endDate')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-700 rounded-lg px-4 py-3 bg-gray-800 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadEmails}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
            >
              {loading ? t('emailExtraction.extracting') : t('emailExtraction.extract')}
            </button>
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
          <p className="mb-4 text-sm text-gray-400">
            Total: {queue.length} | Duplicates: {duplicateCount} | Selected: {selectedCount}
          </p>
          <div className="flex justify-between mb-4">
            <div className="space-x-2">
              <button onClick={selectAll} className="px-3 py-1 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">
                {t('queue.selectAll')}
              </button>
              <button onClick={clearSelection} className="px-3 py-1 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">
                {t('queue.clear')}
              </button>
              <button onClick={removeSelected} className="px-3 py-1 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">
                {t('queue.remove')}
              </button>
              <button onClick={clearQueue} className="px-3 py-1 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">
                Clear Queue
              </button>
            </div>
            <div className="space-x-2">
              <button
                onClick={processSelected}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                {t('queue.processSelected')}
              </button>
              <button
                onClick={processAll}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
              >
                {t('queue.processAll')}
              </button>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-800 text-left">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-gray-400">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => (allSelected ? clearSelection() : selectAll())}
                  />
                </th>
                <th className="px-6 py-3 text-gray-400">{t('queue.table.date')}</th>
                <th className="px-6 py-3 text-gray-400">{t('queue.table.amount')}</th>
                <th className="px-6 py-3 text-gray-400">{t('queue.table.description')}</th>
                <th className="px-6 py-3 text-gray-400">{t('queue.table.bank')}</th>
                <th className="px-6 py-3 text-gray-400">{t('queue.table.viewEmail')}</th>
                <th className="px-6 py-3 text-gray-400">{t('queue.table.duplicate')}</th>
                <th className="px-6 py-3 text-gray-400">{t('queue.table.remove')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {queue.map((item) => {
                const transaction = item?.transaction || {};
                const isDuplicate = Boolean(transaction.duplicate);

                return (
                  <tr key={item.queueId} className={`text-gray-300 ${isDuplicate ? 'bg-amber-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.queueId)}
                        onChange={() => toggleSelect(item.queueId)}
                      />
                    </td>
                    <td className="px-6 py-4">{transaction.date || item.email_datetime || '-'}</td>
                    <td className="px-6 py-4">{transaction.amount ?? '-'}</td>
                    <td className="px-6 py-4">{transaction.description || item.subject || '-'}</td>
                    <td className="px-6 py-4">{transaction.bank || '-'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewEmail(transaction.full_email || item.email || '')}
                        className="text-blue-400 hover:underline"
                      >
                        {t('queue.table.viewEmail')}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-red-400 flex items-center gap-1">
                      {isDuplicate && <AlertTriangle className="w-4 h-4" />}
                      {isDuplicate ? t('queue.table.duplicateYes') : t('queue.table.duplicateNo')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => removeFromQueue(item.queueId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        {t('queue.table.remove')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {processing && (
            <p className="mt-4 text-sm text-gray-400">
              {t('queue.processing', { current: progress, total: queue.length })}
            </p>
          )}
        </div>
      )}
      <EmailViewerModal
        isOpen={showEmailModal}
        onClose={closeEmailModal}
        html={modalHtml}
      />
    </>
  );
};

export default EmailExtractionPage;
