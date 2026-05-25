import React from 'react';
import TransactionDashboard from './TransactionDashboard';
import AuthForm from './AuthForm';
import { Brand, I } from '../ui/BrandIcon';

/* ─────────────────────────────────────────────────────────────
   LIQUID GLASS HELPERS
   The "liquid glass" look needs three layers:
     1. bg: very translucent fill
     2. backdrop-filter: heavy blur + saturate
     3. box-shadow: inset top-highlight + outer glow + drop shadow
   None of this fits cleanly in Tailwind classes so we use inline styles.
   ───────────────────────────────────────────────────────────── */

const glass = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(36px) saturate(180%)',
  WebkitBackdropFilter: 'blur(36px) saturate(180%)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.25), 0 8px 40px rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.12)',
};

const glassDeep = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
};

/* Lime-mat hero frame — identical to Finns reference */
const LimeFrame = ({ src, alt }) => (
  <div className="relative mx-auto w-full max-w-5xl">
    <div
      aria-hidden="true"
      className="absolute -inset-8 rounded-[48px] pointer-events-none"
      style={{
        background: 'radial-gradient(closest-side, rgba(52,211,153,0.45), transparent 70%)',
        filter: 'blur(32px)',
      }}
    />
    <div
      className="relative rounded-3xl p-3 sm:p-5"
      style={{ backgroundColor: '#bbf7d0' }}
    >
      <img
        src={src}
        alt={alt}
        className="block w-full h-auto rounded-2xl shadow-2xl"
      />
    </div>
  </div>
);

/* Simple glass card */
const GlassCard = ({ icon, title, body, accent = false }) => (
  <div
    className="rounded-2xl p-6 flex flex-col gap-3"
    style={accent ? {
      ...glass,
      border: '1px solid rgba(52,211,153,0.35)',
      boxShadow: 'inset 0 1px 0 rgba(52,211,153,0.25), inset 0 -1px 0 rgba(0,0,0,0.2), 0 8px 40px rgba(0,0,0,0.3)',
    } : glass}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center"
      style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}
    >
      <Brand name={icon} size={22} />
    </div>
    <div className="text-sm font-semibold text-gray-100">{title}</div>
    <div className="text-xs text-gray-400 leading-relaxed">{body}</div>
  </div>
);

/* Ambient color blobs — gives the glass something real to refract */
const Ambient = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      className="absolute -top-24 -left-24 w-[65vw] h-[65vw] rounded-full"
      style={{
        background: 'radial-gradient(closest-side, rgba(52,211,153,0.55), transparent 70%)',
        filter: 'blur(40px)',
      }}
    />
    <div
      className="absolute top-[15%] -right-32 w-[60vw] h-[60vw] rounded-full"
      style={{
        background: 'radial-gradient(closest-side, rgba(132,204,22,0.45), transparent 70%)',
        filter: 'blur(55px)',
      }}
    />
    <div
      className="absolute top-[52%] -left-20 w-[55vw] h-[55vw] rounded-full"
      style={{
        background: 'radial-gradient(closest-side, rgba(16,185,129,0.50), transparent 70%)',
        filter: 'blur(45px)',
      }}
    />
    <div
      className="absolute bottom-[8%] right-[5%] w-[50vw] h-[50vw] rounded-full"
      style={{
        background: 'radial-gradient(closest-side, rgba(52,211,153,0.40), transparent 70%)',
        filter: 'blur(50px)',
      }}
    />
  </div>
);

/* ─────────────────────────────────────────────────────────────
   LANDING PAGE
   ───────────────────────────────────────────────────────────── */

const LandingPage = () => (
  <div className="relative min-h-screen pb-16">
    <Ambient />

    {/* ══════ HERO ══════ */}
    <section className="relative pt-10 sm:pt-16 px-4 max-w-6xl mx-auto">

      {/* Announcement chip */}
      <div
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs text-gray-200 cursor-default"
        style={glassDeep}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Plaid en route — connexion bancaire directe bientôt disponible
        <Brand name={I.arrowRight} size={12} />
      </div>

      {/* Headline + CTAs split */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
        <div className="max-w-3xl">
          <h1 className="text-5xl sm:text-7xl font-semibold text-white tracking-tight leading-[1.02]">
            Reprenez le contrôle<br />
            <span className="text-emerald-400">de vos finances</span><br />
            canadiennes.
          </h1>
          <p className="text-gray-400 text-lg mt-6 max-w-xl">
            Lisez vos relevés PDF, courriels bancaires et bientôt vos comptes en direct.
            CIBC, RBC, MBNA, Capital One, Neo et plus.
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm text-gray-400">
            <span className="text-emerald-400 tracking-widest">★★★★★</span>
            <span>4.9 / 5 — utilisateurs en bêta privée</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:items-end">
          <a
            href="#cta"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-gray-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-400/20"
          >
            Commencer gratuitement
            <Brand name={I.arrowRight} size={14} accent="#0a0a0a" />
          </a>
          <a
            href="#demo"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-gray-300"
            style={glassDeep}
          >
            <Brand name={I.play} size={15} />
            Voir la démo
          </a>
        </div>
      </div>

      {/* Hero screenshot in lime mat */}
      <LimeFrame
        src="/landing/dashboard.jpg"
        alt="Tableau de bord exptrackr"
      />
    </section>

    {/* ══════ BANKS STRIP ══════ */}
    <section className="relative mt-20 px-4 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-5">
        Relevés pris en charge
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {['CIBC', 'RBC', 'MBNA', 'Capital One', 'Neo', 'Neo World Elite', 'Triangle'].map(b => (
          <span
            key={b}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-gray-200 font-medium"
            style={glassDeep}
          >
            <Brand name={I.bank} size={13} />
            {b}
          </span>
        ))}
      </div>
    </section>

    {/* ══════ 3 GLASS CARDS ══════ */}
    <section className="relative mt-20 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Fonctionnalités</p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
          Vos finances, enfin claires.
        </h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <GlassCard
          accent
          icon={I.uploadCloud}
          title="Import PDF en secondes"
          body="Glissez votre relevé — exptrackr détecte la banque, extrait les transactions et signale les doublons automatiquement."
        />
        <GlassCard
          icon={I.tag}
          title="Catégorisation intelligente"
          body="Vos règles s'appliquent à chaque transaction : épicerie, transport, restaurants, abonnements — tout est trié."
        />
        <GlassCard
          icon={I.message}
          title="Assistant IA 24/7"
          body="Posez vos questions en langage naturel et obtenez des réponses tirées de vos vraies données financières."
        />
      </div>
    </section>

    {/* ══════ PDF SCREENSHOT ══════ */}
    <section className="relative mt-24 px-4 max-w-6xl mx-auto">
      <div
        className="rounded-3xl p-6 sm:p-10"
        style={glass}
      >
        <div className="mb-6 max-w-xl">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Import en temps réel</p>
          <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
            Vos relevés, prêts en quelques secondes.
          </h3>
          <p className="text-gray-400 text-sm">
            Formats CIBC Visa, RBC, MBNA, Capital One, Neo reconnus automatiquement —
            en français comme en anglais. Aucun fichier conservé sur nos serveurs.
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src="/landing/pdf-import.jpg"
            alt="Import PDF exptrackr"
            className="block w-full h-auto"
            loading="lazy"
          />
        </div>
      </div>
    </section>

    {/* ══════ QUOTE ══════ */}
    <section className="relative mt-24 px-4 max-w-3xl mx-auto text-center">
      <p className="text-2xl sm:text-3xl text-white font-medium leading-snug">
        « En un après-midi j'ai importé deux ans de relevés CIBC et MBNA.
        Pour la première fois, je sais vraiment où passe mon argent. »
      </p>
      <div className="mt-6 inline-flex items-center gap-3 text-sm text-gray-400">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400"
          style={glassDeep}
        >
          MJ
        </span>
        <span>Marc J. — Bêta-testeur, Montréal</span>
      </div>
    </section>

    {/* ══════ PLAID COMING SOON ══════ */}
    <section className="relative mt-24 px-4 max-w-6xl mx-auto">
      <div className="rounded-3xl px-6 py-10 sm:px-12 sm:py-14" style={{
        ...glass,
        border: '1px solid rgba(52,211,153,0.25)',
        boxShadow: 'inset 0 1px 0 rgba(52,211,153,0.18), inset 0 -1px 0 rgba(0,0,0,0.2), 0 8px 48px rgba(0,0,0,0.3)',
      }}>
        <div className="max-w-xl">
          <p className="text-xs text-emerald-400 uppercase tracking-widest font-semibold mb-3">Bientôt</p>
          <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">
            Connexion bancaire directe avec Plaid.
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Fini les imports manuels — connectez CIBC, RBC, TD, BMO, Scotiabank,
            Desjardins, Tangerine, Simplii et plus. Vos transactions arrivent automatiquement.
          </p>
          <div className="flex flex-wrap gap-2">
            {['TD', 'BMO', 'Scotiabank', 'Desjardins', 'Tangerine', 'Simplii', 'EQ Bank'].map(b => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] text-gray-300"
                style={glassDeep}
              >
                <Brand name={I.bank} size={11} />{b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ══════ CTA + AUTH ══════ */}
    <section id="cta" className="relative mt-24 px-4 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left — CTA card */}
        <div className="rounded-3xl px-8 py-12 flex flex-col justify-between" style={glass}>
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-4">
              Commencez à reprendre le contrôle.
            </h2>
            <p className="text-gray-400 text-sm">
              Créez votre compte en moins d'une minute. Aucune carte de crédit requise.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">✓</span>
              Données 100 % privées
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">✓</span>
              7 banques canadiennes prises en charge
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">✓</span>
              Aucun abonnement — open source
            </div>
          </div>
        </div>

        {/* Right — Auth form */}
        <div>
          <AuthForm initialMode="register" />
        </div>
      </div>
    </section>

    {/* ══════ DEMO ══════ */}
    <section id="demo" className="relative mt-24 px-4 max-w-6xl mx-auto space-y-4">
      <div
        className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
        style={glassDeep}
      >
        <div className="flex items-center gap-2 text-gray-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span><strong className="text-white">Mode aperçu</strong> — données fictives pour explorer l'interface.</span>
        </div>
        <span className="text-[11px] text-gray-500 font-mono uppercase tracking-widest">sécurisé · aucune donnée réelle</span>
      </div>
      <TransactionDashboard demoMode={true} />
    </section>

    {/* ══════ FOOTER ══════ */}
    <footer className="relative mt-16 px-4 max-w-6xl mx-auto">
      <div
        className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500"
        style={glassDeep}
      >
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">[xt]</span>
          <span>exptrackr — fait au Canada © {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#cta" className="hover:text-gray-300 transition-colors">Commencer</a>
          <a href="#demo" className="hover:text-gray-300 transition-colors">Démo</a>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;
