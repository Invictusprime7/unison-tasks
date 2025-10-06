import React from "react";

/**
 * DesignKitSection — a reusable, brandable "Web Design Kit" React component
 * 
 * Variants: "hero" | "features" | "pricing"
 * Includes: tokens (theming), metadata, and a TestBench with multiple cases.
 * Plain JSX (no TypeScript), safe rendering (no objects directly in JSX nodes).
 */

// --------------- Primitive UI ---------------
function Button({ cta, tokens }) {
  const base = {
    background: tokens.colorPrimary,
    color: "#0b1220",
    border: 0,
    borderRadius: tokens.radius,
    padding: `${tokens.spacing * 1}px ${tokens.spacing * 2}px`,
    fontWeight: 600,
    cursor: "pointer",
  };
  if (cta?.href) {
    return (
      <a href={cta.href} style={{ ...base, display: "inline-block", textDecoration: "none" }} onClick={cta.onClick}>
        {cta.label}
      </a>
    );
  }
  return (
    <button style={base} onClick={cta?.onClick}>
      {cta?.label}
    </button>
  );
}

function Badge({ text, tokens }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: `${tokens.spacing * 0.5}px ${tokens.spacing * 1}px`,
        background: "rgba(255,255,255,0.06)",
        borderRadius: tokens.radius,
        color: tokens.colorMuted,
        fontSize: 12,
      }}
    >
      {text}
    </span>
  );
}

function MediaView({ media, tokens }) {
  if (!media || media.kind === "none") return null;
  const wrapper = {
    borderRadius: tokens.radius,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  };
  if (media.kind === "image" && media.src) {
    return (
      <div style={wrapper}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={media.src} alt={media.alt || ""} style={{ display: "block", width: "100%", height: "auto" }} />
      </div>
    );
  }
  if (media.kind === "video" && media.src) {
    return (
      <div style={wrapper}>
        <video src={media.src} controls style={{ display: "block", width: "100%", height: "auto" }} />
      </div>
    );
  }
  return null;
}

// --------------- Defaults / tokens ---------------
const DEFAULT_TOKENS = {
  colorBg: "#0b1220",
  colorFg: "#e5e7eb",
  colorMuted: "#94a3b8",
  colorPrimary: "#22d3ee",
  radius: 16,
  spacing: 12,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
};

const fallback = (v, d) => (v === undefined ? d : v);

// --------------- Variants ---------------
function Hero({ p, t }) {
  const container = {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    alignItems: "center",
    gap: t.spacing * 4,
  };
  const titleStyle = { fontSize: 48, lineHeight: 1.1, margin: 0, color: t.colorFg };
  const subStyle = { fontSize: 18, color: t.colorMuted, marginTop: t.spacing };
  return (
    <div style={container}>
      <div>
        <div style={{ display: "flex", gap: t.spacing }}>{p.description ? <Badge text={p.description} tokens={t} /> : null}</div>
        {p.title ? <h1 style={titleStyle}>{p.title}</h1> : null}
        {p.subtitle ? <p style={subStyle}>{p.subtitle}</p> : null}
        {p.cta ? (
          <div style={{ marginTop: t.spacing * 2 }}>
            <Button cta={p.cta} tokens={t} />
          </div>
        ) : null}
      </div>
      <MediaView media={p.media} tokens={t} />
    </div>
  );
}

function Features({ p, t }) {
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: t.spacing * 2,
  };
  return (
    <div>
      {p.title ? <h2 style={{ color: t.colorFg, marginTop: 0 }}>{p.title}</h2> : null}
      {p.subtitle ? <p style={{ color: t.colorMuted }}>{p.subtitle}</p> : null}
      <div style={grid}>
        {(p.features || []).map((f, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: t.radius, padding: t.spacing * 2 }}>
            {f.icon ? <div style={{ fontSize: 24, marginBottom: t.spacing }}>{f.icon}</div> : null}
            <div style={{ color: t.colorFg, fontWeight: 600 }}>{f.title}</div>
            {f.description ? <div style={{ color: t.colorMuted, marginTop: t.spacing * 0.5 }}>{f.description}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Pricing({ p, t }) {
  const count = Math.max(1, (p.tiers || []).length);
  const grid = {
    display: "grid",
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
    gap: t.spacing * 2,
  };
  return (
    <div>
      {p.title ? <h2 style={{ color: t.colorFg, marginTop: 0 }}>{p.title}</h2> : null}
      {p.subtitle ? <p style={{ color: t.colorMuted }}>{p.subtitle}</p> : null}
      <div style={grid}>
        {(p.tiers || []).map((tier, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: t.radius, padding: t.spacing * 2 }}>
            <div style={{ color: t.colorFg, fontWeight: 700, fontSize: 18 }}>{tier.name}</div>
            <div style={{ color: t.colorFg, fontSize: 32, marginTop: t.spacing }}>{tier.price}</div>
            <ul style={{ marginTop: t.spacing, paddingLeft: t.spacing * 2, color: t.colorMuted }}>
              {(tier.features || []).map((feat, j) => (
                <li key={j}>{feat}</li>
              ))}
            </ul>
            {tier.cta ? (
              <div style={{ marginTop: t.spacing * 2 }}>
                <Button cta={tier.cta} tokens={t} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// --------------- Main Component ---------------
export default function DesignKitSection(props) {
  const t = {
    colorBg: fallback(props.tokens?.colorBg, DEFAULT_TOKENS.colorBg),
    colorFg: fallback(props.tokens?.colorFg, DEFAULT_TOKENS.colorFg),
    colorMuted: fallback(props.tokens?.colorMuted, DEFAULT_TOKENS.colorMuted),
    colorPrimary: fallback(props.tokens?.colorPrimary, DEFAULT_TOKENS.colorPrimary),
    radius: fallback(props.tokens?.radius, DEFAULT_TOKENS.radius),
    spacing: fallback(props.tokens?.spacing, DEFAULT_TOKENS.spacing),
    fontFamily: fallback(props.tokens?.fontFamily, DEFAULT_TOKENS.fontFamily),
  };

  const variant = props.variant || "hero";
  const maxWidth = props.maxWidth ?? 1100;

  const sectionStyle = {
    fontFamily: t.fontFamily,
    background: t.colorBg,
    color: t.colorFg,
    padding: `${t.spacing * 5}px ${t.spacing * 3}px`,
  };
  const containerStyle = {
    maxWidth,
    margin: "0 auto",
  };

  let content = null;
  if (variant === "hero") content = <Hero p={props} t={t} />;
  else if (variant === "features") content = <Features p={props} t={t} />;
  else if (variant === "pricing") content = <Pricing p={props} t={t} />;

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>{content}</div>
    </section>
  );
}

// --------------- Metadata ---------------
export const DesignKitSectionMeta = {
  displayName: "DesignKitSection",
  variants: ["hero", "features", "pricing"],
  props: {
    title: { type: "string", default: "Design anything, fast." },
    subtitle: { type: "string", default: "Drop-in, brandable, accessible." },
    description: { type: "string", default: "NEW" },
    media: { type: "object", default: { kind: "image", src: "https://picsum.photos/640/360" } },
    cta: { type: "object", default: { label: "Get Started" } },
  },
};

// --------------- TestBench (visual test cases) ---------------
export function TestBench() {
  const onClick = () => console.log("CTA clicked");
  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Test 1: Basic hero */}
      <DesignKitSection
        variant="hero"
        title="Design anything, fast."
        subtitle="Drop-in, brandable, accessible."
        description="NEW"
        cta={{ label: "Get Started", onClick }}
        media={{ kind: "image", src: "https://picsum.photos/720/480" }}
      />

      {/* Test 2: Features grid with emojis */}
      <DesignKitSection
        variant="features"
        title="Everything you need"
        subtitle="Production-ready building blocks"
        features={[
          { icon: "⚡", title: "Fast", description: "Optimized rendering" },
          { icon: "🎨", title: "Brandable", description: "Design tokens + themes" },
          { icon: "♿", title: "Accessible", description: "Semantics-first" },
        ]}
        tokens={{ colorPrimary: "#10b981" }}
      />

      {/* Test 3: Pricing with 3 tiers */}
      <DesignKitSection
        variant="pricing"
        title="Simple pricing"
        subtitle="Pick a plan"
        tiers={[
          { name: "Starter", price: "$0", features: ["1 project", "Community"], cta: { label: "Choose" } },
          { name: "Pro", price: "$19/mo", features: ["Unlimited projects", "Priority support"], cta: { label: "Try Pro", onClick } },
          { name: "Team", price: "$49/mo", features: ["Collaboration", "SSO"], cta: { label: "Contact Sales" } },
        ]}
      />

      {/* Test 4: No media, custom tokens */}
      <DesignKitSection
        variant="hero"
        title="Framework-agnostic"
        subtitle="Pure React + inline styles"
        media={{ kind: "none" }}
        tokens={{ colorBg: "#111827", colorPrimary: "#f59e0b", radius: 24 }}
      />
    </div>
  );
}
