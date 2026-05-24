import React from 'react';
import { LogIn, Sparkles, ShieldCheck, BarChart3, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TransactionDashboard from './TransactionDashboard';

const LandingPage = () => {
  const { login } = useAuth();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-10 sm:px-10 sm:py-14">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-xs font-medium border border-blue-800 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Personal finance, organized
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-100 mb-3 tracking-tight">
            Track every dollar across every account.
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-6 max-w-2xl">
            Import statements from any bank, auto-categorize transactions, and see exactly where your money goes.
            Sign in to start with your own data — or scroll down to explore the demo.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={login}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in to get started
            </button>
            <span className="text-xs text-gray-500">Secure sign-in with your Replit / Google account</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          {[
            { icon: Upload, title: 'Import statements', body: 'Drop a PDF from CIBC, RBC, MBNA, Capital One, Neo and more.' },
            { icon: BarChart3, title: 'See the trends', body: 'Time charts, category breakdowns, and a chat assistant.' },
            { icon: ShieldCheck, title: 'Your data, your account', body: 'Every transaction is scoped to your signed-in account.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
              <Icon className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-sm font-semibold text-gray-200 mb-1">{title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{body}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-lg border border-blue-800 bg-blue-900/20 text-blue-300 text-sm px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <strong className="font-semibold">Preview mode</strong> — these are sample transactions so you can explore the interface.
          Sign in to replace them with your own real data.
        </div>
        <button
          onClick={login}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" />
          Sign in
        </button>
      </div>

      <TransactionDashboard demoMode={true} />
    </div>
  );
};

export default LandingPage;
