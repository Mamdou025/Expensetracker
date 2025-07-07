import React, { useState } from 'react';
import Header from './ui/Header';
import { useTranslation } from 'react-i18next';
import { emailService } from '../Services/emailService';
import { transactionService } from '../Services/transactionService';

const EmailExtractionPage = () => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [queue, setQueue] = useState([]); // {email, transaction}
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadEmails = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const data = await emailService.extractEmails(startDate, endDate);
      setQueue(data || []);
      const sel = {};
      data.forEach((_, idx) => {
        sel[idx] = true;
      });
      setSelected(sel);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (idx) => {
    setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const selectAll = () => {
    const sel = {};
    queue.forEach((_, idx) => {
      sel[idx] = true;
    });
    setSelected(sel);
  };

  const clearSelection = () => setSelected({});

  const removeSelected = () => {
    const filtered = queue.filter((_, idx) => !selected[idx]);
    setQueue(filtered);
    const sel = {};
    filtered.forEach((_, idx) => {
      sel[idx] = true;
    });
    setSelected(sel);
  };

  const processEmails = async (emails) => {
    if (emails.length === 0) return;
    setProcessing(true);
    setProgress(0);
    try {
      await emailService.processQueue(emails);
      setProgress(emails.length);
      await transactionService.getAll();
      await loadEmails();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const processSelected = () => {
    const emails = queue.filter((_, idx) => selected[idx]).map((q) => q.email);
    processEmails(emails);
  };

  const processAll = () => {
    const emails = queue.map((q) => q.email);
    processEmails(emails);
  };

  const allSelected = queue.length > 0 && queue.every((_, idx) => selected[idx]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Header />
      <div className="bg-white p-8 rounded-3xl shadow-xl border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('emailExtraction.startDate')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('emailExtraction.endDate')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadEmails}
              className="w-full bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600"
            >
              {loading ? t('emailExtraction.extracting') : t('emailExtraction.extract')}
            </button>
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border">
          <div className="flex justify-between mb-4">
            <div className="space-x-2">
              <button onClick={selectAll} className="px-3 py-1 border rounded-xl text-sm">
                {t('queue.selectAll')}
              </button>
              <button onClick={clearSelection} className="px-3 py-1 border rounded-xl text-sm">
                {t('queue.clear')}
              </button>
              <button onClick={removeSelected} className="px-3 py-1 border rounded-xl text-sm">
                {t('queue.remove')}
              </button>
            </div>
            <div className="space-x-2">
              <button
                onClick={processSelected}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
              >
                {t('queue.processSelected')}
              </button>
              <button
                onClick={processAll}
                className="px-4 py-2 bg-green-700 text-white rounded-xl hover:bg-green-800"
              >
                {t('queue.processAll')}
              </button>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => (allSelected ? clearSelection() : selectAll())}
                  />
                </th>
                <th className="px-6 py-3">{t('queue.table.date')}</th>
                <th className="px-6 py-3">{t('queue.table.amount')}</th>
                <th className="px-6 py-3">{t('queue.table.description')}</th>
                <th className="px-6 py-3">{t('queue.table.duplicate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {queue.map((item, idx) => (
                <tr key={idx} className={item.transaction.duplicate ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={!!selected[idx]}
                      onChange={() => toggle(idx)}
                    />
                  </td>
                  <td className="px-6 py-4">{item.transaction.date}</td>
                  <td className="px-6 py-4">{item.transaction.amount}</td>
                  <td className="px-6 py-4">{item.transaction.description}</td>
                  <td className="px-6 py-4 text-red-600">
                    {item.transaction.duplicate ? t('queue.table.duplicateYes') : t('queue.table.duplicateNo')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {processing && (
            <p className="mt-4 text-sm text-gray-600">
              {t('queue.processing', { current: progress, total: queue.length })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailExtractionPage;
