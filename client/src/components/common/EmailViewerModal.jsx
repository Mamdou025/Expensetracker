import React, { useState, useEffect } from 'react';
import { Brand, I } from '../../ui/BrandIcon';
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
          setEmailHtml('<p style="color:#f87171;">Échec du chargement du courriel.</p>');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchEmail();
  }, [isOpen, transaction, html]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-100">Courriel original</h2>
          <button
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            title="Fermer"
            className="p-2 hover:bg-gray-800 rounded-full transition-colors duration-200 text-gray-400"
          >
            <Brand name={I.x} size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="text-center text-sm text-gray-500 p-6">Chargement…</div>
          ) : emailHtml ? (
            <iframe
              srcDoc={emailHtml}
              title="Email preview"
              sandbox="allow-same-origin"
              className="w-full h-full border-0"
              style={{ minHeight: '500px' }}
            />
          ) : (
            <div className="text-center text-sm text-gray-500 p-6">Aucun contenu disponible.</div>
          )}
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailViewerModal;
