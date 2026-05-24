import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Trash2, X, Search, ArrowLeft, FileUp, Mail, Lock, Check, Building2 } from 'lucide-react';
import { apiClient } from '../Services/api';
import { CANADIAN_BANKS, PRODUCT_LABELS, findBank, logoUrl } from '../data/banks';

const BankIcon = ({ bank, size = 'md' }) => {
  const [failed, setFailed] = useState(false);
  const cls = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  const initial = (bank?.name || '?').trim().charAt(0).toUpperCase();
  const url = logoUrl(bank?.domain);
  if (!url || failed) {
    return (
      <div className={`${cls} rounded-lg bg-blue-600/20 text-blue-300 flex items-center justify-center font-semibold border border-blue-800`}>
        {initial}
      </div>
    );
  }
  return (
    <img src={url} alt="" onError={() => setFailed(true)}
      className={`${cls} rounded-lg bg-white p-1 object-contain border border-gray-800`} />
  );
};

const INGEST_METHODS = [
  { id: 'pdf', label: 'Upload PDF statements', icon: FileUp, available: true,
    desc: 'Drag and drop monthly statements from this bank to import transactions.' },
  { id: 'email_forward', label: 'Forward transaction emails', icon: Mail, available: false,
    desc: 'Get a unique forwarding address — set a Gmail filter to send bank notifications to it.' },
  { id: 'gmail_oauth', label: 'Connect Gmail directly', icon: Lock, available: false,
    desc: 'Sign in with Google so we can poll your inbox for bank emails. (Coming after Google sign-in is enabled.)' },
];

const AddBankWizard = ({ onClose, onSaved, existingBankIds }) => {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [product, setProduct] = useState(null);
  const [nickname, setNickname] = useState('');
  const [method, setMethod] = useState('pdf');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const filtered = CANADIAN_BANKS.filter(b =>
    !query || b.name.toLowerCase().includes(query.toLowerCase())
  );

  const submit = async () => {
    if (!selected) return;
    setSaving(true); setError(null);
    try {
      await apiClient.post('/api/user-bank-accounts', {
        bank_id: selected.id,
        bank_name: selected.name,
        product,
        nickname: nickname.trim() || null,
        ingest_method: method,
      });
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
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="p-1 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="text-sm font-semibold text-gray-100">
              {step === 1 && 'Pick your bank'}
              {step === 2 && `Set up ${selected?.name || 'account'}`}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>

        {step === 1 && (
          <>
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search Canadian banks…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {filtered.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-8">No matches.</div>
              )}
              <div className="grid sm:grid-cols-2 gap-2">
                {filtered.map((b) => {
                  const already = existingBankIds.has(b.id);
                  return (
                    <button key={b.id}
                      onClick={() => { setSelected(b); setProduct(b.products[0]); setStep(2); }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-blue-600 hover:bg-gray-800/40 text-left transition-colors">
                      <BankIcon bank={b} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-100 truncate">{b.name}</div>
                        <div className="text-xs text-gray-500">
                          {b.products.length} product{b.products.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {already && <Check size={14} className="text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {step === 2 && selected && (
          <div className="flex-1 overflow-auto p-5 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
              <BankIcon bank={selected} size="lg" />
              <div>
                <div className="text-base font-semibold text-gray-100">{selected.name}</div>
                <div className="text-xs text-gray-500">Configure how we'll import transactions</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Product</label>
              <div className="flex flex-wrap gap-2">
                {selected.products.map((p) => (
                  <button key={p} type="button" onClick={() => setProduct(p)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      product === p
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}>
                    {PRODUCT_LABELS[p] || p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Nickname (optional)</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                placeholder={`e.g. ${selected.name} ${product ? PRODUCT_LABELS[product] : ''} *1234`}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">How should we get transactions?</label>
              <div className="space-y-2">
                {INGEST_METHODS.map((m) => {
                  const Icon = m.icon;
                  const disabled = !m.available;
                  return (
                    <button key={m.id} type="button"
                      disabled={disabled}
                      onClick={() => setMethod(m.id)}
                      className={`w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                        method === m.id && !disabled
                          ? 'border-blue-500 bg-blue-600/10'
                          : 'border-gray-800 hover:border-gray-700'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Icon size={16} className="text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-100 flex items-center gap-2">
                          {m.label}
                          {disabled && <span className="text-[10px] uppercase bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">Coming soon</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <div className="text-red-400 text-xs">{error}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose}
                className="px-3 py-1.5 text-xs rounded-md text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={submit} disabled={saving || !product}
                className="px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 disabled:opacity-60">
                {saving && <Loader2 size={12} className="animate-spin" />}
                Connect account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConnectedAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/user-bank-accounts');
      setAccounts(data.accounts || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Disconnect this account? Existing transactions are kept.')) return;
    try {
      await apiClient.delete(`/api/user-bank-accounts/${id}`);
      setAccounts((prev) => prev.filter(a => a.id !== id));
    } catch (e) { alert(e.message); }
  };

  const existingBankIds = new Set(accounts.map(a => a.bank_id));

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Building2 size={24} className="text-gray-400" />
            Connected accounts
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Add the banks and credit cards you want to track. You can have multiple accounts at the same bank.
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
          <Plus size={14} /> Add bank
        </button>
      </div>

      {loading && <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={28} /></div>}
      {error && !loading && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-300 text-sm">{error}</div>
      )}

      {!loading && !error && accounts.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-10 text-center">
          <Building2 size={36} className="mx-auto text-gray-600 mb-3" />
          <h3 className="text-base font-semibold text-gray-200">No accounts connected yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Start by adding a bank or credit card you'd like to track.</p>
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
            <Plus size={14} /> Add your first bank
          </button>
        </div>
      )}

      {!loading && !error && accounts.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((a) => {
            const bank = findBank(a.bank_id) || { name: a.bank_name, domain: null };
            return (
              <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <BankIcon bank={bank} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-100 truncate">
                      {a.nickname || a.bank_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {a.bank_name}
                      {a.product && <> · {PRODUCT_LABELS[a.product] || a.product}</>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(a.id)}
                    className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-900/20">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    {a.ingest_method === 'pdf' && <><FileUp size={12} /> PDF statements</>}
                    {a.ingest_method === 'email_forward' && <><Mail size={12} /> Email forwarding</>}
                    {a.ingest_method === 'gmail_oauth' && <><Lock size={12} /> Gmail</>}
                  </span>
                  {a.ingest_method === 'pdf' && (
                    <Link to="/pdf-import"
                      className="text-xs px-2 py-1 rounded-md text-blue-300 hover:bg-blue-900/30 border border-blue-900/50">
                      Import statement
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <AddBankWizard
          onClose={() => setAdding(false)}
          onSaved={load}
          existingBankIds={existingBankIds}
        />
      )}
    </>
  );
};

export default ConnectedAccountsPage;
