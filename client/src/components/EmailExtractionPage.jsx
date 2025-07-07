import React, { useState } from 'react';
import Header from './ui/Header';
import { emailService } from '../Services/emailService';
import { useTransactions } from '../hooks/useTransactions';

const EmailExtractionPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [queue, setQueue] = useState([]); // {email, transaction}
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const { refreshTransactions } = useTransactions();

  const loadEmails = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const data = await emailService.extractEmails(startDate, endDate);
      setQueue(data || []);
      setSelectedIds(data.map((_, idx) => idx));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = (item) => setQueue((prev) => [...prev, item]);

  const toggleSelect = (idx) => {
    setSelectedIds((prev) =>
      prev.includes(idx) ? prev.filter((id) => id !== idx) : [...prev, idx]
    );
  };

  const selectAll = () => {
    setSelectedIds(queue.map((_, idx) => idx));
  };

  const clearSelection = () => setSelectedIds([]);

  const removeSelected = () => {
    setQueue((prev) => prev.filter((_, idx) => !selectedIds.includes(idx)));
    setSelectedIds([]);
  };

  const clearQueue = () => {
    setQueue([]);
    setSelectedIds([]);
  };

  const processEmails = async (emails) => {
    if (emails.length === 0) return;
    setProcessing(true);
    setProgress(0);
    try {
      await emailService.processQueue(emails);
      setProgress(emails.length);
      setQueue((prev) => prev.filter((q) => !emails.includes(q.email)));
      setSelectedIds([]);
      await refreshTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const processSelected = () => {
    const emails = queue
      .filter((_, idx) => selectedIds.includes(idx))
      .map((q) => q.email);
    processEmails(emails);
  };

  const processAll = () => {
    const emails = queue.map((q) => q.email);
    processEmails(emails);
  };

  const allSelected =
    queue.length > 0 && queue.every((_, idx) => selectedIds.includes(idx));

  const duplicateCount = queue.filter((q) => q.transaction.duplicate).length;
  const selectedCount = selectedIds.length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Header />
      <div className="bg-white p-8 rounded-3xl shadow-xl border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
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
              {loading ? 'Extracting...' : 'Extract Emails'}
            </button>
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border">
          <p className="mb-4 text-sm text-gray-700">
            Total: {queue.length} | Duplicates: {duplicateCount} | Selected: {selectedCount}
          </p>
          <div className="flex justify-between mb-4">
            <div className="space-x-2">
              <button onClick={selectAll} className="px-3 py-1 border rounded-xl text-sm">
                Select All
              </button>
              <button onClick={clearSelection} className="px-3 py-1 border rounded-xl text-sm">
                Clear
              </button>
              <button onClick={removeSelected} className="px-3 py-1 border rounded-xl text-sm">
                Remove
              </button>
              <button onClick={clearQueue} className="px-3 py-1 border rounded-xl text-sm">
                Clear Queue
              </button>
            </div>
            <div className="space-x-2">
              <button
                onClick={processSelected}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
              >
                Process Selected
              </button>
              <button
                onClick={processAll}
                className="px-4 py-2 bg-green-700 text-white rounded-xl hover:bg-green-800"
              >
                Process All
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
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Duplicate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {queue.map((item, idx) => (
                <tr
                  key={idx}
                  className={item.transaction.duplicate ? 'bg-yellow-50' : ''}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(idx)}
                      onChange={() => toggleSelect(idx)}
                    />
                  </td>
                  <td className="px-6 py-4">{item.transaction.date}</td>
                  <td className="px-6 py-4">{item.transaction.amount}</td>
                  <td className="px-6 py-4">{item.transaction.description}</td>
                  <td className="px-6 py-4 text-red-600">
                    {item.transaction.duplicate ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {processing && (
            <p className="mt-4 text-sm text-gray-600">Processing {progress} of {queue.length}...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailExtractionPage;
