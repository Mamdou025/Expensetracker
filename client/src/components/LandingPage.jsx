import React from 'react';
import { Brand, I } from '../ui/BrandIcon';
import TransactionDashboard from './TransactionDashboard';
import AuthForm from './AuthForm';
import Logo from './ui/Logo';

const CanadianFlag = ({ className = '' }) => (
  <span
    aria-label="Canada"
    role="img"
    className={`inline-flex items-center justify-center rounded-sm overflow-hidden ${className}`}
    style={{ width: 18, height: 12 }}
  >
    <span style={{ background: '#FF0000', width: 5, height: 12 }} />
    <span style={{ background: '#ffffff', width: 8, height: 12, position: 'relative' }}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FF0000',
          fontSize: 9,
          lineHeight: 1,
        }}
      >
        🍁
      </span>
    </span>
    <span style={{ background: '#FF0000', width: 5, height: 12 }} />
  </span>
);

const Section = ({ id, eyebrow, title, subtitle, children, className = '' }) => (
  <section id={id} className={`rounded-2xl border border-gray-800 bg-gray-900 px-6 py-10 sm:px-10 sm:py-12 ${className}`}>
    {(eyebrow || title || subtitle) && (
      <div className="max-w-3xl mb-8">
        {eyebrow && (
          <div className="text-xs text-emerald-400 font-mono uppercase tracking-widest mb-2">{eyebrow}</div>
        )}
        {title && (
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-100 tracking-tight mb-2">{title}</h2>
        )}
        {subtitle && <p className="text-gray-400 text-sm sm:text-base">{subtitle}</p>}
      </div>
    )}
    {children}
  </section>
);

const FeatureCard = ({ icon, title, body, badge }) => (
  <div className="rounded-xl border border-gray-800 bg-gray-800/40 p-5 hover:border-gray-700 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-900 border border-gray-800">
        <Brand name={icon} size={20} />
      </div>
      {badge && (
        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 border border-emerald-400/40 rounded px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </div>
    <div className="text-sm font-semibold text-gray-100 mb-1">{title}</div>
    <div className="text-xs text-gray-400 leading-relaxed">{body}</div>
  </div>
);

const StepCard = ({ n, icon, title, body }) => (
  <div className="rounded-xl border border-gray-800 bg-gray-800/40 p-5 relative">
    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-500 text-gray-950 text-sm font-bold flex items-center justify-center border-2 border-gray-900">
      {n}
    </div>
    <Brand name={icon} size={22} className="mb-3" />
    <div className="text-sm font-semibold text-gray-100 mb-1">{title}</div>
    <div className="text-xs text-gray-400 leading-relaxed">{body}</div>
  </div>
);

const BankChip = ({ name }) => (
  <div className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-800/50 px-3 py-2 text-xs text-gray-300">
    <Brand name={I.bank} size={14} />
    <span className="font-medium">{name}</span>
  </div>
);

/* ----- Decorative mock dashboard preview (pure SVG/divs, theme-aware) ----- */
const MockDashboardPreview = () => (
  <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden shadow-2xl">
    {/* Window chrome */}
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-800 bg-gray-900">
      <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
      <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
      <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
      <span className="ml-3 text-[10px] font-mono text-gray-500">exptrackr / tableau de bord</span>
    </div>

    {/* Stat row */}
    <div className="grid grid-cols-3 gap-2 p-3">
      {[
        { label: 'Dépenses', value: '4 218 $', tone: 'text-gray-100' },
        { label: 'Revenus', value: '+ 5 600 $', tone: 'text-emerald-400' },
        { label: 'Net', value: '+ 1 382 $', tone: 'text-gray-100' },
      ].map((s) => (
        <div key={s.label} className="rounded-lg border border-gray-800 bg-gray-900 p-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-500">{s.label}</div>
          <div className={`text-lg font-semibold ${s.tone}`}>{s.value}</div>
        </div>
      ))}
    </div>

    {/* Chart area */}
    <div className="px-3 pb-3">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-400">Dépenses par mois</div>
          <div className="text-[10px] font-mono text-gray-600">6 derniers mois</div>
        </div>
        <svg viewBox="0 0 300 100" className="w-full h-24">
          <defs>
            <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            points="0,70 50,55 100,62 150,40 200,48 250,28 300,35"
          />
          <polygon
            fill="url(#lpGrad)"
            points="0,70 50,55 100,62 150,40 200,48 250,28 300,35 300,100 0,100"
          />
        </svg>
      </div>
    </div>

    {/* Transaction rows */}
    <div className="px-3 pb-3 space-y-1.5">
      {[
        { date: '24 mai', name: 'Loblaws', cat: 'Épicerie', amt: '- 87,42 $' },
        { date: '23 mai', name: 'Petro-Canada', cat: 'Transport', amt: '- 52,10 $' },
        { date: '22 mai', name: 'Dépôt salaire', cat: 'Revenu', amt: '+ 2 800,00 $', pos: true },
        { date: '21 mai', name: 'Tim Hortons', cat: 'Restaurants', amt: '- 6,75 $' },
      ].map((t, i) => (
        <div key={i} className="flex items-center justify-between rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-mono w-12">{t.date}</span>
            <span className="text-gray-200 font-medium">{t.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-gray-800 rounded px-1.5 py-0.5">{t.cat}</span>
          </div>
          <span className={`font-mono ${t.pos ? 'text-emerald-400' : 'text-gray-300'}`}>{t.amt}</span>
        </div>
      ))}
    </div>
  </div>
);

const MockChatPreview = () => (
  <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden shadow-2xl">
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900">
      <Brand name={I.message} size={14} />
      <span className="text-[10px] font-mono text-gray-500">assistant exptrackr</span>
    </div>
    <div className="p-3 space-y-2 text-xs">
      <div className="inline-block max-w-[85%] rounded-lg bg-gray-800 text-gray-200 px-3 py-2">
        Combien j'ai dépensé en restaurants ce mois-ci ?
      </div>
      <div className="ml-auto inline-block max-w-[90%] rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-gray-100 px-3 py-2">
        En mai 2026, vous avez dépensé <strong className="text-emerald-400">312,48 $</strong> en
        restaurants sur 14 transactions — soit 18 % de plus qu'en avril.
        <div className="mt-1 text-[10px] text-gray-500 font-mono">CIBC Visa · MBNA Mastercard</div>
      </div>
      <div className="inline-block max-w-[85%] rounded-lg bg-gray-800 text-gray-200 px-3 py-2">
        Et mon top 3 marchands ?
      </div>
    </div>
  </div>
);

const MockImportPreview = () => (
  <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden shadow-2xl">
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900">
      <Brand name={I.pdf} size={14} />
      <span className="text-[10px] font-mono text-gray-500">import pdf · cibc_visa_mai_2026.pdf</span>
    </div>
    <div className="p-4 space-y-3">
      <div className="rounded-lg border-2 border-dashed border-gray-800 bg-gray-900 p-4 text-center">
        <Brand name={I.uploadCloud} size={28} className="mx-auto mb-2" />
        <div className="text-xs text-gray-400">Glissez votre relevé PDF</div>
        <div className="text-[10px] text-gray-600 mt-1">CIBC · RBC · MBNA · Capital One · Neo</div>
      </div>
      <div className="space-y-1.5">
        {[
          { d: '02/05', m: 'Metro', a: '64,12 $', ok: true },
          { d: '04/05', m: 'STM', a: '94,00 $', ok: true },
          { d: '07/05', m: 'Amazon.ca', a: '129,99 $', dup: true },
          { d: '11/05', m: 'Hydro-Québec', a: '142,30 $', ok: true },
        ].map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-md bg-gray-900 border border-gray-800 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked={r.ok} readOnly className="accent-emerald-500" />
              <span className="text-gray-500 font-mono">{r.d}</span>
              <span className="text-gray-200">{r.m}</span>
              {r.dup && (
                <span className="text-[10px] text-yellow-400 border border-yellow-400/40 rounded px-1">
                  Doublon
                </span>
              )}
            </div>
            <span className="font-mono text-gray-300">{r.a}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const banks = [
    'CIBC Chèques',
    'CIBC Visa',
    'RBC Visa',
    'MBNA Mastercard',
    'Capital One',
    'Neo Financial',
    'Neo World Elite',
  ];

  return (
    <div className="space-y-8">
      {/* ============ HERO ============ */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-10 sm:px-10 sm:py-14 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(600px circle at 85% 0%, rgba(16,185,129,0.15), transparent 60%), radial-gradient(400px circle at 10% 100%, rgba(16,185,129,0.10), transparent 60%)',
          }}
        />
        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-3 mb-4">
              <Logo variant="full" size="md" />
              <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-400 font-mono uppercase tracking-widest border border-gray-800 rounded-full px-2 py-1">
                <CanadianFlag /> conçu pour le Canada
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold text-gray-100 mb-4 tracking-tight leading-tight">
              Toutes vos cartes canadiennes,{' '}
              <span className="text-emerald-400">un seul tableau de bord.</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mb-6 leading-relaxed">
              Importez les relevés PDF de CIBC, RBC, MBNA, Capital One et Neo, lisez les courriels de
              transactions de votre banque, et laissez exptrackr catégoriser, étiqueter et visualiser
              chaque dollar — en français comme en anglais.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-4 py-2.5 text-sm transition-colors"
              >
                <Brand name={I.play} size={16} accent="#0a0a0a" />
                Essayer la démo
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-200 font-medium px-4 py-2.5 text-sm transition-colors"
              >
                Voir les fonctionnalités
                <Brand name={I.arrowRight} size={14} />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[
                { k: '7+', v: 'banques canadiennes' },
                { k: 'FR/EN', v: 'relevés bilingues' },
                { k: '0 $', v: 'pour commencer' },
              ].map((s) => (
                <div key={s.v} className="text-left">
                  <div className="text-xl font-semibold text-emerald-400">{s.k}</div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <AuthForm initialMode="register" />
          </div>
        </div>
      </section>

      {/* ============ SUPPORTED BANKS ============ */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-8 sm:px-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <div className="text-xs text-emerald-400 font-mono uppercase tracking-widest mb-1">
              Banques prises en charge
            </div>
            <div className="text-lg font-semibold text-gray-100">
              Des analyseurs taillés sur mesure pour les relevés canadiens
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-gray-400">
            <CanadianFlag /> Formats FR & EN reconnus automatiquement
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {banks.map((b) => (
            <BankChip key={b} name={b} />
          ))}
          <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-700 bg-gray-800/30 px-3 py-2 text-xs text-gray-500">
            <Brand name={I.plus} size={14} /> Demandez votre banque
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <Section
        id="features"
        eyebrow="Fonctionnalités"
        title="Tout ce qu'il faut pour reprendre le contrôle"
        subtitle="exptrackr combine ingestion automatique, catégorisation intelligente et visualisations claires — sans jamais quitter votre tableau de bord."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={I.pdf}
            title="Import PDF de relevés"
            body="Glissez le PDF de votre relevé : exptrackr détecte la banque, extrait chaque transaction, gère les conversions de devises et signale les doublons."
          />
          <FeatureCard
            icon={I.mail}
            title="Lecture des courriels"
            body="Connectez Gmail en IMAP : les courriels de transactions de votre banque sont parsés en arrière-plan et ajoutés à votre fil."
          />
          <FeatureCard
            icon={I.bank}
            title="Connexion bancaire via Plaid"
            badge="Bientôt"
            body="Bientôt : liez directement vos comptes CIBC, RBC, TD, BMO, Scotiabank et plus via Plaid pour une synchronisation en temps réel."
          />
          <FeatureCard
            icon={I.wand}
            title="Catégorisation automatique"
            body="Des règles par mot-clé apprennent vos habitudes et appliquent catégories et étiquettes à chaque nouvelle transaction."
          />
          <FeatureCard
            icon={I.chart}
            title="Graphiques et tendances"
            body="Tableau de bord avec dépenses par mois, répartition par catégorie, comparaisons et statistiques de net."
          />
          <FeatureCard
            icon={I.message}
            title="Assistant conversationnel IA"
            body="Posez des questions en langage naturel : « combien j'ai dépensé en épicerie ce mois-ci ? » — l'assistant interroge vos données réelles."
          />
          <FeatureCard
            icon={I.shieldCheck}
            title="Détection des doublons"
            body="Empreinte SHA-256 par document et vérification ligne par ligne : impossible d'importer deux fois la même transaction."
          />
          <FeatureCard
            icon={I.tag}
            title="Étiquettes et catégories"
            body="Créez vos propres catégories et étiquettes, organisez par cartes, projets ou personnes — tout est éditable en un clic."
          />
          <FeatureCard
            icon={I.sun}
            title="Mode clair et sombre"
            body="Interface entièrement adaptée au mode clair et au mode sombre, avec basculement instantané depuis l'en-tête."
          />
        </div>
      </Section>

      {/* ============ SCREENSHOTS / PRODUCT SHOT ============ */}
      <Section
        id="screens"
        eyebrow="Aperçu produit"
        title="Une interface pensée pour vos finances"
        subtitle="Trois écrans clés : le tableau de bord, l'import PDF, et l'assistant conversationnel."
      >
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="space-y-3">
            <MockDashboardPreview />
            <div className="text-xs text-gray-400 px-1">
              <span className="text-gray-100 font-semibold">Tableau de bord.</span> Statistiques,
              graphiques temporels et fil de transactions sur la même page.
            </div>
          </div>
          <div className="space-y-3">
            <MockImportPreview />
            <div className="text-xs text-gray-400 px-1">
              <span className="text-gray-100 font-semibold">Import PDF.</span> Aperçu avant insertion,
              doublons détectés, sélection ligne par ligne.
            </div>
          </div>
          <div className="space-y-3">
            <MockChatPreview />
            <div className="text-xs text-gray-400 px-1">
              <span className="text-gray-100 font-semibold">Assistant.</span> Posez vos questions, obtenez
              des réponses chiffrées à partir de vos vraies transactions.
            </div>
          </div>
        </div>
      </Section>

      {/* ============ HOW IT WORKS ============ */}
      <Section
        id="how"
        eyebrow="Comment ça marche"
        title="En route en moins de 5 minutes"
        subtitle="Trois étapes simples : importez, laissez exptrackr classifier, et explorez."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StepCard
            n="1"
            icon={I.userPlus}
            title="Créez votre compte"
            body="Inscription par courriel en quelques secondes. Vos données sont rattachées à votre compte personnel."
          />
          <StepCard
            n="2"
            icon={I.uploadCloud}
            title="Importez vos relevés"
            body="Glissez un PDF de CIBC, RBC, MBNA, Capital One ou Neo — ou connectez votre Gmail pour les courriels de transactions."
          />
          <StepCard
            n="3"
            icon={I.wand}
            title="Laissez la catégorisation faire son travail"
            body="Les règles intelligentes étiquettent et catégorisent. Ajustez en un clic — exptrackr apprend de vos corrections."
          />
          <StepCard
            n="4"
            icon={I.chart}
            title="Explorez vos tendances"
            body="Visualisez par mois, par catégorie, par marchand. Posez vos questions à l'assistant pour des réponses instantanées."
          />
        </div>
      </Section>

      {/* ============ PLAID COMING SOON ============ */}
      <section className="rounded-2xl border border-emerald-500/30 bg-gray-900 px-6 py-10 sm:px-10 sm:py-12 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(500px circle at 0% 50%, rgba(16,185,129,0.10), transparent 60%)',
          }}
        />
        <div className="grid lg:grid-cols-3 gap-8 items-center relative">
          <div className="lg:col-span-2">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 border border-emerald-400/40 rounded px-2 py-0.5">
                Bientôt
              </span>
              <CanadianFlag />
              <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">
                couverture nationale
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-100 tracking-tight mb-3">
              Connexion bancaire directe via <span className="text-emerald-400">Plaid</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-5 leading-relaxed">
              Bientôt, fini les imports manuels : connectez en quelques clics vos comptes CIBC, RBC, TD,
              BMO, Scotiabank, Desjardins, Tangerine, Simplii, EQ Bank et plus encore. Vos transactions
              apparaissent automatiquement dans exptrackr, mises à jour chaque jour.
            </p>
            <div className="flex flex-wrap gap-2">
              {['CIBC', 'RBC', 'TD', 'BMO', 'Scotiabank', 'Desjardins', 'Tangerine', 'Simplii', 'EQ Bank', 'National Bank'].map(
                (b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800/60 px-3 py-1 text-xs text-gray-300"
                  >
                    <Brand name={I.bank} size={12} />
                    {b}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="w-44 h-44 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-gray-900 relative">
              <div className="absolute inset-2 rounded-full border border-emerald-500/20 animate-pulse" />
              <Brand name={I.bank} size={72} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRIVACY / TRUST ============ */}
      <Section
        eyebrow="Vos données"
        title="Vos finances vous appartiennent"
        subtitle="Aucun courtier, aucune revente. Chaque transaction est rattachée à votre compte et reste accessible à vous seul."
      >
        <div className="grid sm:grid-cols-3 gap-4">
          <FeatureCard
            icon={I.shield}
            title="Authentification sécurisée"
            body="Connexion par courriel et mot de passe ou via Replit. Sessions chiffrées, déconnexion en un clic."
          />
          <FeatureCard
            icon={I.lock}
            title="Stockage privé"
            body="Vos transactions sont stockées dans une base dédiée à votre compte. Aucun accès tiers."
          />
          <FeatureCard
            icon={I.database}
            title="Vous gardez le contrôle"
            body="Modifiez, supprimez ou exportez vos données quand vous voulez."
          />
        </div>
      </Section>

      {/* ============ DEMO BANNER ============ */}
      <div id="demo" className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 text-emerald-300 text-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2">
          <Brand name={I.info} size={18} accent="#10b981" />
          <div>
            <strong className="font-semibold text-emerald-400">Mode aperçu</strong>
            <span className="text-emerald-300"> — le tableau de bord ci-dessous présente des transactions d'exemple pour explorer l'interface.</span>
          </div>
        </div>
        <span className="text-xs text-emerald-400 font-mono uppercase tracking-widest whitespace-nowrap">
          données fictives · sécurisé
        </span>
      </div>

      <TransactionDashboard demoMode={true} />
    </div>
  );
};

export default LandingPage;
