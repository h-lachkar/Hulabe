import { ImageResponse } from "next/og";

export const alt = "Hulabe — Sites, e-commerce, SaaS et apps. Rapides et propres.";
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
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Halo */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -100,
            width: 800,
            height: 800,
            borderRadius: "100%",
            background:
              "radial-gradient(circle, rgba(163,230,53,0.5) 0%, rgba(163,230,53,0.15) 35%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#A3E635",
            }}
          />
          <span>
            hulabe<span style={{ color: "#A3E635" }}>.</span>
          </span>
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Title */}
        <div
          style={{
            fontSize: 100,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Build fast.</span>
          <span>
            Ship faster<span style={{ color: "#A3E635" }}>.</span>
          </span>
        </div>

        {/* Bottom row */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 22,
            fontFamily: "ui-monospace, monospace",
            color: "#A1A1AA",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, background: "#A3E635", borderRadius: 4 }} />
            DEV STUDIO
          </span>
          <span>·</span>
          <span>Quote in 24h</span>
          <span>·</span>
          <span>Kickoff in 7 days</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
