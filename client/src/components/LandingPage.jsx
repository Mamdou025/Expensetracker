import React, { useState, useEffect, useRef } from 'react';
import TransactionDashboard from './TransactionDashboard';
import AuthForm from './AuthForm';
import { Brand, I } from '../ui/BrandIcon';
import LiquidGlassNav from './liquid-glass-nav';
import './LandingPage.css';

const EM  = '#10b981';
const EM2 = '#34d399';

/* ── Scroll fade-in ──────────────────────────────────────────────── */
const FadeIn = ({ children, delay = 0, style = {} }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('lp-visible'), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className="lp-fade" style={style}>
      {children}
    </div>
  );
};

/* ── Logo ────────────────────────────────────────────────────────── */
const Logo = ({ size = 'sm' }) => {
  const fs = size === 'xl' ? 32 : size === 'lg' ? 22 : 15;
  return (
    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 800, fontSize: fs, letterSpacing: '-0.5px' }}>
      <span style={{ color: EM2 }}>[</span>
      <span style={{ color: '#0f172a' }}>xt</span>
      <span style={{ color: EM2 }}>]</span>
    </span>
  );
};

/* ── Label ───────────────────────────────────────────────────────── */
const Label = ({ children }) => (
  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>
    {children}
  </p>
);

/* ── Chip ────────────────────────────────────────────────────────── */
const Chip = ({ children }) => {
  const [hov, setHov] = useState(false);
  return (
    <span
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 999,
        background: hov ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.72)',
        border: `1px solid ${hov ? 'rgba(16,185,129,0.30)' : 'rgba(255,255,255,0.9)'}`,
        fontSize: 12, color: hov ? '#059669' : '#64748b', whiteSpace: 'nowrap',
        backdropFilter: 'blur(8px)',
        boxShadow: hov ? '0 2px 12px rgba(16,185,129,0.14)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all .2s ease',
        cursor: 'default',
      }}
    >
      {children}
    </span>
  );
};

/* ── Glass card ──────────────────────────────────────────────────── */
const Card = ({ children, style = {}, accent = false, hover = false }) => {
  const [hov, setHov] = useState(false);
  const lifted = hover && hov;
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: 'rgba(255,255,255,0.76)',
        border: accent
          ? `1px solid ${lifted ? 'rgba(16,185,129,0.38)' : 'rgba(16,185,129,0.22)'}`
          : `1px solid ${lifted ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.92)'}`,
        borderRadius: 20,
        padding: 28,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: lifted
          ? '0 24px 64px rgba(0,0,0,0.11), 0 4px 16px rgba(0,0,0,0.07)'
          : '0 2px 8px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.85)',
        transform: lifted ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all .28s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ── Icon box ────────────────────────────────────────────────────── */
const IconBox = ({ name, color = EM, bg = 'rgba(16,185,129,0.10)', border = 'rgba(16,185,129,0.20)' }) => (
  <div style={{
    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bg, border: `1px solid ${border}`,
    boxShadow: `0 4px 12px ${bg}`,
  }}>
    <Brand name={name} size={22} accent={color} />
  </div>
);

/* ── Step number ─────────────────────────────────────────────────── */
const StepNum = ({ n }) => (
  <div style={{
    width: 36, height: 36, borderRadius: 999, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)',
    fontSize: 13, fontWeight: 700, color: EM,
    boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
  }}>
    {n}
  </div>
);

/* ── Screenshot frame ────────────────────────────────────────────── */
const Shot = ({ src, alt }) => (
  <div style={{
    borderRadius: 16, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
    background: '#f1f5f9',
  }}>
    <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: 'auto' }} loading="lazy" />
  </div>
);

const BANKS  = ['CIBC', 'RBC', 'MBNA', 'Capital One', 'Neo', 'Neo World Elite', 'Triangle'];
const COMING = ['TD', 'BMO', 'Scotiabank', 'Desjardins', 'Tangerine', 'Simplii', 'EQ Bank'];

const LANDING_NAV = [
  { href: '#features', label: 'Fonctionnalités', icon: <Brand name={I.bolt} size={15} accent={EM} /> },
  { href: '#banks',    label: 'Banques',          icon: <Brand name={I.bank} size={15} accent={EM} /> },
  { href: '#demo',     label: 'Démo',             icon: <Brand name={I.play} size={15} accent={EM} /> },
];

/* ════════════════════════════════════════════════════════════════════
   LANDING PAGE
════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [activeNavIndex, setActiveNavIndex] = useState(-1);

  return (
    <div style={{ background: '#f0f4f8', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>

      {/* ── Background layers ───────────────────────────────────── */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.022) 1px, transparent 1px)',
        backgroundSize: '52px 52px',
      }} />

      {/* Animated gradient orbs */}
      <div aria-hidden className="lp-orb-1" style={{
        position: 'fixed', top: -280, left: '18%', width: 750, height: 750,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(closest-side, rgba(16,185,129,0.13), transparent)',
        filter: 'blur(64px)',
      }} />
      <div aria-hidden className="lp-orb-2" style={{
        position: 'fixed', top: '35%', right: -220, width: 640, height: 640,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(closest-side, rgba(139,92,246,0.09), transparent)',
        filter: 'blur(64px)',
      }} />
      <div aria-hidden className="lp-orb-3" style={{
        position: 'fixed', bottom: '15%', left: -120, width: 520, height: 520,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(closest-side, rgba(6,182,212,0.09), transparent)',
        filter: 'blur(64px)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ═══ NAV ═════════════════════════════════════════════ */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          borderBottom: '1px solid rgba(255,255,255,0.55)',
          background: 'rgba(240,244,248,0.84)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 1px 32px rgba(0,0,0,0.04)',
        }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo size="xl" />
              <span style={{ fontSize: 17, fontWeight: 600, color: '#64748b' }}>exptrackr</span>
            </div>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="hidden md:flex">
                <LiquidGlassNav
                  items={LANDING_NAV}
                  activeIndex={activeNavIndex}
                  onSelect={(i) => setActiveNavIndex(i)}
                  className="lgn-lg"
                />
              </div>
              <a href="#cta" className="nav-cta" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 22px', borderRadius: 10,
                background: EM, color: '#fff',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 2px 16px rgba(16,185,129,0.32)',
                transition: 'all .18s ease',
                position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(16,185,129,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = EM; e.currentTarget.style.boxShadow = '0 2px 16px rgba(16,185,129,0.32)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Commencer <Brand name={I.arrowRight} size={14} accent="#fff" />
              </a>
            </nav>
          </div>
        </header>

        {/* ═══ HERO ════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1120, margin: '0 auto', padding: '96px 24px 0' }}>

          {/* badge */}
          <div style={{ marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 999,
              background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16,185,129,0.22)',
              fontSize: 12, fontWeight: 600, color: EM,
              boxShadow: '0 2px 12px rgba(16,185,129,0.12)',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: EM, animation: 'lp-pulse 2s infinite', flexShrink: 0 }} />
              Connexion bancaire directe avec Plaid — bientôt disponible
            </span>
          </div>

          {/* headline */}
          <h1 style={{ fontSize: 'clamp(40px, 6.5vw, 78px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#0f172a', marginBottom: 28, maxWidth: 840 }}>
            Vos finances canadiennes,<br />
            <span className="hero-gradient-text">enfin sous contrôle.</span>
          </h1>

          <p style={{ fontSize: 19, color: '#475569', maxWidth: 540, lineHeight: 1.68, marginBottom: 44 }}>
            Importez vos relevés PDF, vos courriels bancaires, catégorisez automatiquement et analysez vos dépenses — le tout en privé.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 88 }}>
            <a href="#cta" className="hero-cta-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 32px', borderRadius: 14,
              background: `linear-gradient(135deg, ${EM} 0%, #059669 100%)`,
              color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(16,185,129,0.32), 0 1px 0 rgba(255,255,255,0.15) inset',
              transition: 'all .22s ease',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 36px rgba(16,185,129,0.50)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(16,185,129,0.32), 0 1px 0 rgba(255,255,255,0.15) inset'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Commencer gratuitement
              <Brand name={I.arrowRight} size={16} accent="#fff" />
            </a>
            <a href="#demo" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 26px', borderRadius: 14,
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.9)',
              fontSize: 15, fontWeight: 600, color: '#475569', textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'all .2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.72)'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
            >
              <Brand name={I.play} size={16} />
              Voir la démo
            </a>
            <span style={{ fontSize: 13, color: '#94a3b8', paddingLeft: 4 }}>
              <span style={{ color: '#f59e0b' }}>★★★★★</span>  Bêta privée
            </span>
          </div>

          {/* hero screenshot */}
          <Shot src="/landing/dashboard.jpg" alt="Tableau de bord exptrackr" />
        </section>

        {/* ═══ METRICS ════════════════════════════════════════ */}
        <FadeIn>
          <section style={{ maxWidth: 1120, margin: '72px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { val: '7',    sub: 'banques canadiennes',  icon: I.bank,   color: EM,        bg: 'rgba(16,185,129,0.08)',  bd: 'rgba(16,185,129,0.18)' },
                { val: '100%', sub: 'données privées',      icon: I.shield, color: '#22d3ee', bg: 'rgba(6,182,212,0.08)',   bd: 'rgba(6,182,212,0.18)' },
                { val: 'Free', sub: 'open source',          icon: I.bolt,   color: '#a78bfa', bg: 'rgba(139,92,246,0.08)', bd: 'rgba(139,92,246,0.18)' },
              ].map(({ val, sub, icon, color, bg, bd }) => (
                <Card key={sub} hover>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <IconBox name={icon} color={color} bg={bg} border={bd} />
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>{val}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{sub}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* ═══ BANKS ══════════════════════════════════════════ */}
        <FadeIn>
          <section id="banks" style={{ maxWidth: 1120, margin: '72px auto 0', padding: '0 24px', textAlign: 'center' }}>
            <Label>Relevés pris en charge dès maintenant</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {BANKS.map(b => (
                <Chip key={b}><Brand name={I.bank} size={12} accent={EM} />{b}</Chip>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* ═══ FEATURES ═══════════════════════════════════════ */}
        <section id="features" style={{ maxWidth: 1120, margin: '88px auto 0', padding: '0 24px' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Label>Fonctionnalités</Label>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
                Tout ce qu'il faut.<br />
                <span style={{ color: EM }}>Rien de superflu.</span>
              </h2>
            </div>
          </FadeIn>

          {/* 2+1 bento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: 16 }}>

            <FadeIn delay={0} style={{ gridRow: '1 / 3' }}>
              <Card accent hover style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <IconBox name={I.uploadCloud} />
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '18px 0 10px' }}>Import PDF en quelques secondes</h3>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>
                    Glissez votre relevé — exptrackr détecte la banque, extrait les transactions et propose les catégories automatiquement. Aucun fichier conservé sur nos serveurs.
                  </p>
                </div>
                <Shot src="/landing/pdf-import.jpg" alt="Import PDF" />
              </Card>
            </FadeIn>

            <FadeIn delay={120}>
              <Card hover style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <IconBox name={I.tag} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '4px 0 4px' }}>Catégorisation automatique</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  Créez des règles par mot-clé. Épicerie, transport, restaurants — tout est trié à l'import, sans effort.
                </p>
              </Card>
            </FadeIn>

            <FadeIn delay={240}>
              <Card hover style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <IconBox name={I.message} color="#a78bfa" bg="rgba(139,92,246,0.10)" border="rgba(139,92,246,0.22)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '4px 0 4px' }}>Assistant IA 24/7</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  Posez vos questions en français. Obtenez des réponses basées sur vos vraies données financières.
                </p>
              </Card>
            </FadeIn>

          </div>
        </section>

        {/* ═══ SCREENSHOT: AI CHAT ════════════════════════════ */}
        <FadeIn>
          <section style={{ maxWidth: 1120, margin: '72px auto 0', padding: '0 24px' }}>
            <Card style={{ padding: 48 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'center' }}>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 999,
                    background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)',
                    marginBottom: 18,
                  }}>
                    <Brand name={I.message} size={13} accent="#a78bfa" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>IA Financière</span>
                  </div>
                  <h3 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 16, lineHeight: 1.15 }}>
                    Posez vos questions,<br />obtenez des réponses.
                  </h3>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
                    L'assistant connaît vos vraies données. Analysez vos habitudes, identifiez les dépenses inutiles, planifiez mieux.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      'Combien ai-je dépensé en restaurants en mars ?',
                      'Quelle est ma banque avec le plus de frais ?',
                      'Montre-moi mes dépenses fixes ce mois-ci.',
                    ].map(q => (
                      <div key={q} style={{
                        display: 'flex', gap: 10, fontSize: 13, color: '#64748b',
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.10)',
                      }}>
                        <span style={{ color: EM, flexShrink: 0, fontWeight: 700 }}>›</span>{q}
                      </div>
                    ))}
                  </div>
                </div>
                <Shot src="/landing/chat.jpg" alt="Assistant IA exptrackr" />
              </div>
            </Card>
          </section>
        </FadeIn>

        {/* ═══ HOW IT WORKS ════════════════════════════════════ */}
        <section style={{ maxWidth: 1120, margin: '88px auto 0', padding: '0 24px' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Label>Comment ça marche</Label>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
                Opérationnel en 3 minutes.
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { n: '01', icon: I.uploadCloud, title: 'Importez vos relevés', body: 'Glissez vos PDF bancaires ou connectez votre Gmail. exptrackr extrait tout automatiquement.', color: EM, bg: 'rgba(16,185,129,0.08)', bd: 'rgba(16,185,129,0.18)', delay: 0 },
              { n: '02', icon: I.tag,         title: 'Catégorisez',          body: 'Définissez vos règles une fois. Chaque transaction future est triée sans effort de votre part.', color: '#22d3ee', bg: 'rgba(6,182,212,0.08)', bd: 'rgba(6,182,212,0.18)', delay: 120 },
              { n: '03', icon: I.chartBar,    title: 'Analysez',             body: "Visualisez vos dépenses par catégorie, tendances mensuelles, banques — et interrogez l'IA.", color: '#a78bfa', bg: 'rgba(139,92,246,0.08)', bd: 'rgba(139,92,246,0.18)', delay: 240 },
            ].map(({ n, icon, title, body, color, bg, bd, delay }) => (
              <FadeIn key={n} delay={delay}>
                <Card hover>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <StepNum n={n} />
                    <IconBox name={icon} color={color} bg={bg} border={bd} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{body}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ═══ TESTIMONIAL ════════════════════════════════════ */}
        <FadeIn>
          <section style={{ maxWidth: 720, margin: '88px auto 0', padding: '0 24px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.92)',
              borderRadius: 28,
              padding: '52px 56px',
              boxShadow: '0 8px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
              textAlign: 'center',
              position: 'relative',
            }}>
              {/* giant quote mark */}
              <div style={{
                position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
                fontSize: 72, lineHeight: 1, fontWeight: 900,
                background: 'linear-gradient(135deg, #10b981, #22d3ee)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                userSelect: 'none',
              }}>"</div>

              <div style={{ paddingTop: 40 }}>
                {/* stars */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 22 }}>
                  {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#f59e0b', fontSize: 18 }}>★</span>)}
                </div>
                <p style={{ fontSize: 21, color: '#334155', lineHeight: 1.58, marginBottom: 32, fontStyle: 'italic', fontWeight: 400 }}>
                  En un après-midi j'ai importé deux ans de relevés CIBC et MBNA.
                  Pour la première fois, je sais vraiment où passe mon argent.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(34,211,238,0.15))',
                    border: '2px solid rgba(16,185,129,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: EM,
                  }}>MJ</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Marc J.</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Bêta-testeur · Montréal</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ═══ PLAID COMING SOON ══════════════════════════════ */}
        <FadeIn>
          <section style={{ maxWidth: 1120, margin: '88px auto 0', padding: '0 24px' }}>
            <div style={{
              padding: '52px 52px',
              borderRadius: 24,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(34,211,238,0.04) 50%, rgba(139,92,246,0.04) 100%)',
              border: '1px solid rgba(16,185,129,0.16)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 4px 32px rgba(16,185,129,0.07), inset 0 1px 0 rgba(255,255,255,0.65)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'center' }}>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 999,
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)',
                    marginBottom: 18,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: EM, animation: 'lp-pulse 2s infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: EM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>En développement</span>
                  </div>
                  <h3 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 16, lineHeight: 1.15 }}>
                    Connexion bancaire directe<br />avec Plaid.
                  </h3>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                    Fini les imports manuels. Connectez CIBC, RBC, TD, BMO, Scotiabank, Desjardins,
                    Tangerine, Simplii et plus — vos transactions arrivent automatiquement.
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 14 }}>Bientôt disponible</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {COMING.map(b => (
                      <Chip key={b}><Brand name={I.bank} size={11} accent={EM} />{b}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ═══ CTA + AUTH ═════════════════════════════════════ */}
        <FadeIn>
          <section id="cta" style={{ maxWidth: 1120, margin: '88px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              <div style={{
                padding: '52px 48px',
                borderRadius: 24,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.82) 0%, rgba(240,253,244,0.82) 100%)',
                border: '1px solid rgba(16,185,129,0.20)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 4px 32px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                display: 'flex', flexDirection: 'column',
              }}>
                <Logo size="lg" />
                <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', margin: '22px 0 14px', lineHeight: 1.15 }}>
                  Reprenez le contrôle<br />de vos finances.
                </h2>
                <p style={{ fontSize: 14, color: '#475569', marginBottom: 36, lineHeight: 1.65 }}>
                  Créez votre compte en moins d'une minute.<br />Aucune carte de crédit. Aucun abonnement.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                  {[
                    [I.shield,  'Données 100 % privées — hébergées chez vous'],
                    [I.bank,    '7 banques canadiennes prises en charge'],
                    [I.bolt,    'Open source — aucun abonnement'],
                    [I.wand,    'Catégorisation automatique par règles'],
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', flexShrink: 0 }}>
                        <Brand name={icon} size={13} accent={EM} />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <AuthForm initialMode="register" />
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ═══ DEMO ════════════════════════════════════════════ */}
        <section id="demo" style={{ maxWidth: 1120, margin: '88px auto 0', padding: '0 24px' }}>
          <FadeIn>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <Label>Démo interactive</Label>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Explorez l'interface — données fictives</h2>
              </div>
              <span style={{
                fontSize: 11, color: '#94a3b8', fontFamily: 'ui-monospace, monospace',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.9)',
                backdropFilter: 'blur(8px)',
              }}>
                sécurisé · aucune donnée réelle
              </span>
            </div>
          </FadeIn>
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 8px 48px rgba(0,0,0,0.09)' }}>
            <TransactionDashboard demoMode={true} />
          </div>
        </section>

        {/* ═══ FOOTER ══════════════════════════════════════════ */}
        <footer style={{
          maxWidth: 1120, margin: '72px auto 0', padding: '28px 24px',
          borderTop: '1px solid rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>exptrackr — fait au Canada © {new Date().getFullYear()}</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#94a3b8' }}>
            {[['#features','Fonctionnalités'],['#banks','Banques'],['#cta','Commencer'],['#demo','Démo']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => e.target.style.color = '#475569'}
                onMouseLeave={e => e.target.style.color = '#94a3b8'}>{label}</a>
            ))}
          </div>
        </footer>

      </div>

    </div>
  );
}
