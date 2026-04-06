import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3, Clock, Zap, DollarSign, MessageSquare,
  ChevronDown, ChevronUp, RefreshCw, Trash2, Activity,
  TrendingUp, Hash, FileText, Timer, Database, X
} from 'lucide-react';

const formatNumber = (n) => {
  if (n == null) return '0';
  return Number(n).toLocaleString();
};

const formatCost = (c) => {
  if (!c) return '$0.00';
  return `$${Number(c).toFixed(6)}`;
};

const formatDuration = (ms) => {
  if (!ms) return '0s';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d + 'Z');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  };
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-semibold text-gray-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, expanded, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-300 hover:text-gray-100 transition-colors"
  >
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-500" />
      <span>{title}</span>
    </div>
    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
  </button>
);

const TokenBar = ({ prompt, completion, total }) => {
  if (!total) return null;
  const pPct = (prompt / total) * 100;
  const cPct = (completion / total) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden flex">
        <div className="bg-blue-500 h-full" style={{ width: `${pPct}%` }} />
        <div className="bg-emerald-500 h-full" style={{ width: `${cPct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{formatNumber(total)}</span>
    </div>
  );
};

const ChatUsagePanel = ({ visible, onClose, sessionUsage = [] }) => {
  const { t } = useTranslation();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState({
    overview: true,
    session: true,
    daily: false,
    hourly: false,
    history: false,
    context: false,
  });
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chat/usage');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsage(await res.json());
    } catch (e) {
      console.error('Failed to fetch usage:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) fetchUsage();
  }, [visible, fetchUsage]);

  const clearHistory = async () => {
    if (!window.confirm(t('chatUsage.confirmClear', 'Clear all AI usage history?'))) return;
    setClearing(true);
    try {
      await fetch('/api/chat/usage', { method: 'DELETE' });
      await fetchUsage();
    } finally {
      setClearing(false);
    }
  };

  const toggleSection = (key) => setSections(s => ({ ...s, [key]: !s[key] }));

  if (!visible) return null;

  const s = usage?.summary || {};
  const sessionTokens = sessionUsage.reduce((a, u) => a + (u.total_tokens || 0), 0);
  const sessionCost = sessionUsage.reduce((a, u) => a + (u.estimated_cost || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-100">
              {t('chatUsage.title', 'AI Usage Tracking')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsage}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={clearHistory}
              disabled={clearing}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-400">
              <p className="text-sm mb-2">Failed to load usage data: {error}</p>
              <button onClick={fetchUsage} className="text-xs text-blue-400 hover:text-blue-300 underline">Retry</button>
            </div>
          ) : loading && !usage ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <>
              <div>
                <SectionHeader icon={Activity} title={t('chatUsage.allTime', 'All-Time Overview')} expanded={sections.overview} onToggle={() => toggleSection('overview')} />
                {sections.overview && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    <StatCard icon={MessageSquare} label={t('chatUsage.totalRequests', 'Requests')} value={formatNumber(s.total_requests)} color="blue" />
                    <StatCard icon={Hash} label={t('chatUsage.totalTokens', 'Total Tokens')} value={formatNumber(s.total_tokens)} sub={`${formatNumber(s.total_prompt_tokens)} in / ${formatNumber(s.total_completion_tokens)} out`} color="purple" />
                    <StatCard icon={DollarSign} label={t('chatUsage.estCost', 'Est. Cost')} value={formatCost(s.total_estimated_cost)} color="green" />
                    <StatCard icon={Timer} label={t('chatUsage.avgDuration', 'Avg Duration')} value={formatDuration(s.avg_duration_ms)} color="amber" />
                    <StatCard icon={Zap} label={t('chatUsage.avgTokens', 'Avg Tokens/Req')} value={formatNumber(s.avg_tokens_per_request)} color="cyan" />
                    <StatCard icon={FileText} label={t('chatUsage.totalChars', 'Response Chars')} value={formatNumber(s.total_response_chars)} color="rose" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{t('chatUsage.today', 'Today')}</p>
                  <p className="text-sm font-medium text-gray-200">{formatNumber(usage?.today?.requests)} requests</p>
                  <p className="text-xs text-gray-400">{formatNumber(usage?.today?.tokens)} tokens &middot; {formatCost(usage?.today?.cost)}</p>
                </div>
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{t('chatUsage.thisMonth', 'This Month')}</p>
                  <p className="text-sm font-medium text-gray-200">{formatNumber(usage?.thisMonth?.requests)} requests</p>
                  <p className="text-xs text-gray-400">{formatNumber(usage?.thisMonth?.tokens)} tokens &middot; {formatCost(usage?.thisMonth?.cost)}</p>
                </div>
              </div>

              {sessionUsage.length > 0 && (
                <div>
                  <SectionHeader icon={Zap} title={t('chatUsage.currentSession', 'Current Session')} expanded={sections.session} onToggle={() => toggleSection('session')} />
                  {sections.session && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{sessionUsage.length} messages</span>
                        <span className="text-gray-300">{formatNumber(sessionTokens)} tokens &middot; {formatCost(sessionCost)}</span>
                      </div>
                      <div className="space-y-1.5">
                        {sessionUsage.map((u, i) => (
                          <div key={i} className="bg-gray-800/40 rounded-lg px-3 py-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Message {i + 1}</span>
                              <span className="text-gray-500">{formatDuration(u.duration_ms)}</span>
                            </div>
                            <TokenBar prompt={u.prompt_tokens} completion={u.completion_tokens} total={u.total_tokens} />
                            <div className="flex gap-3 mt-1 text-gray-500">
                              <span><span className="text-blue-400">{formatNumber(u.prompt_tokens)}</span> in</span>
                              <span><span className="text-emerald-400">{formatNumber(u.completion_tokens)}</span> out</span>
                              <span>{formatCost(u.estimated_cost)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <SectionHeader icon={TrendingUp} title={t('chatUsage.dailyBreakdown', 'Daily Breakdown')} expanded={sections.daily} onToggle={() => toggleSection('daily')} />
                {sections.daily && (
                  <div className="mt-2 space-y-1">
                    {(usage?.daily || []).length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No data yet</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-5 text-xs text-gray-500 px-2 pb-1 border-b border-gray-800">
                          <span>Date</span><span className="text-right">Requests</span><span className="text-right">Tokens</span><span className="text-right">Avg Time</span><span className="text-right">Cost</span>
                        </div>
                        {(usage?.daily || []).map((d, i) => (
                          <div key={i} className="grid grid-cols-5 text-xs px-2 py-1.5 hover:bg-gray-800/30 rounded">
                            <span className="text-gray-300">{d.day}</span>
                            <span className="text-right text-gray-400">{d.requests}</span>
                            <span className="text-right text-gray-400">{formatNumber(d.tokens)}</span>
                            <span className="text-right text-gray-500">{formatDuration(d.avg_duration)}</span>
                            <span className="text-right text-gray-500">{formatCost(d.cost)}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <SectionHeader icon={Clock} title={t('chatUsage.peakHours', 'Usage by Hour')} expanded={sections.hourly} onToggle={() => toggleSection('hourly')} />
                {sections.hourly && (
                  <div className="mt-2">
                    {(usage?.hourly || []).length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No data yet</p>
                    ) : (
                      <div className="grid grid-cols-6 gap-1.5">
                        {Array.from({ length: 24 }, (_, h) => {
                          const hourStr = String(h).padStart(2, '0');
                          const data = (usage?.hourly || []).find(x => x.hour === hourStr);
                          const maxReqs = Math.max(...(usage?.hourly || []).map(x => x.requests), 1);
                          const intensity = data ? data.requests / maxReqs : 0;
                          return (
                            <div
                              key={h}
                              className="rounded p-1.5 text-center text-xs border border-gray-700/30"
                              style={{ backgroundColor: intensity > 0 ? `rgba(59, 130, 246, ${0.1 + intensity * 0.5})` : 'transparent' }}
                              title={data ? `${data.requests} requests, ${formatNumber(data.tokens)} tokens` : 'No usage'}
                            >
                              <span className="text-gray-500">{hourStr}h</span>
                              {data && <p className="text-gray-300 font-medium">{data.requests}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <SectionHeader icon={Database} title={t('chatUsage.contextEnrichment', 'Context Enrichment')} expanded={sections.context} onToggle={() => toggleSection('context')} />
                {sections.context && (
                  <div className="mt-2 space-y-1">
                    {(usage?.contextStats || []).length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No enrichment data yet</p>
                    ) : (
                      (usage?.contextStats || []).map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 hover:bg-gray-800/30 rounded">
                          <span className="text-gray-300 font-mono">{c.context_queries}</span>
                          <span className="text-gray-500">{c.count} times</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <SectionHeader icon={MessageSquare} title={t('chatUsage.recentHistory', 'Recent Messages')} expanded={sections.history} onToggle={() => toggleSection('history')} />
                {sections.history && (
                  <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto">
                    {(usage?.recentSessions || []).length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No messages yet</p>
                    ) : (
                      (usage?.recentSessions || []).map((r, i) => (
                        <div key={i} className="bg-gray-800/30 rounded-lg px-3 py-2 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 truncate max-w-[60%]" title={r.user_message}>{r.user_message}</span>
                            <span className="text-gray-600">{formatDate(r.timestamp)}</span>
                          </div>
                          <div className="flex gap-3 text-gray-500">
                            <span>{r.model}</span>
                            <span>{formatNumber(r.total_tokens)} tokens</span>
                            <span>{formatDuration(r.duration_ms)}</span>
                            <span>{formatCost(r.estimated_cost)}</span>
                          </div>
                          <TokenBar prompt={r.prompt_tokens} completion={r.completion_tokens} total={r.total_tokens} />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {s.first_usage && (
                <div className="text-xs text-gray-600 text-center pt-2 border-t border-gray-800">
                  {t('chatUsage.trackingSince', 'Tracking since')} {formatDate(s.first_usage)}
                  {' '}&middot;{' '}{t('chatUsage.lastUsed', 'Last used')} {formatDate(s.last_usage)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatUsagePanel;
