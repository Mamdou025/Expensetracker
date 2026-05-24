import React from 'react';
import { ShieldCheck, BarChart3, Upload } from 'lucide-react';
import TransactionDashboard from './TransactionDashboard';
import AuthForm from './AuthForm';
import Logo from './ui/Logo';

const LandingPage = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-10 sm:px-10 sm:py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-3 mb-4">
              <Logo variant="full" size="md" />
              <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                finances personnelles, organisées
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-100 mb-3 tracking-tight">
              Suivez chaque dollar sur chaque compte.
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mb-6">
              Importez les relevés de n'importe quelle banque, catégorisez automatiquement vos transactions
              et visualisez exactement où passe votre argent. Créez un compte pour commencer avec vos propres données — ou faites défiler pour explorer la démo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Upload, title: 'Importer des relevés', body: 'Relevés PDF de CIBC, RBC, MBNA, Capital One, Neo et plus encore.' },
                { icon: BarChart3, title: 'Voir les tendances', body: 'Graphiques temporels, répartition par catégorie et assistant conversationnel.' },
                { icon: ShieldCheck, title: 'Vos données, votre compte', body: 'Chaque transaction est rattachée à votre compte personnel.' },
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
        <strong className="font-semibold">Mode aperçu</strong> — le tableau de bord ci-dessous présente des transactions d'exemple pour explorer l'interface.
        Connectez-vous ou créez un compte pour commencer à suivre vos propres données.
      </div>

      <TransactionDashboard demoMode={true} />
    </div>
  );
};

export default LandingPage;
