import { ImageResponse } from "next/og";

export const alt = "Hulabe. Sites, e-commerce, SaaS and apps. Fast and clean.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
        {/* Subtle grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
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
            borderRadius: "100%",
            background:
              "radial-gradient(circle, rgba(163,230,53,0.55) 0%, rgba(163,230,53,0.18) 35%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Soft dark fade bottom */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 200,
            background:
              "linear-gradient(to top, rgba(10,10,10,0.95) 0%, transparent 100%)",
          }}
        />

        {/* Brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#A3E635",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "ui-monospace, monospace",
              fontSize: 22,
              fontWeight: 700,
              color: "#0A0A0A",
              letterSpacing: 0,
            }}
          >
            {"</>"}
          </div>
          <span>
            hulabe<span style={{ color: "#A3E635" }}>.</span>
          </span>
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Title */}
        <div
          style={{
            fontSize: 112,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            display: "flex",
            flexDirection: "column",
            zIndex: 1,
          }}
        >
          <span>Your idea,</span>
          <span>
            shipped<span style={{ color: "#A3E635" }}>.</span>
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            marginTop: 28,
            marginBottom: 0,
            fontSize: 28,
            lineHeight: 1.35,
            color: "#D4D4D8",
            maxWidth: 880,
            zIndex: 1,
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
            gap: 20,
            fontSize: 20,
            fontFamily: "ui-monospace, monospace",
            color: "#A1A1AA",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            zIndex: 1,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                background: "#A3E635",
                borderRadius: 4,
              }}
            />
            DEV STUDIO
          </span>
          <span style={{ color: "#3F3F46" }}>·</span>
          <span>Quote in 24h</span>
          <span style={{ color: "#3F3F46" }}>·</span>
          <span>Fixed price</span>
          <span style={{ color: "#3F3F46" }}>·</span>
          <span>From €500</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
