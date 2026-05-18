import { ImageResponse } from "next/og";

/**
 * LinkedIn company-page banner generator.
 *
 * LinkedIn spec: 1128×191 (4:1 ratio). We render at 1584×396 (also 4:1) for
 * Retina sharpness. LinkedIn will accept it and downscale.
 *
 * Visit /linkedin-banner, save the PNG, upload to LinkedIn → Edit page → Cover.
 *
 * Note: Satori (the renderer inside next/og) requires every parent of multiple
 * children to have `display: flex` (or `display: none`) explicitly set, and
 * does NOT accept units on numeric-only props (z-index, etc.).
 */

export const runtime = "edge";

const W = 1584;
const H = 396;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0A",
          color: "#FAFAFA",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 96px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
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
            opacity: 0.7,
          }}
        />

        {/* Lime halo top-right */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -160,
            width: 800,
            height: 800,
            display: "flex",
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(163,230,53,0.55) 0%, rgba(163,230,53,0.18) 35%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Dark vignette left side for text contrast */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "linear-gradient(to right, rgba(10,10,10,0.6) 0%, transparent 40%)",
          }}
        />

        {/* Left: brand block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Code mark */}
          <div
            style={{
              width: 96,
              height: 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 22,
              background: "#A3E635",
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 38,
              fontWeight: 700,
              color: "#0A0A0A",
              marginRight: 24,
            }}
          >
            {"</>"}
          </div>
          {/* Wordmark + sub */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 82,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              <span>hulabe</span>
              <span style={{ color: "#A3E635" }}>.</span>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 10,
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 16,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#A1A1AA",
              }}
            >
              dev studio · fast · clean
            </div>
          </div>
        </div>

        {/* Right: tagline + trust strip */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            position: "relative",
            maxWidth: 720,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            <div style={{ display: "flex" }}>Your idea,</div>
            <div style={{ display: "flex" }}>
              <span>shipped</span>
              <span style={{ color: "#A3E635" }}>.</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 22,
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 17,
              color: "#A1A1AA",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
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
              <span>Quote in 24h</span>
            </div>
            <span style={{ color: "#3F3F46", margin: "0 16px" }}>·</span>
            <span>Fixed price</span>
            <span style={{ color: "#3F3F46", margin: "0 16px" }}>·</span>
            <span>hulabe.com</span>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
