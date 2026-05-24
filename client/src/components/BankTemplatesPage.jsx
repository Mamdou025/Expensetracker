import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../Services/api';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Mail, Copy, Check, Loader2, AlertCircle, Plus } from 'lucide-react';

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

const BankLogo = ({ bank }) => {
  const domain = lookupDomain(bank);
  const [failed, setFailed] = useState(false);
  const initial = (bank || '?').trim().charAt(0).toUpperCase();

  if (!domain || failed) {
    return (
      <div className="w-12 h-12 rounded-lg bg-blue-600/20 text-blue-300 flex items-center justify-center text-lg font-semibold border border-blue-800">
        {initial}
      </div>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt=""
      onError={() => setFailed(true)}
      className="w-12 h-12 rounded-lg bg-white p-1 object-contain border border-gray-800"
    />
  );
};

const BankTemplatesPage = () => {
  const { t } = useTranslation();
  const { isOwner } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [inbox, setInbox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiClient.get('/api/pdf-templates');
        if (!active) return;
        setTemplates(data.templates || []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load banks');
      } finally {
        if (active) setLoading(false);
      }
      if (isOwner) {
        try {
          const info = await apiClient.get('/api/inbox-info');
          if (active) setInbox(info);
        } catch (_) { /* non-fatal */ }
      }
    })();
    return () => { active = false; };
  }, [isOwner]);

  const copyAddress = async () => {
    if (!inbox?.address) return;
    try {
      await navigator.clipboard.writeText(inbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  };

  // Deduplicate by bank name so each institution appears once
  const banks = (() => {
    const seen = new Map();
    for (const tpl of templates) {
      const key = (tpl.bank || '').toLowerCase();
      if (!seen.has(key)) seen.set(key, { bank: tpl.bank, country: tpl.country, types: [tpl.account_type] });
      else {
        const entry = seen.get(key);
        if (tpl.account_type && !entry.types.includes(tpl.account_type)) entry.types.push(tpl.account_type);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.bank.localeCompare(b.bank));
  })();

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Building2 size={24} className="text-gray-400" />
          {t('bankTemplates.title')}
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          Banks currently supported. To add another, forward one of its transaction emails to the address below.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      )}

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
              <div
                key={b.bank}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-3 hover:border-gray-700 transition-colors"
              >
                <BankLogo bank={b.bank} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-100 truncate">{b.bank}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {b.types.join(' · ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-lg bg-blue-600/20 text-blue-300 p-2 border border-blue-800">
                <Plus size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-100">Add a new bank</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Forward a single transaction email from the bank to the address below. We'll use it to build a parser for that institution.
                </p>
              </div>
            </div>

            {isOwner ? (
              inbox?.address ? (
                <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                  <Mail size={16} className="text-gray-400 shrink-0" />
                  <code className="flex-1 text-sm text-gray-100 font-mono truncate">{inbox.address}</code>
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-100 transition-colors"
                  >
                    {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              ) : (
                <div className="text-sm text-amber-300 bg-amber-900/20 border border-amber-800 rounded-md px-3 py-2">
                  No inbox address is configured yet. Set the <code className="font-mono">EMAIL_USER</code> secret to enable email forwarding.
                </div>
              )
            ) : (
              <div className="text-sm text-gray-400 bg-gray-800/50 border border-gray-800 rounded-md px-3 py-2">
                Ask the workspace owner for the forwarding address.
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default BankTemplatesPage;
