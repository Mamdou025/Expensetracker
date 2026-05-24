import React from 'react';
import { Sparkles, ShieldCheck, BarChart3, Upload } from 'lucide-react';
import TransactionDashboard from './TransactionDashboard';
import AuthForm from './AuthForm';

const LandingPage = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-10 sm:px-10 sm:py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-xs font-medium border border-blue-800 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Personal finance, organized
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-100 mb-3 tracking-tight">
              Track every dollar across every account.
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mb-6">
              Import statements from any bank, auto-categorize transactions, and see exactly where your money goes.
              Create an account to start with your own data — or scroll down to explore the demo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Upload, title: 'Import statements', body: 'PDF statements from CIBC, RBC, MBNA, Capital One, Neo and more.' },
                { icon: BarChart3, title: 'See the trends', body: 'Time charts, category breakdowns, and a chat assistant.' },
                { icon: ShieldCheck, title: 'Your data, your account', body: 'Every transaction is scoped to your account.' },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-lg border border-gray-800 bg-gray-800/50 p-3">
                  <Icon className="w-4 h-4 text-blue-400 mb-1.5" />
                  <div className="text-xs font-semibold text-gray-200 mb-0.5">{title}</div>
                  <div className="text-xs text-gray-500 leading-snug">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <AuthForm initialMode="login" />
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-blue-800 bg-blue-900/20 text-blue-300 text-sm px-4 py-3">
        <strong className="font-semibold">Preview mode</strong> — the dashboard below shows sample transactions so you can explore the interface.
        Sign in or create an account to start tracking your own data.
      </div>

      <TransactionDashboard demoMode={true} />
    </div>
  );
};

export default LandingPage;
