import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Brand, BrandLine, I } from '../ui/BrandIcon';
import { emailService } from '../Services/emailService';
import { useTransactions } from '../hooks/useTransactions';
import EmailViewerModal from './common/EmailViewerModal';
import { transformQueueItemFromApi } from '../Services/transformers';

const SectionHeader = ({ iconName, title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-3 mb-3">
    <div>
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
        {iconName && <Brand name={iconName} size={16} className="text-gray-400" />}
        {title}
      </h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const StatChip = ({ label, value, tone = 'default' }) => {
  const toneClasses = {
    default: 'bg-gray-800 text-gray-200 border-gray-700',
    warn: 'bg-amber-900/20 text-amber-300 border-amber-800/60',
    accent: 'bg-emerald-900/20 text-emerald-300 border-emerald-800/60',
  }[tone];
  return (
    <div className={`flex items-baseline gap-2 px-3 py-1.5 rounded-md border text-xs ${toneClasses}`}>
      <span className="font-semibold tabular-nums text-sm">{value}</span>
      <span className="uppercase tracking-wide opacity-80">{label}</span>
    </div>
  );
};

const formatAmount = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (Number.isNaN(num)) return String(amount);
  return num.toLocaleString(undefined, { style: 'currency', currency: 'CAD' });
};

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
  const [error, setError] = useState('');

  const { refreshTransactions } = useTransactions();

  const loadEmails = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');
    try {
      const data = await emailService.extractEmails(startDate, endDate);
      const normalizedQueue = (Array.isArray(data) ? data : []).map((item, idx) =>
        transformQueueItemFromApi(item, idx)
      );
      setQueue(normalizedQueue);
      setSelectedIds(normalizedQueue.map((item) => item.queueId));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to extract emails');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (queueId) => {
    setSelectedIds((prev) =>
      prev.includes(queueId) ? prev.filter((id) => id !== queueId) : [...prev, queueId]
    );
  };

  const selectAll = () => setSelectedIds(queue.map((item) => item.queueId));
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
      setError(err.message || 'Failed to process emails');
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

  const processAll = () => processEmails(queue);

  const allSelected = queue.length > 0 && queue.every((item) => selectedIds.includes(item.queueId));
  const duplicateCount = useMemo(
    () => queue.filter((item) => Boolean(item?.transaction?.duplicate)).length,
    [queue]
  );
  const selectedCount = selectedIds.length;
  const canExtract = Boolean(startDate && endDate) && !loading;
  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const fmt = (d) => d.toISOString().slice(0, 10);
    setStartDate(fmt(start));
    setEndDate(fmt(end));
  };

  return (
    <>
      {/* Header / intro */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center">
            <Brand name={I.mail} size={20} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-100">{t('emailExtraction.pageTitle')}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {t('emailExtraction.pageDescription')}
            </p>
          </div>
          <Link
            to="/accounts"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded"
          >
            {t('emailExtraction.linkToForwarding')}
            <Brand name={I.arrowRight} size={14} />
          </Link>
        </div>
      </div>

      {/* Date range / extract */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 mb-4">
        <SectionHeader
          iconName={I.calendar}
          title={t('emailExtraction.rangeTitle')}
          subtitle={t('emailExtraction.rangeSubtitle')}
          right={
            <div className="flex gap-1">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setQuickRange(d)}
                  className="text-[11px] px-2 py-1 rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600"
                >
                  {t('emailExtraction.lastNDays', { n: d })}
                </button>
              ))}
            </div>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label htmlFor="email-start-date" className="block text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">
              {t('emailExtraction.startDate')}
            </label>
            <input
              id="email-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email-end-date" className="block text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">
              {t('emailExtraction.endDate')}
            </label>
            <input
              id="email-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={loadEmails}
            disabled={!canExtract}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <BrandLine name={I.loading} size={16} className="animate-spin" style={{ color: '#fff' }} />
                {t('emailExtraction.extracting')}
              </>
            ) : (
              <>
                <BrandLine name={I.search} size={16} style={{ color: '#fff' }} />
                {t('emailExtraction.extract')}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red-300 bg-red-900/20 border border-red-800/60 rounded-md px-3 py-2">
            <Brand name={I.alert} size={16} className="shrink-0 mt-0.5" accent="#fca5a5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Queue area */}
      {queue.length === 0 ? (
        <div className="bg-gray-900 rounded-lg border border-dashed border-gray-800 p-10 text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-gray-800 items-center justify-center mb-3">
            <Brand name={I.inbox} size={24} className="text-gray-500" />
          </div>
          <p className="text-sm text-gray-400">
            {loading
              ? t('emailExtraction.loadingHint')
              : t('emailExtraction.emptyHint')}
          </p>
          <p className="text-xs text-gray-600 mt-2 flex items-center justify-center gap-1.5">
            <Brand name={I.info} size={14} />
            {t('emailExtraction.imapRequirementHint')}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-800">
            <div className="flex flex-wrap items-center gap-2">
              <StatChip label={t('emailExtraction.statTotal')} value={queue.length} />
              {duplicateCount > 0 && (
                <StatChip label={t('emailExtraction.statDuplicates')} value={duplicateCount} tone="warn" />
              )}
              <StatChip label={t('emailExtraction.statSelected')} value={selectedCount} tone="accent" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={allSelected ? clearSelection : selectAll}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                {allSelected
                  ? <span className="inline-block w-3.5 h-3.5 border border-current rounded-sm" />
                  : <Brand name={I.checkSquare} size={14} />}
                {allSelected ? t('queue.clear') : t('queue.selectAll')}
              </button>
              <button
                onClick={removeSelected}
                disabled={selectedCount === 0}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Brand name={I.trash} size={14} />
                {t('queue.remove')}
              </button>
              <button
                onClick={clearQueue}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Brand name={I.x} size={14} />
                {t('emailExtraction.clearQueue')}
              </button>
              <div className="w-px h-5 bg-gray-800 mx-1" />
              <button
                onClick={processSelected}
                disabled={selectedCount === 0 || processing}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {processing
                  ? <BrandLine name={I.loading} size={14} className="animate-spin" style={{ color: '#fff' }} />
                  : <BrandLine name={I.play} size={14} style={{ color: '#fff' }} />}
                {t('queue.processSelected')}
              </button>
              <button
                onClick={processAll}
                disabled={processing}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('queue.processAll')}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-800">
                  <th className="px-4 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => (allSelected ? clearSelection() : selectAll())}
                      aria-label={allSelected ? t('queue.clear') : t('queue.selectAll')}
                      className="accent-blue-500"
                    />
                  </th>
                  <th className="px-4 py-2 text-left">{t('queue.table.date')}</th>
                  <th className="px-4 py-2 text-right">{t('queue.table.amount')}</th>
                  <th className="px-4 py-2 text-left">{t('queue.table.description')}</th>
                  <th className="px-4 py-2 text-left">{t('queue.table.bank')}</th>
                  <th className="px-4 py-2 text-center w-20">{t('queue.table.viewEmail')}</th>
                  <th className="px-4 py-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {queue.map((item) => {
                  const transaction = item?.transaction || {};
                  const isDuplicate = Boolean(transaction.duplicate);
                  const isSelected = selectedIds.includes(item.queueId);

                  return (
                    <tr
                      key={item.queueId}
                      className={`text-gray-300 hover:bg-gray-800/40 ${isSelected ? 'bg-blue-900/10' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.queueId)}
                          aria-label={`${t('queue.selectAll')} — ${transaction.description || item.subject || ''}`}
                          className="accent-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap tabular-nums">
                        {transaction.date || item.email_datetime || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {formatAmount(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="truncate">
                            {transaction.description || item.subject || '—'}
                          </span>
                          {isDuplicate && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-amber-900/40 text-amber-300 border border-amber-800/60 px-1.5 py-0.5 rounded shrink-0">
                              <Brand name={I.alert} size={12} accent="#fcd34d" />
                              {t('emailExtraction.duplicateBadge')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{transaction.bank || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => viewEmail(transaction.full_email || item.email?.full_email_html || '')}
                          className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                          title={t('queue.table.viewEmail')}
                          aria-label={t('queue.table.viewEmail')}
                        >
                          <Brand name={I.eye} size={16} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeFromQueue(item.queueId)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800"
                          title={t('queue.table.remove')}
                          aria-label={t('queue.table.remove')}
                        >
                          <Brand name={I.x} size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {processing && (
            <div className="border-t border-gray-800 px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
              <Brand name={I.loading} size={14} className="animate-spin" />
              {t('queue.processing', { current: progress, total: queue.length })}
            </div>
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
