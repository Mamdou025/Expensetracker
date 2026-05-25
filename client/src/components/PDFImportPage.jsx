import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { pdfImportService } from '../Services/pdfImportService';
import { apiClient } from '../Services/api';
import { useTransactions } from '../hooks/useTransactions';
import {
  FileArrowUp, FilePdf, CheckCircle, XCircle, Trash, PencilSimple, X,
  CaretDown, CaretUp, Warning, CircleNotch, UploadSimple, CursorClick,
  ShieldCheck, Buildings, Info,
} from '@phosphor-icons/react';

/* Brand palette for icons:
   - emerald accent layer (duotone primary)  → #10b981
   - in light mode we still want strong contrast, so we pass a fixed color
   Phosphor's duotone weight renders the secondary layer at 20% opacity of `color`,
   giving an automatic two-tone green+green-tint look that pairs well with the
   black/white card backgrounds. */
const ACCENT = '#10b981';        // emerald-500
const ACCENT_STRONG = '#059669'; // emerald-600 (used over light bgs)
const ICON_W = { duotone: 'duotone', bold: 'bold', regular: 'regular', fill: 'fill' };

const PARSER_BANK_DOMAINS = {
  'CIBC': 'cibc.com',
  'RBC': 'rbcroyalbank.com',
  'MBNA': 'mbna.ca',
  'Capital One': 'capitalone.ca',
  'Neo Financial': 'neofinancial.com',
  'Neo Financial World Elite': 'neofinancial.com',
  'Triangle': 'canadiantire.ca',
};

const lookupDomain = (bank) => {
  if (!bank) return null;
  if (PARSER_BANK_DOMAINS[bank]) return PARSER_BANK_DOMAINS[bank];
  const lower = bank.toLowerCase();
  for (const [name, domain] of Object.entries(PARSER_BANK_DOMAINS)) {
    if (lower.includes(name.toLowerCase())) return domain;
  }
  return null;
};

const BankChip = ({ name, sub }) => {
  const [failed, setFailed] = useState(false);
  const domain = lookupDomain(name);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-800">
      {domain && !failed ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt=""
          onError={() => setFailed(true)}
          className="w-6 h-6 rounded bg-white p-0.5 object-contain shrink-0"
        />
      ) : (
        <div className="w-6 h-6 rounded bg-blue-600/20 text-blue-300 flex items-center justify-center text-xs font-semibold border border-blue-800 shrink-0">
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs font-medium text-gray-200 truncate">{name}</div>
        {sub && <div className="text-[10px] text-gray-500 truncate">{sub}</div>}
      </div>
    </div>
  );
};

const HelpStep = ({ icon: Icon, num, title, desc }) => (
  <div className="flex gap-3">
    <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
      <Icon size={20} weight="duotone" color={ACCENT} />
    </div>
    <div className="min-w-0">
      <div className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
        <span className="text-emerald-400">{num}.</span> {title}
      </div>
      <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</div>
    </div>
  </div>
);

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
  const [isDragging, setIsDragging] = useState(false);
  const [supportedBanks, setSupportedBanks] = useState([]);
  const [helpOpen, setHelpOpen] = useState(true);

  useEffect(() => {
    apiClient.get('/api/pdf-templates')
      .then((data) => setSupportedBanks(data?.templates || []))
      .catch(() => setSupportedBanks([]));
  }, []);

  const toggleDupExpand = (idx) => {
    setExpandedDups((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const acceptFiles = (list) => {
    const selected = Array.from(list || []).filter(f => f.type === 'application/pdf');
    if (selected.length > 0) {
      setFiles(selected);
      setParseResults([]);
      setTransactions([]);
      setImportResult(null);
    }
  };

  const handleFileSelect = (e) => acceptFiles(e.target.files);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFiles(e.dataTransfer.files);
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
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-100 flex items-center gap-2">
          <FileArrowUp size={28} weight="duotone" color={ACCENT} />
          Importer des relevés PDF
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Téléversez vos relevés bancaires en PDF — nous en extrayons automatiquement les transactions.
        </p>
      </div>

      {/* Help / how-it-works card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-800 hover:bg-gray-800/40"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Info size={14} weight="duotone" color={ACCENT} />
            Comment ça fonctionne
          </div>
          {helpOpen ? <CaretUp size={16} weight="bold" className="text-gray-500" /> : <CaretDown size={16} weight="bold" className="text-gray-500" />}
        </button>
        {helpOpen && (
          <div className="p-5 grid gap-4 md:grid-cols-3">
            <HelpStep
              num="1"
              icon={UploadSimple}
              title="Déposez vos PDFs"
              desc="Un ou plusieurs relevés mensuels. Aucun fichier n'est conservé — seules les transactions extraites le sont."
            />
            <HelpStep
              num="2"
              icon={CursorClick}
              title="Vérifiez les transactions"
              desc="Nous détectons la banque, le type de carte et les éventuels doublons. Modifiez ou décochez ce qui ne devrait pas être importé."
            />
            <HelpStep
              num="3"
              icon={ShieldCheck}
              title="Importez en un clic"
              desc="Les transactions choisies rejoignent votre tableau de bord avec catégorisation automatique."
            />
          </div>
        )}
      </div>

      {/* Upload card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 mb-6">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800">
          <FilePdf size={18} weight="duotone" color={ACCENT} />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Téléverser des relevés
          </span>
        </div>

        <div className="p-5">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-900/10'
                : 'border-gray-700 hover:border-emerald-700 hover:bg-gray-800/30'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadSimple size={48} weight="duotone" color={isDragging ? ACCENT : '#9ca3af'} className="mx-auto mb-3" />
            <p className="text-gray-300 mb-1 font-medium">
              {files.length > 0
                ? `${files.length} fichier(s) sélectionné(s)`
                : 'Glissez vos PDFs ici, ou cliquez pour parcourir'}
            </p>
            <p className="text-xs text-gray-500">Plusieurs fichiers acceptés · jusqu'à 20 Mo chacun</p>
            {files.length > 0 && (
              <div className="mt-4 max-h-28 overflow-y-auto text-left max-w-md mx-auto space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="text-xs text-gray-400 bg-gray-800/60 border border-gray-800 rounded px-2 py-1 flex items-center gap-2">
                    <FilePdf size={14} weight="duotone" color={ACCENT} className="shrink-0" />
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-gray-500 shrink-0">{(f.size / 1024).toFixed(0)} Ko</span>
                  </div>
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

          <div className="flex gap-3 mt-4 flex-wrap">
            <button
              onClick={handleParse}
              disabled={files.length === 0 || parsing}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-900/20"
            >
              {parsing ? <CircleNotch size={16} weight="bold" className="animate-spin" /> : <FilePdf size={16} weight="bold" />}
              {parsing
                ? `Analyse ${progress.current}/${progress.total}…`
                : files.length > 1
                  ? `Analyser ${files.length} PDFs`
                  : 'Analyser le PDF'}
            </button>
            {(parseResults.length > 0 || files.length > 0) && (
              <button
                onClick={reset}
                className="px-5 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 text-sm"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {parsing && progress.currentFile && (
            <div className="mt-4">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <CircleNotch size={16} weight="bold" className="animate-spin" color={ACCENT} />
                <span>Analyse de <span className="text-gray-200">{progress.currentFile}</span>…</span>
              </div>
              <div className="mt-2 w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%`, backgroundColor: ACCENT }}
                />
              </div>
            </div>
          )}

          {parseResults.length > 0 && (
            <div className="mt-5 space-y-2">
              <div className="flex gap-2 text-xs flex-wrap">
                <span className="bg-blue-900/30 text-blue-300 px-2.5 py-1 rounded-md border border-blue-900/50">
                  {successResults.length} fichier(s) analysé(s)
                </span>
                <span className="bg-emerald-900/30 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-900/50">
                  {totalFound} transactions trouvées
                </span>
                {totalDups > 0 && (
                  <span className="bg-amber-900/30 text-amber-300 px-2.5 py-1 rounded-md border border-amber-900/50">
                    {totalDups} doublon(s) détecté(s)
                  </span>
                )}
                {errorResults.length > 0 && (
                  <span className="bg-red-900/30 text-red-300 px-2.5 py-1 rounded-md border border-red-900/50">
                    {errorResults.length} fichier(s) en erreur
                  </span>
                )}
              </div>

              {parseResults.length > 1 && (
                <div className="mt-3 space-y-1">
                  {parseResults.map((r, i) => (
                    <div key={i} className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 border ${r.error ? 'bg-red-900/15 text-red-300 border-red-900/40' : 'bg-gray-800/60 text-gray-300 border-gray-800'}`}>
                      {r.error ? <XCircle size={14} weight="duotone" color="#ef4444" /> : <CheckCircle size={14} weight="duotone" color={ACCENT} />}
                      <span className="font-medium truncate">{r._fileName}</span>
                      {r.error ? (
                        <span className="text-red-400">— {r.error}</span>
                      ) : (
                        <span className="text-gray-400">— {r.bank} • {r.transactions_found} tx{r.duplicate_count > 0 ? ` • ${r.duplicate_count} doublons` : ''}{r.document_already_imported ? ' • déjà importé' : ''}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Supported banks card (only when nothing parsed yet) */}
      {parseResults.length === 0 && supportedBanks.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 mb-6">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800">
            <Buildings size={18} weight="duotone" color={ACCENT} />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Banques prises en charge
            </span>
            <span className="ml-auto text-xs text-gray-500">{supportedBanks.length} banques · {supportedBanks.reduce((s, b) => s + (b.card_types?.length || 1), 0)} produits</span>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {supportedBanks.map((b, i) => (
              <BankChip key={i} name={b.bank || b.name} sub={(b.card_types || []).join(' · ')} />
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
            Une autre banque ? L'analyseur générique gère également les formats standards (date, description, montant).
          </div>
        </div>
      )}

      {/* Transactions review */}
      {transactions.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 mb-6">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800">
            <CheckCircle size={18} weight="duotone" color={ACCENT} />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Vérifier et importer
            </span>
            <span className="ml-auto text-xs text-gray-500">
              {transactions.length} transaction(s) · {selectedCount} sélectionnée(s)
              {files.length > 1 && ` · ${fileGroups.length} fichiers`}
            </span>
          </div>

          <div className="p-5">
            <div className="flex gap-2 flex-wrap mb-4">
              {transactions.some(r => r.direction === 'deposit' || r.direction === 'payment') && (
                <span className="text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-900/40 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                  <Info size={12} weight="bold" />
                  Les dépôts sont importés mais exclus des totaux de dépenses
                </span>
              )}
              {totalDups > 0 && (
                <span className="text-xs text-amber-300 bg-amber-900/20 border border-amber-900/40 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                  <Warning size={12} weight="bold" />
                  Doublons décochés — dépliez la ligne pour comparer
                </span>
              )}
            </div>

            <div className="flex justify-between mb-4 flex-wrap gap-2">
              <div className="flex flex-wrap gap-2">
                <button onClick={selectAll} className="px-3 py-1.5 border border-gray-700 text-gray-300 rounded-md text-xs hover:bg-gray-800">
                  Tout sélectionner
                </button>
                <button onClick={selectNonDuplicates} className="px-3 py-1.5 border border-gray-700 text-gray-300 rounded-md text-xs hover:bg-gray-800">
                  Sélectionner non-doublons
                </button>
                <button onClick={clearSelection} className="px-3 py-1.5 border border-gray-700 text-gray-300 rounded-md text-xs hover:bg-gray-800">
                  Tout désélectionner
                </button>
                <button onClick={removeSelected} className="px-3 py-1.5 border border-gray-700 text-red-400 rounded-md text-xs hover:bg-gray-800">
                  Retirer la sélection
                </button>
              </div>
              <button
                onClick={handleConfirm}
                disabled={selectedCount === 0 || confirming}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-900/20"
              >
                {confirming ? <CircleNotch size={16} weight="bold" className="animate-spin" /> : <CheckCircle size={16} weight="bold" />}
                {confirming ? 'Importation…' : `Importer ${selectedCount} sélectionnée(s)`}
              </button>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="min-w-full divide-y divide-gray-800 text-left text-sm">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => (allSelected ? clearSelection() : selectAll())}
                      />
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                    {files.length > 1 && <th className="px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Fichier</th>}
                    <th className="px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Banque</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
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
                        <tr className={`${selectedIds.has(row._idx) ? 'bg-blue-900/20' : ''} ${isDeposit ? 'opacity-70' : ''} ${isDup ? 'bg-amber-900/10' : ''} text-gray-300`}>
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(row._idx)}
                              onChange={() => toggleSelect(row._idx)}
                            />
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editValues.date}
                                onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                                className="border border-gray-600 rounded px-2 py-1 w-36 bg-gray-800 text-gray-200"
                              />
                            ) : (
                              row.date
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {isDeposit ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                                Dépôt
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50">
                                Dépense
                              </span>
                            )}
                          </td>
                          <td className={`px-3 py-2.5 whitespace-nowrap font-medium ${isDeposit ? 'text-emerald-400' : 'text-gray-200'}`}>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editValues.amount}
                                onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })}
                                className="border border-gray-600 rounded px-2 py-1 w-24 bg-gray-800 text-gray-200"
                              />
                            ) : (
                              <>{isDeposit ? '+' : ''}{Number(row.amount).toLocaleString(undefined, { style: 'currency', currency: 'CAD' })}</>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editValues.description}
                                  onChange={(e) =>
                                    setEditValues({ ...editValues, description: e.target.value })
                                  }
                                  className="border border-gray-600 rounded px-2 py-1 w-full bg-gray-800 text-gray-200"
                                />
                              ) : (
                                <span className="truncate max-w-xs" title={row.description}>{row.description}</span>
                              )}
                              {isDup && hasMatch && (
                                <button
                                  onClick={() => toggleDupExpand(row._idx)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300 border border-amber-900/50 whitespace-nowrap hover:bg-amber-900/50 transition-colors cursor-pointer"
                                >
                                  <Warning size={12} weight="bold" />
                                  Doublon
                                  {isExpanded ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
                                </button>
                              )}
                              {isDup && !hasMatch && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300 border border-amber-900/50 whitespace-nowrap">
                                  <Warning size={12} weight="bold" />
                                  Doublon
                                </span>
                              )}
                            </div>
                          </td>
                          {files.length > 1 && (
                            <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[120px] truncate" title={row._fileName}>
                              {row._fileName}
                            </td>
                          )}
                          <td className="px-3 py-2.5 whitespace-nowrap text-gray-300">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValues.bank}
                                onChange={(e) => setEditValues({ ...editValues, bank: e.target.value })}
                                className="border border-gray-600 rounded px-2 py-1 w-28 bg-gray-800 text-gray-200"
                              />
                            ) : (
                              row.bank
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={saveEdit}
                                    className="p-1 text-emerald-400 hover:text-emerald-300"
                                    title="Enregistrer"
                                  >
                                    <CheckCircle size={16} weight="bold" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1 text-gray-400 hover:text-gray-300"
                                    title="Annuler"
                                  >
                                    <X size={16} weight="bold" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(row._idx)}
                                    className="p-1 text-emerald-400 hover:text-emerald-300"
                                    title="Modifier"
                                  >
                                    <PencilSimple size={16} weight="bold" />
                                  </button>
                                  <button
                                    onClick={() => removeRow(row._idx)}
                                    className="p-1 text-red-400 hover:text-red-300"
                                    title="Retirer"
                                  >
                                    <Trash size={16} weight="bold" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {hasMatch && isExpanded && (
                          <tr className="bg-amber-900/10">
                            <td colSpan={colCount} className="px-3 py-3">
                              <div className="ml-8 border border-amber-900/40 rounded-lg p-4 bg-gray-800/80">
                                <p className="text-xs font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
                                  <Warning size={14} weight="duotone" />
                                  Transaction existante dans la base
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">PDF (source : pdf)</p>
                                    <p className="text-gray-200"><strong>{row.date}</strong> &mdash; {Number(row.amount).toLocaleString(undefined, { style: 'currency', currency: 'CAD' })}</p>
                                    <p className="text-gray-400 mt-0.5">{row.description}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Existante (source : {row.existing_match.source_type})</p>
                                    <p className="text-gray-200"><strong>{row.existing_match.date}</strong> &mdash; {Number(row.existing_match.amount).toLocaleString(undefined, { style: 'currency', currency: 'CAD' })}</p>
                                    <p className="text-gray-400 mt-0.5">{row.existing_match.description}</p>
                                  </div>
                                </div>
                                <div className="mt-2 flex gap-2 flex-wrap">
                                  {dateDiffDays > 0 ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/30 text-orange-300 border border-orange-900/50">
                                      Date diffère de {dateDiffDays} jour(s)
                                    </span>
                                  ) : null}
                                  {descDiffers ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/30 text-orange-300 border border-orange-900/50">
                                      Description diffère
                                    </span>
                                  ) : null}
                                  {dateDiffDays === 0 && !descDiffers && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-900/50">
                                      Correspondance exacte
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
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 mb-6">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800">
            {importResult.errors === 0 ? (
              <CheckCircle size={18} weight="duotone" color={ACCENT} />
            ) : (
              <XCircle size={18} weight="duotone" color="#f59e0b" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Importation terminée
            </span>
          </div>
          <div className="p-5">
            <div className="flex gap-2 flex-wrap mb-3">
              <span className="bg-emerald-900/30 text-emerald-300 border border-emerald-900/50 px-2.5 py-1 rounded-md text-xs">
                {importResult.inserted} transactions importées
              </span>
              {importResult.skipped > 0 && (
                <span className="bg-amber-900/30 text-amber-300 border border-amber-900/50 px-2.5 py-1 rounded-md text-xs">
                  {importResult.skipped} doublons ignorés
                </span>
              )}
              {importResult.errors > 0 && (
                <span className="bg-red-900/30 text-red-300 border border-red-900/50 px-2.5 py-1 rounded-md text-xs">
                  {importResult.errors} erreurs
                </span>
              )}
            </div>
            {importResult.transactions && importResult.transactions.length > 0 && (
              <div className="mt-3 text-sm text-gray-400">
                <p className="font-medium mb-1 text-gray-300">Détail des transactions importées :</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {importResult.transactions.slice(0, 10).map((txn, i) => (
                    <li key={i}>
                      #{txn.transaction_id} — {txn.description} — {Number(txn.amount).toLocaleString(undefined, { style: 'currency', currency: 'CAD' })} — {txn.category}
                    </li>
                  ))}
                  {importResult.transactions.length > 10 && (
                    <li>…et {importResult.transactions.length - 10} de plus</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PDFImportPage;
