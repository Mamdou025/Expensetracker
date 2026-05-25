import React from 'react';
import { Brand, I } from '../ui/BrandIcon';
import TransactionDashboard from './TransactionDashboard';
import AuthForm from './AuthForm';
import Logo from './ui/Logo';

/* ---------- Tiny inline atoms ---------- */

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

const Eyebrow = ({ children }) => (
  <div className="inline-flex items-center gap-2 mb-3">
    <span className="inline-block w-1.5 h-1.5 rounded-full bg-lime-400" />
    <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">{children}</span>
  </div>
);

const Stars = ({ rating = 4.9, label }) => (
  <div className="inline-flex items-center gap-2 text-gray-400 text-xs">
    <span className="text-lime-400 tracking-widest">★★★★★</span>
    <span>{rating} — {label}</span>
  </div>
);

/* ---------- Lime-glow screenshot frame (Finns-style hero shot) ---------- */

const LimeFrame = ({ src, alt, label }) => (
  <div className="relative mx-auto w-full max-w-5xl">
    {/* Outer lime glow */}
    <div
      aria-hidden="true"
      className="absolute -inset-2 sm:-inset-3 rounded-3xl"
      style={{
        background: 'linear-gradient(135deg, #d9f99d 0%, #a3e635 50%, #84cc16 100%)',
        filter: 'blur(2px)',
        opacity: 0.95,
      }}
    />
    {/* Soft external halo */}
    <div
      aria-hidden="true"
      className="absolute -inset-10 rounded-[40px] pointer-events-none"
      style={{
        background: 'radial-gradient(closest-side, rgba(163,230,53,0.35), transparent 70%)',
        filter: 'blur(20px)',
      }}
    />
    <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-950 shadow-2xl">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-800 bg-gray-900">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
        <span className="ml-3 text-[10px] font-mono text-gray-500 truncate">{label}</span>
      </div>
      <img src={src} alt={alt} className="block w-full h-auto" />
    </div>
  </div>
);

const ScreenshotFrame = ({ src, alt, label, className = '' }) => (
  <div className={`rounded-xl border border-gray-800 bg-gray-950 overflow-hidden shadow-xl ${className}`}>
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-800 bg-gray-900">
      <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
      <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
      <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
      <span className="ml-3 text-[10px] font-mono text-gray-500 truncate">{label}</span>
    </div>
    <img src={src} alt={alt} loading="lazy" className="block w-full h-auto" />
  </div>
);

/* ---------- Section wrappers ---------- */

const Section = ({ id, children, className = '' }) => (
  <section id={id} className={`px-2 sm:px-4 ${className}`}>
    {children}
  </section>
);

const SectionHeading = ({ eyebrow, title, subtitle, align = 'center' }) => (
  <div className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''} mb-10`}>
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 className="text-3xl sm:text-4xl font-semibold text-gray-100 tracking-tight mb-3">{title}</h2>
    {subtitle && <p className="text-gray-400 text-base">{subtitle}</p>}
  </div>
);

/* ---------- Card components inspired by Finns trio ---------- */

const CardA_Currencies = () => (
  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6 flex flex-col">
    <div className="mb-4">
      <div className="text-base font-semibold text-gray-100">Catégorisation automatique</div>
      <div className="text-xs text-gray-400 mt-1">
        Des règles intelligentes appliquent vos catégories à chaque transaction.
      </div>
    </div>
    <div className="rounded-lg border border-gray-800 bg-gray-800/50 px-3 py-2 mb-2 flex items-center gap-2 text-xs text-gray-500">
      <Brand name={I.search} size={14} />
      Rechercher une catégorie…
    </div>
    <div className="space-y-1.5 text-xs">
      {[
        { e: '🛒', name: 'Épicerie', sub: 'Loblaws, Metro, IGA' },
        { e: '⛽', name: 'Transport', sub: 'Petro-Canada, STM' },
        { e: '🍽️', name: 'Restaurants', sub: 'Tim Hortons, A&W' },
        { e: '📺', name: 'Abonnements', sub: 'Bell, Netflix, Spotify' },
      ].map((c) => (
        <div key={c.name} className="flex items-center justify-between rounded-md border border-gray-800 bg-gray-800/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{c.e}</span>
            <span className="text-gray-200 font-medium">{c.name}</span>
          </div>
          <span className="text-gray-500 text-[11px] font-mono truncate max-w-[50%]">{c.sub}</span>
        </div>
      ))}
    </div>
  </div>
);

const CardB_Upload = () => (
  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6 flex flex-col">
    <div className="mb-4">
      <div className="text-base font-semibold text-gray-100">Glissez vos relevés</div>
      <div className="text-xs text-gray-400 mt-1">
        Les PDFs CIBC, RBC, MBNA, Capital One et Neo sont lus automatiquement.
      </div>
    </div>
    <div className="flex-1 rounded-xl border-2 border-dashed border-lime-400/60 bg-lime-400/5 p-6 flex flex-col items-center justify-center text-center">
      <Brand name={I.uploadCloud} size={36} className="mb-2" />
      <div className="text-sm font-medium text-gray-100">Déposez un PDF ici</div>
      <div className="text-[11px] text-gray-500 mt-1 font-mono">cibc_visa_mai_2026.pdf</div>
      <button
        type="button"
        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-lime-400 text-gray-950 px-3 py-1.5 text-xs font-semibold hover:bg-lime-300 transition-colors"
      >
        Parcourir
      </button>
    </div>
  </div>
);

const CardC_Workspace = () => (
  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6 flex flex-col">
    <div className="mb-4">
      <div className="text-base font-semibold text-gray-100">Plusieurs comptes, une vue</div>
      <div className="text-xs text-gray-400 mt-1">
        Suivez toutes vos cartes et comptes canadiens au même endroit.
      </div>
    </div>
    <button
      type="button"
      className="self-start inline-flex items-center gap-1.5 rounded-md bg-gray-100 text-gray-950 px-3 py-1.5 text-xs font-semibold mb-3"
    >
      Ajouter un compte
      <Brand name={I.plus} size={12} accent="#0a0a0a" />
    </button>
    <div className="space-y-1.5 text-xs">
      {[
        { name: 'CIBC Visa Infinite', sub: '•• 4521', active: true },
        { name: 'MBNA Mastercard', sub: '•• 7732', active: false },
        { name: 'Neo World Elite', sub: '•• 5948', active: false },
        { name: 'RBC Chèques', sub: '•• 0011', active: false },
      ].map((a) => (
        <div
          key={a.name}
          className={`flex items-center justify-between rounded-md border px-3 py-2 ${
            a.active ? 'border-lime-400/60 bg-lime-400/10' : 'border-gray-800 bg-gray-800/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Brand name={I.bank} size={14} />
            <span className="text-gray-200 font-medium">{a.name}</span>
          </div>
          <span className="text-gray-500 text-[11px] font-mono">{a.sub}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ---------- "Everything you need" 3 image-like cards ---------- */

const BigCard = ({ accent, eyebrow, value, title, body, children }) => (
  <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden flex flex-col">
    <div
      className="relative h-52 flex items-end p-5"
      style={{
        background: accent,
      }}
    >
      <div className="absolute inset-0 opacity-30" style={{
        background: 'radial-gradient(closest-side, rgba(255,255,255,0.4), transparent 70%)',
      }} />
      <div className="relative w-full">
        {eyebrow && (
          <div className="inline-flex items-center gap-1 mb-2 rounded-full bg-white/85 text-gray-900 text-[10px] font-semibold uppercase tracking-widest px-2 py-1">
            {eyebrow}
          </div>
        )}
        {value && (
          <div className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">{value}</div>
        )}
        {children}
      </div>
    </div>
    <div className="p-5">
      <div className="text-sm font-semibold text-gray-100 mb-1">{title}</div>
      <div className="text-xs text-gray-400 leading-relaxed">{body}</div>
    </div>
  </div>
);

/* ---------- Small feature tile (2x2 grid alongside the photo) ---------- */

const Tile = ({ icon, title, body }) => (
  <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-700 transition-colors">
    <Brand name={icon} size={22} className="mb-3" />
    <div className="text-sm font-semibold text-gray-100 mb-1">{title}</div>
    <div className="text-xs text-gray-400 leading-relaxed">{body}</div>
  </div>
);

/* ---------- Bank chip ---------- */

const BankChip = ({ name }) => (
  <div className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-800/50 px-3 py-2 text-xs text-gray-300">
    <Brand name={I.bank} size={14} />
    <span className="font-medium">{name}</span>
  </div>
);

/* =========================================================
   LANDING PAGE
   ========================================================= */

const LandingPage = () => {
  const banks = ['CIBC', 'RBC', 'MBNA', 'Capital One', 'Neo', 'Neo World Elite', 'Triangle'];

  return (
    <div className="space-y-16 sm:space-y-24 pb-8">
      {/* ============ HERO ============ */}
      <Section className="pt-6 sm:pt-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900 px-3 py-1.5 mb-6 text-xs text-gray-300">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-lime-400" />
          Annonce — connexion bancaire via Plaid en route
          <Brand name={I.arrowRight} size={12} />
        </div>

        <h1 className="text-4xl sm:text-6xl font-semibold text-gray-100 tracking-tight leading-[1.05] max-w-3xl mx-auto">
          Reprenez le contrôle de vos finances canadiennes.
        </h1>
        <p className="text-gray-400 text-base sm:text-lg mt-5 max-w-xl mx-auto">
          La plateforme tout-en-un qui lit vos relevés PDF, vos courriels bancaires et bientôt vos
          comptes en direct — pour les particuliers et petites équipes au Canada.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <a
            href="#cta"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-white text-gray-950 font-semibold px-5 py-2.5 text-sm transition-colors"
          >
            Commencer gratuitement
            <Brand name={I.arrowRight} size={14} accent="#0a0a0a" />
          </a>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-lg text-gray-200 hover:text-gray-100 font-medium px-3 py-2.5 text-sm"
          >
            <Brand name={I.play} size={16} />
            Voir exptrackr en action
          </a>
        </div>

        <div className="mt-5">
          <Stars rating="4.9/5" label="par les utilisateurs en bêta privée" />
        </div>

        {/* Hero screenshot in lime frame */}
        <div className="mt-12 sm:mt-16 px-2 sm:px-4">
          <LimeFrame
            src="/landing/dashboard.jpg"
            alt="Tableau de bord exptrackr — vue d'ensemble des dépenses"
            label="exptrackr / tableau de bord"
          />
        </div>
      </Section>

      {/* ============ TRUST STRIP ============ */}
      <Section>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-5">
            Banques canadiennes prises en charge
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {banks.map((b) => (
              <BankChip key={b} name={b} />
            ))}
            <span className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-700 bg-gray-800/30 px-3 py-2 text-xs text-gray-500">
              <Brand name={I.plus} size={14} /> Demandez la vôtre
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-gray-500">
            <CanadianFlag /> formats français et anglais reconnus
          </div>
        </div>
      </Section>

      {/* ============ "VOS FINANCES TRAVAILLENT AUTANT QUE VOUS" (3 cards) ============ */}
      <Section>
        <div className="text-center mb-10">
          <Eyebrow>Pourquoi exptrackr</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-100 tracking-tight max-w-2xl mx-auto">
            Vos finances travaillent autant que vous.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardA_Currencies />
          <CardB_Upload />
          <CardC_Workspace />
        </div>
      </Section>

      {/* ============ WIDE PRODUCT SHOT — PDF import + insight cards ============ */}
      <Section>
        <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 sm:p-10">
          <div className="max-w-2xl">
            <Eyebrow>Import en temps réel</Eyebrow>
            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-100 tracking-tight mb-2">
              Vos transactions, prêtes en quelques secondes.
            </h3>
            <p className="text-gray-400 text-sm sm:text-base">
              Glissez vos relevés mensuels — exptrackr détecte la banque, extrait chaque ligne, signale
              les doublons et applique vos règles de catégorisation. Aucun fichier n'est conservé.
            </p>
          </div>
          <div className="mt-8">
            <ScreenshotFrame
              src="/landing/pdf-import.jpg"
              alt="Page d'import PDF d'exptrackr"
              label="exptrackr / import pdf"
            />
          </div>
        </div>
      </Section>

      {/* ============ "TOUT CE QU'IL VOUS FAUT, RIEN DE PLUS" (3 big image cards) ============ */}
      <Section>
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-100 tracking-tight max-w-2xl mx-auto">
            Tout ce qu'il vous faut, rien de plus.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <BigCard
            accent="linear-gradient(135deg, #d9f99d, #a3e635)"
            eyebrow="Multi-banques"
            value="7+"
            title="Banques canadiennes"
            body="Analyseurs sur mesure pour CIBC, RBC, MBNA, Capital One, Neo et plus — en français comme en anglais."
          />
          <BigCard
            accent="linear-gradient(135deg, #fde68a, #f59e0b)"
            eyebrow="Anti-doublons"
            value="100%"
            title="Aucune transaction en double"
            body="Empreinte SHA-256 par document et vérification ligne par ligne avant l'insertion en base."
          />
          <BigCard
            accent="linear-gradient(135deg, #c7d2fe, #818cf8)"
            eyebrow="Assistant IA"
            value="24/7"
            title="Réponses instantanées"
            body="Posez vos questions en langage naturel et obtenez des réponses tirées de vos vraies transactions."
          />
        </div>
      </Section>

      {/* ============ 2x2 TILES + CHAT SCREENSHOT ============ */}
      <Section>
        <div className="text-center mb-10">
          <Eyebrow>Conçu pour vous</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-100 tracking-tight max-w-2xl mx-auto">
            Une plateforme qui s'adapte à votre quotidien.
          </h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-5 items-stretch">
          <div className="grid sm:grid-cols-2 gap-5">
            <Tile
              icon={I.shieldCheck}
              title="Données privées"
              body="Vos transactions sont rattachées à votre compte — aucun partage avec des tiers."
            />
            <Tile
              icon={I.mail}
              title="Lecture des courriels"
              body="Branchez Gmail par IMAP : les notifications de votre banque deviennent des transactions."
            />
            <Tile
              icon={I.tag}
              title="Étiquettes flexibles"
              body="Catégorisez par carte, projet, personne ou voyage avec vos propres étiquettes."
            />
            <Tile
              icon={I.sun}
              title="Clair ou sombre"
              body="Une interface entièrement thématisée, basculement instantané dans l'en-tête."
            />
          </div>
          <ScreenshotFrame
            src="/landing/chat.jpg"
            alt="Assistant financier exptrackr"
            label="exptrackr / assistant"
            className="lg:self-stretch"
          />
        </div>
      </Section>

      {/* ============ TESTIMONIAL ============ */}
      <Section>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl sm:text-2xl text-gray-100 font-medium leading-snug">
            « En un après-midi j'ai importé deux ans de relevés CIBC et MBNA. Pour la première fois, je
            sais vraiment où passe mon argent — sans abonnement de 15 $ par mois. »
          </p>
          <div className="mt-5 inline-flex items-center gap-3 text-sm text-gray-400">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lime-300 to-lime-500 flex items-center justify-center text-gray-900 font-semibold">
              MJ
            </div>
            <div className="text-left">
              <div className="text-gray-100 font-semibold">Marc J.</div>
              <div className="text-xs">Bêta-testeur · Montréal</div>
            </div>
          </div>
        </div>
      </Section>

      {/* ============ PLAID COMING SOON ============ */}
      <Section>
        <div className="rounded-3xl border border-lime-400/30 bg-gray-900 px-6 py-10 sm:px-10 sm:py-12 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(500px circle at 0% 50%, rgba(163,230,53,0.18), transparent 60%)',
            }}
          />
          <div className="relative grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <Eyebrow>Bientôt — couverture nationale</Eyebrow>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-100 tracking-tight mb-3">
                Connexion bancaire directe avec <span className="text-lime-400">Plaid</span>.
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mb-5">
                Bientôt, fini les imports manuels : connectez en quelques clics vos comptes CIBC, RBC,
                TD, BMO, Scotiabank, Desjardins, Tangerine, Simplii, EQ Bank, National Bank et plus.
                Vos transactions arrivent automatiquement.
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
              <div className="relative w-44 h-44 rounded-full border-2 border-lime-400/40 flex items-center justify-center bg-gray-900">
                <div className="absolute inset-2 rounded-full border border-lime-400/30 animate-pulse" />
                <Brand name={I.bank} size={72} />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ============ BIG CTA (Finns black box) + AuthForm ============ */}
      <Section id="cta">
        <div className="grid lg:grid-cols-5 gap-5 items-stretch">
          {/* CTA card */}
          <div className="lg:col-span-3 rounded-3xl bg-gray-100 text-gray-900 px-8 py-12 sm:px-12 sm:py-16 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full"
              style={{ background: 'radial-gradient(closest-side, rgba(163,230,53,0.5), transparent 70%)' }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-widest text-gray-600">
                <CanadianFlag /> conçu au canada
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
                Commencez à reprendre le contrôle dès aujourd'hui.
              </h2>
              <p className="text-gray-700 text-sm sm:text-base max-w-md mx-auto mb-6">
                Créez votre compte en moins d'une minute. Aucune carte de crédit requise.
              </p>
              <a
                href="#auth-form"
                style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}
                className="inline-flex items-center gap-2 rounded-lg hover:opacity-90 font-semibold px-5 py-3 text-sm transition-opacity"
              >
                Essayer — c'est gratuit
                <Brand name={I.arrowRight} size={14} accent="#a3e635" />
              </a>
            </div>
          </div>
          {/* Auth form */}
          <div id="auth-form" className="lg:col-span-2 flex">
            <div className="w-full">
              <AuthForm initialMode="register" />
            </div>
          </div>
        </div>
      </Section>

      {/* ============ DEMO BANNER + DEMO DASHBOARD ============ */}
      <div id="demo" className="space-y-4 px-2 sm:px-4">
        <div className="rounded-lg border border-lime-400/40 bg-lime-400/10 text-gray-200 text-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2">
            <Brand name={I.info} size={18} accent="#a3e635" />
            <div>
              <strong className="font-semibold text-gray-100">Mode aperçu</strong>
              <span className="text-gray-400"> — le tableau de bord ci-dessous présente des transactions d'exemple pour explorer l'interface.</span>
            </div>
          </div>
          <span className="text-[11px] text-gray-500 font-mono uppercase tracking-widest whitespace-nowrap">
            données fictives · sécurisé
          </span>
        </div>

        <TransactionDashboard demoMode={true} />
      </div>

      {/* ============ FOOTER STRIP ============ */}
      <Section>
        <div className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <Logo variant="full" size="sm" />
            <span>© {new Date().getFullYear()} exptrackr — fait au Canada</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#demo" className="hover:text-gray-300">Démo</a>
            <a href="#cta" className="hover:text-gray-300">Commencer</a>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default LandingPage;
