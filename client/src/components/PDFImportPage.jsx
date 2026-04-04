import React, { useState, useRef } from 'react';
import Header from './ui/Header';
import { useTranslation } from 'react-i18next';
import { pdfImportService } from '../Services/pdfImportService';
import { useTransactions } from '../hooks/useTransactions';
import { Upload, FileText, CheckCircle, XCircle, Trash2, Edit3, X, ChevronDown, ChevronUp, AlertTriangle, Loader2 } from 'lucide-react';

const PDFImportPage = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const { refreshTransactions } = useTransactions();

  const [files, setFiles] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [parseResults, setParseResults] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [importResult, setImportResult] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [expandedDups, setExpandedDups] = useState(new Set());
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFile: '' });

  const toggleDupExpand = (idx) => {
    setExpandedDups((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf');
    if (selected.length > 0) {
      setFiles(selected);
      setParseResults([]);
      setTransactions([]);
      setImportResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []).filter(f => f.type === 'application/pdf');
    if (dropped.length > 0) {
      setFiles(dropped);
      setParseResults([]);
      setTransactions([]);
      setImportResult(null);
    }
  };

  const handleParse = async () => {
    if (files.length === 0) return;
    setParsing(true);
    setImportResult(null);
    setProgress({ current: 0, total: files.length, currentFile: '' });

    const allTxns = [];
    const allResults = [];
    let globalIdx = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length, currentFile: file.name });
        try {
          const result = await pdfImportService.parsePdf(file);
          result._fileName = file.name;
          allResults.push(result);
          const txns = (result.transactions || []).map((txn) => ({
            ...txn,
            _idx: globalIdx++,
            _fileName: file.name,
          }));
          allTxns.push(...txns);
        } catch (err) {
          allResults.push({
            _fileName: file.name,
            error: err.message || t('pdfImport.parseFailed'),
            transactions: [],
            transactions_found: 0,
            duplicate_count: 0,
          });
        }
      }

      setParseResults(allResults);
      setTransactions(allTxns);
      const nonDuplicateIds = new Set(allTxns.filter((txn) => !txn.is_duplicate).map((txn) => txn._idx));
      setSelectedIds(nonDuplicateIds);
    } finally {
      setParsing(false);
      setProgress({ current: 0, total: 0, currentFile: '' });
    }
  };

  const toggleSelect = (idx) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(transactions.map((txn) => txn._idx)));
  const clearSelection = () => setSelectedIds(new Set());
  const selectNonDuplicates = () => {
    setSelectedIds(new Set(transactions.filter((txn) => !txn.is_duplicate).map((txn) => txn._idx)));
  };

  const removeSelected = () => {
    setTransactions((prev) => prev.filter((txn) => !selectedIds.has(txn._idx)));
    setSelectedIds(new Set());
  };

  const removeRow = (idx) => {
    setTransactions((prev) => prev.filter((txn) => txn._idx !== idx));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const startEdit = (idx) => {
    const row = transactions.find((txn) => txn._idx === idx);
    if (!row) return;
    setEditingIdx(idx);
    setEditValues({
      date: row.date || '',
      amount: String(row.amount),
      description: row.description || '',
      bank: row.bank || '',
      card_type: row.card_type || '',
    });
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    setTransactions((prev) =>
      prev.map((txn) =>
        txn._idx === editingIdx
          ? {
              ...txn,
              date: editValues.date,
              amount: parseFloat(editValues.amount) || txn.amount,
              description: editValues.description,
              normalized_merchant: editValues.description,
              bank: editValues.bank,
              card_type: editValues.card_type,
            }
          : txn
      )
    );
    setEditingIdx(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditValues({});
  };

  const handleConfirm = async () => {
    const selected = transactions.filter((txn) => selectedIds.has(txn._idx));
    if (selected.length === 0) return;
    setConfirming(true);
    try {
      const toSend = selected.map(({ _idx, _fileName, ...rest }) => rest);
      const result = await pdfImportService.confirmImport(toSend);
      setImportResult(result);
      setTransactions((prev) => prev.filter((txn) => !selectedIds.has(txn._idx)));
      setSelectedIds(new Set());
      await refreshTransactions();
    } catch (err) {
      alert(err.message || t('pdfImport.confirmFailed'));
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setParseResults([]);
    setTransactions([]);
    setSelectedIds(new Set());
    setImportResult(null);
    setEditingIdx(null);
    setExpandedDups(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;
  const selectedCount = selectedIds.size;
  const totalFound = parseResults.reduce((sum, r) => sum + (r.transactions_found || 0), 0);
  const totalDups = parseResults.reduce((sum, r) => sum + (r.duplicate_count || 0), 0);
  const successResults = parseResults.filter(r => !r.error);
  const errorResults = parseResults.filter(r => r.error);

  const fileGroups = [];
  if (transactions.length > 0) {
    const grouped = {};
    transactions.forEach(txn => {
      const fn = txn._fileName || 'unknown';
      if (!grouped[fn]) grouped[fn] = [];
      grouped[fn].push(txn);
    });
    Object.entries(grouped).forEach(([fn, txns]) => {
      fileGroups.push({ fileName: fn, transactions: txns });
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Header />

      <div className="bg-white p-8 rounded-3xl shadow-xl border mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t('pdfImport.title')}
        </h2>

        <div
          className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-1">
            {files.length > 0
              ? t('pdfImport.filesSelected', { count: files.length })
              : t('pdfImport.dropzone')}
          </p>
          {files.length > 0 && (
            <div className="mt-2 text-sm text-gray-400 max-h-24 overflow-y-auto">
              {files.map((f, i) => (
                <p key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</p>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleParse}
            disabled={files.length === 0 || parsing}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {parsing
              ? t('pdfImport.parsingProgress', { current: progress.current, total: progress.total })
              : files.length > 1
                ? t('pdfImport.parseAll', { count: files.length })
                : t('pdfImport.parse')}
          </button>
          {(parseResults.length > 0 || files.length > 0) && (
            <button
              onClick={reset}
              className="px-6 py-3 border rounded-xl hover:bg-gray-50"
            >
              {t('pdfImport.reset')}
            </button>
          )}
        </div>

        {parsing && progress.currentFile && (
          <div className="mt-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>{t('pdfImport.parsingFile', { name: progress.currentFile })}</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {parseResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
              <span className="bg-blue-50 px-3 py-1 rounded-lg">
                {t('pdfImport.filesProcessed', { count: successResults.length })}
              </span>
              <span className="bg-blue-50 px-3 py-1 rounded-lg">
                {t('pdfImport.found')}: <strong>{totalFound}</strong>
              </span>
              {totalDups > 0 && (
                <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg">
                  {t('pdfImport.duplicatesFound', { count: totalDups })}
                </span>
              )}
              {errorResults.length > 0 && (
                <span className="bg-red-50 text-red-700 px-3 py-1 rounded-lg">
                  {t('pdfImport.fileErrors', { count: errorResults.length })}
                </span>
              )}
            </div>

            {parseResults.length > 1 && (
              <div className="mt-2 space-y-1">
                {parseResults.map((r, i) => (
                  <div key={i} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${r.error ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                    {r.error ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                    <span className="font-medium">{r._fileName}</span>
                    {r.error ? (
                      <span>— {r.error}</span>
                    ) : (
                      <span>— {r.bank} • {r.transactions_found} txns{r.duplicate_count > 0 ? ` • ${r.duplicate_count} dups` : ''}{r.document_already_imported ? ` • ${t('pdfImport.alreadyImported')}` : ''}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {transactions.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border mb-8">
          <p className="mb-2 text-sm text-gray-700">
            {t('pdfImport.total')}: {transactions.length} | {t('pdfImport.selected')}: {selectedCount}
            {files.length > 1 && ` | ${t('pdfImport.fromFiles', { count: fileGroups.length })}`}
          </p>
          {transactions.some(r => r.direction === 'deposit' || r.direction === 'payment') && (
            <p className="mb-4 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
              {t('pdfImport.depositNote')}
            </p>
          )}
          {totalDups > 0 && (
            <p className="mb-4 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('pdfImport.duplicatesReviewNote')}
            </p>
          )}
          <div className="flex justify-between mb-4 flex-wrap gap-2">
            <div className="space-x-2">
              <button onClick={selectAll} className="px-3 py-1 border rounded-xl text-sm">
                {t('queue.selectAll')}
              </button>
              <button onClick={selectNonDuplicates} className="px-3 py-1 border rounded-xl text-sm">
                {t('pdfImport.selectNonDups')}
              </button>
              <button onClick={clearSelection} className="px-3 py-1 border rounded-xl text-sm">
                {t('queue.clear')}
              </button>
              <button onClick={removeSelected} className="px-3 py-1 border rounded-xl text-sm text-red-600">
                {t('queue.remove')}
              </button>
            </div>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0 || confirming}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {confirming
                ? t('pdfImport.confirming')
                : t('pdfImport.confirm', { count: selectedCount })}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => (allSelected ? clearSelection() : selectAll())}
                    />
                  </th>
                  <th className="px-4 py-3">{t('queue.table.date')}</th>
                  <th className="px-4 py-3">{t('pdfImport.type')}</th>
                  <th className="px-4 py-3">{t('queue.table.amount')}</th>
                  <th className="px-4 py-3">{t('queue.table.description')}</th>
                  {files.length > 1 && <th className="px-4 py-3">{t('pdfImport.file')}</th>}
                  <th className="px-4 py-3">{t('queue.table.bank')}</th>
                  <th className="px-4 py-3">{t('transactionTable.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((row) => {
                  const isEditing = editingIdx === row._idx;
                  const isDeposit = row.direction === 'deposit' || row.direction === 'payment';
                  const isDup = row.is_duplicate;
                  const hasMatch = row.is_duplicate && row.existing_match;
                  const isExpanded = expandedDups.has(row._idx);
                  const colCount = files.length > 1 ? 8 : 7;

                  let dateDiffDays = 0;
                  let descDiffers = false;
                  if (hasMatch) {
                    dateDiffDays = Math.round(Math.abs(new Date(row.date) - new Date(row.existing_match.date)) / 86400000);
                    descDiffers = (row.description || '').toLowerCase().trim() !== (row.existing_match.description || '').toLowerCase().trim();
                  }

                  return (
                    <React.Fragment key={row._idx}>
                    <tr className={`${selectedIds.has(row._idx) ? 'bg-blue-50' : ''} ${isDeposit ? 'opacity-60' : ''} ${isDup ? 'bg-amber-50/60' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row._idx)}
                          onChange={() => toggleSelect(row._idx)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editValues.date}
                            onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                            className="border rounded px-2 py-1 w-36"
                          />
                        ) : (
                          row.date
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isDeposit ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {t('pdfImport.deposit')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {t('pdfImport.expense')}
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${isDeposit ? 'text-emerald-600' : ''}`}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.amount}
                            onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })}
                            className="border rounded px-2 py-1 w-24"
                          />
                        ) : (
                          <>{isDeposit ? '+' : ''}{Number(row.amount).toLocaleString(undefined, { style: 'currency', currency: 'CAD' })}</>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.description}
                              onChange={(e) =>
                                setEditValues({ ...editValues, description: e.target.value })
                              }
                              className="border rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <span className="truncate max-w-xs" title={row.description}>{row.description}</span>
                          )}
                          {isDup && hasMatch && (
                            <button
                              onClick={() => toggleDupExpand(row._idx)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 whitespace-nowrap hover:bg-amber-200 transition-colors cursor-pointer"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {t('pdfImport.duplicate')}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                          {isDup && !hasMatch && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3" />
                              {t('pdfImport.duplicate')}
                            </span>
                          )}
                        </div>
                      </td>
                      {files.length > 1 && (
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate" title={row._fileName}>
                          {row._fileName}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.bank}
                            onChange={(e) => setEditValues({ ...editValues, bank: e.target.value })}
                            className="border rounded px-2 py-1 w-28"
                          />
                        ) : (
                          row.bank
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className="p-1 text-green-600 hover:text-green-800"
                                title={t('mappings.rules.save')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 text-gray-600 hover:text-gray-800"
                                title={t('mappings.rules.cancel')}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(row._idx)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title={t('mappings.rules.edit')}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeRow(row._idx)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title={t('queue.table.remove')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {hasMatch && isExpanded && (
                      <tr className="bg-amber-50/40">
                        <td colSpan={colCount} className="px-4 py-3">
                          <div className="ml-8 border border-amber-200 rounded-xl p-4 bg-white/80">
                            <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t('pdfImport.existingMatch')}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">PDF ({t('pdfImport.source')}: pdf)</p>
                                <p><strong>{row.date}</strong> &mdash; {Number(row.amount).toLocaleString(undefined, { style: 'currency', currency: 'CAD' })}</p>
                                <p className="text-gray-700 mt-0.5">{row.description}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">{t('pdfImport.existingMatch')} ({t('pdfImport.source')}: {row.existing_match.source_type})</p>
                                <p><strong>{row.existing_match.date}</strong> &mdash; {Number(row.existing_match.amount).toLocaleString(undefined, { style: 'currency', currency: 'CAD' })}</p>
                                <p className="text-gray-700 mt-0.5">{row.existing_match.description}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {dateDiffDays > 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                  {t('pdfImport.dateDiff', { days: dateDiffDays })}
                                </span>
                              ) : null}
                              {descDiffers ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                  {t('pdfImport.descDiff')}
                                </span>
                              ) : null}
                              {dateDiffDays === 0 && !descDiffers && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                  {t('pdfImport.exactMatch')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importResult && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border mb-8">
          <div className="flex items-center gap-3 mb-4">
            {importResult.errors === 0 ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-yellow-600" />
            )}
            <h3 className="text-lg font-semibold">
              {t('pdfImport.resultTitle')}
            </h3>
          </div>
          <p className="text-sm text-gray-700">
            {t('pdfImport.resultInserted', { count: importResult.inserted })}
            {importResult.skipped > 0 &&
              ` | ${t('pdfImport.resultSkipped', { count: importResult.skipped })}`}
            {importResult.errors > 0 &&
              ` | ${t('pdfImport.resultErrors', { count: importResult.errors })}`}
          </p>
          {importResult.transactions && importResult.transactions.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              <p className="font-medium mb-1">{t('pdfImport.resultDetails')}:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {importResult.transactions.slice(0, 10).map((txn, i) => (
                  <li key={i}>
                    #{txn.transaction_id} — {txn.description} — {Number(txn.amount).toLocaleString(undefined, { style: 'currency', currency: 'CAD' })} — {txn.category}
                  </li>
                ))}
                {importResult.transactions.length > 10 && (
                  <li>{t('pdfImport.resultMore', { count: importResult.transactions.length - 10 })}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFImportPage;
