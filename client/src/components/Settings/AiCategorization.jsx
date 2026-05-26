import React, { useState, useMemo } from 'react';
import { apiClient } from '../../Services/api';
import { Brand, BrandLine, I } from '../../ui/BrandIcon';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../../hooks/useTransactions';

const CONFIDENCE_STYLES = {
  high:   'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
  medium: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50',
  low:    'bg-red-900/30 text-red-300 border-red-700/50',
};

const formatAmount = (n) => {
  const num = parseFloat(n) || 0;
  return num.toLocaleString(undefined, { style: 'currency', currency: 'CAD' });
};

const AiCategorization = () => {
  const { t } = useTranslation();
  const { refreshTransactions } = useTransactions();
  const [status, setStatus] = useState('idle'); // idle | scanning | results | applying | done
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState('');
  const [appliedCount, setAppliedCount] = useState(0);
  const [scanMode, setScanMode] = useState(null);

  const scan = async (mode) => {
    setScanMode(mode);
    setStatus('scanning');
    setError('');
    setSuggestions([]);
    setSelected(new Set());
    try {
      const data = await apiClient.post('/api/ai-categorize', { mode });
      const list = data.suggestions || [];
      setSuggestions(list);
      setSelected(new Set(list.filter(s => s.confidence !== 'low').map(s => s.id)));
      setStatus('results');
    } catch (err) {
      setError(err.message || t('aiCategorization.errorScan'));
      setStatus('idle');
    }
  };

  const apply = async () => {
    const updates = suggestions
      .filter(s => selected.has(s.id))
      .map(s => ({ id: s.id, category: s.suggested_category, tags: s.suggested_tags }));
    if (updates.length === 0) return;
    setStatus('applying');
    setError('');
    try {
      const data = await apiClient.post('/api/ai-categorize/apply', { updates });
      setAppliedCount(data.applied || updates.length);
      setStatus('done');
      refreshTransactions();
    } catch (err) {
      setError(err.message || t('aiCategorization.errorApply'));
      setStatus('results');
    }
  };

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = suggestions.length > 0 && suggestions.every(s => selected.has(s.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(suggestions.map(s => s.id)));
  };

  const highCount = useMemo(() => suggestions.filter(s => s.confidence === 'high').length, [suggestions]);
  const medCount  = useMemo(() => suggestions.filter(s => s.confidence === 'medium').length, [suggestions]);
  const lowCount  = useMemo(() => suggestions.filter(s => s.confidence === 'low').length, [suggestions]);

  return (
    <div className="space-y-4">
      {/* Header description */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 flex gap-3">
        <div className="shrink-0 w-9 h-9 rounded-md bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center">
          <Brand name={I.sparkles || I.star} size={18} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-200">{t('aiCategorization.description')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('aiCategorization.descriptionSub')}</p>
        </div>
      </div>

      {/* Scan buttons */}
      {(status === 'idle' || status === 'done') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => scan('uncategorized')}
            className="flex items-start gap-3 p-4 rounded-lg border border-gray-700 hover:border-emerald-700/60 hover:bg-emerald-900/10 text-left transition-colors"
          >
            <Brand name={I.inbox} size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-200">{t('aiCategorization.scanUncategorized')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('aiCategorization.scanUncategorizedSub')}</p>
            </div>
          </button>
          <button
            onClick={() => scan('all')}
            className="flex items-start gap-3 p-4 rounded-lg border border-gray-700 hover:border-blue-700/60 hover:bg-blue-900/10 text-left transition-colors"
          >
            <Brand name={I.refresh || I.sync} size={20} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-200">{t('aiCategorization.scanAll')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('aiCategorization.scanAllSub')}</p>
            </div>
          </button>
        </div>
      )}

      {/* Scanning state */}
      {status === 'scanning' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <BrandLine name={I.loading} size={28} className="animate-spin text-emerald-400" style={{ color: '#34d399' }} />
          <p className="text-sm text-gray-400">{t('aiCategorization.scanning')}</p>
          <p className="text-xs text-gray-600">{t('aiCategorization.scanningHint')}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-300 bg-red-900/20 border border-red-800/60 rounded-md px-3 py-2">
          <Brand name={I.alert} size={15} className="shrink-0 mt-0.5" accent="#fca5a5" />
          <span>{error}</span>
        </div>
      )}

      {/* Done state */}
      {status === 'done' && (
        <div className="flex items-center gap-3 bg-emerald-900/20 border border-emerald-700/50 rounded-lg px-4 py-3">
          <Brand name={I.check} size={18} className="text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">
            {t('aiCategorization.applied', { count: appliedCount })}
          </p>
        </div>
      )}

      {/* Results */}
      {status === 'results' && suggestions.length === 0 && (
        <div className="text-center py-10 text-sm text-gray-500">
          {t('aiCategorization.noResults')}
        </div>
      )}

      {status === 'results' && suggestions.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md border bg-gray-800 border-gray-700 text-gray-300">
                <span className="font-semibold">{suggestions.length}</span> {t('aiCategorization.total')}
              </span>
              {highCount > 0 && (
                <span className={`px-2.5 py-1 rounded-md border ${CONFIDENCE_STYLES.high}`}>
                  <span className="font-semibold">{highCount}</span> {t('aiCategorization.high')}
                </span>
              )}
              {medCount > 0 && (
                <span className={`px-2.5 py-1 rounded-md border ${CONFIDENCE_STYLES.medium}`}>
                  <span className="font-semibold">{medCount}</span> {t('aiCategorization.medium')}
                </span>
              )}
              {lowCount > 0 && (
                <span className={`px-2.5 py-1 rounded-md border ${CONFIDENCE_STYLES.low}`}>
                  <span className="font-semibold">{lowCount}</span> {t('aiCategorization.low')}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scan(scanMode)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-700 text-gray-400 hover:bg-gray-800"
              >
                <Brand name={I.refresh || I.sync} size={13} />
                {t('aiCategorization.rescan')}
              </button>
              <button
                onClick={apply}
                disabled={selected.size === 0 || status === 'applying'}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {status === 'applying'
                  ? <BrandLine name={I.loading} size={13} className="animate-spin" style={{ color: '#fff' }} />
                  : <Brand name={I.check} size={13} />}
                {t('aiCategorization.applySelected', { count: selected.size })}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-800 bg-gray-800/40">
                    <th className="px-3 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="accent-emerald-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">{t('aiCategorization.col.description')}</th>
                    <th className="px-3 py-2 text-left">{t('aiCategorization.col.bank')}</th>
                    <th className="px-3 py-2 text-right">{t('aiCategorization.col.amount')}</th>
                    <th className="px-3 py-2 text-left">{t('aiCategorization.col.from')}</th>
                    <th className="px-3 py-2 text-left">{t('aiCategorization.col.to')}</th>
                    <th className="px-3 py-2 text-left">{t('aiCategorization.col.tags')}</th>
                    <th className="px-3 py-2 text-center">{t('aiCategorization.col.confidence')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {suggestions.map(s => (
                    <tr
                      key={s.id}
                      className={`hover:bg-gray-700/20 transition-colors ${selected.has(s.id) ? 'bg-emerald-900/10' : ''}`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggleOne(s.id)}
                          className="accent-emerald-500"
                        />
                      </td>
                      <td className="px-3 py-2.5 max-w-[220px]">
                        <span className="block truncate text-gray-300" title={s.description}>
                          {s.description}
                        </span>
                        {s.reason && (
                          <span className="block text-[11px] text-gray-600 truncate">{s.reason}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-xs">{s.bank || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-400 whitespace-nowrap">
                        {formatAmount(s.amount)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs text-gray-500 italic">
                          {s.current_category || <span className="text-gray-700">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-200">{s.suggested_category}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {s.suggested_tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded bg-gray-800 text-gray-400 border border-gray-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wide rounded border font-medium ${CONFIDENCE_STYLES[s.confidence] || CONFIDENCE_STYLES.medium}`}>
                          {t(`aiCategorization.${s.confidence}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AiCategorization;
