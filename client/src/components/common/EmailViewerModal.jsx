import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../../Services/api';

const EmailViewerModal = ({ isOpen, onClose, transaction, html }) => {
  const [emailHtml, setEmailHtml] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmail = async () => {
      if (!isOpen) return;

      if (html) {
        setEmailHtml(html);
        return;
      }

      if (transaction) {
        try {
          setLoading(true);
          const data = await apiClient.get(`/api/transactions/${transaction.id}/email`);
          setEmailHtml(data.full_email || '');
        } catch (err) {
          console.error('Failed to fetch email:', err);
          setEmailHtml('<p class="text-red-600">Failed to load email.</p>');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchEmail();
  }, [isOpen, transaction, html]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Original Email</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-auto flex-1">
          {loading ? (
            <div className="text-center text-sm text-gray-500">Loading...</div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
          )}
        </div>
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailViewerModal;
