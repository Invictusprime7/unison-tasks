import React from "react";

/**
 * DesignKitSection — a reusable, brandable "Web Design Kit" React component
 *
 * Goals
 * - Emulates how Canva/Framer expose configurable blocks: one component, many variants
 * - Pure React + inline styles (no external CSS), portable in any app
 * - Theming via design tokens; safe rendering (no objects directly in JSX)
 * - Includes a small in-file TestBench to exercise multiple cases ("test cases")
 *
 * Usage
 * <DesignKitSection
 *   variant="hero"
 *   title="Design anything, fast."
 *   subtitle="Drop-in, brandable, accessible."
 *   cta={{ label: "Get Started", onClick: () => alert("Go!") }}
 *   media={{ kind: "image", src: "https://picsum.photos/640/360" }}
 *   tokens={{ colorPrimary: "#22d3ee" }}
 * />
 */

// ---------------- Types ----------------
export type Variant = "hero" | "features" | "pricing";

export interface Tokens {
  colorBg?: string; // background of the section
  colorFg?: string; // primary foreground text
  colorMuted?: string; // secondary text
  colorPrimary?: string; // CTA accents
  radius?: number; // px
  spacing?: number; // base spacing unit
  fontFamily?: string; // base font family
}

export interface CTA {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface Media {
  kind: "none" | "image" | "video";
  src?: string;
  alt?: string;
}

export interface FeatureItem {
  icon?: string; // emoji or small text icon
  title: string;
  description?: string;
}

export interface PricingTier {
  name: string;
  price: string; // e.g., "$19/mo"
  features: string[];
  cta?: CTA;
}

export interface DesignKitProps {
  variant?: Variant;
  title?: string;
  subtitle?: string;
  description?: string;
  media?: Media;
  cta?: CTA;
  features?: FeatureItem[];
  tiers?: PricingTier[];
  tokens?: Tokens;
  maxWidth?: number; // container max width
  onOpenStudio?: () => void; // callback to open design studio
  onAddToCanvas?: (element: {
    type: 'text' | 'image' | 'section';
    data: any;
  }) => void; // callback to add element to canvas
}

// ---------------- Defaults ----------------
const DEFAULT_TOKENS: Required<Tokens> = {
  colorBg: "#0b1220",
  colorFg: "#e5e7eb",
  colorMuted: "#94a3b8",
  colorPrimary: "#22d3ee",
  radius: 16,
  spacing: 12,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
};

const fallback = <T,>(v: T | undefined, d: T): T => (v === undefined ? d : v);

// ---------------- Primitive UI ----------------
function Button({ 
  cta, 
  tokens, 
  onOpenStudio, 
  onAddToCanvas,
  elementData 
}: { 
  cta: CTA; 
  tokens: Required<Tokens>; 
  onOpenStudio?: () => void;
  onAddToCanvas?: (element: { type: 'text' | 'image' | 'section'; data: any }) => void;
  elementData?: any;
}) {
  const base: React.CSSProperties = {
    background: tokens.colorPrimary,
    color: "#0b1220",
    border: 0,
    borderRadius: tokens.radius,
    padding: `${tokens.spacing * 1}px ${tokens.spacing * 2}px`,
    fontWeight: 600,
    cursor: "pointer",
  };
  
  const handleClick = (e?: React.MouseEvent) => {
    if (onAddToCanvas && elementData) {
      onAddToCanvas(elementData);
    }
    if (onOpenStudio) {
      onOpenStudio();
    }
    if (cta.onClick) {
      cta.onClick();
    }
  };
  
  if (cta.href) {
    return (
      <a href={cta.href} style={{ ...base, display: "inline-block", textDecoration: "none" }} onClick={handleClick}>
        {cta.label}
      </a>
    );
  }
  return (
    <button style={base} onClick={handleClick}>
      {cta.label}
    </button>
  );
}

function Badge({ text, tokens }: { text: string; tokens: Required<Tokens> }) {
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

function MediaView({ media, tokens }: { media?: Media; tokens: Required<Tokens> }) {
  if (!media || media.kind === "none") return null;
  const wrapper: React.CSSProperties = {
    borderRadius: tokens.radius,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  };
  if (media.kind === "image" && media.src) {
    return (
      <div style={wrapper}>
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

// ---------------- Variants ----------------
function Hero({ p, t }: { p: DesignKitProps; t: Required<Tokens> }) {
  const container: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    alignItems: "center",
    gap: t.spacing * 4,
  };
  const titleStyle: React.CSSProperties = { fontSize: 48, lineHeight: 1.1, margin: 0, color: t.colorFg };
  const subStyle: React.CSSProperties = { fontSize: 18, color: t.colorMuted, marginTop: t.spacing };
  
  const heroElementData = {
    type: 'section' as const,
    data: {
      variant: 'hero',
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      media: p.media,
    }
  };
  
  return (
    <div style={container}>
      <div>
        <div style={{ display: "flex", gap: t.spacing }}>{p.description ? <Badge text={p.description} tokens={t} /> : null}</div>
        {p.title ? <h1 style={titleStyle}>{p.title}</h1> : null}
        {p.subtitle ? <p style={subStyle}>{p.subtitle}</p> : null}
        {p.cta ? (
          <div style={{ marginTop: t.spacing * 2 }}>
            <Button 
              cta={p.cta} 
              tokens={t} 
              onOpenStudio={p.onOpenStudio} 
              onAddToCanvas={p.onAddToCanvas}
              elementData={heroElementData}
            />
          </div>
        ) : null}
      </div>
      <MediaView media={p.media} tokens={t} />
    </div>
  );
}

function Features({ p, t }: { p: DesignKitProps; t: Required<Tokens> }) {
  const grid: React.CSSProperties = {
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

function Pricing({ p, t }: { p: DesignKitProps; t: Required<Tokens> }) {
  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${Math.max(1, (p.tiers || []).length)}, minmax(0, 1fr))`,
    gap: t.spacing * 2,
  };
  return (
    <div>
      {p.title ? <h2 style={{ color: t.colorFg, marginTop: 0 }}>{p.title}</h2> : null}
      {p.subtitle ? <p style={{ color: t.colorMuted }}>{p.subtitle}</p> : null}
      <div style={grid}>
        {(p.tiers || []).map((tier, i) => {
          const tierElementData = {
            type: 'section' as const,
            data: {
              variant: 'pricing',
              tier: tier,
            }
          };
          
          return (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: t.radius, padding: t.spacing * 2 }}>
              <div style={{ color: t.colorFg, fontWeight: 700, fontSize: 18 }}>{tier.name}</div>
              <div style={{ color: t.colorFg, fontSize: 32, marginTop: t.spacing }}>{tier.price}</div>
              <ul style={{ marginTop: t.spacing, paddingLeft: t.spacing * 2, color: t.colorMuted }}>
                {tier.features.map((feat, j) => (
                  <li key={j}>{feat}</li>
                ))}
              </ul>
              {tier.cta ? (
                <div style={{ marginTop: t.spacing * 2 }}>
                  <Button 
                    cta={tier.cta} 
                    tokens={t} 
                    onOpenStudio={p.onOpenStudio}
                    onAddToCanvas={p.onAddToCanvas}
                    elementData={tierElementData}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Main Component ----------------
export default function DesignKitSection(props: DesignKitProps) {
  const t: Required<Tokens> = {
    colorBg: fallback(props.tokens?.colorBg, DEFAULT_TOKENS.colorBg),
    colorFg: fallback(props.tokens?.colorFg, DEFAULT_TOKENS.colorFg),
    colorMuted: fallback(props.tokens?.colorMuted, DEFAULT_TOKENS.colorMuted),
    colorPrimary: fallback(props.tokens?.colorPrimary, DEFAULT_TOKENS.colorPrimary),
    radius: fallback(props.tokens?.radius, DEFAULT_TOKENS.radius),
    spacing: fallback(props.tokens?.spacing, DEFAULT_TOKENS.spacing),
    fontFamily: fallback(props.tokens?.fontFamily, DEFAULT_TOKENS.fontFamily),
  };

  const variant: Variant = props.variant || "hero";
  const maxWidth = props.maxWidth ?? 1100;

  const sectionStyle: React.CSSProperties = {
    fontFamily: t.fontFamily,
    background: t.colorBg,
    color: t.colorFg,
    padding: `${t.spacing * 5}px ${t.spacing * 3}px`,
  };
  const containerStyle: React.CSSProperties = {
    maxWidth,
    margin: "0 auto",
  };

  let content: React.ReactNode = null;
  if (variant === "hero") content = <Hero p={props} t={t} />;
  else if (variant === "features") content = <Features p={props} t={t} />;
  else if (variant === "pricing") content = <Pricing p={props} t={t} />;

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>{content}</div>
    </section>
  );
}

// ---------------- Metadata (for visual editors / docs) ----------------
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
