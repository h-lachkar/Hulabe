import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Hulabe <onboarding@resend.dev>";
export const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL ?? "hugo@hulabe.com";

type LeadConfirmationProps = {
  to: string;
  name?: string | null;
  locale: "fr" | "en" | "es";
};

const COPY = {
  fr: {
    subject: "On a bien reçu ta demande",
    hello: (n?: string | null) => (n ? `Salut ${n},` : "Salut,"),
    body: "Merci d'avoir pris le temps de nous écrire. On revient vers toi sous 24h ouvrées avec une réponse claire — devis fixé, planning, et prochaine étape.",
    booking: "Si tu veux gagner du temps, tu peux réserver un brief de 30 min directement :",
    bookingCta: "Réserver un créneau",
    sign: "À très vite,\nHugo — Hulabe",
  },
  en: {
    subject: "We got your request",
    hello: (n?: string | null) => (n ? `Hi ${n},` : "Hi,"),
    body: "Thanks for reaching out. We'll get back to you within 24 working hours with a clear answer — a fixed quote, timeline, and next step.",
    booking: "Want to skip ahead? Book a 30-min brief directly:",
    bookingCta: "Book a slot",
    sign: "Talk soon,\nHugo — Hulabe",
  },
  es: {
    subject: "Hemos recibido tu solicitud",
    hello: (n?: string | null) => (n ? `Hola ${n},` : "Hola,"),
    body: "Gracias por escribirnos. Te respondemos en menos de 24h hábiles con una respuesta clara — presupuesto fijo, calendario y siguiente paso.",
    booking: "Si quieres avanzar, reserva un brief de 30 min:",
    bookingCta: "Reservar hueco",
    sign: "Hablamos pronto,\nHugo — Hulabe",
  },
} as const;

function emailLayout(content: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#FAFAFA;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#141414;border:1px solid #262626;border-radius:16px;padding:40px;">
        <tr><td style="padding-bottom:24px;">
          <span style="display:inline-block;width:32px;height:32px;background:#A3E635;border-radius:8px;vertical-align:middle;"></span>
          <span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;margin-left:10px;vertical-align:middle;">hulabe<span style="color:#A3E635;">.</span></span>
        </td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#FAFAFA;">
          ${content}
        </td></tr>
        <tr><td style="padding-top:32px;font-size:12px;color:#71717A;border-top:1px solid #262626;margin-top:24px;">
          Hulabe · support@hulabe.com · hulabe.com
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendLeadConfirmation({ to, name, locale }: LeadConfirmationProps) {
  if (!resend) return;
  const c = COPY[locale];
  const calUrl = process.env.NEXT_PUBLIC_CAL_URL ?? "https://cal.com/hulabe/intro";
  const html = emailLayout(`
    <p style="margin:0 0 16px;">${c.hello(name)}</p>
    <p style="margin:0 0 16px;">${c.body}</p>
    <p style="margin:0 0 8px;">${c.booking}</p>
    <p style="margin:0 0 24px;">
      <a href="${calUrl}" style="display:inline-block;padding:12px 20px;background:#A3E635;color:#0A0A0A;text-decoration:none;border-radius:10px;font-weight:600;">${c.bookingCta}</a>
    </p>
    <p style="margin:0;white-space:pre-line;color:#A1A1AA;">${c.sign}</p>
  `);
  await resend.emails.send({ from: FROM_EMAIL, to, subject: c.subject, html });
}

type LeadNotificationProps = {
  source: "CONTACT_FORM" | "SIMULATOR";
  email: string;
  name?: string | null;
  phone?: string | null;
  message?: string | null;
  serviceType?: string | null;
  budget?: string | null;
  timeline?: string | null;
  features?: string[];
  estimatedPriceMin?: number | null;
  estimatedPriceMax?: number | null;
  locale: string;
  leadId: string;
};

export async function sendLeadNotification(props: LeadNotificationProps) {
  if (!resend) return;
  const rows: Array<[string, string]> = [
    ["Source", props.source],
    ["Locale", props.locale],
    ["Email", props.email],
  ];
  if (props.name) rows.push(["Name", props.name]);
  if (props.phone) rows.push(["Phone", props.phone]);
  if (props.serviceType) rows.push(["Service", props.serviceType]);
  if (props.budget) rows.push(["Budget", props.budget]);
  if (props.timeline) rows.push(["Timeline", props.timeline]);
  if (props.features && props.features.length > 0) rows.push(["Features", props.features.join(", ")]);
  if (props.estimatedPriceMin != null && props.estimatedPriceMax != null) {
    rows.push(["Estimate", `${props.estimatedPriceMin}€ – ${props.estimatedPriceMax}€`]);
  }
  if (props.message) rows.push(["Message", props.message]);
  rows.push(["Lead ID", props.leadId]);

  const tableRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;color:#A1A1AA;font-size:13px;border-bottom:1px solid #262626;">${k}</td><td style="padding:6px 12px;font-size:13px;border-bottom:1px solid #262626;">${escapeHtml(v)}</td></tr>`,
    )
    .join("");

  const html = emailLayout(`
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;">New lead — ${props.source.toLowerCase()}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0A0A0A;border:1px solid #262626;border-radius:10px;overflow:hidden;">
      ${tableRows}
    </table>
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFICATION_EMAIL,
    replyTo: props.email,
    subject: `[Hulabe] New ${props.source === "SIMULATOR" ? "simulator" : "contact"} lead — ${props.email}`,
    html,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
