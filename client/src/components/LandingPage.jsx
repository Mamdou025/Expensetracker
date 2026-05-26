import React, { useState } from 'react';
import TransactionDashboard from './TransactionDashboard';
import AuthForm from './AuthForm';
import { Brand, I } from '../ui/BrandIcon';

/* ── Brand ─────────────────────────────────────────────────────── */
const EM = '#34d399';

/* ── Logo ──────────────────────────────────────────────────────── */
const Logo = ({ size = 'sm' }) => (
  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 800, fontSize: size === 'lg' ? 22 : 15, letterSpacing: '-0.5px' }}>
    <span style={{ color: EM }}>[</span>
    <span style={{ color: '#f3f4f6' }}>xt</span>
    <span style={{ color: EM }}>]</span>
  </span>
);

/* ── Section label ──────────────────────────────────────────────── */
const Label = ({ children }) => (
  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>
    {children}
  </p>
);

/* ── Feature chip (bank badge) ──────────────────────────────────── */
const Chip = ({ children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 999,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

/* ── Card ───────────────────────────────────────────────────────── */
const Card = ({ children, style = {}, accent = false }) => (
  <div style={{
    background: accent ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${accent ? 'rgba(52,211,153,0.22)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 20,
    padding: 28,
    ...style,
  }}>
    {children}
  </div>
);

/* ── Icon box ───────────────────────────────────────────────────── */
const IconBox = ({ name, color = EM, bg = 'rgba(52,211,153,0.10)', border = 'rgba(52,211,153,0.20)' }) => (
  <div style={{
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bg, border: `1px solid ${border}`,
  }}>
    <Brand name={name} size={20} accent={color} />
  </div>
);

/* ── Step number ────────────────────────────────────────────────── */
const StepNum = ({ n }) => (
  <div style={{
    width: 32, height: 32, borderRadius: 999, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)',
    fontSize: 13, fontWeight: 700, color: EM,
  }}>
    {n}
  </div>
);

/* ── Screenshot frame ───────────────────────────────────────────── */
const Shot = ({ src, alt }) => (
  <div style={{
    borderRadius: 16, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
    background: '#0a0f18',
  }}>
    <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: 'auto' }} loading="lazy" />
  </div>
);

const BANKS     = ['CIBC', 'RBC', 'MBNA', 'Capital One', 'Neo', 'Neo World Elite', 'Triangle'];
const COMING    = ['TD', 'BMO', 'Scotiabank', 'Desjardins', 'Tangerine', 'Simplii', 'EQ Bank'];

/* ════════════════════════════════════════════════════════════════════
   LANDING PAGE
════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ background: '#050a10', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* subtle grid texture */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* top glow */}
      <div aria-hidden style={{
        position: 'fixed', top: -200, left: '30%', width: 600, height: 600,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(closest-side, rgba(52,211,153,0.12), transparent)',
        filter: 'blur(40px)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ═══ NAV ═════════════════════════════════════════════ */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(5,10,16,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>exptrackr</span>
            </div>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#64748b' }} className="hidden md:flex">
                {[['#features','Fonctionnalités'],['#banks','Banques'],['#demo','Démo']].map(([href,label]) => (
                  <a key={href} href={href} style={{ color: '#64748b', textDecoration: 'none', transition: 'color .15s' }}
                    onMouseEnter={e=>e.target.style.color='#e2e8f0'} onMouseLeave={e=>e.target.style.color='#64748b'}>{label}</a>
                ))}
              </div>
              <a href="#cta" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 18px', borderRadius: 10,
                background: EM, color: '#050a10',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                transition: 'background .15s',
              }}
                onMouseEnter={e=>e.currentTarget.style.background='#6ee7b7'}
                onMouseLeave={e=>e.currentTarget.style.background=EM}
              >
                Commencer <Brand name={I.arrowRight} size={13} accent="#050a10" />
              </a>
            </nav>
          </div>
        </header>

        {/* ═══ HERO ════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px 0' }}>

          {/* badge */}
          <div style={{ marginBottom: 24 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 999,
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.20)',
              fontSize: 12, fontWeight: 600, color: EM,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: EM, animation: 'pulse 2s infinite' }} />
              Connexion bancaire directe avec Plaid — bientôt disponible
            </span>
          </div>

          {/* headline */}
          <h1 style={{ fontSize: 'clamp(38px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.07, letterSpacing: '-0.03em', color: '#f8fafc', marginBottom: 24, maxWidth: 800 }}>
            Vos finances canadiennes,<br />
            <span style={{ color: EM }}>enfin sous contrôle.</span>
          </h1>

          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 520, lineHeight: 1.65, marginBottom: 36 }}>
            Importez vos relevés PDF, vos courriels bancaires, catégorisez automatiquement et analysez vos dépenses — le tout en privé.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 72 }}>
            <a href="#cta" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 12,
              background: EM, color: '#050a10',
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 0 32px rgba(52,211,153,0.25)',
            }}
              onMouseEnter={e=>e.currentTarget.style.background='#6ee7b7'}
              onMouseLeave={e=>e.currentTarget.style.background=EM}
            >
              Commencer gratuitement
              <Brand name={I.arrowRight} size={16} accent="#050a10" />
            </a>
            <a href="#demo" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              fontSize: 15, fontWeight: 600, color: '#94a3b8', textDecoration: 'none',
            }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='#e2e8f0'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='#94a3b8'}}
            >
              <Brand name={I.play} size={16} />
              Voir la démo
            </a>
            <span style={{ fontSize: 13, color: '#64748b', paddingLeft: 4 }}>
              <span style={{ color: EM }}>★★★★★</span>  Bêta privée
            </span>
          </div>

          {/* hero screenshot */}
          <Shot src="/landing/dashboard.jpg" alt="Tableau de bord exptrackr" />
        </section>

        {/* ═══ METRICS ════════════════════════════════════════ */}
        <section style={{ maxWidth: 1120, margin: '64px auto 0', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { val: '7',    sub: 'banques canadiennes',  icon: I.bank,    color: EM,        bg: 'rgba(52,211,153,0.08)',   bd: 'rgba(52,211,153,0.18)' },
              { val: '100%', sub: 'données privées',      icon: I.shield,  color: '#22d3ee', bg: 'rgba(6,182,212,0.08)',   bd: 'rgba(6,182,212,0.18)' },
              { val: 'Free', sub: 'open source',          icon: I.bolt,    color: '#a78bfa', bg: 'rgba(139,92,246,0.08)',  bd: 'rgba(139,92,246,0.18)' },
            ].map(({ val, sub, icon, color, bg, bd }) => (
              <Card key={sub}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <IconBox name={icon} color={color} bg={bg} border={bd} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{sub}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ BANKS ══════════════════════════════════════════ */}
        <section id="banks" style={{ maxWidth: 1120, margin: '64px auto 0', padding: '0 24px', textAlign: 'center' }}>
          <Label>Relevés pris en charge dès maintenant</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {BANKS.map(b => (
              <Chip key={b}><Brand name={I.bank} size={12} accent={EM} />{b}</Chip>
            ))}
          </div>
        </section>

        {/* ═══ FEATURES ═══════════════════════════════════════ */}
        <section id="features" style={{ maxWidth: 1120, margin: '80px auto 0', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Label>Fonctionnalités</Label>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
              Tout ce qu'il faut.<br />
              <span style={{ color: EM }}>Rien de superflu.</span>
            </h2>
          </div>

          {/* 2+1 bento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: 16 }}>

            {/* Large — PDF import with screenshot */}
            <Card accent style={{ gridRow: '1 / 3', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <IconBox name={I.uploadCloud} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '16px 0 8px' }}>Import PDF en quelques secondes</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                  Glissez votre relevé — exptrackr détecte la banque, extrait les transactions et propose les catégories automatiquement. Aucun fichier conservé sur nos serveurs.
                </p>
              </div>
              <Shot src="/landing/pdf-import.jpg" alt="Import PDF" />
            </Card>

            {/* Catégorisation */}
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <IconBox name={I.tag} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '4px 0 4px' }}>Catégorisation automatique</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                Créez des règles par mot-clé. Épicerie, transport, restaurants — tout est trié à l'import, sans effort.
              </p>
            </Card>

            {/* AI chat */}
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <IconBox name={I.message} color="#a78bfa" bg="rgba(139,92,246,0.10)" border="rgba(139,92,246,0.22)" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '4px 0 4px' }}>Assistant IA 24/7</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                Posez vos questions en français. Obtenez des réponses basées sur vos vraies données financières.
              </p>
            </Card>

          </div>
        </section>

        {/* ═══ SCREENSHOT: AI CHAT ════════════════════════════ */}
        <section style={{ maxWidth: 1120, margin: '64px auto 0', padding: '0 24px' }}>
          <Card style={{ padding: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.22)', marginBottom: 16 }}>
                  <Brand name={I.message} size={13} accent="#a78bfa" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>IA Financière</span>
                </div>
                <h3 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: 14, lineHeight: 1.2 }}>
                  Posez vos questions,<br />obtenez des réponses.
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
                  L'assistant connaît vos vraies données. Analysez vos habitudes, identifiez les dépenses inutiles, planifiez mieux.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'Combien ai-je dépensé en restaurants en mars ?',
                    'Quelle est ma banque avec le plus de frais ?',
                    'Montre-moi mes dépenses fixes ce mois-ci.',
                  ].map(q => (
                    <div key={q} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#64748b' }}>
                      <span style={{ color: EM, flexShrink: 0 }}>›</span>{q}
                    </div>
                  ))}
                </div>
              </div>
              <Shot src="/landing/chat.jpg" alt="Assistant IA exptrackr" />
            </div>
          </Card>
        </section>

        {/* ═══ HOW IT WORKS ════════════════════════════════════ */}
        <section style={{ maxWidth: 1120, margin: '80px auto 0', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Label>Comment ça marche</Label>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
              Opérationnel en 3 minutes.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { n: '01', icon: I.uploadCloud, title: 'Importez vos relevés', body: 'Glissez vos PDF bancaires ou connectez votre Gmail. exptrackr extrait tout automatiquement.', color: EM, bg: 'rgba(52,211,153,0.08)', bd: 'rgba(52,211,153,0.18)' },
              { n: '02', icon: I.tag,         title: 'Catégorisez',          body: 'Définissez vos règles une fois. Chaque transaction future est triée sans effort de votre part.', color: '#22d3ee', bg: 'rgba(6,182,212,0.08)',   bd: 'rgba(6,182,212,0.18)' },
              { n: '03', icon: I.chartBar,    title: 'Analysez',             body: 'Visualisez vos dépenses par catégorie, tendances mensuelles, banques — et interrogez l\'IA.', color: '#a78bfa', bg: 'rgba(139,92,246,0.08)',  bd: 'rgba(139,92,246,0.18)' },
            ].map(({ n, icon, title, body, color, bg, bd }) => (
              <Card key={n}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <StepNum n={n} />
                  <IconBox name={icon} color={color} bg={bg} border={bd} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ TESTIMONIAL ════════════════════════════════════ */}
        <section style={{ maxWidth: 640, margin: '80px auto 0', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, color: EM, marginBottom: 16, lineHeight: 1 }}>"</div>
          <p style={{ fontSize: 20, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic' }}>
            En un après-midi j'ai importé deux ans de relevés CIBC et MBNA.
            Pour la première fois, je sais vraiment où passe mon argent.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: EM,
            }}>MJ</div>
            <span style={{ fontSize: 13, color: '#64748b' }}>Marc J. — Bêta-testeur, Montréal</span>
          </div>
        </section>

        {/* ═══ PLAID COMING SOON ══════════════════════════════ */}
        <section style={{ maxWidth: 1120, margin: '80px auto 0', padding: '0 24px' }}>
          <Card style={{ padding: 48, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.14)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(52,211,153,0.10)', border: `1px solid rgba(52,211,153,0.22)`,
                  marginBottom: 16,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: EM, animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: EM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>En développement</span>
                </div>
                <h3 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: 14, lineHeight: 1.2 }}>
                  Connexion bancaire directe<br />avec Plaid.
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
                  Fini les imports manuels. Connectez CIBC, RBC, TD, BMO, Scotiabank, Desjardins,
                  Tangerine, Simplii et plus — vos transactions arrivent automatiquement.
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: 14 }}>Bientôt disponible</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {COMING.map(b => (
                    <Chip key={b}><Brand name={I.bank} size={11} accent={EM} />{b}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ═══ CTA + AUTH ═════════════════════════════════════ */}
        <section id="cta" style={{ maxWidth: 1120, margin: '80px auto 0', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Left */}
            <Card accent style={{ padding: 48, display: 'flex', flexDirection: 'column' }}>
              <Logo size="lg" />
              <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', margin: '20px 0 12px', lineHeight: 1.2 }}>
                Reprenez le contrôle<br />de vos finances.
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
                Créez votre compte en moins d'une minute.<br />Aucune carte de crédit. Aucun abonnement.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                {[
                  [I.shield,  'Données 100 % privées — hébergées chez vous'],
                  [I.bank,    '7 banques canadiennes prises en charge'],
                  [I.bolt,    'Open source — aucun abonnement'],
                  [I.wand,    'Catégorisation automatique par règles'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.18)', flexShrink: 0 }}>
                      <Brand name={icon} size={13} accent={EM} />
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </Card>

            {/* Right — auth form */}
            <div>
              <AuthForm initialMode="register" />
            </div>
          </div>
        </section>

        {/* ═══ DEMO ════════════════════════════════════════════ */}
        <section id="demo" style={{ maxWidth: 1120, margin: '80px auto 0', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <Label>Démo interactive</Label>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Explorez l'interface — données fictives</h2>
            </div>
            <span style={{
              fontSize: 11, color: '#475569', fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '5px 12px', borderRadius: 6,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              sécurisé · aucune donnée réelle
            </span>
          </div>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
            <TransactionDashboard demoMode={true} />
          </div>
        </section>

        {/* ═══ FOOTER ══════════════════════════════════════════ */}
        <footer style={{
          maxWidth: 1120, margin: '64px auto 0', padding: '24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo />
            <span style={{ fontSize: 12, color: '#475569' }}>exptrackr — fait au Canada © {new Date().getFullYear()}</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#475569' }}>
            {[['#features','Fonctionnalités'],['#banks','Banques'],['#cta','Commencer'],['#demo','Démo']].map(([href,label]) => (
              <a key={href} href={href} style={{ color: '#475569', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e=>e.target.style.color='#94a3b8'} onMouseLeave={e=>e.target.style.color='#475569'}>{label}</a>
            ))}
          </div>
        </footer>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .landing-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
