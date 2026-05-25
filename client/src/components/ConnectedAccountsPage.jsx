import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Brand, BrandLine, I } from '../ui/BrandIcon';
import { apiClient } from '../Services/api';
import { CANADIAN_BANKS, PRODUCT_LABELS, findBank, logoUrl } from '../data/banks';

const PARSER_BANK_DOMAINS = {
  'CIBC': 'cibc.com', 'CIBC Chequing': 'cibc.com', 'CIBC Visa': 'cibc.com', 'CIBC Credit': 'cibc.com',
  'RBC': 'rbcroyalbank.com', 'RBC Visa': 'rbcroyalbank.com', 'RBC Credit': 'rbcroyalbank.com',
  'MBNA': 'mbna.ca', 'MBNA Mastercard': 'mbna.ca',
  'Capital One': 'capitalone.ca', 'Capital One Mastercard': 'capitalone.ca',
  'Neo Financial': 'neofinancial.com', 'Neo Financial World Elite': 'neofinancial.com',
  'Triangle': 'canadiantire.ca', 'Triangle Mastercard': 'canadiantire.ca',
};
const lookupParserDomain = (bank) => {
  if (!bank) return null;
  if (PARSER_BANK_DOMAINS[bank]) return PARSER_BANK_DOMAINS[bank];
  const lower = bank.toLowerCase();
  for (const [name, domain] of Object.entries(PARSER_BANK_DOMAINS)) {
    if (lower.includes(name.toLowerCase()) || name.toLowerCase().includes(lower)) return domain;
  }
  return null;
};
const ParserBankLogo = ({ bank, size = 10 }) => {
  const [failed, setFailed] = useState(false);
  const domain = lookupParserDomain(bank);
  const initial = (bank || '?').trim().charAt(0).toUpperCase();
  const cls = `w-${size} h-${size}`;
  if (!domain || failed) {
    return (
      <div className={`${cls} rounded-lg bg-blue-600/20 text-blue-300 flex items-center justify-center font-semibold border border-blue-800 shrink-0`}>
        {initial}
      </div>
    );
  }
  return (
    <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} alt=""
      onError={() => setFailed(true)}
      className={`${cls} rounded-lg bg-white p-1 object-contain border border-gray-800 shrink-0`} />
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
        if (active) { setFull(data); setTab(data.body_text ? 'text' : 'html'); }
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [sample.id]);

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cet exemple de courriel ?')) return;
    try {
      await apiClient.delete(`/api/email-samples/${sample.id}`);
      onDeleted(sample.id);
      onClose();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-800">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-100 truncate">{sample.subject || '(sans objet)'}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              De {sample.sender || 'expéditeur inconnu'} · {formatDate(sample.received_at || sample.created_at)}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800">
            <Brand name={I.x} size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 pt-3">
          <button onClick={() => setTab('text')} disabled={!full?.body_text}
            className={`px-3 py-1 text-xs rounded-md ${tab === 'text' ? 'nav-active' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-40`}>Texte brut</button>
          <button onClick={() => setTab('html')} disabled={!full?.body_html}
            className={`px-3 py-1 text-xs rounded-md ${tab === 'html' ? 'nav-active' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-40`}>HTML rendu</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading && <div className="flex justify-center py-10"><Brand name={I.loading} className="animate-spin text-blue-500" size={20} /></div>}
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {full && tab === 'text' && (
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-gray-950 border border-gray-800 rounded-md p-3">
              {full.body_text || '(aucun corps en texte brut)'}
            </pre>
          )}
          {full && tab === 'html' && (
            <div className="bg-white rounded-md p-3 max-h-[55vh] overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: full.body_html || '' }} />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 p-3 border-t border-gray-800">
          <button onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md text-red-300 hover:bg-red-900/30 border border-red-900/50">
            <Brand name={I.trash} size={13} accent="#fca5a5" /> Supprimer
          </button>
          <button disabled title="Bientôt disponible"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-blue-600/50 text-white cursor-not-allowed">
            <BrandLine name={I.wand} size={13} style={{ color: '#fff' }} /> Créer un modèle à partir de ce courriel (bientôt)
          </button>
        </div>
      </div>
    </div>
  );
};

const SampleUploadModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ bank_name: '', sender: '', subject: '', received_at: '', body_text: '', body_html: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.body_text.trim() && !form.body_html.trim()) {
      setError('Collez le contenu du courriel (texte ou HTML).');
      return;
    }
    setSaving(true); setError(null);
    try {
      await apiClient.post('/api/email-samples', form);
      onSaved();
      onClose();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onSubmit={submit}
        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-gray-100">Ajouter un exemple de courriel</div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800">
            <Brand name={I.x} size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nom de la banque (facultatif)</label>
              <input type="text" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date de réception (facultatif)</label>
              <input type="date" value={form.received_at} onChange={(e) => set('received_at', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Expéditeur (facultatif)</label>
            <input type="text" value={form.sender} onChange={(e) => set('sender', e.target.value)} placeholder="notifications@bank.com"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Objet (facultatif)</label>
            <input type="text" value={form.subject} onChange={(e) => set('subject', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Corps en texte brut</label>
            <textarea rows={6} value={form.body_text} onChange={(e) => set('body_text', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-xs font-mono" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Corps HTML (facultatif)</label>
            <textarea rows={4} value={form.body_html} onChange={(e) => set('body_html', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-xs font-mono" />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 p-3 border-t border-gray-800">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs rounded-md text-gray-300 hover:bg-gray-800">Annuler</button>
          <button type="submit" disabled={saving}
            className="px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 disabled:opacity-60">
            {saving && <BrandLine name={I.loading} size={12} className="animate-spin" style={{ color: '#fff' }} />}
            Enregistrer l'exemple
          </button>
        </div>
      </form>
    </div>
  );
};

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

const buildIngestMethods = (forwardingAddress) => [
  { id: 'pdf', label: 'Importer des relevés PDF', iconName: I.upload, available: true,
    desc: 'Glissez-déposez vos relevés mensuels de cette banque pour importer les transactions.' },
  { id: 'email_forward', label: 'Faire suivre les courriels de transactions', iconName: I.mail,
    available: !!forwardingAddress,
    unavailableReason: "Adresse de réacheminement indisponible pour l'instant.",
    desc: 'Obtenez une adresse de réacheminement personnelle — créez un filtre Gmail pour y envoyer les notifications bancaires.' },
  { id: 'gmail_oauth', label: 'Connecter Gmail directement', iconName: I.lock, available: false,
    unavailableReason: 'Bientôt disponible',
    desc: 'Connectez-vous avec Google pour que nous puissions consulter votre boîte de réception. (Disponible une fois Google activé.)' },
];

const ForwardingAddressBox = ({ address }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <div className="mt-3 rounded-lg border border-blue-900/60 bg-blue-950/30 p-3 space-y-2">
      <div className="text-xs text-blue-200 font-medium flex items-center gap-1.5">
        <Brand name={I.shieldCheck} size={12} /> Votre adresse de réacheminement privée
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-gray-100 truncate">{address}</code>
        <button type="button" onClick={copy}
          className="text-xs px-2 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1">
          <BrandLine name={I.copy} size={12} style={{ color: '#fff' }} /> {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <div className="text-[11px] text-gray-400 leading-relaxed">
        Dans Gmail (ou votre application courriel), créez un filtre pour les messages provenant de l'adresse de la banque
        (ex. <code className="text-gray-300">notify@cibc.com</code>) et faites-les suivre à l'adresse ci-dessus.
        Nous ne voyons jamais votre mot de passe — uniquement ce que vous nous réacheminez.
      </div>
    </div>
  );
};

const AddBankWizard = ({ onClose, onSaved, existingBankIds, forwardingAddress }) => {
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
    if (method === 'email_forward' && !forwardingAddress) {
      setError("Adresse de réacheminement indisponible — veuillez réessayer dans un instant.");
      return;
    }
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
                <Brand name={I.arrowLeft} size={16} />
              </button>
            )}
            <div className="text-sm font-semibold text-gray-100">
              {step === 1 && 'Choisissez votre banque'}
              {step === 2 && `Configurer ${selected?.name || 'le compte'}`}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800">
            <Brand name={I.x} size={16} />
          </button>
        </div>

        {step === 1 && (
          <>
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Brand name={I.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Rechercher une banque canadienne…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {filtered.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-8">Aucun résultat.</div>
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
                          {b.products.length} produit{b.products.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {already && <Brand name={I.check} size={14} className="text-emerald-400 shrink-0" />}
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
                <div className="text-xs text-gray-500">Configurez la façon d'importer vos transactions</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Produit</label>
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
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Surnom (facultatif)</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                placeholder={`ex. ${selected.name} ${product ? PRODUCT_LABELS[product] : ''} *1234`}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Comment récupérer les transactions ?</label>
              <div className="space-y-2">
                {buildIngestMethods(forwardingAddress).map((m) => {
                  const disabled = !m.available;
                  const active = method === m.id && !disabled;
                  return (
                    <div key={m.id}>
                      <button type="button"
                        disabled={disabled}
                        onClick={() => setMethod(m.id)}
                        className={`w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                          active
                            ? 'border-blue-500 bg-blue-600/10'
                            : 'border-gray-800 hover:border-gray-700'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Brand name={m.iconName} size={16} className="text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-100 flex items-center gap-2">
                            {m.label}
                            {disabled && (
                              <span className="text-[10px] uppercase bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                                {m.unavailableReason || 'Indisponible'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                        </div>
                      </button>
                      {active && m.id === 'email_forward' && forwardingAddress && (
                        <ForwardingAddressBox address={forwardingAddress} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && <div className="text-red-400 text-xs">{error}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose}
                className="px-3 py-1.5 text-xs rounded-md text-gray-300 hover:bg-gray-800">Annuler</button>
              <button onClick={submit} disabled={saving || !product}
                className="px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 disabled:opacity-60">
                {saving && <BrandLine name={I.loading} size={12} className="animate-spin" style={{ color: '#fff' }} />}
                Connecter le compte
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
  const [forwardingAddress, setForwardingAddress] = useState(null);
  const [supportedBanks, setSupportedBanks] = useState([]);
  const [samples, setSamples] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [uploadingSample, setUploadingSample] = useState(false);

  const fetchSamples = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/email-samples');
      setSamples(data.samples || []);
    } catch (_) {}
  }, []);

  const load = useCallback(async () => {
    try {
      const [data, fwd, templates] = await Promise.all([
        apiClient.get('/api/user-bank-accounts'),
        apiClient.get('/api/forwarding-address').catch((err) => {
          console.warn('Forwarding address fetch failed:', err?.message);
          return null;
        }),
        apiClient.get('/api/pdf-templates').catch(() => ({ templates: [] })),
      ]);
      setAccounts(data.accounts || []);
      setForwardingAddress(fwd?.address || null);
      const seen = new Map();
      for (const tpl of (templates.templates || [])) {
        const key = (tpl.bank || '').toLowerCase();
        if (!seen.has(key)) seen.set(key, { bank: tpl.bank, types: [tpl.account_type] });
        else {
          const entry = seen.get(key);
          if (tpl.account_type && !entry.types.includes(tpl.account_type)) entry.types.push(tpl.account_type);
        }
      }
      setSupportedBanks(Array.from(seen.values()).sort((a, b) => a.bank.localeCompare(b.bank)));
      fetchSamples();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchSamples]);

  useEffect(() => { load(); }, [load]);

  const onSampleDeleted = (id) => setSamples((prev) => prev.filter((s) => s.id !== id));

  const handleDelete = async (id) => {
    if (!window.confirm('Déconnecter ce compte ? Les transactions existantes seront conservées.')) return;
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
            <Brand name={I.building} size={24} className="text-gray-400" />
            Mes comptes connectés
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Ajoutez les banques et cartes de crédit que vous souhaitez suivre. Vous pouvez avoir plusieurs comptes dans la même banque.
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          aria-label="Ajouter une banque"
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
          <BrandLine name={I.plus} size={14} style={{ color: '#fff' }} /> Ajouter une banque
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brand name={I.wand} size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
            Deux façons d'alimenter vos transactions
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Pour chaque banque ajoutée, choisissez comment exptrackr récupère vos opérations. Vous pouvez combiner les deux méthodes selon vos comptes.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-blue-600/20 text-blue-300 flex items-center justify-center">
                <Brand name={I.upload} size={16} />
              </div>
              <div className="text-sm font-semibold text-gray-100">1. Importer des relevés PDF</div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Téléchargez les relevés mensuels (PDF) téléchargés depuis votre banque. exptrackr lit le document, détecte automatiquement la banque, et extrait chaque transaction avec la date, le montant et la description.
            </p>
            <Link to="/pdf-import"
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white">
              <Brand name={I.upload} size={12} /> Aller à l'import PDF
            </Link>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-emerald-600/20 text-emerald-300 flex items-center justify-center">
                <Brand name={I.mail} size={16} />
              </div>
              <div className="text-sm font-semibold text-gray-100">2. Faire suivre vos courriels</div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Chaque utilisateur reçoit une adresse de réacheminement privée (<code className="text-gray-300">votre-id@exptracker.app</code>). Créez un filtre Gmail qui transfère les notifications de la banque vers cette adresse — chaque courriel devient automatiquement une transaction.
            </p>
            {forwardingAddress ? (
              <ForwardingAddressBox address={forwardingAddress} />
            ) : (
              <div className="text-[11px] text-gray-500 italic">
                Votre adresse apparaîtra ici une fois disponible.
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && <div className="flex justify-center py-16"><Brand name={I.loading} className="animate-spin text-blue-500" size={28} /></div>}
      {error && !loading && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-300 text-sm">{error}</div>
      )}

      {!loading && !error && accounts.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-10 text-center">
          <Brand name={I.building} size={36} className="mx-auto text-gray-600 mb-3" />
          <h3 className="text-base font-semibold text-gray-200">Aucun compte connecté pour l'instant</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Commencez par ajouter une banque ou une carte de crédit à suivre.</p>
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
            <BrandLine name={I.plus} size={14} style={{ color: '#fff' }} /> Ajouter ma première banque
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
                    <Brand name={I.trash} size={14} accent="#fca5a5" />
                  </button>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    {a.ingest_method === 'pdf' && <><Brand name={I.upload} size={12} /> Relevés PDF</>}
                    {a.ingest_method === 'email_forward' && <><Brand name={I.mail} size={12} /> Courriels réacheminés</>}
                    {a.ingest_method === 'gmail_oauth' && <><Brand name={I.lock} size={12} /> Gmail</>}
                  </span>
                  {a.ingest_method === 'pdf' && (
                    <Link to="/pdf-import"
                      className="text-xs px-2 py-1 rounded-md text-blue-300 hover:bg-blue-900/30 border border-blue-900/50">
                      Importer un relevé
                    </Link>
                  )}
                </div>
                {a.ingest_method === 'email_forward' && forwardingAddress && (
                  <ForwardingAddressBox address={forwardingAddress} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && supportedBanks.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <Brand name={I.building} size={16} className="text-gray-500" />
              Banques et analyseurs pris en charge
            </h3>
            <span className="text-xs text-gray-500">{supportedBanks.length} banques</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Voici les banques dont nous savons déjà lire les relevés et les courriels. Choisissez-en une lorsque vous cliquez sur <b>Ajouter une banque</b>.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {supportedBanks.map((b) => (
              <div key={b.bank}
                className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center gap-3 hover:border-gray-700 transition-colors">
                <ParserBankLogo bank={b.bank} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-100 truncate">{b.bank}</div>
                  <div className="text-xs text-gray-500 truncate">{b.types.join(' · ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-10">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brand name={I.inbox} size={18} className="text-gray-400" />
                <h3 className="text-base font-semibold text-gray-100">Exemples de courriels réacheminés</h3>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{samples.length}</span>
              </div>
              <button onClick={() => setUploadingSample(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white">
                <BrandLine name={I.plus} size={12} style={{ color: '#fff' }} /> Coller un exemple
              </button>
            </div>
            {samples.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-6">
                Aucun exemple pour l'instant. Faites suivre un courriel bancaire à votre adresse privée ci-dessus, ou cliquez sur <b>Coller un exemple</b> pour en ajouter un manuellement.
              </div>
            ) : (
              <ul className="divide-y divide-gray-800">
                {samples.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => setViewing(s)}
                      className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-gray-800/40 rounded-md">
                      <ParserBankLogo bank={s.bank_name || s.sender || '?'} size={9} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-100 truncate">{s.subject || '(sans objet)'}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {s.sender || 'expéditeur inconnu'} · {formatDate(s.received_at || s.created_at)}
                          {s.bank_name && <> · <span className="text-gray-400">{s.bank_name}</span></>}
                        </div>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        s.status === 'modeled' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/30 text-amber-300'
                      }`}>{s.status === 'modeled' ? 'modélisé' : 'en attente'}</span>
                      <Brand name={I.chevronRight} size={14} className="text-gray-600" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {adding && (
        <AddBankWizard
          onClose={() => setAdding(false)}
          onSaved={load}
          existingBankIds={existingBankIds}
          forwardingAddress={forwardingAddress}
        />
      )}
      {viewing && <SampleViewer sample={viewing} onClose={() => setViewing(null)} onDeleted={onSampleDeleted} />}
      {uploadingSample && <SampleUploadModal onClose={() => setUploadingSample(false)} onSaved={fetchSamples} />}
    </>
  );
};

export default ConnectedAccountsPage;
