import React, { useState, useRef } from 'react';
import Header from './ui/Header';
import { useTranslation } from 'react-i18next';
import { pdfImportService } from '../Services/pdfImportService';
import { useTransactions } from '../hooks/useTransactions';
import { Upload, FileText, CheckCircle, XCircle, Trash2, Edit3, X } from 'lucide-react';

const PDFImportPage = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const { refreshTransactions } = useTransactions();

  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [importResult, setImportResult] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValues, setEditValues] = useState({});

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setParseResult(null);
      setTransactions([]);
      setImportResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setParseResult(null);
      setTransactions([]);
      setImportResult(null);
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setImportResult(null);
    try {
      const result = await pdfImportService.parsePdf(file);
      setParseResult(result);
      const txns = (result.transactions || []).map((t, i) => ({ ...t, _idx: i }));
      setTransactions(txns);
      const nonDuplicateIds = new Set(txns.filter((t) => !t.is_duplicate).map((t) => t._idx));
      setSelectedIds(nonDuplicateIds);
    } catch (err) {
      alert(err.message || t('pdfImport.parseFailed'));
    } finally {
      setParsing(false);
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

  const selectAll = () => setSelectedIds(new Set(transactions.map((t) => t._idx)));
  const clearSelection = () => setSelectedIds(new Set());

  const removeSelected = () => {
    setTransactions((prev) => prev.filter((t) => !selectedIds.has(t._idx)));
    setSelectedIds(new Set());
  };

  const removeRow = (idx) => {
    setTransactions((prev) => prev.filter((t) => t._idx !== idx));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const startEdit = (idx) => {
    const row = transactions.find((t) => t._idx === idx);
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
      prev.map((t) =>
        t._idx === editingIdx
          ? {
              ...t,
              date: editValues.date,
              amount: parseFloat(editValues.amount) || t.amount,
              description: editValues.description,
              normalized_merchant: editValues.description,
              bank: editValues.bank,
              card_type: editValues.card_type,
            }
          : t
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
    const selected = transactions.filter((t) => selectedIds.has(t._idx));
    if (selected.length === 0) return;
    setConfirming(true);
    try {
      const toSend = selected.map(({ _idx, ...rest }) => rest);
      const result = await pdfImportService.confirmImport(toSend);
      setImportResult(result);
      setTransactions((prev) => prev.filter((t) => !selectedIds.has(t._idx)));
      setSelectedIds(new Set());
      await refreshTransactions();
    } catch (err) {
      alert(err.message || t('pdfImport.confirmFailed'));
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParseResult(null);
    setTransactions([]);
    setSelectedIds(new Set());
    setImportResult(null);
    setEditingIdx(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;
  const selectedCount = selectedIds.size;

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
            {file ? file.name : t('pdfImport.dropzone')}
          </p>
          {file && (
            <p className="text-sm text-gray-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleParse}
            disabled={!file || parsing}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {parsing ? t('pdfImport.parsing') : t('pdfImport.parse')}
          </button>
          {(parseResult || file) && (
            <button
              onClick={reset}
              className="px-6 py-3 border rounded-xl hover:bg-gray-50"
            >
              {t('pdfImport.reset')}
            </button>
          )}
        </div>

        {parseResult && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-4 text-sm text-gray-600">
              <span className="bg-blue-50 px-3 py-1 rounded-lg">
                {t('pdfImport.bank')}: <strong>{parseResult.bank}</strong>
              </span>
              <span className="bg-blue-50 px-3 py-1 rounded-lg">
                {t('pdfImport.cardType')}: <strong>{parseResult.card_type}</strong>
              </span>
              <span className="bg-blue-50 px-3 py-1 rounded-lg">
                {t('pdfImport.found')}: <strong>{parseResult.transactions_found}</strong>
              </span>
              {parseResult.duplicate_count > 0 && (
                <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg">
                  {t('pdfImport.duplicatesFound', { count: parseResult.duplicate_count })}
                </span>
              )}
            </div>
            {parseResult.document_already_imported && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-xl text-sm">
                {t('pdfImport.documentAlreadyImported')}
              </div>
            )}
          </div>
        )}
      </div>

      {transactions.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border mb-8">
          <p className="mb-2 text-sm text-gray-700">
            {t('pdfImport.total')}: {transactions.length} | {t('pdfImport.selected')}: {selectedCount}
          </p>
          {transactions.some(r => r.direction === 'deposit' || r.direction === 'payment') && (
            <p className="mb-4 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
              {t('pdfImport.depositNote')}
            </p>
          )}
          <div className="flex justify-between mb-4">
            <div className="space-x-2">
              <button onClick={selectAll} className="px-3 py-1 border rounded-xl text-sm">
                {t('queue.selectAll')}
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
                  <th className="px-4 py-3">{t('pdfImport.rawDescription')}</th>
                  <th className="px-4 py-3">{t('queue.table.bank')}</th>
                  <th className="px-4 py-3">{t('pdfImport.cardType')}</th>
                  <th className="px-4 py-3">{t('transactionTable.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((row) => {
                  const isEditing = editingIdx === row._idx;
                  const isDeposit = row.direction === 'deposit' || row.direction === 'payment';

                  return (
                    <tr key={row._idx} className={`${selectedIds.has(row._idx) ? 'bg-blue-50' : ''} ${isDeposit ? 'opacity-60' : ''} ${row.is_duplicate ? 'bg-yellow-50/50' : ''}`}>
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
                            row.description
                          )}
                          {row.is_duplicate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                              {t('pdfImport.duplicate')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={row.raw_description}>
                        {row.raw_description}
                      </td>
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
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.card_type}
                            onChange={(e) =>
                              setEditValues({ ...editValues, card_type: e.target.value })
                            }
                            className="border rounded px-2 py-1 w-24"
                          />
                        ) : (
                          row.card_type
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
