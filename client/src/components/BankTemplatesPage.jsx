import React, { useState, useEffect } from 'react';
import Header from './ui/Header';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../Services/api';
import { Building2, FileText, Calendar, Columns3, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const BankTemplatesPage = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await apiClient.get('/api/pdf-templates');
        setTemplates(data.templates || []);
      } catch (err) {
        setError(err.message || t('bankTemplates.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [t]);

  const fieldLabels = {
    statement_period: t('bankTemplates.field.statementPeriod'),
    account_number: t('bankTemplates.field.accountNumber'),
    opening_balance: t('bankTemplates.field.openingBalance'),
    closing_balance: t('bankTemplates.field.closingBalance'),
    total_withdrawals: t('bankTemplates.field.totalWithdrawals'),
    total_deposits: t('bankTemplates.field.totalDeposits'),
    date: t('bankTemplates.field.date'),
    description: t('bankTemplates.field.description'),
    amount: t('bankTemplates.field.amount'),
    direction: t('bankTemplates.field.direction'),
    balance: t('bankTemplates.field.balance'),
  };

  return (
    <div className="min-h-screen bg-gray-950 max-w-6xl mx-auto p-6">
      <Header />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Building2 size={24} className="text-gray-400" />
          {t('bankTemplates.title')}
        </h2>
        <p className="text-gray-500 mt-1">{t('bankTemplates.subtitle')}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span className="ml-3 text-gray-500">{t('bankTemplates.loading')}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-400 mt-0.5" size={20} />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {!loading && !error && templates.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <FileText className="mx-auto text-gray-500 mb-3" size={40} />
          <p className="text-gray-400 text-lg">{t('bankTemplates.noTemplates')}</p>
        </div>
      )}

      <div className="grid gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white rounded-lg p-2">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">{tpl.bank}</h3>
                    <span className="text-sm text-gray-500">
                      {tpl.account_type} — {tpl.country}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle size={14} />
                  {t('bankTemplates.active')}
                </div>
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FileText size={14} />
                  {t('bankTemplates.detectionRules')}
                </h4>
                <div className="space-y-2">
                  {tpl.detection_keywords.map((kw, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <code className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-sm font-mono">{kw}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Calendar size={14} />
                  {t('bankTemplates.dateFormat')}
                </h4>
                <code className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-sm font-mono">
                  {tpl.date_format}
                </code>

                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-3 flex items-center gap-2">
                  <Columns3 size={14} />
                  {t('bankTemplates.columns')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tpl.columns.map((col, i) => (
                    <span key={i} className="bg-indigo-900/30 text-indigo-300 px-2.5 py-1 rounded-lg text-sm font-medium">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 pb-4">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {t('bankTemplates.fieldsExtracted')}
              </h4>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('bankTemplates.statementLevel')}</p>
                  {tpl.fields_extracted.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span className="text-sm text-gray-400">{fieldLabels[f] || f}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('bankTemplates.transactionLevel')}</p>
                  {tpl.transaction_fields.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span className="text-sm text-gray-400">{fieldLabels[f] || f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {tpl.notes && (
              <div className="px-6 pb-5">
                <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3">
                  <p className="text-sm text-amber-300">
                    <span className="font-medium">{t('bankTemplates.notes')}:</span> {tpl.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && templates.length > 0 && (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4 text-center text-sm text-gray-500">
          {t('bankTemplates.footerInfo')}
        </div>
      )}
    </div>
  );
};

export default BankTemplatesPage;
