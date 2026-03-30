import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   ENNIE — Complete App v2.0
   Original 23 screens + Specialization Engine + Smart Queue
   ═══════════════════════════════════════════════════════════════ */

/* ─── Design Tokens ─── */
const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", card: "#FFFFFF", cardHover: "#FAFAFA",
  border: "#EBEBEB", borderLight: "#F0F0F0", text: "#0A0A0A", textMuted: "#6B6B6B",
  textDim: "#AAAAAA", accent: "#8B3FFF", accentDim: "rgba(139,63,255,0.08)",
  accentGlow: "rgba(139,63,255,0.18)", warm: "#E07830", warmDim: "rgba(224,120,48,0.08)",
  danger: "#A32D2D", dangerDim: "rgba(163,45,45,0.08)", blue: "#185FA5",
  blueDim: "rgba(24,95,165,0.08)", purple: "#8B3FFF", purpleDim: "rgba(139,63,255,0.08)",
  pink: "#E88FB0", pinkDim: "rgba(232,143,176,0.12)",
  green: "#2E9E68", greenDim: "rgba(46,158,104,0.10)",
  grad: "linear-gradient(135deg, #0A0A0A, #2A2A2A)",
  gradHero: "radial-gradient(ellipse 110% 65% at 50% -5%, #9747FF 0%, #C4A0FF 38%, #EDE0FF 60%, #FFFFFF 80%)",
  gradWarm: "linear-gradient(135deg, #E07830, #D63B3B)",
};

/* ── Queue Engine ── */
const computeWait = (tier, patients = 3, committed = 4) => {
  const base = Math.max(2, Math.round((patients / Math.max(committed, 1)) * 5));
  if (tier === "free") return Math.min(base * 2, 60);
  if (tier === "today") return Math.min(base, 90);
  if (tier === "week") return Math.min(base * 3, 7 * 24 * 60);
  return base;
};
const fmtWait = (m) => {
  if (m < 2) return "under 2 min";
  if (m < 60) return `~${m} min`;
  if (m < 24 * 60) return `~${Math.round(m / 60)} hr`;
  return `~${Math.round(m / (24 * 60))} days`;
};
const systemWindow = (patients = 3, committed = 4) =>
  Math.max(5, Math.min(20, Math.round(15 - (patients - committed) * 1.5)));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ─── Global Styles ─── */
const GlobalCSS = () => (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
    <style>{`
      * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
      body { background: ${T.bg}; color: ${T.text}; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
      h1,h2,h3,h4 { font-family: 'Syne', sans-serif !important; letter-spacing: -0.025em; }
      @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      @keyframes slideDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
      @keyframes pulse { 0%,100% { opacity:.3 } 50% { opacity:1 } }
      @keyframes breathe { 0%,100% { transform:scale(1) } 50% { transform:scale(1.04) } }
      @keyframes spin { to { transform:rotate(360deg) } }
      @keyframes shimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
      @keyframes ripple { 0% { transform:scale(.8);opacity:.6 } 100% { transform:scale(2.4);opacity:0 } }
      @keyframes orbFloat { 0%,100% { transform:scale(1) } 50% { transform:scale(1.06) } }
      @keyframes orbRing1 { 0%,100% { transform:scale(1);opacity:.2 } 50% { transform:scale(1.3);opacity:.06 } }
      @keyframes orbRing2 { 0%,100% { transform:scale(1.05);opacity:.12 } 50% { transform:scale(1.5);opacity:.02 } }
      @keyframes orbPulse { 0%,100% { transform:scale(1) } 25% { transform:scale(1.18) } 75% { transform:scale(.92) } }
      @keyframes orbRipple { 0% { transform:scale(1);opacity:.35 } 100% { transform:scale(2.2);opacity:0 } }
      @keyframes captionFade { from { opacity:0;transform:translateY(6px) } to { opacity:1;transform:translateY(0) } }
      ::-webkit-scrollbar { width:4px }
      ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:4px }
      input, textarea, select { font-family: inherit; }
      button { font-family: inherit; }
    `}</style>
  </>
);

/* ═══════════════ SHARED COMPONENTS ═══════════════ */

const Logo = ({ size = 20, full }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" stroke={T.accent} strokeWidth="1.5" opacity=".3" />
      <path d="M12 3C7 3 3 7 3 12s4 9 9 9" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M12 9c-1.7 0-3 1.3-3 3s1.3 3 3 3" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
    <div>
      <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -0.5, color: T.text }}>Ennie</span>
      {full && <span style={{ fontSize: size * 0.45, color: T.textMuted, fontWeight: 400, display: "block", marginTop: -2 }}>by Charlie Goldsmith</span>}
    </div>
  </div>
);

const Header = ({ left, center, right }) => (
  <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20, minHeight: 52 }}>
    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>{left || <Logo />}</div>
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>{center}</div>
    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>{right}</div>
  </div>
);

const Badge = ({ children, color = T.accent, bg }) => (
  <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color, background: bg || (color + "18"), letterSpacing: 0.3 }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", full, disabled, small, style: sx }) => {
  const base = { padding: small ? "9px 18px" : "14px 22px", borderRadius: 100, fontSize: small ? 13 : 15, fontWeight: 600, cursor: disabled ? "default" : "pointer", border: "none", width: full ? "100%" : "auto", opacity: disabled ? 0.4 : 1, transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
  const variants = {
    primary: { ...base, background: T.grad, color: "#FFFFFF" },
    secondary: { ...base, background: T.card, color: T.text, border: `1px solid ${T.border}` },
    ghost: { ...base, background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` },
    danger: { ...base, background: T.dangerDim, color: T.danger, border: `1px solid ${T.danger}30` },
    accent: { ...base, background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}30` },
    warm: { ...base, background: T.warmDim, color: T.warm, border: `1px solid ${T.warm}30` },
    green: { ...base, background: T.greenDim, color: T.green, border: `1px solid ${T.green}30` },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...variants[variant], ...sx }}>{children}</button>;
};

const Card = ({ children, style: sx, onClick }) => (
  <div onClick={onClick} style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, padding: 18, ...(onClick ? { cursor: "pointer" } : {}), ...sx }}>{children}</div>
);

const ScreenWrap = ({ children, pad = true }) => (
  <div style={{ flex: 1, overflowY: "auto", padding: pad ? 16 : 0 }}>{children}</div>
);

const Divider = () => <div style={{ height: 1, background: T.border, margin: "16px 0" }} />;

const Label = ({ children }) => <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{children}</div>;

const Input = ({ value, onChange, placeholder, type = "text", style: sx }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 14, outline: "none", ...sx }} />
);

const Toggle = ({ on, onToggle, label }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={onToggle}>
    <span style={{ fontSize: 14, color: T.text }}>{label}</span>
    <div style={{ width: 48, height: 28, borderRadius: 14, background: on ? T.accent : "#D8D0EC", padding: 3, cursor: "pointer", transition: "background .2s" }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: "#fff", transform: on ? "translateX(20px)" : "translateX(0)", transition: "transform .2s" }} />
    </div>
  </div>
);

const TypingDots = () => (
  <div style={{ display: "flex", gap: 4, padding: "10px 14px" }}>
    {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.textMuted, animation: `pulse 1.2s ease ${i * .2}s infinite` }} />)}
  </div>
);

const ChatBubble = ({ text, isAI }) => (
  <div style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end", marginBottom: 8, animation: "slideUp .3s ease" }}>
    {isAI && <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, marginTop: 2, fontSize: 10, fontWeight: 800, color: "#fff" }}>E</div>}
    <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: isAI ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: isAI ? T.bg : T.accentDim, border: `1px solid ${isAI ? T.border : T.accent + "30"}`, color: T.text, fontSize: 13.5, lineHeight: 1.55 }}>{text}</div>
  </div>
);

/* ─── Body Map ─── */
const BodyMap = ({ side = "front", pins = [], onAddPin, onSelectPin, selectedPin, small }) => {
  const svgRef = useRef(null);
  const w = small ? 140 : 200;
  const h = small ? 266 : 380;
  const handleClick = (e) => {
    if (!onAddPin) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = +((svgP.x / w * 100).toFixed(1));
    const y = +((svgP.y / h * 100).toFixed(1));
    if (x > 15 && x < 85 && y > 3 && y < 95) onAddPin(x, y, side);
  };
  const bodyPath = `M100,30 C100,14 88,4 80,4 C72,4 68,10 68,18 C68,28 76,36 80,38 L80,42 C76,44 60,50 56,56 L42,100 C40,106 44,110 48,110 L60,108 L58,106 C56,104 56,100 58,96 L68,72 L68,130 C68,140 62,200 60,220 L56,280 C54,300 56,310 60,316 L64,340 C66,348 70,352 76,352 C82,352 84,348 82,340 L78,300 L80,260 L82,300 L78,340 C76,348 78,352 84,352 C90,352 94,348 96,340 L100,316 C104,310 106,300 104,280 L100,220 C98,200 92,140 92,130 L92,72 L102,96 C104,100 104,104 102,106 L100,108 L112,110 C116,110 120,106 118,100 L104,56 C100,50 84,44 80,42`;
  const sidePins = pins.filter(p => p.side === side);
  return (
    <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: small ? 140 : 200, cursor: onAddPin ? "crosshair" : "default" }} onClick={handleClick}>
      <defs>
        <radialGradient id={`bg${side}${small?'s':''}`} cx="50%" cy="30%"><stop offset="0%" stopColor="#D8D0EC" /><stop offset="100%" stopColor="#C8BEE0" /></radialGradient>
        <filter id="glow2"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {side === "back" && <line x1="80" y1="42" x2="80" y2="310" stroke={T.textDim} strokeWidth=".5" strokeDasharray="3,3" opacity=".3" />}
      <g transform={`scale(${w/200},${h/380})`}><path d={bodyPath} fill={`url(#bg${side}${small?'s':''})`} stroke={T.borderLight} strokeWidth="1.5" transform="translate(20,8)" /></g>
      <text x={w/2} y={h - 4} textAnchor="middle" fill={T.textDim} fontSize={small ? 10 : 12}>{side.toUpperCase()}</text>
      {sidePins.map(p => {
        const cx = p.x / 100 * w, cy = p.y / 100 * h;
        const sel = selectedPin === p.id;
        const c = p.severity > 6 ? T.danger : p.severity > 3 ? T.warm : T.accent;
        return (
          <g key={p.id} onClick={e => { e.stopPropagation(); onSelectPin?.(p.id); }} style={{ cursor: "pointer" }}>
            <circle cx={cx} cy={cy} r={small ? 10 : 14} fill={c} opacity=".15" />
            <circle cx={cx} cy={cy} r={sel ? 8 : 6} fill={c} opacity={sel ? .9 : .7} filter={sel ? "url(#glow2)" : ""} />
            <text x={cx} y={cy + 3} textAnchor="middle" fill="#fff" fontSize={small ? 6 : 8} fontWeight="700" style={{ pointerEvents: "none" }}>{p.severity}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ─── Severity Slider ─── */
const Slider = ({ value, onChange, min = 0, max = 10 }) => {
  const ref = useRef(null);
  const pct = ((value - min) / (max - min)) * 100;
  const color = value > 6 ? T.danger : value > 3 ? T.warm : T.accent;
  const handle = e => {
    const r = ref.current.getBoundingClientRect();
    const cx = e.pointerId !== undefined ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
    onChange(Math.round(clamp((cx - r.left) / r.width, 0, 1) * (max - min) + min));
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.textMuted }}>None</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}/{max}</span>
        <span style={{ fontSize: 12, color: T.textMuted }}>Severe</span>
      </div>
      <div ref={ref}
        onPointerDown={e => { e.target.setPointerCapture(e.pointerId); handle(e); }}
        onPointerMove={e => { if (e.pressure > 0) handle(e); }}
        onTouchStart={handle} onTouchMove={handle}
        style={{ position: "relative", height: 32, background: T.surface, borderRadius: 16, cursor: "pointer", overflow: "hidden", border: `1px solid ${T.border}`, touchAction: "none" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `linear-gradient(90deg, ${T.accent}, ${color})`, borderRadius: 16, transition: "width .05s" }} />
        <div style={{ position: "absolute", left: `calc(${pct}% - 16px)`, top: 0, width: 32, height: 32, borderRadius: "50%", background: "#fff", boxShadow: `0 0 12px ${color}60`, transition: "left .05s", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 4px" }}>
        {["Mild", "Moderate", "Severe"].map((l, i) => (
          <span key={l} style={{ fontSize: 12, color: T.textDim, textAlign: i === 0 ? "left" : i === 1 ? "center" : "right", flex: 1 }}>{l}</span>
        ))}
      </div>
    </div>
  );
};

/* ─── Timer Ring ─── */
const TimerRing = React.memo(({ seconds, total }) => {
  const pct = seconds / total;
  const r = 24, circ = 2 * Math.PI * r;
  const color = seconds < 60 ? T.danger : seconds < 150 ? T.warm : T.accent;
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return (
    <div style={{ position: "relative", width: 58, height: 58 }}>
      <svg viewBox="0 0 58 58" style={{ width: 58, height: 58, transform: "rotate(-90deg)" }}>
        <circle cx="29" cy="29" r={r} fill="none" stroke={T.border} strokeWidth="3.5" />
        <circle cx="29" cy="29" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear, stroke .5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{m}:{s.toString().padStart(2, "0")}</span>
      </div>
    </div>
  );
});

/* ─── Silhouette ─── */
const Silhouette = ({ active }) => (
  <svg viewBox="0 0 120 160" style={{ width: 90, height: 120 }}>
    <defs>
      <radialGradient id="aura2" cx="50%" cy="40%">
        <stop offset="0%" stopColor={T.accent} stopOpacity={active ? .15 : .03} />
        <stop offset="70%" stopColor={T.purple} stopOpacity={active ? .06 : 0} />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="80" rx="55" ry="75" fill="url(#aura2)">{active && <animate attributeName="rx" values="55;58;55" dur="3s" repeatCount="indefinite" />}</ellipse>
    <circle cx="60" cy="38" r="18" fill="#D8D0EC" />
    <ellipse cx="60" cy="95" rx="28" ry="45" fill="#D8D0EC" />
  </svg>
);

/* ─── Progress Bar ─── */
const ProgressBar = ({ value, max = 100, color = T.accent, height = 6 }) => (
  <div style={{ height, background: T.surface, borderRadius: 3, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 3, transition: "width .4s" }} />
  </div>
);

/* ─── Stat Card ─── */
const StatCard = ({ label, value, sub, color = T.accent, icon }) => (
  <Card style={{ flex: "1 1 45%", minWidth: 120, animation: "slideUp .4s ease" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{sub}</div>}
      </div>
      {icon && <span style={{ fontSize: 22, opacity: .5 }}>{icon}</span>}
    </div>
  </Card>
);

/* ─── Tab Bar ─── */
const TabBar = ({ tabs, active, onTab }) => (
  <div style={{ borderTop: `1px solid ${T.border}`, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", position: "sticky", bottom: 0, zIndex: 20, padding: "10px 16px 14px" }}>
    <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          flexShrink: 0, padding: "8px 16px", borderRadius: 100,
          border: active === t.id ? "none" : `1px solid ${T.border}`,
          background: active === t.id ? T.text : "transparent",
          color: active === t.id ? "#FFFFFF" : T.textMuted,
          fontSize: 13, fontWeight: active === t.id ? 600 : 400,
          cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ fontSize: 14 }}>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  </div>
);

/* ─── Back Button ─── */
const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>←</button>
);

/* ═══════════════════════════════════════════════════════════════
   SPECIALIZATION DATA
   ═══════════════════════════════════════════════════════════════ */
const CONDITIONS_DATA = [
  { id: "arthritis",    label: "Arthritis",        icon: "🦴", sessions: 8,  avgDrop: 4.2, beatPlacebo: true,  pct: 92 },
  { id: "migraine",     label: "Migraine",          icon: "🧠", sessions: 5,  avgDrop: 3.8, beatPlacebo: true,  pct: 84 },
  { id: "chronic_back", label: "Chronic back pain", icon: "🔧", sessions: 6,  avgDrop: 2.9, beatPlacebo: true,  pct: 71 },
  { id: "fibromyalgia", label: "Fibromyalgia",      icon: "💢", sessions: 3,  avgDrop: 1.1, beatPlacebo: false, pct: 38 },
  { id: "neuropathy",   label: "Neuropathy",        icon: "⚡", sessions: 2,  avgDrop: 0.8, beatPlacebo: false, pct: 29 },
  { id: "anxiety",      label: "Anxiety / stress",  icon: "🌀", sessions: 4,  avgDrop: 2.1, beatPlacebo: false, pct: 52 },
];
const OVERALL_STATS = { sessions: 20, beatPlacebo: 14, pct: 70, threshold: 75 };

/* ═══════════════════════════════════════════════════════════════
   SCREEN 1: Landing
   ═══════════════════════════════════════════════════════════════ */
const LandingScreen = ({ onGetStarted, onJoinHealer, onLogin }) => (
  <div style={{ flex: 1, overflowY: "auto", background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
    {/* Gradient hero */}
    <div style={{ background: T.gradHero, minHeight: "60vh", display: "flex", flexDirection: "column", padding: "52px 24px 32px", animation: "fadeIn .8s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "auto" }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" stroke="#0A0A0A" strokeWidth="1.5" opacity=".25" />
          <path d="M12 3C7 3 3 7 3 12s4 9 9 9" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: -0.4, color: "#0A0A0A" }}>Ennie</span>
      </div>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(52px,14vw,68px)", fontWeight: 800, lineHeight: 0.92, letterSpacing: -3, color: "#0A0A0A", marginBottom: 20 }}>
        Energy<br />Healing.
      </h1>
      <p style={{ fontSize: 15, color: "rgba(10,10,10,.6)", lineHeight: 1.5, maxWidth: 280, marginBottom: 28 }}>
        A public resource for measurable healing. Anyone, anywhere.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["About", "Learn", "Research", "Contact"].map(item => (
          <button key={item} style={{ padding: "9px 18px", borderRadius: 100, border: "1.5px solid rgba(10,10,10,.15)", background: "rgba(255,255,255,.45)", backdropFilter: "blur(8px)", color: "#0A0A0A", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{item}</button>
        ))}
      </div>
    </div>
    {/* White bottom */}
    <div style={{ padding: "28px 24px 40px" }}>
      <Btn onClick={onGetStarted} full style={{ marginBottom: 12, fontSize: 16 }}>Start a Healer Testing Session</Btn>
      <Btn onClick={onJoinHealer} variant="secondary" full style={{ marginBottom: 16 }}>Apply as a healer</Btn>
      <button onClick={onLogin} style={{ display: "block", margin: "0 auto", background: "none", border: "none", color: T.textMuted, fontSize: 14, cursor: "pointer" }}>Login</button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 2: Sign Up
   ═══════════════════════════════════════════════════════════════ */
const SignUpScreen = ({ onContinue, onBack }) => {
  const [email, setEmail] = useState("");
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Sign up</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease", paddingTop: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Create your account</h2>
          <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 28 }}>No password needed — we'll send a magic link.</p>
          <Label>EMAIL</Label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
          <div style={{ height: 16 }} />
          <Btn onClick={() => onContinue(email)} full disabled={!email.includes("@")}>Continue with magic link</Btn>
          <Divider />
          <Btn variant="secondary" full style={{ marginBottom: 10 }} onClick={() => onContinue("apple")}><span style={{ fontSize: 18 }}></span> Sign in with Apple</Btn>
          <Btn variant="secondary" full onClick={() => onContinue("google")}><span style={{ fontSize: 16 }}>G</span> Sign in with Google</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 3: Age Gate
   ═══════════════════════════════════════════════════════════════ */
const AgeGateScreen = ({ onContinue, onBack }) => {
  const [dob, setDob] = useState({ day: "", month: "", year: "" });
  const numOnly = (val, maxLen) => val.replace(/[^0-9]/g, "").slice(0, maxLen);
  const age = useMemo(() => {
    const d = parseInt(dob.day), m = parseInt(dob.month), y = parseInt(dob.year);
    if (!d || !m || !y || dob.year.length < 4 || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) return null;
    const date = new Date(y, m - 1, d);
    if (date.getMonth() !== m - 1) return null;
    return Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }, [dob]);
  const valid = age !== null && age >= 13 && age < 150;
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Verify age</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease", paddingTop: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Date of birth</h2>
          <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 24 }}>We need this to keep everyone safe.</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1 }}><Label>DAY</Label><Input value={dob.day} onChange={e => setDob({ ...dob, day: numOnly(e.target.value, 2) })} placeholder="DD" type="tel" /></div>
            <div style={{ flex: 1 }}><Label>MONTH</Label><Input value={dob.month} onChange={e => setDob({ ...dob, month: numOnly(e.target.value, 2) })} placeholder="MM" type="tel" /></div>
            <div style={{ flex: 1.5 }}><Label>YEAR</Label><Input value={dob.year} onChange={e => setDob({ ...dob, year: numOnly(e.target.value, 4) })} placeholder="YYYY" type="tel" /></div>
          </div>
          {age !== null && age < 13 && <Card style={{ background: T.dangerDim, border: `1px solid ${T.danger}30`, marginBottom: 16 }}><p style={{ fontSize: 13, color: T.danger }}>You must be at least 13 to use Ennie.</p></Card>}
          {age !== null && age >= 13 && age < 18 && <Card style={{ background: T.warmDim, border: `1px solid ${T.warm}30`, marginBottom: 16 }}><p style={{ fontSize: 13, color: T.warm }}>You can use Ennie as a case. Healer roles require 18+.</p></Card>}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}25`, marginBottom: 20, fontSize: 12, color: T.blue, lineHeight: 1.5 }}>ℹ️ Ennie is not a medical service. Energy healing is complementary — always consult your doctor.</div>
          <Btn onClick={() => onContinue(age)} full disabled={!valid}>Continue</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 3a: UCI Research Consent
   ═══════════════════════════════════════════════════════════════ */
const ConsentScreen = ({ onAccept, onBack }) => {
  const [checks, setChecks] = useState({ notMedical: false, dataUse: false, followUp: false, voluntary: false, notEmergency: false });
  const allChecked = Object.values(checks).every(Boolean);
  const toggle = (k) => setChecks(c => ({ ...c, [k]: !c[k] }));
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Research Consent</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.blueDim, border: `1px solid ${T.blue}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: T.blue }}>UCI</div>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>UC Irvine Research Study</div><div style={{ fontSize: 11, color: T.textMuted }}>IRB-approved protocol</div></div>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Informed Consent</h2>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, marginBottom: 16 }}>Ennie is part of ongoing academic research conducted in collaboration with the University of California, Irvine.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {[
              { key: "notMedical", label: "Not medical treatment", desc: "I understand energy healing is complementary and experimental, not a substitute for medical care." },
              { key: "dataUse", label: "Research data use", desc: "I agree my anonymised session data may be used for academic research overseen by UC Irvine." },
              { key: "followUp", label: "Follow-up measurements", desc: "I may be asked for optional follow-up symptom ratings at 24 hours, 1 week, and 1 month." },
              { key: "voluntary", label: "Voluntary participation", desc: "My participation is entirely voluntary. I can withdraw at any time without penalty." },
              { key: "notEmergency", label: "Not a medical emergency", desc: "I confirm I'm not currently experiencing a medical emergency." },
            ].map(item => (
              <div key={item.key} onClick={() => toggle(item.key)} style={{ padding: "14px", borderRadius: 14, cursor: "pointer", background: checks[item.key] ? T.accentDim : T.card, border: `1px solid ${checks[item.key] ? T.accent + "40" : T.border}`, transition: "all .15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, border: `2px solid ${checks[item.key] ? T.accent : T.border}`, background: checks[item.key] ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.bg, transition: "all .15s" }}>{checks[item.key] ? "✓" : ""}</div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: checks[item.key] ? T.accent : T.text }}>{item.label}</span>
                </div>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55, paddingLeft: 32 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <Btn onClick={onAccept} full disabled={!allChecked}>{allChecked ? "I Consent — Continue" : "Please acknowledge all items above"}</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 3c: Queue Hold Explainer
   ═══════════════════════════════════════════════════════════════ */
const QueueHoldScreen = ({ onContinue, onBack }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, animation: "fadeIn .3s ease" }}>
    <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>How it works</span>} />
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 360, borderRadius: 24, background: `linear-gradient(180deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, padding: "36px 24px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.blueDim, border: `2px solid ${T.blue}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: 26 }}>⏸️</div>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, color: T.text, textAlign: "center", marginBottom: 16 }}>How sessions work on Ennie</h2>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: 6 }}>Healer Testing Sessions</p>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>Designed to test healers for ability. We need active symptoms so we can measure real-time changes.</p>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: T.surface, border: `1px solid ${T.blue}20`, marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: T.blue, fontWeight: 700, marginBottom: 6 }}>Super Sessions</p>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>Use our best tested healers. You can join the queue and hold your spot until symptoms are active. Also available for conditions without active symptoms.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          {[
            { num: "1", icon: "🎫", text: "Sign up for a Super Session and enter the queue" },
            { num: "2", icon: "⏳", text: "When you reach the front, we'll hold your spot" },
            { num: "3", icon: "🔔", text: "We'll notify you — start whenever your symptoms are active" },
            { num: "4", icon: "✦", text: "Your session begins the moment you're ready" },
          ].map(s => (
            <div key={s.num} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5, paddingTop: 5 }}>{s.text}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 12, background: T.accentDim, border: `1px solid ${T.accent}25`, marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: T.accent, lineHeight: 1.5, textAlign: "center" }}>Your spot is held for up to 90 days.</p>
        </div>
        <button onClick={onContinue} style={{ width: "100%", padding: "16px 24px", borderRadius: 16, background: T.grad, border: "none", color: T.bg, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${T.accentGlow}` }}>Got it — let's begin intake</button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 4+5: Intake (AI conversation + body map)
   ═══════════════════════════════════════════════════════════════ */
const intakeScript = [
  { ai: "Hi there — I'm Ennie, your intake guide. I'll help us understand what you're experiencing so we can match you with the right healer.", delay: 700 },
  { ai: "Are you currently experiencing any pain or discomfort right now?", delay: 1000 },
  { wait: "user", options: ["Yes, I have pain right now", "It comes and goes", "It's more emotional"] },
  { ai: "Thanks for sharing. Tap the body map to mark where you feel it — you can place as many pins as you need.", delay: 900, action: "showMap" },
  { wait: "pin" },
  { ai: "Now rate the severity from 0 to 10 using the slider below.", delay: 700, action: "showSlider" },
  { wait: "severity" },
  { ai: "How long have you been dealing with this?", delay: 800 },
  { wait: "user", options: ["Less than a week", "A few weeks", "Months", "Years"] },
  { ai: "Has anything made it better or worse recently?", delay: 800 },
  { wait: "user", options: ["Stress makes it worse", "Rest helps", "Nothing helps", "Not sure"] },
  { ai: "Based on what you've described, this sounds like it falls under chronic pain. Does that feel right?", delay: 900, action: "showCategory" },
  { wait: "user", options: ["Yes, that's right", "Maybe more like tension", "I'm not sure"] },
  { ai: "Got it. You're eligible for a Healer Testing Session — a test healer will work with you anonymously. It typically takes about 5 minutes.", delay: 1000 },
  { ai: "Would you like to join the queue now?", delay: 600, action: "showQueue" },
];

const IntakeScreen = ({ onJoinQueue, onPaidSession, onIneligible, pins, setPins, onBack }) => {
  const [showMapTip, setShowMapTip] = useState(true);
  const [msgs, setMsgs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(false);
  const [waitFor, setWaitFor] = useState(null);
  const [opts, setOpts] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [showQ, setShowQ] = useState(false);
  const [side, setSide] = useState("front");
  const [selPin, setSelPin] = useState(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState("text");
  const [voiceActive, setVoiceActive] = useState(false);
  const [lastAI, setLastAI] = useState("");
  const endRef = useRef(null);
  const scroll = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  const runStep = useCallback(async (i) => {
    if (i >= intakeScript.length) return;
    const s = intakeScript[i];
    if (s.ai) {
      setTyping(true); await wait(s.delay || 800); setTyping(false);
      setMsgs(m => [...m, { text: s.ai, isAI: true }]);
      setLastAI(s.ai);
      if (s.action === "showMap") setShowMap(true);
      if (s.action === "showSlider") setShowSlider(true);
      if (s.action === "showCategory") setShowCat(true);
      if (s.action === "showQueue") setShowQ(true);
      const next = intakeScript[i + 1];
      if (next?.ai) setTimeout(() => runStep(i + 1), 350);
      else if (next?.wait) { setWaitFor(next.wait); if (next.options) setOpts(next.options); }
      setIdx(i + 1);
    }
  }, []);

  useEffect(() => { runStep(0); }, [runStep]);
  useEffect(scroll, [msgs, typing]);

  const reply = (t) => {
    setMsgs(m => [...m, { text: t, isAI: false }]);
    setWaitFor(null); setOpts([]);
    if (t === "It comes and goes") {
      setTimeout(async () => {
        setTyping(true); await wait(1000); setTyping(false);
        setMsgs(m => [...m, { text: "That's really common. Are you feeling any of those symptoms right now, even mildly?", isAI: true }]);
        setWaitFor("user"); setOpts(["Yes, I can feel it now", "No, not right now"]);
      }, 300);
      return;
    }
    if (t === "No, not right now") {
      setTimeout(async () => {
        setTyping(true); await wait(1000); setTyping(false);
        setMsgs(m => [...m, { text: "No worries at all. Healer Testing Sessions need active symptoms so we can measure changes in real time. You're welcome to come back whenever they flare up — or we can show you options with our Super Sessions.", isAI: true }]);
        setTimeout(() => onIneligible?.(), 2500);
      }, 300);
      return;
    }
    if (t === "Yes, I can feel it now") {
      // Continue the normal intake flow — they DO have symptoms
    }
    setTimeout(() => runStep(idx + 1), 300);
    setIdx(i => i + 1);
  };

  const addPin = (x, y, sd) => {
    const p = { id: Date.now(), x, y, side: sd, severity: 5 };
    setPins(prev => [...prev, p]); setSelPin(p.id);
    if (waitFor === "pin") {
      setMsgs(m => [...m, { text: `Marked a spot on ${sd} body`, isAI: false }]);
      setWaitFor(null);
      setTimeout(() => runStep(idx + 1), 300);
      setIdx(i => i + 1);
    }
  };

  const confirmSev = () => {
    const p = pins.find(x => x.id === selPin);
    setMsgs(m => [...m, { text: `Rated severity: ${p?.severity || 5}/10`, isAI: false }]);
    setWaitFor(null);
    setTimeout(() => runStep(idx + 1), 300); setIdx(i => i + 1);
  };

  /* ═══ VOICE MODE ═══ */
  if (mode === "voice") {
    return (
      <>
        <Header
          left={<BackBtn onClick={onBack} />}
          center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Intake</span>}
          right={<button onClick={() => setMode("text")} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⌨️ Text</button>}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {showMap && (
            <div style={{ flex: "0 0 auto", padding: "8px 12px 0", animation: "slideUp .3s ease" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                {["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <BodyMap side={side} pins={pins} onAddPin={addPin} onSelectPin={setSelPin} selectedPin={selPin} />
              </div>
              {showSlider && selPin && (
                <div style={{ padding: "6px 8px 2px" }}>
                  <Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} />
                  {waitFor === "severity" && <Btn onClick={confirmSev} variant="accent" full small style={{ marginTop: 8 }}>Confirm severity</Btn>}
                </div>
              )}
              {pins.length > 0 && <div style={{ display: "flex", gap: 4, padding: "4px 0 2px", flexWrap: "wrap", justifyContent: "center" }}>{pins.map((p, i) => <span key={p.id} onClick={() => setSelPin(p.id)} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer", background: selPin === p.id ? T.accentDim : T.card, border: `1px solid ${selPin === p.id ? T.accent + "40" : T.border}`, color: selPin === p.id ? T.accent : T.textMuted }}>#{i + 1} · {p.severity}/10</span>)}</div>}
            </div>
          )}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 24px", minHeight: 80 }}>
            {(lastAI || typing) && (
              <p style={{ fontSize: 14, color: T.textMuted, textAlign: "center", lineHeight: 1.6, animation: "captionFade .4s ease", maxWidth: 300 }} key={lastAI}>
                {typing ? "Listening…" : lastAI}
              </p>
            )}
          </div>
          {waitFor === "user" && opts.length > 0 && (
            <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {opts.map((o, i) => <button key={i} onClick={() => reply(o)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${T.accent}35`, background: T.accentDim, color: T.accent, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{o}</button>)}
            </div>
          )}
          {showQ && (
            <div style={{ padding: "4px 16px 8px" }}>
              <Btn onClick={onJoinQueue} full>Start Healer Testing Session</Btn>
              <div style={{ height: 6 }} />
              <Btn onClick={onPaidSession} variant="ghost" full small>Or book a Super Session →</Btn>
            </div>
          )}
          <div style={{ padding: "12px 0 28px", display: "flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(180deg, transparent, ${T.surface}80)` }}>
            <div
              onClick={() => {
                if (!voiceActive) {
                  setVoiceActive(true);
                  setTimeout(() => {
                    setVoiceActive(false);
                    if (waitFor === "user" && opts.length > 0) reply(opts[Math.floor(Math.random() * opts.length)]);
                    else if (waitFor === "pin") addPin(52, 55, side);
                    else if (waitFor === "severity") confirmSev();
                  }, 2500);
                }
              }}
              style={{ position: "relative", width: 140, height: 140, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 140, height: 140, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: voiceActive ? "orbRipple 1.5s ease-out infinite" : "orbRing1 3s ease-in-out infinite" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 120, height: 120, borderRadius: "50%", border: `1.5px solid ${T.accent}60`, animation: voiceActive ? "orbRipple 1.5s ease-out .3s infinite" : "orbRing2 3.5s ease-in-out .5s infinite" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 80, height: 80, borderRadius: "50%", transform: "translate(-50%,-50%)", background: voiceActive ? `radial-gradient(circle at 40% 35%, ${T.accent}, ${T.blue}80, ${T.purple}60)` : `radial-gradient(circle at 40% 35%, ${T.accent}90, ${T.blue}50, ${T.surface})`, boxShadow: voiceActive ? `0 0 40px ${T.accent}50` : `0 0 30px ${T.accent}25`, animation: voiceActive ? "orbPulse .8s ease-in-out infinite" : "orbFloat 3s ease-in-out infinite" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 40, height: 40, borderRadius: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, rgba(255,255,255,${voiceActive ? 0.3 : 0.15}), transparent)`, animation: voiceActive ? "orbPulse .6s ease-in-out infinite" : "orbFloat 2s ease-in-out .5s infinite" }} />
            </div>
            <p style={{ fontSize: 12, color: voiceActive ? T.accent : T.textMuted, fontWeight: 500, marginTop: 8, transition: "color .2s" }}>
              {voiceActive ? "Listening… tap to send" : "Tap to speak"}
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ═══ TEXT MODE ═══ */
  return (
    <>
      <Header
        left={<BackBtn onClick={onBack} />}
        center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Intake</span>}
        right={<button onClick={() => setMode("voice")} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🎙️ Voice</button>}
      />
      {showMap && (
        <div style={{ padding: "8px 12px", background: T.surface, borderBottom: `1px solid ${T.border}`, animation: "slideDown .3s ease" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
            {["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}
          </div>
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            <BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { setShowMapTip(false); addPin(x, y, sd); }} onSelectPin={setSelPin} selectedPin={selPin} />
            {showMapTip && pins.length === 0 && (
              <div onClick={() => setShowMapTip(false)} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", borderRadius: 8, cursor: "pointer", animation: "fadeIn .3s ease", zIndex: 5 }}>
                <div style={{ padding: "12px 18px", borderRadius: 12, background: T.card, border: `1px solid ${T.accent}40`, textAlign: "center", maxWidth: 200 }}>
                  <p style={{ fontSize: 13, color: T.accent, fontWeight: 600, marginBottom: 4 }}>👆 Tap anywhere</p>
                  <p style={{ fontSize: 12, color: T.textMuted }}>Tap on the body to mark where it hurts</p>
                </div>
              </div>
            )}
          </div>
          {showSlider && selPin && (
            <div style={{ padding: "6px 8px 2px", animation: "slideUp .2s ease" }}>
              <Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} />
              {waitFor === "severity" && <Btn onClick={confirmSev} variant="accent" full small style={{ marginTop: 8 }}>Confirm severity</Btn>}
            </div>
          )}
          {pins.length > 0 && <div style={{ display: "flex", gap: 4, padding: "4px 0", flexWrap: "wrap", justifyContent: "center" }}>{pins.map((p, i) => <span key={p.id} onClick={() => setSelPin(p.id)} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer", background: selPin === p.id ? T.accentDim : T.card, border: `1px solid ${selPin === p.id ? T.accent + "40" : T.border}`, color: selPin === p.id ? T.accent : T.textMuted }}>#{i + 1} · {p.severity}/10</span>)}</div>}
        </div>
      )}
      {showCat && !showQ && (
        <div style={{ padding: "6px 12px", animation: "slideDown .2s ease" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {["Chronic Pain", "Acute Injury", "Tension", "Emotional", "Other"].map(c => <span key={c} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", background: c === "Chronic Pain" ? T.accentDim : T.card, border: `1px solid ${c === "Chronic Pain" ? T.accent + "40" : T.border}`, color: c === "Chronic Pain" ? T.accent : T.textMuted }}>{c}</span>)}
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
        {msgs.length === 0 && <div style={{ padding: "10px 12px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}25`, marginBottom: 10, fontSize: 12, color: T.blue, lineHeight: 1.5 }}>ℹ️ Ennie is not a medical service. Energy healing is complementary.</div>}
        {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
        {typing && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 26, height: 26, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.bg }}>E</div><div style={{ background: T.card, borderRadius: "4px 14px 14px 14px", border: `1px solid ${T.border}` }}><TypingDots /></div></div>}
        <div ref={endRef} />
      </div>
      {waitFor === "user" && opts.length > 0 && <div style={{ padding: "4px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>{opts.map((o, i) => <button key={i} onClick={() => reply(o)} style={{ padding: "7px 12px", borderRadius: 18, border: `1px solid ${T.accent}35`, background: T.accentDim, color: T.accent, fontSize: 12.5, fontWeight: 500, cursor: "pointer", animation: `slideUp ${.2 + i * .06}s ease` }}>{o}</button>)}</div>}
      {showQ && <div style={{ padding: "8px 16px" }}><Btn onClick={onJoinQueue} full>Start Healer Testing Session</Btn><div style={{ height: 6 }} /><Btn onClick={onPaidSession} variant="ghost" full small>Or book a Super Session →</Btn></div>}
      <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}`, background: `${T.surface}ee`, display: "flex", gap: 8 }}>
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…" style={{ flex: 1 }} />
        <Btn onClick={() => { if (text.trim()) { reply(text.trim()); setText(""); } }} small style={{ width: 44, borderRadius: 12, padding: 0 }}>↑</Btn>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 5a: No Active Symptoms
   ═══════════════════════════════════════════════════════════════ */
const paidTiersData = [
  { name: "Line", price: "$50", urgency: "Queue", wait: "3–4 weeks", color: T.accent, desc: "Join the queue. Approx wait 3–4 weeks.", stat: "70% of users report over 90% pain reduction and 60% total pain relief after 3 sessions." },
  { name: "Week", price: "$150", urgency: "This Week", wait: "1–7 days", color: T.blue, desc: "Scheduled session within the next 7 days.", stat: "70% of users report over 90% pain reduction and 60% total pain relief after 3 sessions." },
  { name: "Today", price: "$350", urgency: "Today", wait: "< 2 hrs", color: T.warm, desc: "Priority session matched and completed today.", stat: "70% of users report over 90% pain reduction and 60% total pain relief after 3 sessions." },
];

const IneligibleScreen = ({ onPaid, onGroup, onClose }) => (
  <>
    <Header left={<BackBtn onClick={onClose} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Session Options</span>} />
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        <div style={{ borderRadius: 20, padding: "32px 24px", background: `linear-gradient(180deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.warmDim, border: `2px solid ${T.warm}50`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 24 }}>🌿</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, color: T.text, marginBottom: 10 }}>Healer Testing Sessions need active symptoms</h2>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, marginBottom: 8 }}>To reliably test our healers, we need symptoms you can rate in real time.</p>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6, fontWeight: 500 }}>Please come back when your symptoms are active — we'd love to help you then.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ flex: 1, height: 1, background: T.border }} /><span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>Or book a Super Session</span><div style={{ flex: 1, height: 1, background: T.border }} /></div>
        {paidTiersData.map((t, i) => (
          <Card key={t.name} onClick={() => onPaid(t)} style={{ marginBottom: 10, cursor: "pointer", border: `1px solid ${t.color}25`, animation: `slideUp ${.3 + i * .08}s ease` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 16, fontWeight: 700, color: t.color }}>{t.name}</span><span style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.price}</span></div>
            <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>{t.desc}</p>
            {t.stat && <p style={{ fontSize: 11, color: T.accent, marginBottom: 8, padding: "6px 8px", borderRadius: 8, background: T.accentDim, lineHeight: 1.45 }}>📊 {t.stat}</p>}
            <div style={{ display: "flex", gap: 8 }}><Badge color={t.color}>{t.urgency}</Badge><Badge color={T.textMuted}>~{t.wait}</Badge></div>
          </Card>
        ))}
        <Card onClick={onGroup} style={{ cursor: "pointer", border: `1px solid ${T.purple}30`, background: `${T.purple}08`, animation: "slideUp .6s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👥</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: T.purple }}>Group Healing</div><div style={{ fontSize: 12, color: T.textMuted }}>From $19.99/mo · 8 sessions per month</div></div>
          </div>
        </Card>
        <div style={{ height: 8 }} />
        <Btn variant="ghost" full onClick={onClose}>Maybe later</Btn>
      </div>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 5: Routing / SKU selection
   ═══════════════════════════════════════════════════════════════ */
const allSkus = [
  { name: "Healer Testing Session", price: "FREE", urgency: "Test Pool", wait: "10–20 min", color: T.accent, desc: "Matched with a test healer anonymously. Active symptoms required.", stat: "Up to 50% of our users report a 50% or more pain reduction.", free: true },
  ...paidTiersData,
];
const RoutingScreen = ({ eligible, onFree, onPaid, onGroup, onBack }) => (
  <>
    <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Choose your session</span>} />
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        {eligible && <div style={{ padding: "12px 14px", borderRadius: 14, background: T.accentDim, border: `1px solid ${T.accent}30`, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 22 }}>✅</span><div><div style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>You're eligible for a Healer Testing Session</div><div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Active symptoms detected — help us test healer ability.</div></div></div>}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>All session options</h2>
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Every session is live, anonymous, and mediated by AI.</p>
        {allSkus.map((sku, i) => {
          const isFree = sku.free, disabled = isFree && !eligible;
          return (
            <div key={sku.name} onClick={disabled ? undefined : (isFree ? onFree : () => onPaid(sku))} style={{ background: isFree ? `${T.accent}0A` : T.card, borderRadius: 16, padding: 16, marginBottom: 10, cursor: disabled ? "default" : "pointer", border: `1px solid ${disabled ? T.border : isFree ? T.accent + "40" : sku.color + "25"}`, opacity: disabled ? 0.4 : 1, transition: "all .15s", animation: `slideUp ${.25 + i * .07}s ease`, position: "relative", overflow: "hidden" }}>
              {isFree && eligible && <div style={{ position: "absolute", top: 0, right: 0, padding: "4px 12px", borderRadius: "0 14px 0 10px", background: T.accent, fontSize: 9, fontWeight: 700, color: T.bg, letterSpacing: .5, textTransform: "uppercase" }}>Recommended</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 16, fontWeight: 700, color: disabled ? T.textDim : (isFree ? T.accent : sku.color) }}>{sku.name}</span><span style={{ fontSize: 20, fontWeight: 800, color: disabled ? T.textDim : (isFree ? T.accent : sku.color) }}>{sku.price}</span></div>
              <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5, marginBottom: 6 }}>{sku.desc}</p>
              {sku.stat && <p style={{ fontSize: 11, color: T.accent, marginBottom: 8, padding: "6px 8px", borderRadius: 8, background: T.accentDim, lineHeight: 1.45 }}>📊 {sku.stat}</p>}
              <div style={{ display: "flex", gap: 8 }}><Badge color={disabled ? T.textDim : sku.color}>{sku.urgency}</Badge><Badge color={T.textMuted}>~{sku.wait}</Badge></div>
            </div>
          );
        })}
        <Card onClick={onGroup} style={{ cursor: "pointer", border: `1px solid ${T.purple}30`, background: `${T.purple}08` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👥</div><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: T.purple }}>Group Healing</div><div style={{ fontSize: 12, color: T.textMuted }}>From $19.99/mo · 8 sessions per month</div></div></div>
        </Card>
      </div>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   GROUP HEALING SCREENS
   ═══════════════════════════════════════════════════════════════ */
const groupSessions = [
  { id: 1, day: "Monday", time: "7:00 PM", healer: "Ember", spots: 12, filled: 8 },
  { id: 2, day: "Wednesday", time: "12:00 PM", healer: "Solace", spots: 15, filled: 11 },
  { id: 3, day: "Thursday", time: "8:00 PM", healer: "Lumen", spots: 10, filled: 6 },
  { id: 4, day: "Saturday", time: "10:00 AM", healer: "Horizon", spots: 20, filled: 14 },
  { id: 5, day: "Sunday", time: "6:00 PM", healer: "Haven", spots: 15, filled: 9 },
  { id: 6, day: "Tuesday", time: "9:00 PM", healer: "Aura", spots: 12, filled: 10 },
  { id: 7, day: "Friday", time: "1:00 PM", healer: "Zephyr", spots: 18, filled: 5 },
  { id: 8, day: "Saturday", time: "4:00 PM", healer: "Sage", spots: 15, filled: 12 },
];

const GroupScheduleScreen = ({ onSingle, onSubscribe, onBack }) => {
  const [tab, setTab] = useState("single");
  const [selected, setSelected] = useState([]);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Group Healing</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            {[{ id: "single", label: "Single Session" }, { id: "subscribe", label: "$19.99/mo" }].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelected([]); }} style={{ flex: 1, padding: "10px 8px", borderRadius: 11, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: tab === t.id ? T.card : "transparent", color: tab === t.id ? T.accent : T.textMuted, transition: "all .15s" }}>{t.label}</button>
            ))}
          </div>
          {tab === "subscribe" && <Card style={{ marginBottom: 16, border: `1px solid ${T.purple}30`, background: `${T.purple}06` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 18, fontWeight: 800, color: T.purple }}>$19.99<span style={{ fontSize: 12, fontWeight: 500 }}>/month</span></span><Badge color={T.purple}>8 sessions/mo</Badge></div><p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>Unlimited access to group healing sessions. Pick any 8 per month.</p></Card>}
          {tab === "single" && <Card style={{ marginBottom: 16, border: `1px solid ${T.accent}25` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 15, fontWeight: 700 }}>Single Group Session</div><div style={{ fontSize: 12, color: T.textMuted }}>Pick one session below</div></div><span style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>$29</span></div></Card>}
          <Label>UPCOMING SESSIONS — YOUR TIMEZONE</Label>
          {groupSessions.map((s, i) => {
            const isSel = selected.includes(s.id), spotsLeft = s.spots - s.filled;
            return (
              <Card key={s.id} onClick={() => { if (tab === "single") setSelected([s.id]); else toggle(s.id); }} style={{ marginBottom: 8, cursor: "pointer", animation: `slideUp ${.2 + i * .04}s ease`, border: `1px solid ${isSel ? T.accent + "50" : T.border}`, background: isSel ? T.accentDim : T.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSel ? T.accent : T.border}`, background: isSel ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: T.bg }}>{isSel ? "✓" : ""}</div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.day}</span><span style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>{s.time}</span>
                  </div>
                  <Badge color={spotsLeft < 5 ? T.warm : T.textMuted}>{spotsLeft} spots</Badge>
                </div>
                <div style={{ fontSize: 11, color: T.textDim, paddingLeft: 28 }}>{s.healer} · {s.filled}/{s.spots} joined</div>
              </Card>
            );
          })}
          <div style={{ height: 12 }} />
          {tab === "single" ? (
            <Btn onClick={() => onSingle(groupSessions.find(s => s.id === selected[0]))} full disabled={selected.length === 0}>{selected.length > 0 ? "Book session — $29" : "Select a session"}</Btn>
          ) : (
            <Btn onClick={() => onSubscribe(selected.map(id => groupSessions.find(s => s.id === id)))} full disabled={selected.length === 0} style={{ background: `linear-gradient(135deg, ${T.purple}, ${T.blue})` }}>{selected.length > 0 ? `Subscribe — $19.99/mo · ${Math.min(selected.length, 8)} selected` : "Select sessions"}</Btn>
          )}
        </div>
      </ScreenWrap>
    </>
  );
};

const GroupConfirmScreen = ({ sessions, isSub, onIntake, onBack }) => {
  const [addCal, setAddCal] = useState(false);
  const [notif, setNotif] = useState(true);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>{isSub ? "Subscription" : "Booking"} Confirmed</span>} />
      <ScreenWrap>
        <div style={{ textAlign: "center", marginBottom: 20, animation: "slideUp .4s ease" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{isSub ? "You're subscribed!" : "Session booked!"}</h2>
          <p style={{ fontSize: 13, color: T.textMuted }}>{isSub ? "$19.99/mo · Your selected sessions are confirmed." : "Your group healing session is confirmed."}</p>
        </div>
        {(sessions || []).map((s, i) => s && <Card key={i} style={{ marginBottom: 8, animation: `slideUp ${.3 + i * .06}s ease` }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14, fontWeight: 600 }}>{s.day} · {s.time}</span><Badge color={T.accent}>Confirmed</Badge></div></Card>)}
        <Divider />
        <Card style={{ marginBottom: 10 }}><Toggle on={addCal} onToggle={() => setAddCal(!addCal)} label="📅 Add to calendar" /></Card>
        <Card style={{ marginBottom: 16 }}><Toggle on={notif} onToggle={() => setNotif(!notif)} label="🔔 Notify me before session" /></Card>
        <Btn onClick={onIntake} full>Complete intake for group session</Btn>
      </ScreenWrap>
    </>
  );
};

const GroupIntakeScreen = ({ pins, setPins, onDone, onBack }) => {
  const [side, setSide] = useState("front");
  const [selPin, setSelPin] = useState(null);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Group Intake</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Mark your symptoms</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 14 }}>Tap the body to place pins, then rate severity.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>{["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { const p = { id: Date.now(), x, y, side: sd, severity: 5 }; setPins(prev => [...prev, p]); setSelPin(p.id); }} onSelectPin={setSelPin} selectedPin={selPin} /></div>
          {pins.length > 0 && <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap", justifyContent: "center" }}>{pins.map((p, i) => <span key={p.id} onClick={() => setSelPin(p.id)} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, cursor: "pointer", background: selPin === p.id ? T.accentDim : T.card, border: `1px solid ${selPin === p.id ? T.accent + "40" : T.border}`, color: selPin === p.id ? T.accent : T.textMuted }}>#{i + 1} · {p.severity}/10</span>)}</div>}
          {selPin && <Card style={{ marginBottom: 14 }}><Label>SEVERITY</Label><Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} /></Card>}
          {pins.length === 0 && <div style={{ padding: "20px 16px", borderRadius: 14, border: `1px dashed ${T.border}`, textAlign: "center", marginBottom: 14 }}><p style={{ fontSize: 13, color: T.textDim }}>Tap the body map above to mark where you feel symptoms</p></div>}
          <Btn onClick={onDone} full disabled={pins.length === 0}>{pins.length > 0 ? "Continue to Session" : "Place at least one pin"}</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

const GroupSessionScreen = ({ pins, setPins, onEnd }) => {
  const [timer, setTimer] = useState(600);
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(false);
  const [side, setSide] = useState("front");
  const [selPin, setSelPin] = useState(pins[0]?.id || null);
  const [text, setText] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const script = [
      { t: 1500, m: "Welcome to group healing. Your healer is working with the group now. Focus on your symptoms." },
      { t: 6000, m: "The healer is sending energy to the group. Update your body map as you notice changes." },
      { t: 15000, m: "How are your symptoms feeling? Adjust the sliders on the body map." },
      { t: 25000, m: "The healer is intensifying focus. Keep breathing and noticing." },
    ];
    script.forEach(({ t, m }) => setTimeout(async () => { setTyping(true); await wait(1200); setTyping(false); setMsgs(prev => [...prev, { text: m, isAI: true }]); }, t));
  }, []);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  useEffect(() => { const i = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(i); onEnd(); return 0; } return t - 1; }), 1000); return () => clearInterval(i); }, [onEnd]);
  const send = (m) => {
    if (!m.trim()) return;
    setMsgs(prev => [...prev, { text: m, isAI: false }]); setText("");
    const lower = m.toLowerCase();
    if (/better|improv|less|easing|lighter|shifted|reduced/.test(lower) && pins.length) setPins(ps => ps.map(p => ({ ...p, severity: clamp(p.severity - 1, 0, 10) })));
    if (/worse|more|intense|stronger|sharp/.test(lower) && pins.length) setPins(ps => ps.map(p => ({ ...p, severity: clamp(p.severity + 1, 0, 10) })));
  };
  return (
    <>
      <Header left={<Badge color={T.purple}>👥 Group</Badge>} center={<TimerRing seconds={timer} total={600} />} right={<Btn variant="danger" small onClick={onEnd} style={{ padding: "5px 12px" }}>End</Btn>} />
      <div style={{ flex: "0 0 auto", maxHeight: "44vh", overflowY: "auto", background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "4px 12px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "4px 0 6px" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.purple, animation: "pulse 2s infinite" }} /><span style={{ fontSize: 10, color: T.textMuted }}>Group session · Live body map</span></div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>{["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}</div>
        <div style={{ display: "flex", justifyContent: "center" }}><BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { const p = { id: Date.now(), x, y, side: sd, severity: 5 }; setPins(prev => [...prev, p]); setSelPin(p.id); }} onSelectPin={setSelPin} selectedPin={selPin} small /></div>
        {selPin && <div style={{ padding: "4px 4px 0" }}><Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} /></div>}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
        {typing && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${T.purple}, ${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.bg }}>E</div><div style={{ background: T.card, borderRadius: "4px 14px 14px 14px", border: `1px solid ${T.border}` }}><TypingDots /></div></div>}
        <div ref={ref} />
      </div>
      <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}`, background: `${T.surface}ee`, display: "flex", gap: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(text); }} placeholder="Describe how you feel…" style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 13.5, outline: "none" }} />
        <button onClick={() => send(text)} style={{ width: 42, height: 42, borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${T.purple}, ${T.blue})`, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 6: Queue
   ═══════════════════════════════════════════════════════════════ */
const QueueScreen = ({ onReady, onLeave }) => {
  const [patients, setPatients] = React.useState(3);
  const [committed, setCommitted] = React.useState(4);
  const [sel, setSel] = React.useState("free");
  const [progress, setProgress] = React.useState(0);

  const myWait = computeWait(sel, patients, committed);

  React.useEffect(() => {
    const i = setInterval(() => setProgress(p => {
      if (p >= 100) { clearInterval(i); setTimeout(onReady, 400); return 100; }
      return p + 1;
    }), 180);
    return () => clearInterval(i);
  }, [onReady]);

  const dotColor = (w) => w < 15 ? T.green : w < 45 ? T.warm : T.danger;

  return (
    <>
      <Header center={<span style={{ fontSize: 13, color: T.textMuted }}>Queue</span>} />
      <ScreenWrap>
        {/* Live supply strip */}
        <div style={{ background: "#FAFAFA", borderRadius: 16, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 13, color: T.textMuted }}><strong style={{ color: T.text }}>{committed}</strong> healers committed now</span>
          </div>
          <span style={{ fontSize: 12, color: T.textDim }}>{patients} in queue</span>
        </div>

        {/* Big wait display */}
        <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Your estimated wait</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: T.text }}>{fmtWait(myWait)}</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>
            Based on <strong style={{ color: T.text }}>{committed}</strong> committed healers · <strong style={{ color: T.text }}>{patients}</strong> ahead
          </div>
        </div>
        <ProgressBar value={progress} color={T.text} />

        {/* Tier cards */}
        <div style={{ marginTop: 20, marginBottom: 16 }}>
          <Label>Session type</Label>
          {[
            { id: "free", name: "Healer testing session", price: "Free", desc: "Help us test a healer — active symptoms needed" },
            { id: "today", name: "Super Session — Today", price: "$350", desc: "Guaranteed match · verified healer" },
            { id: "week", name: "Super Session — This Week", price: "$150", desc: "Session within 7 days · no active symptoms needed" },
          ].map(t => {
            const w = computeWait(t.id, patients, committed);
            return (
              <div key={t.id} onClick={() => setSel(t.id)} style={{ padding: "14px 16px", borderRadius: 18, border: sel === t.id ? `2px solid ${T.text}` : `1px solid ${T.border}`, background: T.card, cursor: "pointer", marginBottom: 8, transition: "all .15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{t.price}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>{t.desc}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor(w), display: "inline-block" }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{fmtWait(w)}</span>
                  <span style={{ fontSize: 12, color: T.textMuted }}>estimated wait</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demand sliders */}
        <div style={{ background: "#FAFAFA", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Label>Simulate demand</Label>
          {[{ label: "Patients in queue", val: patients, set: setPatients }, { label: "Committed healers", val: committed, set: setCommitted }].map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: T.textMuted }}>{s.label}</span>
                <span style={{ fontWeight: 500 }}>{s.val}</span>
              </div>
              <input type="range" min="1" max="15" value={s.val} step="1" onChange={e => s.set(+e.target.value)} style={{ width: "100%" }} />
            </div>
          ))}
        </div>

        <Btn onClick={onReady} full>Join queue →</Btn>
        <button onClick={onLeave} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: T.textMuted, fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Leave queue</button>
      </ScreenWrap>
    </>
  );
};


/* ═══════════════════════════════════════════════════════════════
   SCREEN 7: Ready Now
   ═══════════════════════════════════════════════════════════════ */
const ReadyNowScreen = ({ onReady, onSnooze }) => (
  <>
    <Header center={<Logo />} />
    <ScreenWrap>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", animation: "slideUp .4s ease" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 36, animation: "breathe 2s ease-in-out infinite" }}>✦</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>It's nearly your turn</h2>
        <p style={{ fontSize: 15, color: T.textMuted, marginBottom: 32 }}>Are you ready to begin?</p>
        <Btn onClick={onReady} full>I'm Ready — Let's Go</Btn>
        <div style={{ height: 10 }} />
        <Btn onClick={onSnooze} variant="secondary" full>Snooze — keep my spot</Btn>
      </div>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 8: Symptom Confirmation
   ═══════════════════════════════════════════════════════════════ */
const SymptomConfirmScreen = ({ pins, setPins, onStart, onBack }) => {
  const [selPin, setSelPin] = useState(pins[0]?.id || null);
  const [note, setNote] = useState("");
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Check in</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Are your symptoms still present?</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>Update each rating — these become your session baseline.</p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><BodyMap side="front" pins={pins} onSelectPin={setSelPin} selectedPin={selPin} small /></div>
          {selPin && <Card style={{ marginBottom: 12 }}><Label>SEVERITY — SYMPTOM #{pins.findIndex(p => p.id === selPin) + 1}</Label><Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} /></Card>}
          <Label>OPTIONAL NOTE</Label>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Any changes since intake?" />
          <div style={{ height: 16 }} />
          <Btn onClick={onStart} full>I'm Ready — Connect Now</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 8b: Connecting
   ═══════════════════════════════════════════════════════════════ */
const ConnectingScreen = ({ onConnected, isGroup, onCancel }) => {
  const [step, setStep] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  useEffect(() => {
    if (cancelled) return;
    const timers = [setTimeout(() => setStep(1), 1500), setTimeout(() => setStep(2), 3500), setTimeout(() => setStep(3), 5500), setTimeout(() => onConnected(), 7000)];
    return () => timers.forEach(clearTimeout);
  }, [onConnected, cancelled]);
  return (
    <>
      <Header center={<Logo />} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px", textAlign: "center" }}>
        <div style={{ position: "relative", width: 90, height: 90, marginBottom: 28 }}>
          <svg viewBox="0 0 90 90" style={{ width: 90, height: 90, animation: "spin 3s linear infinite" }}>
            <circle cx="45" cy="45" r="38" fill="none" stroke={T.border} strokeWidth="3" />
            <circle cx="45" cy="45" r="38" fill="none" stroke={isGroup ? T.purple : T.accent} strokeWidth="3" strokeDasharray="60 180" strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{isGroup ? "👥" : "✦"}</div>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{step < 2 ? "Connecting you with a healer…" : step < 3 ? "Healer found" : "Starting session…"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, width: "100%" }}>
          {["Finding the best match…", "Sending your symptom data…", "Healer is preparing…"].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: step > i ? T.accentDim : T.surface, border: `1px solid ${step > i ? T.accent + "30" : T.border}`, transition: "all .4s", opacity: step >= i ? 1 : 0.3 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: step > i ? T.accent : "transparent", border: `2px solid ${step > i ? T.accent : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.bg, transition: "all .3s" }}>{step > i ? "✓" : ""}</div>
              <span style={{ fontSize: 13, color: step > i ? T.accent : T.textMuted, fontWeight: step > i ? 600 : 400 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 16, padding: "20px 18px", background: `linear-gradient(180deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, textAlign: "left", width: "100%" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>Before we begin</p>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.65, marginBottom: 10 }}>Please give accurate feedback throughout the session. It is critical to getting the most out of the session.</p>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.65, fontWeight: 600 }}>The truth — no matter what it is — is very important.</p>
        </div>
        <button onClick={() => { setCancelled(true); onCancel?.(); }} style={{ marginTop: 16, background: "none", border: "none", color: T.textDim, fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Cancel</button>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 9: Live Session (Case)
   ═══════════════════════════════════════════════════════════════ */
const sessionScript = [
  { ai: "Your healer is connected and ready. They can see your symptom map. Take a moment to settle in.", delay: 1800 },
  { ai: "Your healer is beginning to work with you now. Relax and notice any changes.", delay: 3500 },
  { ai: "How are you feeling? Any changes — even subtle ones?", delay: 8000 },
  { ai: "Your healer is adjusting their focus. Keep noticing how your body feels.", delay: 12000 },
  { ai: "Take a slow breath. How's the area you marked earlier?", delay: 16000 },
  { ai: "Your healer will continue for the remaining time. Update your symptoms on the body map whenever you notice a change.", delay: 20000 },
];

const LiveSessionScreen = ({ pins, setPins, baselinePins, onEnd }) => {
  const [timer, setTimer] = useState(300);
  const [msgs, setMsgs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState("voice");
  const [text, setText] = useState("");
  const [side, setSide] = useState("front");
  const [selPin, setSelPin] = useState(pins[0]?.id || null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [lastAI, setLastAI] = useState("Your healer is connecting…");
  const ref = useRef(null);
  const scroll = () => ref.current?.scrollIntoView({ behavior: "smooth" });

  const run = useCallback(async (i) => {
    if (i >= sessionScript.length) return;
    const s = sessionScript[i];
    if (s.ai) {
      setTyping(true); await wait(s.delay || 2000); setTyping(false);
      setMsgs(m => [...m, { text: s.ai, isAI: true }]);
      setLastAI(s.ai); setIdx(i + 1);
      if (sessionScript[i + 1]?.ai) setTimeout(() => run(i + 1), 300);
    }
  }, []);

  useEffect(() => { run(0); }, [run]);
  useEffect(scroll, [msgs, typing]);
  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(i); onEnd(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(i);
  }, [active, onEnd]);

  const parseAndAdjust = (input) => {
    const lower = input.toLowerCase();
    const improving = /better|improv|less pain|decreas|relief|easing|lighter|shifted|changed|reduced|gone/.test(lower);
    const worsening = /worse|more pain|increas|intense|stronger|sharp|throb/.test(lower);
    if ((improving || worsening) && pins.length > 0) {
      const delta = improving ? -1 : 1;
      setPins(ps => ps.map(p => ({ ...p, severity: clamp(p.severity + delta, 0, 10) })));
      setTimeout(async () => {
        setTyping(true); await wait(1200); setTyping(false);
        const newSev = clamp((pins[0]?.severity || 5) + delta, 0, 10);
        const msg = improving ? `Noted — your healer can see the improvement. Symptoms updated to ${newSev}/10.` : `Thanks for letting us know. Your healer is adjusting. Symptoms updated to ${newSev}/10.`;
        setMsgs(m => [...m, { text: msg, isAI: true }]);
        setLastAI(msg);
        if (improving) setTimer(t => Math.min(t + 60, 300));
      }, 400);
    }
  };

  const sendMessage = (msg) => {
    if (!msg.trim()) return;
    setMsgs(m => [...m, { text: msg, isAI: false }]);
    parseAndAdjust(msg); setText(""); setVoiceActive(false);
    if (idx < sessionScript.length) setTimeout(() => run(idx), 800);
  };

  const bodyMapPanel = (
    <div style={{ padding: "4px 12px 8px" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
        {["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { const p = { id: Date.now(), x, y, side: sd, severity: 5 }; setPins(prev => [...prev, p]); setSelPin(p.id); }} onSelectPin={setSelPin} selectedPin={selPin} small />
      </div>
      {selPin && (
        <div style={{ padding: "6px 4px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted }}>Symptom #{pins.findIndex(p => p.id === selPin) + 1}</span>
            {pins.length > 1 && <button onClick={() => { setPins(ps => ps.filter(p => p.id !== selPin)); setSelPin(pins.find(p => p.id !== selPin)?.id || null); }} style={{ background: "none", border: "none", color: T.danger, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Remove</button>}
          </div>
          <Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} />
        </div>
      )}
    </div>
  );

  if (mode === "voice") return (
    <>
      <Header left={<Logo />} center={<TimerRing seconds={timer} total={300} />} right={<Btn variant="danger" small onClick={onEnd} style={{ padding: "5px 12px" }}>End</Btn>} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0 4px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500 }}>Healer connected · Anonymous</span>
        </div>
        <div style={{ flex: "0 0 auto", borderBottom: `1px solid ${T.border}`, background: T.surface }}>{bodyMapPanel}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 28px" }}>
          <p style={{ fontSize: 15, color: typing ? T.textDim : T.text, textAlign: "center", lineHeight: 1.65, animation: "captionFade .4s ease", maxWidth: 320, fontWeight: typing ? 400 : 500 }} key={lastAI + typing}>{typing ? "…" : lastAI}</p>
        </div>
        <div style={{ padding: "0 0 24px", display: "flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(180deg, transparent, ${T.surface}60)` }}>
          <div onClick={() => { if (voiceActive) { const samples = ["I think the pain is easing", "Feeling warmth in that area", "About the same right now", "Definitely less tension"]; sendMessage(samples[Math.floor(Math.random() * samples.length)]); } else { setVoiceActive(true); } }} style={{ position: "relative", width: 130, height: 130, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: voiceActive ? "orbRipple 1.5s ease-out infinite" : "orbRing1 3s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 5, borderRadius: "50%", border: `1.5px solid ${T.accent}50`, animation: voiceActive ? "orbRipple 1.5s ease-out .3s infinite" : "orbRing2 3.5s ease-in-out .4s infinite" }} />
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: voiceActive ? `radial-gradient(circle at 38% 32%, #fff 0%, #9B8AFB 30%, #7C6AE8 65%, #6B5CE0 100%)` : `radial-gradient(circle at 38% 32%, #C4B5FD 0%, #9B8AFB 50%, #E8E2F4 100%)`, boxShadow: voiceActive ? `0 0 50px ${T.accent}50` : `0 0 30px ${T.accent}20`, animation: voiceActive ? "orbPulse .8s ease-in-out infinite" : "orbFloat 3s ease-in-out infinite" }} />
          </div>
          <p style={{ fontSize: 12, color: voiceActive ? T.accent : T.textMuted, fontWeight: 500, marginTop: 10, transition: "color .2s" }}>{voiceActive ? "Listening…" : "Tap to speak"}</p>
          <button onClick={() => setMode("text")} style={{ marginTop: 10, background: "none", border: "none", color: T.textDim, fontSize: 12, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Switch to text</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Header left={<Logo />} center={<TimerRing seconds={timer} total={300} />} right={<Btn variant="danger" small onClick={onEnd} style={{ padding: "5px 12px" }}>End</Btn>} />
      <div style={{ flex: "0 0 auto", maxHeight: "48vh", overflowY: "auto", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: "pulse 2s infinite" }} /><span style={{ fontSize: 10, color: T.textMuted }}>Healer connected · Anonymous</span></div>
        {bodyMapPanel}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
        {typing && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 26, height: 26, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.bg }}>E</div><div style={{ background: T.card, borderRadius: "4px 14px 14px 14px", border: `1px solid ${T.border}` }}><TypingDots /></div></div>}
        <div ref={ref} />
      </div>
      <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setMode("voice")} style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.accent, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🎙️</button>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(text); }} placeholder="Describe how you feel…" style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 13.5, outline: "none" }} />
          <button onClick={() => sendMessage(text)} style={{ width: 42, height: 42, borderRadius: 12, border: "none", background: T.grad, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 10: Session End
   ═══════════════════════════════════════════════════════════════ */
const SessionEndScreen = ({ baselinePins, finalPins, onHome, onThankYou }) => (
  <>
    <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Session Complete</span>} />
    <ScreenWrap>
      <div style={{ textAlign: "center", marginBottom: 20, animation: "slideUp .5s ease" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 24 }}>✨</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Session Complete</h2>
        <p style={{ fontSize: 13, color: T.textMuted }}>Here's how your symptoms changed</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.border}` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1 }}>BEFORE</div><BodyMap side="front" pins={baselinePins} small /></div>
        <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.accent}25` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 10, fontWeight: 600, color: T.accent, letterSpacing: 1 }}>AFTER</div><BodyMap side="front" pins={finalPins} small /></div>
      </div>
      {baselinePins.map((bp, i) => { const fp = finalPins[i]; const diff = bp.severity - (fp?.severity || 0); return (
        <Card key={i} style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", animation: `slideUp ${.4 + i * .1}s ease` }}>
          <div><div style={{ fontSize: 11, color: T.textMuted }}>Symptom {i + 1}</div><div style={{ fontSize: 13, marginTop: 2 }}><span style={{ color: T.danger }}>{bp.severity}</span><span style={{ color: T.textDim, margin: "0 6px" }}>→</span><span style={{ color: T.accent }}>{fp?.severity || 0}</span></div></div>
          <Badge color={diff > 0 ? T.accent : T.warm}>{diff > 0 ? `−${diff}` : "—"}</Badge>
        </Card>
      ); })}
      <div style={{ padding: "10px 12px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}20`, marginBottom: 12, marginTop: 8 }}>
        <p style={{ fontSize: 12, color: T.blue, lineHeight: 1.55 }}>A drop of 2–4 points is what most participants describe as noticeably lighter, less sharp, or easier to move. This data is part of ongoing research with UCI.</p>
      </div>
      <Btn onClick={onThankYou} variant="accent" full>Send anonymous thank-you 💚</Btn>
      <div style={{ height: 8 }} />
      <Btn onClick={onHome} variant="ghost" full>Back to home</Btn>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 10b: Share
   ═══════════════════════════════════════════════════════════════ */
const ShareScreen = ({ onDone }) => {
  const [rated, setRated] = useState(0);
  const [thanks, setThanks] = useState(false);
  return (
    <>
      <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Share your experience</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 30, animation: "breathe 2s ease-in-out infinite" }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 6 }}>That's amazing!</h2>
            <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6 }}>We're so glad you experienced improvement. Your results help us prove that energy healing works.</p>
          </div>
          <Card style={{ marginBottom: 14, textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 10 }}>Rate Ennie</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setRated(s)} style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${s <= rated ? T.warm : T.border}`, background: s <= rated ? T.warmDim : T.surface, fontSize: 20, cursor: "pointer", transition: "all .15s", transform: s <= rated ? "scale(1.1)" : "scale(1)" }}>⭐</button>)}
            </div>
            {rated > 0 && <p style={{ fontSize: 12, color: T.accent, fontWeight: 500, animation: "slideUp .2s ease" }}>Thank you for your {rated}-star rating!</p>}
          </Card>
          <Card style={{ border: `1px solid ${T.accent}30`, background: `${T.accent}06`, marginBottom: 10 }} onClick={() => setThanks(true)}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🎥</div>
              <div style={{ flex: 1 }}><p style={{ fontSize: 15, fontWeight: 700, color: T.accent, marginBottom: 3 }}>Record a video testimonial</p><p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>30 seconds is all it takes. Share what changed for you.</p></div>
            </div>
          </Card>
          {thanks && <div style={{ padding: "12px 14px", borderRadius: 12, background: T.accentDim, border: `1px solid ${T.accent}25`, marginBottom: 10, textAlign: "center", animation: "slideUp .3s ease" }}><p style={{ fontSize: 13, color: T.accent }}>🎬 Video recording would open here in production</p></div>}
          <Label>SPREAD THE WORD</Label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[{ icon: "💬", label: "Message", color: T.accent }, { icon: "📱", label: "Social", color: T.blue }, { icon: "📋", label: "Copy link", color: T.textMuted }].map(s => <Card key={s.label} style={{ flex: 1, textAlign: "center", cursor: "pointer", padding: "12px 8px" }}><span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{s.icon}</span><span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span></Card>)}
          </div>
          <Btn variant="ghost" full onClick={onDone}>Continue</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 11: Follow-up Check-in
   ═══════════════════════════════════════════════════════════════ */
const FollowUpScreen = ({ onPositive, onNeutral, pins, setPins }) => {
  const [selPin, setSelPin] = useState(pins[0]?.id || null);
  const [side, setSide] = useState("front");
  return (
    <>
      <Header left={<Logo />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Follow-up</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <Card style={{ marginBottom: 14, background: T.blueDim, border: `1px solid ${T.blue}25` }}>
            <p style={{ fontSize: 13, color: T.blue, fontWeight: 600, marginBottom: 4 }}>24-hour check-in</p>
            <p style={{ fontSize: 13, color: T.text }}>These are your results from your last session. Adjust the sliders to reflect how you feel now.</p>
          </Card>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>{["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { const p = { id: Date.now(), x, y, side: sd, severity: 5 }; setPins(prev => [...prev, p]); setSelPin(p.id); }} onSelectPin={setSelPin} selectedPin={selPin} /></div>
          {selPin && <Card style={{ marginBottom: 14 }}><Label>HOW IS SYMPTOM #{pins.findIndex(p => p.id === selPin) + 1} NOW?</Label><Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} /></Card>}
          <Divider />
          <Label>OR QUICK RESPONSE</Label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[{ label: "100% better", icon: "✅", v: "accent", fn: "pos" }, { label: "It didn't help", icon: "✕", v: "secondary", fn: "neut" }].map(r => <Btn key={r.label} variant={r.v} small onClick={r.fn === "pos" ? onPositive : onNeutral} style={{ flex: 1 }}>{r.icon} {r.label}</Btn>)}
          </div>
          <Btn onClick={onPositive} full>Submit check-in</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 12: Healer Onboarding
   ═══════════════════════════════════════════════════════════════ */
const HealerOnboardScreen = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ language: "English", modality: "", tz: "", exp: "" });
  if (step === 0) return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Healer Sign-up</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Tell us about yourself</h2>
          <Label>LANGUAGE</Label><Input value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} placeholder="English" /><div style={{ height: 12 }} />
          <Label>MODALITY</Label><Input value={form.modality} onChange={e => setForm({ ...form, modality: e.target.value })} placeholder="e.g. Reiki, energy healing, pranic…" /><div style={{ height: 12 }} />
          <Label>TIMEZONE</Label><Input value={form.tz} onChange={e => setForm({ ...form, tz: e.target.value })} placeholder="e.g. America/Los_Angeles" /><div style={{ height: 12 }} />
          <Label>EXPERIENCE</Label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["No experience", "Some experience", "Professional"].map(e => <Btn key={e} variant={form.exp === e ? "accent" : "secondary"} small onClick={() => setForm({ ...form, exp: e })} style={{ flex: 1, fontSize: 11 }}>{e}</Btn>)}
          </div>
          {form.exp === "No experience" && <Card style={{ background: T.warmDim, border: `1px solid ${T.warm}30`, marginBottom: 12 }}><p style={{ fontSize: 12, color: T.warm }}>Complete the Human Medicine training before proceeding.</p><Btn variant="secondary" small style={{ marginTop: 8 }}>View training →</Btn></Card>}
          <Btn onClick={() => setStep(1)} full disabled={!form.modality}>Continue</Btn>
        </div>
      </ScreenWrap>
    </>
  );
  return (
    <>
      <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Agreements</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Platform rules</h2>
          <Card style={{ marginBottom: 12 }}><p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>• All sessions are mediated by AI — you cannot speak directly to the case.<br />• Sessions are anonymous on both sides.<br />• No recording of any kind.<br />• Your performance is tracked and contributes to your qualification.</p></Card>
          <Btn onClick={onComplete} full>I agree — start healing</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 13: Healer Home — NEW VERSION with specialization
   ═══════════════════════════════════════════════════════════════ */
const HealerHomeScreen = ({ onGoOnline, onSpecializations }) => {
  const specialists = CONDITIONS_DATA.filter(c => c.beatPlacebo && c.pct >= 75);
  return (
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><h2 style={{ fontSize: 20, fontWeight: 700 }}>Healer Dashboard</h2><Badge color={T.warm}>Applicant</Badge></div>
        </div>

        {/* Go Online CTA */}
        <Card style={{ marginBottom: 16, border: `2px solid ${T.green}40`, background: T.greenDim, cursor: "pointer" }} onClick={onGoOnline}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.green + "25", border: `2px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🟢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.green }}>Go online & accept cases</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Commit to a time window · Get matched instantly</div>
            </div>
            <span style={{ color: T.green, fontSize: 20 }}>→</span>
          </div>
        </Card>

        <Label>QUALIFICATION PROGRESS</Label>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13 }}>{OVERALL_STATS.beatPlacebo} / {OVERALL_STATS.sessions} sessions beat placebo</span><span style={{ fontSize: 13, color: OVERALL_STATS.pct >= OVERALL_STATS.threshold ? T.green : T.warm }}>{OVERALL_STATS.pct}%</span></div>
          <ProgressBar value={OVERALL_STATS.pct} color={OVERALL_STATS.pct >= OVERALL_STATS.threshold ? T.green : T.accent} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>Current: {OVERALL_STATS.pct}%</span>
            <span style={{ fontSize: 11, color: T.textMuted }}>General qualification: {OVERALL_STATS.threshold}%</span>
          </div>
        </Card>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <StatCard label="Sessions" value={OVERALL_STATS.sessions} icon="📊" />
          <StatCard label="Success rate" value={`${OVERALL_STATS.pct}%`} color={T.accent} icon="📈" />
          <StatCard label="Avg improvement" value="3.2" color={T.blue} icon="✦" sub="points" />
          <StatCard label="Status" value="Test" color={T.warm} icon="🔬" />
        </div>

        <Divider />

        {/* Specialization teaser */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Label>YOUR SPECIALIZATIONS</Label>
          <button onClick={onSpecializations} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View all →</button>
        </div>
        {specialists.slice(0, 2).map(c => (
          <Card key={c.id} style={{ marginBottom: 8, border: `1px solid ${T.green}30`, background: T.greenDim }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: T.green + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{c.label}</span><Badge color={T.green} bg={T.greenDim}>Specialist ✓</Badge></div>
                <div style={{ fontSize: 12, color: T.textMuted }}>{c.sessions} sessions · avg {c.avgDrop.toFixed(1)} pt drop</div>
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, color: T.green }}>{c.pct}%</span>
            </div>
          </Card>
        ))}
        {CONDITIONS_DATA.filter(c => !c.beatPlacebo).slice(0, 1).map(c => (
          <Card key={c.id} style={{ marginBottom: 8 }} onClick={onSpecializations}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.icon}</div>
              <div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</span><Badge color={T.warm} bg={T.warmDim}>Developing</Badge></div><div style={{ fontSize: 12, color: T.textMuted }}>{c.sessions} sessions · {c.pct}% — tap to start skill-build →</div></div>
            </div>
          </Card>
        ))}

        <Divider />

        <Label>EARNINGS</Label>
        <Card style={{ marginBottom: 16 }}>
          {[{ period: "Today", amount: "$87.50", color: T.accent }, { period: "This Week", amount: "$462.50", color: T.blue }, { period: "This Month", amount: "$1,840.00", color: T.purple }].map((e, i) => (
            <div key={e.period} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
              <span style={{ fontSize: 14, color: T.textMuted }}>{e.period}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: e.color }}>{e.amount}</span>
            </div>
          ))}
        </Card>

        <Card style={{ background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}20`, textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💜</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.5 }}>"You've helped reduce 38.4 severity points this month."</p>
          <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>That's real pain, lifted from real people.</p>
        </Card>
      </div>
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 13b: Specialization Engine
   ═══════════════════════════════════════════════════════════════ */
const SpecializationScreen = ({ onBack, onStartSkillBuild }) => {
  const [expanded, setExpanded] = useState(null);
  const colorFor = (pct) => pct >= 80 ? T.green : pct >= 65 ? T.accent : pct >= 45 ? T.warm : T.danger;
  const specialists = CONDITIONS_DATA.filter(c => c.beatPlacebo && c.pct >= 75);
  const developing = CONDITIONS_DATA.filter(c => !c.beatPlacebo || c.pct < 75);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, fontWeight: 600, color: T.textMuted }}>Your specializations</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .35s ease" }}>
          <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}25` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 2 }}>Overall qualification</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{OVERALL_STATS.beatPlacebo}/{OVERALL_STATS.sessions}</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>sessions beat placebo threshold</div>
              </div>
              <Badge color={T.warm} bg={T.warmDim}>Below 75% threshold</Badge>
            </div>
            <ProgressBar value={OVERALL_STATS.pct} color={T.accent} height={8} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>{OVERALL_STATS.pct}% success rate</span>
              <span style={{ fontSize: 11, color: T.textMuted }}>Need {OVERALL_STATS.threshold}% to qualify broadly</span>
            </div>
            <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(155,138,251,0.12)", border: `1px solid ${T.accent}20` }}>
              <p style={{ fontSize: 12, color: T.text, lineHeight: 1.55 }}>
                You haven't qualified as a general healer yet — but you're showing <strong>strong results in specific conditions</strong>. We're routing specialist sessions your way to help you qualify condition-by-condition.
              </p>
            </div>
          </Card>

          {specialists.length > 0 && <>
            <Label>CONFIRMED SPECIALIZATIONS ✓</Label>
            {specialists.map(c => (
              <Card key={c.id} style={{ marginBottom: 10, border: `1px solid ${T.green}30`, background: T.greenDim }} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.green + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{c.label}</span><Badge color={T.green} bg={T.greenDim}>Specialist ✓</Badge></div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{c.sessions} sessions · avg {c.avgDrop.toFixed(1)} pt drop · top {100 - c.pct}%</div>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: T.green }}>{c.pct}%</span>
                </div>
                {expanded === c.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.green}25`, animation: "fadeIn .2s ease" }}>
                    <ProgressBar value={c.pct} color={T.green} height={6} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, marginBottom: 10 }}><span style={{ fontSize: 11, color: T.textMuted }}>Your rate</span><span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>{c.pct}% beat placebo threshold</span></div>
                    <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>You're now a <strong>paid specialist</strong> for {c.label}. Patients with this condition are matched to you first. You can also accept skill-build sessions in other conditions to grow your range.</p>
                  </div>
                )}
              </Card>
            ))}
          </>}

          <Divider />
          <Label>CONDITIONS TO DEVELOP</Label>
          <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55, marginBottom: 12 }}>Choose one to enter skill-build mode — we'll queue you only these cases so you can practise specifically.</p>
          {developing.map(c => (
            <Card key={c.id} style={{ marginBottom: 10 }} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</span><Badge color={T.warm} bg={T.warmDim}>Developing</Badge></div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{c.sessions} sessions · avg {c.avgDrop.toFixed(1)} pt drop</div>
                </div>
                <div style={{ textAlign: "right" }}><span style={{ fontSize: 18, fontWeight: 700, color: colorFor(c.pct) }}>{c.pct}%</span><div style={{ fontSize: 10, color: T.textMuted }}>vs 75%</div></div>
              </div>
              {expanded === c.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, animation: "fadeIn .2s ease" }}>
                  <ProgressBar value={c.pct} max={100} color={colorFor(c.pct)} height={6} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, marginBottom: 12 }}><span style={{ fontSize: 11, color: T.textMuted }}>{c.pct}% now</span><span style={{ fontSize: 11, color: T.textMuted }}>75% to qualify</span></div>
                  <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55, marginBottom: 12 }}>In skill-build mode, we'll queue you <em>only</em> {c.label} cases. Once you clear 75%, you unlock paid specialist sessions for this condition.</p>
                  <Btn variant="accent" full small onClick={() => onStartSkillBuild(c)}>Start skill-build: {c.label} →</Btn>
                </div>
              )}
            </Card>
          ))}
          <div style={{ height: 24 }} />
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 13c: Skill-Build Confirm
   ═══════════════════════════════════════════════════════════════ */
const SkillBuildConfirmScreen = ({ condition, onConfirm, onBack }) => (
  <>
    <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, fontWeight: 600, color: T.textMuted }}>Skill-build mode</span>} />
    <ScreenWrap>
      <div style={{ animation: "slideUp .35s ease" }}>
        <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{condition.icon}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Skill-build: {condition.label}</h2>
          <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>While in skill-build mode, we'll only queue you <strong>{condition.label}</strong> cases. This helps you develop targeted ability faster.</p>
        </div>
        <Card style={{ marginBottom: 12, background: T.accentDim, border: `1px solid ${T.accent}25` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginBottom: 8 }}>What changes in skill-build mode</div>
          {[["Sessions queued", `Only ${condition.label} cases`], ["Goal", "Reach 75% success rate"], ["Current rate", `${condition.pct}% (${condition.sessions} sessions)`], ["Sessions needed", "~8–12 more at this pace"], ["Reward", "Paid specialist for this condition"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.accent}15` }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>{k}</span><span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card style={{ marginBottom: 20, background: T.warmDim, border: `1px solid ${T.warm}25` }}>
          <p style={{ fontSize: 12, color: T.text, lineHeight: 1.55 }}><strong>Note:</strong> You can exit skill-build mode at any time from your dashboard. Your confirmed specializations (Arthritis, Migraine) remain active — you'll still receive those as a paid specialist in parallel.</p>
        </Card>
        <Btn full onClick={onConfirm}>Enter skill-build mode →</Btn>
        <div style={{ height: 8 }} />
        <Btn variant="ghost" full onClick={onBack}>Not now</Btn>
      </div>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 13d: Availability Commitment — replaces simple toggle
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   HEALER STEP 1: Availability Ping — System asks, healer responds
   ═══════════════════════════════════════════════════════════════ */
const HealerPingScreen = ({ skillBuildCondition, onYes, onNo }) => {
  const firstWindow = systemWindow();
  const [totalHours, setTotalHours] = useState(1);
  const totalMins = totalHours * 60;
  const estSessions = Math.floor(totalMins / 8); // ~8 min per session cycle

  return (
    <>
      <Header left={<BackBtn onClick={onNo} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>Healer · availability check</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .3s ease" }}>

          {/* Bell + headline */}
          <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26 }}>🔔</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginBottom: 10 }}>Patients ready.</div>
            <p style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.65 }}>
              We have <strong style={{ color: T.text }}>3 patients</strong> in queue.<br />
              Your first session will arrive within <strong style={{ color: T.text }}>{firstWindow} minutes.</strong>
            </p>
          </div>

          {skillBuildCondition && (
            <div style={{ background: T.accentDim, borderRadius: 14, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{skillBuildCondition.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>Skill-build: {skillBuildCondition.label}</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>Only {skillBuildCondition.label} cases will be sent to you</div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: T.border, margin: "4px 0 20px" }} />

          {/* Total availability — healer chooses */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>How long are you available today?</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>After each session we'll re-check. You'll stay in the pool until your time is up or you go offline.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[{ h: 0.5, label: "30 min" }, { h: 1, label: "1 hr" }, { h: 2, label: "2 hr" }, { h: 4, label: "4 hr" }, { h: 8, label: "All day" }].map(opt => (
                <button key={opt.h} onClick={() => setTotalHours(opt.h)} style={{ padding: "9px 16px", borderRadius: 100, border: `1.5px solid ${totalHours === opt.h ? T.text : T.border}`, background: totalHours === opt.h ? T.text : "transparent", color: totalHours === opt.h ? "#fff" : T.textMuted, fontSize: 13, fontWeight: totalHours === opt.h ? 600 : 400, cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}>{opt.label}</button>
              ))}
            </div>
          </div>

          {/* What this means */}
          <Card style={{ background: "#FAFAFA", marginBottom: 20 }}>
            {[
              ["First session arrives", `within ${firstWindow} min`],
              ["Total availability", totalHours < 1 ? "30 minutes" : totalHours === 1 ? "1 hour" : totalHours === 8 ? "All day" : `${totalHours} hours`],
              ["Est. sessions", `~${estSessions} sessions`],
              ["After each session", "Re-pinged automatically"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.textMuted }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{v}</span>
              </div>
            ))}
          </Card>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => onYes(totalHours)} full style={{ flex: 2 }}>Yes, I'm available</Btn>
            <Btn onClick={onNo} variant="ghost" style={{ flex: 1 }}>Not now</Btn>
          </div>
          <p style={{ fontSize: 12, color: T.textDim, marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>
            Committing to availability — not a specific case yet. The case notification comes next.
          </p>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HEALER STEP 2: Committed — waiting for case notification
   ═══════════════════════════════════════════════════════════════ */
const HealerCommittedScreen = ({ skillBuildCondition, totalHours = 1, onMatch, onBack }) => {
  const firstWindow = systemWindow();
  const [countdown, setCountdown] = useState(firstWindow * 60);
  const [phase, setPhase] = useState("waiting"); // "waiting" | "getReady" | "incoming"
  const totalMins = totalHours * 60;
  const estSessions = Math.floor(totalMins / 8);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(interval); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate: get-ready alert fires 8s in (represents ~60s before real case)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("getReady"), 8000);
    // Then case arrives 4s after get-ready
    const t2 = setTimeout(() => { setPhase("incoming"); setTimeout(onMatch, 1500); }, 12000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onMatch]);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const pct = (countdown / (firstWindow * 60)) * 100;
  const totalLabel = totalHours < 1 ? "30 min" : totalHours === 1 ? "1 hr" : totalHours === 8 ? "all day" : `${totalHours} hr`;

  // ── GET READY STATE ──
  if (phase === "getReady" || phase === "incoming") {
    const isIncoming = phase === "incoming";
    return <>
      <Header center={<Logo />} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 24px", textAlign: "center" }}>

        {/* Pulsing alert ring */}
        <div style={{ position: "relative", width: 100, height: 100, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: isIncoming ? T.greenDim : T.warmDim, animation: "breathe 1s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: `2px solid ${isIncoming ? T.green : T.warm}`, opacity: 0.4, animation: "orbRipple 1.2s ease-out infinite" }} />
          <span style={{ fontSize: 40, position: "relative", zIndex: 1 }}>{isIncoming ? "🟢" : "⚡"}</span>
        </div>

        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginBottom: 10, color: isIncoming ? T.green : T.warm }}>
          {isIncoming ? "Case arriving now" : "Get ready."}
        </div>
        <p style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.65, marginBottom: 28, maxWidth: 280 }}>
          {isIncoming
            ? "You're about to receive the 5-second claim notification. Stay on this screen."
            : "You're next in the healer queue. A case is about to be sent to you — put your phone where you can see it."}
        </p>

        {/* What's coming */}
        <Card style={{ width: "100%", marginBottom: 20, background: isIncoming ? T.greenDim : T.warmDim, border: `1px solid ${isIncoming ? T.green : T.warm}25` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>Condition</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{skillBuildCondition?.label || "Arthritis"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>Baseline severity</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>7/10</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>You have</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: isIncoming ? T.green : T.warm }}>5 seconds to claim</span>
          </div>
        </Card>

        {!isIncoming && (
          <p style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6 }}>
            If you miss it, the case goes to the next healer in queue.
          </p>
        )}
        {isIncoming && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, animation: `pulse 0.8s ease ${i * 0.2}s infinite` }} />)}
          </div>
        )}
      </div>
    </>;
  }

  // ── WAITING STATE ──
  return (
    <>
      <Header center={<Logo />} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.greenDim, border: `2px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, animation: "breathe 2s ease-in-out infinite", fontSize: 32 }}>🟢</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: -1.2, marginBottom: 8 }}>You're live</div>
        <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 24, lineHeight: 1.65 }}>
          Available for <strong style={{ color: T.text }}>{totalLabel}</strong> · est. <strong style={{ color: T.text }}>{estSessions} sessions</strong><br />
          First case arrives within <strong style={{ color: T.text }}>{firstWindow} min</strong>
        </p>

        <Card style={{ width: "100%", marginBottom: 16, background: "#FAFAFA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>First case arriving in</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: T.green }}>{mins}:{String(secs).padStart(2, "0")}</span>
          </div>
          <ProgressBar value={pct} color={T.text} height={4} />
          <p style={{ fontSize: 11, color: T.textDim, marginTop: 8, textAlign: "center" }}>You'll get a heads-up before the case notification arrives</p>
        </Card>

        <Card style={{ width: "100%", marginBottom: 20, background: "#FAFAFA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>Total availability</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{totalLabel}</span>
          </div>
          <ProgressBar value={100} color="#EBEBEB" height={4} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: T.textDim }}>Now</span>
            <span style={{ fontSize: 11, color: T.textDim }}>~{estSessions} sessions possible</span>
            <span style={{ fontSize: 11, color: T.textDim }}>{totalLabel}</span>
          </div>
        </Card>

        <div style={{ width: "100%", textAlign: "left", marginBottom: 24 }}>
          {[
            { n: "1", done: true, title: "Availability confirmed", sub: `${totalLabel} total · first case in ~${firstWindow} min` },
            { n: "2", done: false, title: "Get-ready alert", sub: "~60s warning before case notification" },
            { n: "3", done: false, title: "5-second claim", sub: "First healer to respond gets the case" },
          ].map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: s.done ? T.text : "#F5F5F5", border: s.done ? "none" : `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: s.done ? "#fff" : T.textMuted, flexShrink: 0, marginTop: 1 }}>{s.done ? "✓" : s.n}</div>
              <div><div style={{ fontSize: 14, fontWeight: 500 }}>{s.title}</div><div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{s.sub}</div></div>
            </div>
          ))}
        </div>
        <Btn variant="danger" small onClick={onBack}>Go offline</Btn>
      </div>
    </>
  );
};


/* ═══════════════════════════════════════════════════════════════
   SCREEN 14: Smart Match Notification — replaces MatchScreen
   ═══════════════════════════════════════════════════════════════ */
const SmartMatchScreen = ({ skillBuildCondition, onClaim, onDecline }) => {
  const [countdown, setCountdown] = useState(5);
  const [claimed, setClaimed] = useState(false);
  const matchedCase = skillBuildCondition || CONDITIONS_DATA.find(c => c.id === "arthritis");

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); onDecline(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = () => { setClaimed(true); setTimeout(onClaim, 800); };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg }}>
      <Header center={<span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Case incoming</span>} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{ width: "100%", maxWidth: 360, animation: claimed ? "fadeIn .2s" : "slideUp .4s ease" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: "ripple 1.5s ease-out infinite" }} />
            <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: "ripple 1.5s ease-out .5s infinite" }} />
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{matchedCase?.icon || "🙌"}</div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 6 }}>Match found!</h2>
          <p style={{ fontSize: 14, color: T.textMuted, textAlign: "center", marginBottom: 20 }}>A case matching your specialization is waiting.</p>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: T.textMuted }}>Condition</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{matchedCase?.label}</span>
                <Badge color={skillBuildCondition ? T.accent : T.green}>{skillBuildCondition ? "Skill-build match" : "Specialist match"}</Badge>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, color: T.textMuted }}>Baseline severity</span><span style={{ fontSize: 13, fontWeight: 600, color: T.warm }}>7/10</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, color: T.textMuted }}>Duration</span><span style={{ fontSize: 13 }}>6+ months</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: T.textMuted }}>Session type</span><span style={{ fontSize: 13 }}>Remote · 5 min</span></div>
          </Card>
          <Card style={{ marginBottom: 20, background: T.accentDim, border: `1px solid ${T.accent}25` }}>
            <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, marginBottom: 4 }}>Why you were matched</div>
            <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>
              {skillBuildCondition
                ? `You're in skill-build mode for ${matchedCase?.label}. This case was reserved for you.`
                : `Your ${matchedCase?.label} success rate (${matchedCase?.pct}%) puts you in the top ${100 - (matchedCase?.pct || 80)}% of healers for this condition.`}
            </p>
          </Card>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: T.textMuted }}>Claim within</span><span style={{ fontSize: 14, fontWeight: 700, color: countdown <= 2 ? T.danger : T.accent }}>{countdown}s</span></div>
            <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(countdown / 5) * 100}%`, background: countdown <= 2 ? T.danger : T.accent, borderRadius: 2, transition: "width 1s linear, background .3s" }} />
            </div>
          </div>
          <Btn full onClick={handleClaim} disabled={claimed}>{claimed ? "Claimed! Starting session…" : "Claim this session →"}</Btn>
          <div style={{ height: 8 }} />
          <Btn variant="ghost" full small onClick={onDecline}>Pass — let another healer take it</Btn>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 15: Healer Session Room — with mid-session check-in & tools log
   ═══════════════════════════════════════════════════════════════ */
const HealerSessionScreen = ({ onEnd }) => {
  const [timer, setTimer] = useState(300);
  const [msgs, setMsgs] = useState([
    { text: "Case is connected. You can see their symptom map. Begin when ready.", isAI: true },
    { text: "Case reports: chronic pain, lower back, severity 7/10.", isAI: true },
  ]);
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [caseSev, setCaseSev] = useState(7);
  const [checkIns, setCheckIns] = useState([{ time: 300, sev: 7 }]); // timestamps + readings
  const [showToolsLog, setShowToolsLog] = useState(false);
  const [tools, setTools] = useState({ visualisation: false, trauma: false, bodyFocus: false, remote: true, group: false });
  const ref = useRef(null);

  useEffect(() => {
    const i = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(i); onEnd(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(i);
  }, [onEnd]);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const doCheckIn = () => {
    setMsgs(m => [...m, { text: `Mid-session check-in logged: severity ${caseSev}/10 at ${Math.floor((300 - timer) / 60)}:${String((300 - timer) % 60).padStart(2,"0")} elapsed`, isAI: true }]);
    setCheckIns(c => [...c, { time: timer, sev: caseSev }]);
  };

  const sendMessage = (msg) => {
    if (!msg.trim()) return;
    setMsgs(m => [...m, { text: msg, isAI: false }]);
    setText("");
    setTimeout(async () => {
      setMsgs(m => [...m, { text: "Mediator is typing…", isAI: true }]);
      await wait(1500);
      const responses = [
        "Case says: I think I feel something shifting in that area.",
        `Case update: severity moved from ${caseSev} to ${Math.max(0, caseSev - 2)}. Body map updated.`,
        "Case says: There's a warmth building where the pain was.",
        "Case says: It's subtle but something is different.",
      ];
      const resp = responses[Math.floor(Math.random() * responses.length)];
      setMsgs(m => m.slice(0, -1).concat({ text: resp, isAI: true }));
      if (resp.includes("severity moved")) setCaseSev(s => Math.max(0, s - 2));
    }, 800);
  };

  const toolLabels = { visualisation: "Visualisation", trauma: "Trauma / emotional", bodyFocus: "Body region focus", remote: "Remote", group: "Group" };

  return (
    <>
      <Header
        left={<span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: .5 }}>HEALER VIEW</span>}
        center={<TimerRing seconds={timer} total={300} />}
        right={<Btn variant="danger" small onClick={onEnd} style={{ padding: "5px 12px" }}>End</Btn>}
      />

      {/* Case body map + info */}
      <div style={{ display: "flex", gap: 8, padding: "8px 16px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <BodyMap side="front" pins={[{ id: 1, x: 52, y: 55, side: "front", severity: caseSev }]} small />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Label>CASE INFO</Label>
          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>
            Category: Arthritis<br />
            Severity: <span style={{ color: caseSev <= 4 ? T.accent : caseSev <= 6 ? T.warm : T.danger, fontWeight: 700 }}>{caseSev}/10</span><br />
            Duration: Months
          </div>
          {/* Mini check-in graph */}
          {checkIns.length > 1 && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginTop: 6, height: 24 }}>
              {checkIns.map((c, i) => <div key={i} style={{ flex: 1, height: `${(c.sev / 10) * 100}%`, background: i === checkIns.length - 1 ? T.accent : T.border, borderRadius: 2, minHeight: 2, transition: "height .3s" }} title={`${c.sev}/10`} />)}
              <span style={{ fontSize: 9, color: T.textDim, marginLeft: 2 }}>trend</span>
            </div>
          )}
          <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
            <button onClick={doCheckIn} style={{ padding: "4px 8px", borderRadius: 8, border: `1px solid ${T.accent}40`, background: T.accentDim, color: T.accent, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>+ Check-in</button>
            <button onClick={() => setShowToolsLog(t => !t)} style={{ padding: "4px 8px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>🔧 Tools</button>
          </div>
          <div style={{ marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: "pulse 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 4 }}>Live updating</span>
          </div>
        </div>
      </div>

      {/* Tools log drawer */}
      {showToolsLog && (
        <div style={{ padding: "10px 16px", background: T.surface, borderBottom: `1px solid ${T.border}`, animation: "slideDown .2s ease" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Techniques used this session</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(toolLabels).map(([k, label]) => (
              <button key={k} onClick={() => setTools(t => ({ ...t, [k]: !t[k] }))} style={{ padding: "5px 10px", borderRadius: 10, border: `1px solid ${tools[k] ? T.accent + "50" : T.border}`, background: tools[k] ? T.accentDim : "transparent", color: tools[k] ? T.accent : T.textMuted, fontSize: 11, fontWeight: tools[k] ? 700 : 400, cursor: "pointer", transition: "all .15s" }}>{tools[k] ? "✓ " : ""}{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Chat */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
        <div ref={ref} />
      </div>

      {/* Input */}
      <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setMode(m => m === "text" ? "voice" : "text")} style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.accent, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{mode === "text" ? "🎙️" : "⌨️"}</button>
          {mode === "voice" ? (
            <button onClick={() => { const samples = ["Focus on the lower back area", "Trying a different approach", "Can you ask them to breathe deeply", "Shifting attention to the shoulder"]; sendMessage(samples[Math.floor(Math.random() * samples.length)]); }} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `2px solid ${T.accent}50`, background: `${T.accent}08`, color: T.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: T.danger, animation: "pulse 1.5s infinite", display: "inline-block" }} />Tap to speak</button>
          ) : (
            <>
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(text); }} placeholder="Message AI mediator…" style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 13.5, outline: "none" }} />
              <button onClick={() => sendMessage(text)} style={{ width: 42, height: 42, borderRadius: 12, border: "none", background: T.grad, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 16: Healer Post-Session
   ═══════════════════════════════════════════════════════════════ */
const HealerPostScreen = ({ onReady, onHome }) => (
  <>
    <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Session Complete</span>} />
    <ScreenWrap>
      <div style={{ textAlign: "center", marginBottom: 20, animation: "slideUp .4s ease" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 24 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Nice work</h2>
        <p style={{ fontSize: 13, color: T.textMuted }}>Case reported improvement.</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard label="This Session" value="−3" color={T.accent} sub="avg improvement" />
        <StatCard label="Career Total" value="4" sub="sessions" color={T.blue} />
      </div>
      <Label>PRIVATE NOTES (OPTIONAL)</Label>
      <textarea placeholder="Add notes about this session…" style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, height: 80, outline: "none", resize: "none", fontFamily: "inherit" }} />
      <div style={{ height: 16 }} />
      <Btn onClick={onReady} full>Ready for another session</Btn>
      <div style={{ height: 8 }} />
      <Btn onClick={onHome} variant="ghost" full>Go offline</Btn>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 17–18b: Tiers + Payment
   ═══════════════════════════════════════════════════════════════ */
const TierScreen = ({ onSelect, onGroup, onBack }) => (
  <>
    <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Super Sessions</span>} />
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Choose your session tier</h2>
        <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>All tiers are Super Sessions with a verified healer.</p>
        {paidTiersData.map((t, i) => <Card key={t.name} onClick={() => onSelect(t)} style={{ marginBottom: 10, cursor: "pointer", border: `1px solid ${t.color}25`, animation: `slideUp ${.3 + i * .08}s ease` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 16, fontWeight: 700, color: t.color }}>{t.name}</span><span style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.price}</span></div><p style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>{t.desc}</p>{t.stat && <p style={{ fontSize: 11, color: T.accent, marginBottom: 8, padding: "6px 8px", borderRadius: 8, background: T.accentDim, lineHeight: 1.45 }}>📊 {t.stat}</p>}<div style={{ display: "flex", gap: 8 }}><Badge color={t.color}>{t.urgency}</Badge><Badge color={T.textMuted}>~{t.wait}</Badge></div></Card>)}
        <Card onClick={onGroup} style={{ cursor: "pointer", border: `1px solid ${T.purple}30`, background: `${T.purple}08` }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👥</div><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: T.purple }}>Group Healing</div><div style={{ fontSize: 12, color: T.textMuted }}>From $19.99/mo · 8 sessions per month</div></div></div></Card>
      </div>
    </ScreenWrap>
  </>
);

const PaymentScreen = ({ tier, onPay, onBack }) => {
  const [save, setSave] = useState(false);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Payment</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <Card style={{ marginBottom: 16, border: `1px solid ${tier?.color || T.accent}30` }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 15, fontWeight: 600 }}>{tier?.name}</span><span style={{ fontSize: 18, fontWeight: 800, color: tier?.color || T.accent }}>{tier?.price}</span></div></Card>
          <Label>CARD NUMBER</Label><Input placeholder="4242 4242 4242 4242" /><div style={{ height: 10 }} />
          <div style={{ display: "flex", gap: 10 }}><div style={{ flex: 1 }}><Label>EXPIRY</Label><Input placeholder="MM/YY" /></div><div style={{ flex: 1 }}><Label>CVC</Label><Input placeholder="123" /></div></div>
          <div style={{ height: 16 }} />
          <Btn variant="secondary" full style={{ marginBottom: 8 }}> Pay</Btn>
          <Btn variant="secondary" full style={{ marginBottom: 16 }}>G Pay</Btn>
          <Toggle on={save} onToggle={() => setSave(!save)} label="Save card for future sessions" />
          <Divider />
          <p style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>Full charge upfront. Automatic refund if no match found, session fails, or safety stop.</p>
          <div style={{ height: 16 }} />
          <Btn onClick={onPay} full>Pay {tier?.price}</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

const PaymentConfirmScreen = ({ tier, onContinue }) => (
  <>
    <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Confirmed</span>} />
    <ScreenWrap>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "65vh", textAlign: "center", animation: "slideUp .4s ease" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 28, animation: "breathe 2s ease-in-out infinite" }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Payment confirmed</h2>
        <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 24, lineHeight: 1.6 }}>Your <span style={{ color: tier?.color || T.accent, fontWeight: 700 }}>{tier?.name}</span> has been booked.</p>
        <Card style={{ width: "100%", marginBottom: 24, border: `1px solid ${tier?.color || T.accent}25` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: T.textMuted }}>Tier</span><span style={{ fontSize: 14, fontWeight: 600, color: tier?.color || T.accent }}>{tier?.name}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: T.textMuted }}>Amount</span><span style={{ fontSize: 14, fontWeight: 700 }}>{tier?.price}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: T.textMuted }}>Est. wait</span><span style={{ fontSize: 14 }}>~{tier?.wait}</span></div>
        </Card>
        <Btn onClick={onContinue} full>Join Queue</Btn>
      </div>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 19: Charlie Reveal (modal)
   ═══════════════════════════════════════════════════════════════ */
const CharlieReveal = ({ onAccept, onDecline }) => (
  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn .3s ease" }}>
    <Card style={{ width: "100%", maxWidth: 340, textAlign: "center", padding: 24, border: `1px solid ${T.accent}30` }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, fontWeight: 800, color: T.bg }}>CG</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Your healer is Charlie Goldsmith</h3>
      <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 20 }}>He'd like to continue on video — do you agree?</p>
      <Btn onClick={onAccept} full>Yes, switch to video</Btn>
      <div style={{ height: 8 }} />
      <Btn onClick={onDecline} variant="ghost" full>No thanks — stay anonymous</Btn>
      <p style={{ fontSize: 10, color: T.textDim, marginTop: 12 }}>No recording. 18+ only.</p>
    </Card>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   SHARED SCREENS: History, Support, Profile, Delete, Admin
   ═══════════════════════════════════════════════════════════════ */
const sessionHistory = [
  { date: "Mar 15, 2026", issue: "Chronic Pain", before: 7, after: 3, dur: "4:32", alias: "Ember" },
  { date: "Mar 10, 2026", issue: "Tension", before: 5, after: 2, dur: "5:00", alias: "Solace" },
  { date: "Feb 28, 2026", issue: "Emotional", before: 6, after: 4, dur: "4:58", alias: "Lumen" },
];

const HistoryScreen = () => {
  const [detail, setDetail] = useState(null);
  if (detail !== null) {
    const s = sessionHistory[detail];
    return (
      <ScreenWrap>
        <div style={{ animation: "slideUp .3s ease" }}>
          <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 16, cursor: "pointer", marginBottom: 12 }}>← Back to history</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{s.issue}</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{s.date} · {s.dur} · {s.alias}</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.border}` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 1 }}>BEFORE</div><BodyMap side="front" pins={[{ id: 1, x: 52, y: 55, side: "front", severity: s.before }]} small /></div>
            <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.accent}25` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.accent, letterSpacing: 1 }}>AFTER</div><BodyMap side="front" pins={[{ id: 1, x: 52, y: 55, side: "front", severity: s.after }]} small /></div>
          </div>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: T.textMuted }}>Severity change</span><span style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>−{s.before - s.after} points</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: T.textMuted }}>Duration</span><span style={{ fontSize: 14 }}>{s.dur}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: T.textMuted }}>Healer</span><span style={{ fontSize: 14 }}>{s.alias}</span></div>
          </Card>
        </div>
      </ScreenWrap>
    );
  }
  return (
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Session History</h2>
        <Card style={{ marginBottom: 16, padding: "12px 14px" }}>
          <Label>SYMPTOM TREND</Label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
            {[7, 5, 6, 3, 2, 4].map((v, i) => <div key={i} style={{ flex: 1, height: `${v * 10}%`, background: `linear-gradient(180deg, ${T.accent}, ${T.accent}40)`, borderRadius: 4, minHeight: 4 }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span style={{ fontSize: 12, color: T.textDim }}>Feb</span><span style={{ fontSize: 12, color: T.textDim }}>Mar</span></div>
        </Card>
        {sessionHistory.map((s, i) => (
          <Card key={i} onClick={() => setDetail(i)} style={{ marginBottom: 8, cursor: "pointer", animation: `slideUp ${.3 + i * .08}s ease` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>{s.issue}</div><div style={{ fontSize: 12, color: T.textMuted }}>{s.date} · {s.dur}</div></div>
              <Badge color={T.accent}>−{s.before - s.after}</Badge>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.danger }}>Before: {s.before}</span>
              <span style={{ fontSize: 12, color: T.accent }}>After: {s.after}</span>
              <span style={{ fontSize: 12, color: T.textDim, marginLeft: "auto" }}>{s.alias}</span>
            </div>
          </Card>
        ))}
      </div>
    </ScreenWrap>
  );
};

const SupportScreen = () => {
  const types = [
    { icon: "🚨", label: "Safety issue", color: T.danger },
    { icon: "⚠️", label: "Inappropriate behaviour", color: T.warm },
    { icon: "🔧", label: "Technical problem", color: T.blue },
    { icon: "💳", label: "Payment issue", color: T.purple },
    { icon: "💬", label: "Session feedback", color: T.accent },
    { icon: "📋", label: "Request account data", color: T.textMuted },
  ];
  return (
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Support</h2>
        <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>AI handles common issues. Complex ones go to a human.</p>
        {types.map((t, i) => <Card key={t.label} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", animation: `slideUp ${.2 + i * .05}s ease` }}><span style={{ fontSize: 22 }}>{t.icon}</span><span style={{ fontSize: 14, fontWeight: 500, color: t.color }}>{t.label}</span></Card>)}
        <Divider />
        <p style={{ fontSize: 12, color: T.textDim }}>Urgent safety: call +1-800-ENNIE<br />Email: support@ennie.app<br />Response SLA: within 24 hours</p>
      </div>
    </ScreenWrap>
  );
};

const ProfileScreen = ({ role, setRole }) => (
  <ScreenWrap>
    <div style={{ animation: "slideUp .4s ease" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Profile & Settings</h2>
      <Label>ROLE</Label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Case", "Healer"].map(r => <Btn key={r} variant={role === r.toLowerCase() ? "accent" : "secondary"} small onClick={() => setRole(r.toLowerCase())} style={{ flex: 1 }}>{r}</Btn>)}
      </div>
      <Label>DISPLAY NAME</Label><Input placeholder="Your name" style={{ marginBottom: 10 }} />
      <Label>EMAIL</Label><Input placeholder="you@example.com" style={{ marginBottom: 10 }} />
      <Label>LANGUAGE</Label><Input placeholder="English" style={{ marginBottom: 10 }} />
      <Divider />
      <Label>NOTIFICATIONS</Label>
      <Card style={{ marginBottom: 10 }}><Toggle on={true} onToggle={() => {}} label="Session reminders" /></Card>
      <Card style={{ marginBottom: 10 }}><Toggle on={true} onToggle={() => {}} label="Follow-up check-ins" /></Card>
      <Card style={{ marginBottom: 10 }}><Toggle on={false} onToggle={() => {}} label="Marketing updates" /></Card>
      <Divider />
      <Label>PAYMENT METHODS</Label>
      <Card style={{ marginBottom: 10 }}><p style={{ fontSize: 13 }}>Visa •••• 4242</p></Card>
      <Btn variant="ghost" small full>Add payment method</Btn>
      <Divider />
      <Label>CONSENT HISTORY</Label>
      <Card><p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>Terms accepted: March 16, 2026<br />Privacy policy: March 16, 2026<br />AI mediation agreement: March 16, 2026</p></Card>
    </div>
  </ScreenWrap>
);

const DeleteScreen = ({ onBack }) => {
  const [confirm, setConfirm] = useState("");
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>Delete Account</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <Card style={{ background: T.dangerDim, border: `1px solid ${T.danger}30`, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.danger, marginBottom: 6 }}>This is permanent</h3>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>Your account will be deleted immediately. Personal data removed or anonymised. Financial/legal records retained as required by law.</p>
          </Card>
          <Label>TYPE "DELETE" TO CONFIRM</Label>
          <Input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE" />
          <div style={{ height: 16 }} />
          <Btn variant="danger" full disabled={confirm !== "DELETE"}>Delete my account</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

const AdminDashboard = () => (
  <ScreenWrap>
    <div style={{ animation: "slideUp .4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Admin</h2>
        <Badge color={T.purple}>Super Admin</Badge>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard label="Live Queue" value="24" color={T.accent} icon="📊" sub="by tier ↗" />
        <StatCard label="Avg Wait" value="14m" color={T.blue} icon="⏱️" sub="by tier ↗" />
        <StatCard label="Active Sessions" value="8" color={T.warm} icon="🔴" sub="drillable ↗" />
        <StatCard label="Healers Online" value="31" color={T.accent} icon="👤" sub="by status ↗" />
        <StatCard label="Failed Matches" value="2" color={T.danger} icon="❌" sub="last hour ↗" />
        <StatCard label="Safety Incidents" value="0" color={T.accent} icon="🛡️" sub="none pending" />
        <StatCard label="Revenue Today" value="$4,280" color={T.accent} icon="💰" sub="free: 45 · paid: 18" />
        <StatCard label="Success Rate" value="72%" color={T.accent} icon="📈" sub="meaningful change" />
      </div>
      <Label>SPECIALIST ROUTING — TODAY</Label>
      <Card style={{ marginBottom: 12 }}>
        {CONDITIONS_DATA.filter(c => c.beatPlacebo).map((c, i) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < CONDITIONS_DATA.filter(x => x.beatPlacebo).length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>{c.icon}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12, color: T.textMuted }}>{Math.floor(Math.random() * 5 + 1)} specialists online</span><Badge color={T.green}>Active</Badge></div>
          </div>
        ))}
      </Card>
      <Label>QUALIFICATION THRESHOLDS</Label>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: T.textMuted }}>Min sessions for general qualification</span><span style={{ fontSize: 13, fontWeight: 600 }}>20</span></div><ProgressBar value={20} max={20} color={T.blue} /></div>
        <div style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: T.textMuted }}>Threshold to beat placebo</span><span style={{ fontSize: 13, fontWeight: 600 }}>75%</span></div><ProgressBar value={75} color={T.accent} /></div>
        <div style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: T.textMuted }}>Min sessions for specialty path</span><span style={{ fontSize: 13, fontWeight: 600 }}>8 per condition</span></div><ProgressBar value={8} max={20} color={T.warm} /></div>
        <div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: T.textMuted }}>Session timeout (seconds)</span><span style={{ fontSize: 13, fontWeight: 600 }}>300</span></div><ProgressBar value={300} max={600} color={T.textDim} /></div>
      </Card>
      <Label>QUICK ACTIONS</Label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Queue Config", "Healer Ops", "Specialist Routing", "Pricing", "Payouts", "Refunds", "Safety Queue", "Charlie Pool", "Emergency"].map(a => <Btn key={a} variant="secondary" small style={{ flex: "1 1 45%" }}>{a}</Btn>)}
      </div>
      <Divider />
      <p style={{ fontSize: 10, color: T.textDim }}>All threshold changes logged with admin ID + timestamp.</p>
    </div>
  </ScreenWrap>
);

/* ═══════════════════════════════════════════════════════════════
   ADMIN: Live Queue Dashboard
   ═══════════════════════════════════════════════════════════════ */
const AdminScreen = ({ onBack }) => {
  const [patients, setPatients] = React.useState(3);
  const [committed, setCommitted] = React.useState(4);
  const w = systemWindow(patients, committed);
  const freeW = computeWait("free", patients, committed);
  const todayW = computeWait("today", patients, committed);
  const weekW = computeWait("week", patients, committed);
  const util = Math.min(100, Math.round((patients / Math.max(committed, 1)) * 50));
  const status = patients > committed * 2 ? "high_demand" : committed > patients * 2 ? "oversupply" : "balanced";
  const statusColor = { high_demand: T.danger, oversupply: T.blue, balanced: T.green };
  const statusBg = { high_demand: T.dangerDim, oversupply: T.blueDim, balanced: T.greenDim };

  const waitBadge = (mins) => {
    const s = mins < 15 ? "good" : mins < 45 ? "warn" : "bad";
    const colors = { good: T.green, warn: T.warm, bad: T.danger };
    const bgs = { good: T.greenDim, warn: T.warmDim, bad: T.dangerDim };
    return <span style={{ fontSize: 13, fontWeight: 500, padding: "3px 12px", borderRadius: 100, background: bgs[s], color: colors[s] }}>{fmtWait(mins)}</span>;
  };

  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 14, fontWeight: 600 }}>Admin — live queue</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .3s ease" }}>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[{ l: "Patients", v: patients, s: "in queue" }, { l: "Committed", v: committed, s: "healers" }, { l: "Utilisation", v: util + "%", s: "supply/demand" }].map(x => (
              <div key={x.l} style={{ background: "#FAFAFA", border: `1px solid ${T.border}`, borderRadius: 16, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4 }}>{x.l}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>{x.v}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{x.s}</div>
              </div>
            ))}
          </div>

          {/* Wait times */}
          <Card style={{ background: "#FAFAFA", marginBottom: 14 }}>
            <Label>Live wait times</Label>
            {[{ label: "Free tier", w: freeW }, { label: "Super — Today", w: todayW }, { label: "Super — Week", w: weekW }].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.textMuted }}>{r.label}</span>
                {waitBadge(r.w)}
              </div>
            ))}
          </Card>

          {/* System decisions */}
          <Card style={{ background: "#FAFAFA", marginBottom: 14 }}>
            <Label>System decisions right now</Label>
            <p style={{ fontSize: 13, color: T.text, marginBottom: 6 }}>Asking healers: <strong>"Available in next {w} min?"</strong></p>
            <p style={{ fontSize: 13, color: T.textMuted }}>Pinging ~{Math.min(committed * 4, 60)} healers per new patient · {committed} have said yes</p>
          </Card>

          {/* Sliders */}
          <Card style={{ background: "#FAFAFA", marginBottom: 14 }}>
            <Label>Simulate conditions</Label>
            {[{ label: "Patients in queue", val: patients, set: setPatients }, { label: "Committed healers", val: committed, set: setCommitted }].map((s, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: T.textMuted }}>{s.label}</span>
                  <span style={{ fontWeight: 500 }}>{s.val}</span>
                </div>
                <input type="range" min="1" max="15" value={s.val} step="1" onChange={e => s.set(+e.target.value)} style={{ width: "100%" }} />
              </div>
            ))}
          </Card>

          {/* Health callout */}
          <div style={{ borderLeft: `3px solid ${statusColor[status]}`, borderRadius: "0 14px 14px 0", padding: "12px 16px", background: statusBg[status] }}>
            <p style={{ fontSize: 13, color: statusColor[status], lineHeight: 1.6 }}>
              {status === "high_demand" && <><strong>High demand.</strong> Wait times rising. Increasing ping volume and shortening commitment window to {w} min.</>}
              {status === "oversupply" && <><strong>Oversupply.</strong> Healers are waiting. Extend commitment windows — less urgency.</>}
              {status === "balanced" && <><strong>Balanced.</strong> Supply and demand are well matched. Wait times are healthy.</>}
            </p>
          </div>
          <div style={{ height: 20 }} />
        </div>
      </ScreenWrap>
    </>
  );
};


/* ═══════════════════════════════════════════════════════════════
   MAIN APP — Navigation State Machine
   ═══════════════════════════════════════════════════════════════ */
export default function EnnieApp() {
  const [screen, setScreen] = useState("landing");
  const [role, setRole] = useState("case");
  const [tab, setTab] = useState("home");
  const [pins, setPins] = useState([]);
  const [baselinePins, setBaselinePins] = useState([]);
  const [finalPins, setFinalPins] = useState([]);
  const [age, setAge] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [showCharlie, setShowCharlie] = useState(false);
  const [atQueueFront, setAtQueueFront] = useState(false);
  const [skillBuildCondition, setSkillBuildCondition] = useState(null);
  const [healerTotalHours, setHealerTotalHours] = useState(1);
  const [mapOpen, setMapOpen] = useState(true);

  const go = (s) => setScreen(s);

  const caseTabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "history", icon: "📋", label: "History" },
    { id: "support", icon: "💬", label: "Support" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  const healerTabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "history", icon: "📋", label: "History" },
    { id: "support", icon: "💬", label: "Support" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  const adminTabs = [
    { id: "home", icon: "📊", label: "Dashboard" },
    { id: "profile", icon: "⚙️", label: "Settings" },
  ];

  const startFreeSession = () => { setBaselinePins(pins.map(p => ({ ...p }))); go("queue"); };
  const endSession = () => { setFinalPins(pins.map(p => ({ ...p, severity: Math.max(0, p.severity - Math.floor(Math.random() * 4 + 2)) }))); go("sessionEnd"); };

  const screenMap = [
    { group: "Case Journey", color: T.accent, items: [
      { id: "landing", num: 1, label: "Landing" },
      { id: "signup", num: 2, label: "Sign Up" },
      { id: "ageGate", num: 3, label: "Age Gate" },
      { id: "consent", num: "3a", label: "UCI Research Consent" },
      { id: "queueHold", num: "3c", label: "Queue Hold Explainer" },
      { id: "intake", num: 4, label: "Intake — AI + Body Map", star: true },
      { id: "ineligible", num: "5a", label: "No Active Symptoms" },
      { id: "routing", num: 5, label: "Eligibility & SKUs" },
      { id: "queue", num: 6, label: "Queue + Tips" },
      { id: "readyNow", num: 7, label: "Ready-Now Prompt" },
      { id: "symptomConfirm", num: 8, label: "Symptom Confirmation" },
      { id: "connecting", num: "8b", label: "Connecting to Healer" },
      { id: "liveSession", num: 9, label: "Live Session Room", star: true },
      { id: "sessionEnd", num: 10, label: "Session End — Before/After" },
      { id: "share", num: "10b", label: "Rate & Share" },
      { id: "followUp", num: 11, label: "Follow-Up Check-in" },
      { id: "caseHome", num: "—", label: "Case Home" },
    ]},
    { group: "Healer Journey", color: T.warm, items: [
      { id: "healerOnboard", num: 12, label: "Healer Onboarding" },
      { id: "healerHome", num: 13, label: "Healer Dashboard" },
      { id: "specializations", num: "13b", label: "Specialization Engine", star: true },
      { id: "skillBuildConfirm", num: "13c", label: "Skill-Build Confirm" },
      { id: "healerPing", num: "13c", label: "Step 1 — availability ping ★", star: true },
      { id: "healerCommitted", num: "13d", label: "Step 2 — committed, waiting" },
      { id: "matchNotif", num: 14, label: "Smart Match (5s claim)" },
      { id: "healerSession", num: 15, label: "Healer Session + Tools Log", star: true },
      { id: "healerPost", num: 16, label: "Healer Post-Session" },
    ]},
    { group: "Paid Flow", color: T.purple, items: [
      { id: "tiers", num: 17, label: "Tier Selection" },
      { id: "payment", num: 18, label: "Payment" },
      { id: "payConfirm", num: "18b", label: "Payment Confirmed" },
    ]},
    { group: "Group Healing", color: T.purple, items: [
      { id: "groupSchedule", num: "G1", label: "Schedule & Pricing" },
      { id: "groupConfirm", num: "G2", label: "Booking Confirmed" },
      { id: "groupIntake", num: "G3", label: "Group Intake" },
      { id: "groupConnecting", num: "G3b", label: "Group Connecting" },
      { id: "groupSession", num: "G4", label: "Group Live Session", star: true },
    ]},
    { group: "Charlie Featured", color: T.blue, items: [
      { id: "charlieReveal", num: 19, label: "Charlie Reveal (Modal)" },
    ]},
    { group: "Shared / Account", color: T.textMuted, items: [
      { id: "caseHome_profile", num: 20, label: "Profile & Settings" },
      { id: "caseHome_history", num: 21, label: "Session History" },
      { id: "caseHome_support", num: 22, label: "Support & Reporting" },
      { id: "deleteAccount", num: 23, label: "Account Deletion" },
    ]},
    { group: "Admin", color: T.purple, items: [
      { id: "adminHome", num: "A", label: "Admin — live queue engine ★", star: true },
    ]},
  ];

  const handleMapNav = (id) => {
    if (id === "caseHome_profile") { setRole("case"); setTab("profile"); go("caseHome"); }
    else if (id === "caseHome_history") { setRole("case"); setTab("history"); go("caseHome"); }
    else if (id === "caseHome_support") { setRole("case"); setTab("support"); go("caseHome"); }
    else if (id === "charlieReveal") { setShowCharlie(true); }
    else if (id === "healerHome") { setRole("healer"); setTab("home"); go("healerHome"); }
    else if (id === "adminHome") { setRole("admin"); setTab("home"); go("adminHome"); }
    else if (id === "caseHome") { setRole("case"); setTab("home"); go("caseHome"); }
    else if (id === "specializations") { setRole("healer"); go("specializations"); }
    else if (id === "skillBuildConfirm") { setSkillBuildCondition(CONDITIONS_DATA.find(c => c.id === "fibromyalgia")); go("skillBuildConfirm"); }
    else if (id === "availability") { go("healerPing"); }
    else if (id === "healerPing") { go("healerPing"); }
    else if (id === "healerCommitted") { go("healerCommitted"); }
    else if (id === "matchNotif") { go("matchNotif"); }
    else if (id === "intake") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }, { id: 2, x: 60, y: 35, side: "front", severity: 4 }]); go(id); }
    else if (id === "routing") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); go(id); }
    else if (id === "liveSession") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); setBaselinePins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); go(id); }
    else if (id === "sessionEnd") { setBaselinePins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); setFinalPins([{ id: 1, x: 52, y: 55, side: "front", severity: 3 }]); go(id); }
    else if (id === "symptomConfirm") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); go(id); }
    else if (id === "followUp") { setFinalPins([{ id: 1, x: 52, y: 55, side: "front", severity: 3 }]); go(id); }
    else if (id === "groupSession") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 6 }]); go(id); }
    else if (id === "groupIntake") { setPins([]); go(id); }
    else { go(id); }
    setMapOpen(false);
  };

  const containerStyle = {
    width: "100%", maxWidth: 420, margin: "0 auto", height: "100dvh", display: "flex",
    flexDirection: "column", background: T.bg, color: T.text, position: "relative",
    fontFamily: "'DM Sans', -apple-system, sans-serif", fontSize: 14, overflow: "hidden",
  };

  const renderScreen = () => {
    switch (screen) {
      case "landing": return <LandingScreen onGetStarted={() => go("signup")} onJoinHealer={() => { setRole("healer"); go("signup"); }} onLogin={() => go("signup")} />;
      case "signup": return <SignUpScreen onContinue={() => go("ageGate")} onBack={() => go("landing")} />;
      case "ageGate": return <AgeGateScreen onContinue={(a) => { setAge(a); if (role === "healer") go("healerOnboard"); else go("consent"); }} onBack={() => go("signup")} />;
      case "consent": return <ConsentScreen onAccept={() => go("intake")} onBack={() => go("ageGate")} />;
      case "queueHold": return <QueueHoldScreen onContinue={() => go("tiers")} onBack={() => go("caseHome")} />;
      case "intake": return <IntakeScreen pins={pins} setPins={setPins} onJoinQueue={() => go("routing")} onPaidSession={() => go("routing")} onIneligible={() => go("ineligible")} onBack={() => go("consent")} />;
      case "ineligible": return <IneligibleScreen onPaid={(t) => { setSelectedTier(t); go("payment"); }} onGroup={() => go("groupSchedule")} onClose={() => go("caseHome")} />;
      case "routing": return <RoutingScreen eligible={true} onFree={startFreeSession} onPaid={(t) => { setSelectedTier(t); go("payment"); }} onGroup={() => go("groupSchedule")} onBack={() => go("intake")} />;
      case "queue": return <QueueScreen onReady={() => go("readyNow")} onLeave={() => go("caseHome")} />;
      case "readyNow": return <ReadyNowScreen onReady={() => go("symptomConfirm")} onSnooze={() => { setAtQueueFront(true); go("caseHome"); }} />;
      case "symptomConfirm": return <SymptomConfirmScreen pins={pins} setPins={setPins} onStart={() => go("connecting")} onBack={() => go("queue")} />;
      case "connecting": return <ConnectingScreen onConnected={() => go("liveSession")} onCancel={() => go("symptomConfirm")} />;
      case "liveSession": return <LiveSessionScreen pins={pins} setPins={setPins} baselinePins={baselinePins} onEnd={endSession} />;
      case "sessionEnd": return <SessionEndScreen baselinePins={baselinePins} finalPins={finalPins} onHome={() => go("caseHome")} onThankYou={() => go("share")} />;
      case "share": return <ShareScreen onDone={() => go("caseHome")} />;
      case "followUp": return <FollowUpScreen onPositive={() => go("share")} onNeutral={() => go("caseHome")} pins={finalPins.length > 0 ? finalPins : [{ id: 1, x: 52, y: 55, side: "front", severity: 3 }]} setPins={setFinalPins} />;
      case "healerOnboard": return <HealerOnboardScreen onComplete={() => go("healerHome")} onBack={() => go("ageGate")} />;
      case "specializations": return <SpecializationScreen onBack={() => go("healerHome")} onStartSkillBuild={(c) => { setSkillBuildCondition(c); go("skillBuildConfirm"); }} />;
      case "skillBuildConfirm": return <SkillBuildConfirmScreen condition={skillBuildCondition || CONDITIONS_DATA[3]} onConfirm={() => go("healerPing")} onBack={() => go("specializations")} />;
      case "healerPing": return <HealerPingScreen skillBuildCondition={skillBuildCondition} onYes={(h) => { setHealerTotalHours(h); go("healerCommitted"); }} onNo={() => go("healerHome")} />;
      case "healerCommitted": return <HealerCommittedScreen skillBuildCondition={skillBuildCondition} totalHours={healerTotalHours} onMatch={() => go("matchNotif")} onBack={() => go("healerHome")} />;
      case "availability": return <HealerPingScreen skillBuildCondition={skillBuildCondition} onYes={(h) => { setHealerTotalHours(h); go("healerCommitted"); }} onNo={() => go("healerHome")} />;
      case "matchNotif": return <SmartMatchScreen skillBuildCondition={skillBuildCondition} onClaim={() => go("healerSession")} onDecline={() => go("availability")} />;
      case "healerSession": return <HealerSessionScreen onEnd={() => go("healerPost")} />;
      case "healerPost": return <HealerPostScreen onReady={() => go("healerPing")} onHome={() => go("healerHome")} />;
      case "adminHome": return <AdminScreen onBack={() => go("landing")} />;
      case "tiers": return <TierScreen onSelect={(t) => { setSelectedTier(t); go("payment"); }} onGroup={() => go("groupSchedule")} onBack={() => go("intake")} />;
      case "groupSchedule": return <GroupScheduleScreen onSingle={() => go("groupConfirm")} onSubscribe={() => go("groupConfirm")} onBack={() => go("routing")} />;
      case "groupConfirm": return <GroupConfirmScreen sessions={[groupSessions[0], groupSessions[2]]} isSub={false} onIntake={() => { setPins([]); go("groupIntake"); }} onBack={() => go("groupSchedule")} />;
      case "groupIntake": return <GroupIntakeScreen pins={pins} setPins={setPins} onDone={() => go("groupConnecting")} onBack={() => go("groupConfirm")} />;
      case "groupConnecting": return <ConnectingScreen isGroup onConnected={() => go("groupSession")} onCancel={() => go("groupConfirm")} />;
      case "groupSession": return <GroupSessionScreen pins={pins.length > 0 ? pins : [{ id: 1, x: 52, y: 55, side: "front", severity: 6 }]} setPins={setPins} onEnd={() => { setFinalPins(pins.map(p => ({ ...p, severity: Math.max(0, p.severity - Math.floor(Math.random() * 3 + 1)) }))); go("sessionEnd"); }} />;
      case "payment": return <PaymentScreen tier={selectedTier} onPay={() => go("payConfirm")} onBack={() => go("tiers")} />;
      case "payConfirm": return <PaymentConfirmScreen tier={selectedTier} onContinue={() => go("queue")} />;
      case "deleteAccount": return <DeleteScreen onBack={() => go(role === "healer" ? "healerHome" : "caseHome")} />;

      case "healerHome":
        return (
          <>
            <Header left={<Logo />} right={<Badge color={T.warm}>Healer</Badge>} />
            {tab === "home" && <HealerHomeScreen onGoOnline={() => go("healerPing")} onSpecializations={() => go("specializations")} />}
            {tab === "history" && <HistoryScreen />}
            {tab === "support" && <SupportScreen />}
            {tab === "profile" && <><ProfileScreen role={role} setRole={(r) => { setRole(r); if (r === "case") go("caseHome"); else if (r === "admin") go("adminHome"); }} /><div style={{ padding: "0 16px 8px" }}><Btn variant="danger" small full onClick={() => go("deleteAccount")}>Delete account</Btn></div></>}
            <TabBar tabs={healerTabs} active={tab} onTab={setTab} />
          </>
        );

      case "adminHome":
        return (
          <>
            <Header left={<Logo />} right={<Badge color={T.purple}>Admin</Badge>} />
            {tab === "home" && <AdminDashboard />}
            {tab === "profile" && <ProfileScreen role={role} setRole={(r) => { setRole(r); if (r === "case") go("caseHome"); else if (r === "healer") go("healerHome"); }} />}
            <TabBar tabs={adminTabs} active={tab} onTab={setTab} />
          </>
        );

      case "caseHome":
        return (
          <>
            <Header left={<Logo />} right={<Badge>Case</Badge>} />
            {tab === "home" && (
              <ScreenWrap>
                <div style={{ animation: "slideUp .4s ease" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Welcome back</h2>
                  {atQueueFront && (
                    <Card onClick={() => { setAtQueueFront(false); go("symptomConfirm"); }} style={{ marginBottom: 14, cursor: "pointer", border: `2px solid ${T.accent}50`, background: T.accentDim, animation: "slideUp .4s ease" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.accent + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: `2px solid ${T.accent}40` }}>🟢</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>You're at the front of the queue</div><div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Tap to start your session</div></div>
                        <span style={{ fontSize: 18, color: T.accent }}>→</span>
                      </div>
                    </Card>
                  )}
                  <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}20`, overflow: "hidden", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: T.accent + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🎉</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700 }}>You're making progress!</div><div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Total pain reduced: <span style={{ color: T.accent, fontWeight: 700 }}>11 points</span> across 3 sessions</div></div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 10, background: T.surface }}><div style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>3</div><div style={{ fontSize: 10, color: T.textMuted }}>Sessions</div></div>
                      <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 10, background: T.surface }}><div style={{ fontSize: 18, fontWeight: 800, color: T.purple }}>67%</div><div style={{ fontSize: 10, color: T.textMuted }}>Improved</div></div>
                      <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 10, background: T.surface }}><div style={{ fontSize: 18, fontWeight: 800, color: T.warm }}>🔥 3</div><div style={{ fontSize: 10, color: T.textMuted }}>Streak</div></div>
                    </div>
                  </Card>
                  <Card style={{ marginBottom: 12, border: `1px solid ${T.accent}25`, cursor: "pointer" }} onClick={() => { setPins([]); go("intake"); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✦</div><div><div style={{ fontSize: 15, fontWeight: 600 }}>Start a Healer Testing Session</div><div style={{ fontSize: 12, color: T.textMuted }}>Free · Active symptoms · ~5 min</div></div></div>
                  </Card>
                  <Card style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => go("tiers")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⭐</div><div><div style={{ fontSize: 15, fontWeight: 600 }}>Book a Super Session</div><div style={{ fontSize: 12, color: T.textMuted }}>Verified healers · from $50</div></div></div>
                  </Card>
                  <Card style={{ marginBottom: 12, cursor: "pointer", border: `1px solid ${T.purple}25`, background: T.purpleDim }} onClick={() => go("groupSchedule")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: T.purple + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👥</div><div><div style={{ fontSize: 15, fontWeight: 600, color: T.purple }}>Group Healing</div><div style={{ fontSize: 12, color: T.textMuted }}>From $19.99/mo · 8 sessions per month</div></div></div>
                  </Card>
                  <Card style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => go("followUp")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: T.blueDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📋</div><div><div style={{ fontSize: 15, fontWeight: 600 }}>24-hour check-in</div><div style={{ fontSize: 12, color: T.textMuted }}>Rate your symptoms since last session</div></div></div>
                  </Card>
                  <Label>YOUR JOURNEY</Label>
                  <Card style={{ marginBottom: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Symptom trend</span><Badge color={T.accent}>↓ Improving</Badge></div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 50 }}>
                      {[7, 5, 6, 3, 2, 4].map((v, i) => <div key={i} style={{ flex: 1, height: `${v * 8}%`, background: i >= 4 ? T.accent : `linear-gradient(180deg, ${T.accent}60, ${T.accent}20)`, borderRadius: 4, minHeight: 4 }} />)}
                    </div>
                  </Card>
                  <Label>RECENT SESSIONS</Label>
                  {sessionHistory.map((s, i) => (
                    <Card key={i} onClick={() => setTab("history")} style={{ marginBottom: 8, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div><span style={{ fontSize: 13, fontWeight: 600 }}>{s.issue}</span><span style={{ fontSize: 11, color: T.textMuted, marginLeft: 8 }}>{s.date}</span></div>
                        <Badge color={T.accent}>−{s.before - s.after}</Badge>
                      </div>
                    </Card>
                  ))}
                  <Card style={{ marginTop: 8, background: `linear-gradient(135deg, ${T.purpleDim}, ${T.accentDim})`, border: `1px solid ${T.purple}15`, textAlign: "center", padding: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>💜</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.5 }}>Your average pain dropped 3.7 points per session</p>
                    <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>You're responding really well to energy healing. Keep going!</p>
                  </Card>
                </div>
              </ScreenWrap>
            )}
            {tab === "history" && <HistoryScreen />}
            {tab === "support" && <SupportScreen />}
            {tab === "profile" && <><ProfileScreen role={role} setRole={(r) => { setRole(r); if (r === "healer") go("healerHome"); else if (r === "admin") go("adminHome"); }} /><div style={{ padding: "0 16px 8px" }}><Btn variant="danger" small full onClick={() => go("deleteAccount")}>Delete account</Btn></div></>}
            <TabBar tabs={caseTabs} active={tab} onTab={setTab} />
          </>
        );

      default: return <LandingScreen onGetStarted={() => go("signup")} onJoinHealer={() => { setRole("healer"); go("signup"); }} onLogin={() => go("signup")} />;
    }
  };

  return (
    <div style={containerStyle}>
      <GlobalCSS />
      {renderScreen()}
      {showCharlie && <CharlieReveal onAccept={() => setShowCharlie(false)} onDecline={() => setShowCharlie(false)} />}

      {/* Floating Map Button */}
      {!mapOpen && (
        <button onClick={() => setMapOpen(true)} style={{ position: "absolute", bottom: 80, right: 14, zIndex: 40, width: 48, height: 48, borderRadius: 14, background: T.grad, border: "none", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(155,138,251,0.35), 0 0 0 2px #fff", display: "flex", alignItems: "center", justifyContent: "center" }} title="Screen Map">☰</button>
      )}

      {/* Screen Map Overlay */}
      {mapOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: `${T.bg}f8`, backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", animation: "fadeIn .2s ease" }}>
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ENNIE v2.0</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Screen Map — tap any screen to jump</div>
            </div>
            <button onClick={() => setMapOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
            {screenMap.map((group) => (
              <div key={group.group} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: group.color, marginBottom: 8, paddingLeft: 2 }}>{group.group}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {group.items.map((item) => {
                    const isCurrent = screen === item.id ||
                      (item.id === "caseHome_profile" && screen === "caseHome" && tab === "profile") ||
                      (item.id === "caseHome_history" && screen === "caseHome" && tab === "history") ||
                      (item.id === "caseHome_support" && screen === "caseHome" && tab === "support");
                    return (
                      <button key={item.id} onClick={() => handleMapNav(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: isCurrent ? `${group.color}18` : T.card, border: `1px solid ${isCurrent ? group.color + "40" : T.border}`, cursor: "pointer", textAlign: "left", width: "100%", transition: "all .12s" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: isCurrent ? group.color : T.surface, border: `1px solid ${isCurrent ? group.color : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isCurrent ? T.bg : T.textDim }}>{item.num}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? group.color : T.text }}>
                            {item.label}
                            {item.star && <span style={{ marginLeft: 6, fontSize: 10, color: T.warm }}>★</span>}
                          </div>
                        </div>
                        {isCurrent && <div style={{ width: 8, height: 8, borderRadius: "50%", background: group.color, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ height: 20 }} />
          </div>
        </div>
      )}
    </div>
  );
}
