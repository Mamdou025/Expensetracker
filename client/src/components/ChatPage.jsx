import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Brand, BrandLine, I } from '../ui/BrandIcon';
import ChatUsagePanel from './ChatUsagePanel';

const SUGGESTED_QUESTIONS = [
  "Combien ai-je dépensé ce mois-ci ?",
  "Quelles sont mes principales catégories de dépenses ?",
  "Montre-moi mes abonnements récurrents",
  "Combien de loyer ai-je payé cette année ?",
  "Quels sont mes frais d'intérêt ?",
  "Sur quelle banque est-ce que je dépense le plus ?",
  "Compare mes dépenses d'un mois à l'autre",
  "Où est-ce que je dépense le plus d'argent ?",
];

const ChatPage = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [sessionUsage, setSessionUsage] = useState([]);
  const [lastUsage, setLastUsage] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setLastUsage(null);

    const assistantMsg = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMsg]);

    try {
      const history = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: history.slice(0, -1) }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullContent += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullContent };
                return updated;
              });
            }
            if (data.done && data.usage) {
              setLastUsage(data.usage);
              setSessionUsage(prev => [...prev, data.usage]);
            }
          } catch (e) {}
        }
      }
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    setSessionUsage([]);
    setLastUsage(null);
  };

  const formatMessage = (content) => {
    const parts = content.split(/(\*\*.*?\*\*|`[^`]+`|\n)/g);
    return parts.map((part, i) => {
      if (part === '\n') return <br key={i} />;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-emerald-400">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const sessionTokens = sessionUsage.reduce((a, u) => a + (u.total_tokens || 0), 0);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brand name={I.message} size={20} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-100">
            {t('chat.title', 'Assistant financier')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUsage(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
            title={t('chatUsage.title', "Suivi de l'utilisation IA")}
          >
            <Brand name={I.chart} size={14} />
            {sessionTokens > 0 && (
              <span className="text-xs tabular-nums">{sessionTokens.toLocaleString()} jet.</span>
            )}
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Brand name={I.trash} size={14} />
              {t('chat.clear', 'Effacer')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Brand name={I.message} size={48} className="text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {t('chat.welcome', 'Posez-moi n\'importe quelle question sur vos finances')}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              {t('chat.welcomeDesc', 'Je peux analyser vos transactions, repérer vos habitudes de dépense, suivre vos abonnements et vous donner un aperçu de vos finances.')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTED_QUESTIONS.slice(0, 6).map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-800 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-800 text-gray-200 rounded-bl-md border border-gray-700'
                  }`}
                >
                  {msg.role === 'assistant' && msg.content === '' && isLoading ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Brand name={I.loading} size={16} className="animate-spin" />
                      <span>{t('chat.thinking', 'Analyse en cours…')}</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{formatMessage(msg.content)}</div>
                  )}
                </div>
              </div>
              {msg.role === 'assistant' && !isLoading && i === messages.length - 1 && lastUsage && (
                <div className="flex justify-start mt-1 ml-1">
                  <span className="text-[10px] text-gray-600 tabular-nums">
                    {lastUsage.total_tokens?.toLocaleString()} jetons &middot; {(lastUsage.duration_ms / 1000).toFixed(1)}s &middot; {lastUsage.model}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder', 'Posez une question sur vos dépenses, catégories, tendances…')}
          className="flex-1 resize-none rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <BrandLine name={I.loading} size={16} className="animate-spin" style={{ color: '#fff' }} />
          ) : (
            <BrandLine name={I.send} size={16} style={{ color: '#fff' }} />
          )}
        </button>
      </div>

      <ChatUsagePanel
        visible={showUsage}
        onClose={() => setShowUsage(false)}
        sessionUsage={sessionUsage}
      />
    </div>
  );
};

export default ChatPage;
