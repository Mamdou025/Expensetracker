import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../Services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Building2, Mail, Copy, Check, Loader2, AlertCircle, Plus, Inbox,
  ChevronRight, X, Trash2, Wand2, ArrowRight,
} from 'lucide-react';

const BANK_DOMAINS = {
  'CIBC': 'cibc.com',
  'CIBC Chequing': 'cibc.com',
  'CIBC Visa': 'cibc.com',
  'CIBC Credit': 'cibc.com',
  'RBC': 'rbcroyalbank.com',
  'RBC Visa': 'rbcroyalbank.com',
  'RBC Credit': 'rbcroyalbank.com',
  'MBNA': 'mbna.ca',
  'MBNA Mastercard': 'mbna.ca',
  'Capital One': 'capitalone.ca',
  'Capital One Mastercard': 'capitalone.ca',
  'Neo Financial': 'neofinancial.com',
  'Neo Financial World Elite': 'neofinancial.com',
  'Triangle': 'canadiantire.ca',
  'Triangle Mastercard': 'canadiantire.ca',
};

const lookupDomain = (bank) => {
  if (!bank) return null;
  if (BANK_DOMAINS[bank]) return BANK_DOMAINS[bank];
  const lower = bank.toLowerCase();
  for (const [name, domain] of Object.entries(BANK_DOMAINS)) {
    if (lower.includes(name.toLowerCase()) || name.toLowerCase().includes(lower)) {
      return domain;
    }
  }
  return null;
};

const BankLogo = ({ bank, size = 12 }) => {
  const domain = lookupDomain(bank);
  const [failed, setFailed] = useState(false);
  const initial = (bank || '?').trim().charAt(0).toUpperCase();
  const cls = `w-${size} h-${size}`;

  if (!domain || failed) {
    return (
      <div className={`${cls} rounded-lg bg-blue-600/20 text-blue-300 flex items-center justify-center font-semibold border border-blue-800`}>
        {initial}
      </div>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt=""
      onError={() => setFailed(true)}
      className={`${cls} rounded-lg bg-white p-1 object-contain border border-gray-800`}
    />
  );
};

const formatDate = (s) => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return s; }
};

const SampleViewer = ({ sample, onClose, onDeleted }) => {
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('text');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiClient.get(`/api/email-samples/${sample.id}`);
        if (active) {
          setFull(data);
          setTab(data.body_text ? 'text' : 'html');
        }
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [sample.id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this email sample?')) return;
    try {
      await apiClient.delete(`/api/email-samples/${sample.id}`);
      onDeleted(sample.id);
      onClose();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-800">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-100 truncate">
              {sample.subject || '(no subject)'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              From {sample.sender || 'unknown'} · {formatDate(sample.received_at || sample.created_at)}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 pt-3">
          <button
            onClick={() => setTab('text')}
            disabled={!full?.body_text}
            className={`px-3 py-1 text-xs rounded-md ${tab === 'text' ? 'nav-active' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-40`}
          >Plain text</button>
          <button
            onClick={() => setTab('html')}
            disabled={!full?.body_html}
            className={`px-3 py-1 text-xs rounded-md ${tab === 'html' ? 'nav-active' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-40`}
          >Rendered HTML</button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={20} /></div>}
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {full && tab === 'text' && (
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-gray-950 border border-gray-800 rounded-md p-3">
              {full.body_text || '(no plain text body)'}
            </pre>
          )}
          {full && tab === 'html' && (
            <div className="bg-white rounded-md p-3 max-h-[55vh] overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: full.body_html || '' }} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-3 border-t border-gray-800">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md text-red-300 hover:bg-red-900/30 border border-red-900/50"
          >
            <Trash2 size={13} /> Delete
          </button>
          <button
            disabled
            title="Coming soon"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-blue-600/50 text-white cursor-not-allowed"
          >
            <Wand2 size={13} /> Create model from this email (coming soon)
          </button>
        </div>
      </div>
    </div>
  );
};

const UploadModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ bank_name: '', sender: '', subject: '', received_at: '', body_text: '', body_html: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.body_text.trim() && !form.body_html.trim()) {
      setError('Paste the email body (text or HTML).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/api/email-samples', form);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-gray-100">Add an email sample</div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bank name (optional)</label>
              <input type="text" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Received date (optional)</label>
              <input type="date" value={form.received_at} onChange={(e) => set('received_at', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sender (optional)</label>
            <input type="text" value={form.sender} onChange={(e) => set('sender', e.target.value)} placeholder="notifications@bank.com"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subject (optional)</label>
            <input type="text" value={form.subject} onChange={(e) => set('subject', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Plain text body</label>
            <textarea rows={6} value={form.body_text} onChange={(e) => set('body_text', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-xs font-mono" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">HTML body (optional)</label>
            <textarea rows={4} value={form.body_html} onChange={(e) => set('body_html', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-xs font-mono" />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 p-3 border-t border-gray-800">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs rounded-md text-gray-300 hover:bg-gray-800">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 disabled:opacity-60">
            {saving && <Loader2 size={12} className="animate-spin" />}
            Save sample
          </button>
        </div>
      </form>
    </div>
  );
};

const BankTemplatesPage = () => {
  const { t } = useTranslation();
  const { isOwner, isAuthenticated } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [samples, setSamples] = useState([]);
  const [inbox, setInbox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchSamples = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiClient.get('/api/email-samples');
      setSamples(data.samples || []);
    } catch (_) {}
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiClient.get('/api/pdf-templates');
        if (active) setTemplates(data.templates || []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load banks');
      } finally {
        if (active) setLoading(false);
      }
      if (isOwner) {
        try { const info = await apiClient.get('/api/inbox-info'); if (active) setInbox(info); } catch (_) {}
      }
      fetchSamples();
    })();
    return () => { active = false; };
  }, [isOwner, fetchSamples]);

  const copyAddress = async () => {
    if (!inbox?.address) return;
    try {
      await navigator.clipboard.writeText(inbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  };

  const banks = (() => {
    const seen = new Map();
    for (const tpl of templates) {
      const key = (tpl.bank || '').toLowerCase();
      if (!seen.has(key)) seen.set(key, { bank: tpl.bank, types: [tpl.account_type] });
      else {
        const entry = seen.get(key);
        if (tpl.account_type && !entry.types.includes(tpl.account_type)) entry.types.push(tpl.account_type);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.bank.localeCompare(b.bank));
  })();

  const onSampleDeleted = (id) => setSamples((prev) => prev.filter((s) => s.id !== id));

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Building2 size={24} className="text-gray-400" />
          {t('bankTemplates.title')}
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          Banks currently supported. To add another, forward one of its transaction emails to the address below — we'll save it here so you can build a parser for it.
        </p>
      </div>

      {loading && <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={28} /></div>}

      {error && !loading && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="text-red-400 mt-0.5" size={18} />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {banks.map((b) => (
              <div key={b.bank}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-3 hover:border-gray-700 transition-colors">
                <BankLogo bank={b.bank} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-100 truncate">{b.bank}</div>
                  <div className="text-xs text-gray-500 truncate">{b.types.join(' · ')}</div>
                </div>
              </div>
            ))}
          </div>

          <Link to="/accounts"
            className="block bg-gray-900 border border-gray-800 hover:border-blue-600 hover:bg-gray-900/80 rounded-lg p-5 mb-6 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-600/20 text-blue-300 p-2 border border-blue-800 shrink-0"><Plus size={18} /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  Add a new bank
                  <ArrowRight size={14} className="text-gray-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Connect a bank or credit card from the <span className="text-blue-300">My banks</span> page. Choose to upload PDF statements or forward transaction emails to your private address.
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Inbox size={18} className="text-gray-400" />
                <h3 className="text-base font-semibold text-gray-100">Email samples</h3>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{samples.length}</span>
              </div>
              <button onClick={() => setUploading(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white">
                <Plus size={12} /> Add sample
              </button>
            </div>

            {samples.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-6">
                No samples yet. Forward a bank email to the address above, or click <b>Add sample</b> to paste one manually.
              </div>
            ) : (
              <ul className="divide-y divide-gray-800">
                {samples.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => setViewing(s)}
                      className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-gray-800/40 rounded-md">
                      <BankLogo bank={s.bank_name || s.sender || '?'} size={9} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-100 truncate">
                          {s.subject || '(no subject)'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {s.sender || 'unknown sender'} · {formatDate(s.received_at || s.created_at)}
                          {s.bank_name && <> · <span className="text-gray-400">{s.bank_name}</span></>}
                        </div>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        s.status === 'modeled' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/30 text-amber-300'
                      }`}>{s.status || 'pending'}</span>
                      <ChevronRight size={14} className="text-gray-600" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {viewing && <SampleViewer sample={viewing} onClose={() => setViewing(null)} onDeleted={onSampleDeleted} />}
      {uploading && <UploadModal onClose={() => setUploading(false)} onSaved={fetchSamples} />}
    </>
  );
};

export default BankTemplatesPage;
