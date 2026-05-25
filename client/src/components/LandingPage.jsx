import React, { useRef } from 'react';
import TransactionDashboard from './TransactionDashboard';
import AuthForm from './AuthForm';
import { Brand, I } from '../ui/BrandIcon';
import LiquidGlass from '../lib/liquid-glass';

/* Lime-mat hero frame */
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

/* Feature card using real LiquidGlass */
const GlassCard = ({ icon, title, body, accent = false }) => (
  <LiquidGlass
    noFloat
    cornerRadius={20}
    padding="24px"
    displacementScale={80}
    blurAmount={0.3}
    saturation={160}
    aberrationIntensity={3}
    style={{
      display: 'block',
      width: '100%',
      height: '100%',
      ...(accent ? { outline: '1px solid rgba(52,211,153,0.3)' } : {}),
    }}
  >
    <div className="flex flex-col gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}
      >
        <Brand name={icon} size={22} />
      </div>
      <div className="text-sm font-semibold text-gray-100">{title}</div>
      <div className="text-xs text-gray-400 leading-relaxed">{body}</div>
    </div>
  </LiquidGlass>
);

/* Ambient color blobs */
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

const LandingPage = () => {
  const pageRef = useRef(null);

  return (
    <div ref={pageRef} className="relative min-h-screen pb-16">
      <Ambient />

      {/* ══════ HERO ══════ */}
      <section className="relative pt-10 sm:pt-16 px-4 max-w-6xl mx-auto">

        {/* Announcement chip */}
        <div className="mb-8">
          <LiquidGlass
            noFloat
            cornerRadius={999}
            padding="6px 16px"
            displacementScale={60}
            blurAmount={0.15}
            saturation={150}
            aberrationIntensity={2}
          >
            <div className="inline-flex items-center gap-2 text-xs text-gray-200 cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Plaid en route — connexion bancaire directe bientôt disponible
              <Brand name={I.arrowRight} size={12} />
            </div>
          </LiquidGlass>
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
            <LiquidGlass
              noFloat
              cornerRadius={12}
              padding="12px 24px"
              displacementScale={55}
              blurAmount={0.1}
              saturation={140}
              aberrationIntensity={2}
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-300">
                <Brand name={I.play} size={15} />
                Voir la démo
              </span>
            </LiquidGlass>
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
            <LiquidGlass
              key={b}
              noFloat
              cornerRadius={999}
              padding="8px 16px"
              displacementScale={55}
              blurAmount={0.1}
              saturation={140}
              aberrationIntensity={2}
            >
              <span className="inline-flex items-center gap-2 text-xs text-gray-200 font-medium">
                <Brand name={I.bank} size={13} />
                {b}
              </span>
            </LiquidGlass>
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
        <LiquidGlass
          noFloat
          cornerRadius={24}
          padding="40px"
          displacementScale={90}
          blurAmount={0.35}
          saturation={160}
          aberrationIntensity={3}
          style={{ display: 'block', width: '100%' }}
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
        </LiquidGlass>
      </section>

      {/* ══════ QUOTE ══════ */}
      <section className="relative mt-24 px-4 max-w-3xl mx-auto text-center">
        <p className="text-2xl sm:text-3xl text-white font-medium leading-snug">
          « En un après-midi j'ai importé deux ans de relevés CIBC et MBNA.
          Pour la première fois, je sais vraiment où passe mon argent. »
        </p>
        <div className="mt-6 inline-flex items-center gap-3 text-sm text-gray-400">
          <LiquidGlass
            noFloat
            cornerRadius={999}
            padding="10px 14px"
            displacementScale={50}
            blurAmount={0.1}
            saturation={140}
            aberrationIntensity={2}
          >
            <span className="text-xs font-bold text-emerald-400">MJ</span>
          </LiquidGlass>
          <span>Marc J. — Bêta-testeur, Montréal</span>
        </div>
      </section>

      {/* ══════ PLAID COMING SOON ══════ */}
      <section className="relative mt-24 px-4 max-w-6xl mx-auto">
        <LiquidGlass
          noFloat
          cornerRadius={24}
          padding="48px 48px"
          displacementScale={90}
          blurAmount={0.35}
          saturation={160}
          aberrationIntensity={3}
          style={{ display: 'block', width: '100%', outline: '1px solid rgba(52,211,153,0.2)' }}
        >
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
                <LiquidGlass
                  key={b}
                  noFloat
                  cornerRadius={999}
                  padding="4px 12px"
                  displacementScale={45}
                  blurAmount={0.08}
                  saturation={130}
                  aberrationIntensity={1.5}
                >
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-300">
                    <Brand name={I.bank} size={11} />{b}
                  </span>
                </LiquidGlass>
              ))}
            </div>
          </div>
        </LiquidGlass>
      </section>

      {/* ══════ CTA + AUTH ══════ */}
      <section id="cta" className="relative mt-24 px-4 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Left — CTA card */}
          <LiquidGlass
            noFloat
            cornerRadius={24}
            padding="48px 32px"
            displacementScale={90}
            blurAmount={0.35}
            saturation={160}
            aberrationIntensity={3}
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            <div className="flex flex-col justify-between h-full">
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
          </LiquidGlass>

          {/* Right — Auth form */}
          <div>
            <AuthForm initialMode="register" />
          </div>
        </div>
      </section>

      {/* ══════ DEMO ══════ */}
      <section id="demo" className="relative mt-24 px-4 max-w-6xl mx-auto space-y-4">
        <LiquidGlass
          noFloat
          cornerRadius={12}
          padding="12px 16px"
          displacementScale={60}
          blurAmount={0.15}
          saturation={140}
          aberrationIntensity={2}
          style={{ display: 'block', width: '100%' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span><strong className="text-white">Mode aperçu</strong> — données fictives pour explorer l'interface.</span>
            </div>
            <span className="text-[11px] text-gray-500 font-mono uppercase tracking-widest">sécurisé · aucune donnée réelle</span>
          </div>
        </LiquidGlass>
        <TransactionDashboard demoMode={true} />
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="relative mt-16 px-4 max-w-6xl mx-auto">
        <LiquidGlass
          noFloat
          cornerRadius={16}
          padding="20px 24px"
          displacementScale={55}
          blurAmount={0.1}
          saturation={130}
          aberrationIntensity={2}
          style={{ display: 'block', width: '100%' }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">[xt]</span>
              <span>exptrackr — fait au Canada © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-5">
              <a href="#cta" className="hover:text-gray-300 transition-colors">Commencer</a>
              <a href="#demo" className="hover:text-gray-300 transition-colors">Démo</a>
            </div>
          </div>
        </LiquidGlass>
      </footer>
    </div>
  );
};

export default LandingPage;
