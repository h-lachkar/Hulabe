import { ImageResponse } from "next/og";

/**
 * Twitter card image. Twitter prefers a 16:9 ratio (1200×675) for
 * `summary_large_image` cards, while OpenGraph uses 1.91:1 (1200×630).
 * Without a dedicated twitter-image, Next.js would reuse opengraph-image —
 * which works but gets letterboxed on Twitter.
 */
export const alt = "Hulabe. Sites, e-commerce, SaaS and apps. Fast and clean.";
export const size = { width: 1200, height: 675 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0A",
          color: "#FAFAFA",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            opacity: 0.6,
          }}
        />

        {/* Lime halo top-right */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -160,
            width: 900,
            height: 900,
            display: "flex",
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(163,230,53,0.55) 0%, rgba(163,230,53,0.18) 35%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Soft fade bottom */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 220,
            display: "flex",
            background:
              "linear-gradient(to top, rgba(10,10,10,0.95) 0%, transparent 100%)",
          }}
        />

        {/* Brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#A3E635",
              fontFamily: "ui-monospace, monospace",
              fontSize: 24,
              fontWeight: 700,
              color: "#0A0A0A",
              marginRight: 18,
            }}
          >
            {"</>"}
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              hulabe
            </span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#A3E635",
              }}
            >
              .
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 120,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            position: "relative",
          }}
        >
          <div style={{ display: "flex" }}>Your idea,</div>
          <div style={{ display: "flex" }}>
            <span>shipped</span>
            <span style={{ color: "#A3E635" }}>.</span>
          </div>
        </div>

        {/* Subtitle */}
        <p
          style={{
            marginTop: 28,
            marginBottom: 0,
            fontSize: 28,
            lineHeight: 1.35,
            color: "#D4D4D8",
            maxWidth: 920,
            position: "relative",
          }}
        >
          Marketing sites, e-commerce, SaaS and mobile apps. Fixed quote in 24h.
        </p>

        {/* Bottom row */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            alignItems: "center",
            fontSize: 20,
            fontFamily: "ui-monospace, monospace",
            color: "#A1A1AA",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 8,
                height: 8,
                display: "flex",
                background: "#A3E635",
                borderRadius: 4,
                marginRight: 10,
              }}
            />
            <span>DEV STUDIO</span>
          </div>
          <span style={{ color: "#3F3F46", margin: "0 16px" }}>·</span>
          <span>Quote in 24h</span>
          <span style={{ color: "#3F3F46", margin: "0 16px" }}>·</span>
          <span>Fixed price</span>
          <span style={{ color: "#3F3F46", margin: "0 16px" }}>·</span>
          <span>From €500</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
