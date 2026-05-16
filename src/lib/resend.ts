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
    sign: "À très vite,\nHugo — Hulabe",
  },
  en: {
    subject: "We got your request",
    hello: (n?: string | null) => (n ? `Hi ${n},` : "Hi,"),
    body: "Thanks for reaching out. We'll get back to you within 24 working hours with a clear answer — a fixed quote, timeline, and next step.",
    sign: "Talk soon,\nHugo — Hulabe",
  },
  es: {
    subject: "Hemos recibido tu solicitud",
    hello: (n?: string | null) => (n ? `Hola ${n},` : "Hola,"),
    body: "Gracias por escribirnos. Te respondemos en menos de 24h hábiles con una respuesta clara — presupuesto fijo, calendario y siguiente paso.",
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
  const html = emailLayout(`
    <p style="margin:0 0 16px;">${c.hello(name)}</p>
    <p style="margin:0 0 24px;">${c.body}</p>
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

/* ----------------------------- Client portal --------------------------- */

type ClientInvitationProps = {
  to: string;
  name?: string | null;
  magicLink: string;
  projectName: string;
};

/**
 * Invite a client to the portal — sent when admin clicks "Inviter au portail"
 * on /admin/projects/[id]. The link lands on /client/setup-password.
 */
export async function sendClientPortalInvitation({
  to,
  name,
  magicLink,
  projectName,
}: ClientInvitationProps) {
  if (!resend) return;
  const clientUrl =
    process.env.NEXT_PUBLIC_CLIENT_URL ?? "https://client.hulabe.com";
  const html = emailLayout(`
    <p style="margin:0 0 16px;">${name ? `Salut ${name},` : "Salut,"}</p>
    <p style="margin:0 0 16px;">
      On vient d'ouvrir ton espace client pour le projet
      <strong>${escapeHtml(projectName)}</strong>. Tu y trouveras l'avancement, les livrables, et un canal direct pour
      demander des ajustements.
    </p>
    <p style="margin:0 0 16px;">
      Pour commencer, choisis ton mot de passe en cliquant ci-dessous :
    </p>
    <p style="margin:0 0 24px;">
      <a href="${magicLink}" style="display:inline-block;padding:12px 20px;background:#A3E635;color:#0A0A0A;text-decoration:none;border-radius:10px;font-weight:600;">
        Définir mon mot de passe
      </a>
    </p>
    <p style="margin:0 0 16px;font-size:12px;color:#71717A;">
      Le lien est valable 1 heure. Si tu le perds, demande-en un nouveau sur
      <a style="color:#A3E635;" href="${clientUrl}/login">${clientUrl}/login</a>.
    </p>
    <p style="margin:0;white-space:pre-line;color:#A1A1AA;">À très vite,\nHugo — Hulabe</p>
  `);
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Ton espace Hulabe pour ${projectName}`,
    html,
  });
}

/* ------------------ Client password set / recovery email ---------------- */

type ClientPasswordEmailProps = {
  to: string;
  name?: string | null;
  link: string;
  mode: "invite" | "recovery";
};

export async function sendClientPasswordEmail({
  to,
  name,
  link,
  mode,
}: ClientPasswordEmailProps) {
  if (!resend) return;
  const clientUrl =
    process.env.NEXT_PUBLIC_CLIENT_URL ?? "https://client.hulabe.com";
  const isRecovery = mode === "recovery";
  const subject = isRecovery
    ? "Réinitialiser ton mot de passe Hulabe"
    : "Définir ton mot de passe pour l'espace client";
  const cta = isRecovery ? "Réinitialiser mon mot de passe" : "Définir mon mot de passe";
  const intro = isRecovery
    ? "Tu as demandé à réinitialiser ton mot de passe sur ton espace client."
    : "Pour accéder à ton espace client, choisis ton mot de passe.";

  const html = emailLayout(`
    <p style="margin:0 0 16px;">${name ? `Salut ${name},` : "Salut,"}</p>
    <p style="margin:0 0 16px;">${intro}</p>
    <p style="margin:0 0 24px;">
      <a href="${link}" style="display:inline-block;padding:12px 20px;background:#A3E635;color:#0A0A0A;text-decoration:none;border-radius:10px;font-weight:600;">
        ${cta}
      </a>
    </p>
    <p style="margin:0 0 16px;font-size:12px;color:#71717A;">
      Le lien est valable 1 heure. Si tu le perds, demande-en un nouveau sur
      <a style="color:#A3E635;" href="${clientUrl}/login">${clientUrl}/login</a>.
    </p>
    ${isRecovery ? `<p style="margin:0;font-size:12px;color:#71717A;">Si ce n'est pas toi qui as fait cette demande, ignore cet email.</p>` : ""}
  `);
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}

type SupportNotificationProps = {
  projectName: string;
  clientName: string;
  clientEmail: string;
  body: string;
  projectId: string;
};

export async function sendSupportNotificationToAdmin({
  projectName,
  clientName,
  clientEmail,
  body,
  projectId,
}: SupportNotificationProps) {
  if (!resend) return;
  const adminLink = adminPortalUrl(`/projects/${projectId}`);
  const html = emailLayout(`
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;">
      Nouveau ticket support — ${escapeHtml(projectName)}
    </p>
    <p style="margin:0 0 16px;color:#A1A1AA;">
      De ${escapeHtml(clientName)} (${escapeHtml(clientEmail)})
    </p>
    <pre style="margin:0 0 16px;padding:16px;background:#0A0A0A;border:1px solid #262626;border-radius:10px;white-space:pre-wrap;font-family:inherit;color:#FAFAFA;">${escapeHtml(body)}</pre>
    <p style="margin:0 0 24px;">
      <a href="${adminLink}" style="display:inline-block;padding:10px 16px;background:#1C1C1C;color:#FAFAFA;text-decoration:none;border:1px solid #262626;border-radius:10px;font-weight:500;font-size:13px;">
        Ouvrir dans l'admin
      </a>
    </p>
  `);
  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFICATION_EMAIL,
    replyTo: clientEmail,
    subject: `[Hulabe] Support ticket — ${projectName}`,
    html,
  });
}

/* --------------------------- Admin team invitation -------------------- */

type AdminInvitationProps = {
  to: string;
  name?: string | null;
  inviterName?: string | null;
  inviterEmail?: string | null;
  magicLink: string;
  role: "OWNER" | "ADMIN" | "VIEWER";
};

const ROLE_LABEL = {
  OWNER: "Owner",
  ADMIN: "Admin",
  VIEWER: "Viewer (lecture seule)",
};

export async function sendAdminInvitation({
  to,
  name,
  inviterName,
  inviterEmail,
  magicLink,
  role,
}: AdminInvitationProps) {
  if (!resend) return;
  const adminUrl = adminPortalUrl();
  const inviter = inviterName ?? inviterEmail ?? "L'équipe Hulabe";
  const html = emailLayout(`
    <p style="margin:0 0 16px;">${name ? `Salut ${name},` : "Salut,"}</p>
    <p style="margin:0 0 16px;">
      <strong>${escapeHtml(inviter)}</strong> t'invite à rejoindre l'espace admin de Hulabe en tant que
      <strong>${ROLE_LABEL[role]}</strong>.
    </p>
    <p style="margin:0 0 16px;">
      Pour commencer, choisis ton mot de passe en cliquant ci-dessous :
    </p>
    <p style="margin:0 0 24px;">
      <a href="${magicLink}" style="display:inline-block;padding:12px 20px;background:#A3E635;color:#0A0A0A;text-decoration:none;border-radius:10px;font-weight:600;">
        Définir mon mot de passe
      </a>
    </p>
    <p style="margin:0 0 16px;font-size:12px;color:#71717A;">
      Le lien est valable 1 heure. Si tu le perds, demande un nouveau lien sur
      <a style="color:#A3E635;" href="${adminUrl}/login">${adminUrl}/login</a>.
    </p>
    <p style="margin:0;color:#A1A1AA;font-size:12px;">Hulabe — Admin</p>
  `);
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Invitation à l'admin Hulabe`,
    html,
  });
}

/* ------------------ Admin password set / recovery email ---------------- */

type AdminPasswordEmailProps = {
  to: string;
  name?: string | null;
  link: string;
  mode: "invite" | "recovery";
};

export async function sendAdminPasswordEmail({
  to,
  name,
  link,
  mode,
}: AdminPasswordEmailProps) {
  if (!resend) return;
  const adminUrl = adminPortalUrl();
  const isRecovery = mode === "recovery";
  const subject = isRecovery
    ? "Réinitialiser ton mot de passe Hulabe admin"
    : "Définir ton mot de passe pour l'admin Hulabe";
  const cta = isRecovery
    ? "Réinitialiser mon mot de passe"
    : "Définir mon mot de passe";
  const intro = isRecovery
    ? "Tu as demandé à réinitialiser ton mot de passe sur l'admin Hulabe."
    : "Pour accéder à ton admin, choisis ton mot de passe.";

  const html = emailLayout(`
    <p style="margin:0 0 16px;">${name ? `Salut ${name},` : "Salut,"}</p>
    <p style="margin:0 0 16px;">${intro}</p>
    <p style="margin:0 0 24px;">
      <a href="${link}" style="display:inline-block;padding:12px 20px;background:#A3E635;color:#0A0A0A;text-decoration:none;border-radius:10px;font-weight:600;">
        ${cta}
      </a>
    </p>
    <p style="margin:0 0 16px;font-size:12px;color:#71717A;">
      Le lien est valable 1 heure. Si tu le perds, demande un nouveau lien sur
      <a style="color:#A3E635;" href="${adminUrl}/login">${adminUrl}/login</a>.
    </p>
    ${isRecovery ? `<p style="margin:0;font-size:12px;color:#71717A;">Si ce n'est pas toi qui as fait cette demande, ignore cet email.</p>` : ""}
  `);
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ----------------------- Client-facing project emails ----------------- */

const STATUS_TITLE_FR: Record<string, string> = {
  DRAFT: "Brief",
  QUOTED: "Devis envoyé",
  SIGNED: "Projet signé",
  IN_PROGRESS: "Build démarré",
  IN_REVIEW: "En review",
  SHIPPED: "Livré",
  ARCHIVED: "Archivé",
};

function projectPortalUrl(projectId: string) {
  const base =
    process.env.NEXT_PUBLIC_CLIENT_URL ??
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hulabe.com"}/client`;
  return `${base}/projects/${projectId}`;
}

function adminPortalUrl(path: string = "") {
  const base =
    process.env.NEXT_PUBLIC_ADMIN_URL ??
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hulabe.com"}/admin`;
  return `${base}${path}`;
}

type ProjectStatusEmailProps = {
  to: string;
  name?: string | null;
  projectId: string;
  projectName: string;
  newStatus: string;
};

export async function sendProjectStatusUpdate({
  to,
  name,
  projectId,
  projectName,
  newStatus,
}: ProjectStatusEmailProps) {
  if (!resend) return;
  const statusLabel = STATUS_TITLE_FR[newStatus] ?? newStatus;
  const portalUrl = projectPortalUrl(projectId);
  const html = emailLayout(`
    <p style="margin:0 0 16px;">${name ? `Salut ${name},` : "Salut,"}</p>
    <p style="margin:0 0 16px;">
      Petit update sur <strong>${escapeHtml(projectName)}</strong> :
    </p>
    <p style="margin:0 0 24px;">
      <span style="display:inline-block;padding:6px 12px;background:rgba(163,230,53,0.1);color:#A3E635;border:1px solid rgba(163,230,53,0.3);border-radius:8px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
        ${escapeHtml(statusLabel)}
      </span>
    </p>
    <p style="margin:0 0 24px;">
      <a href="${portalUrl}" style="display:inline-block;padding:12px 20px;background:#A3E635;color:#0A0A0A;text-decoration:none;border-radius:10px;font-weight:600;">
        Voir le projet
      </a>
    </p>
    <p style="margin:0;color:#A1A1AA;font-size:12px;">Hugo — Hulabe</p>
  `);
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${projectName} — ${statusLabel}`,
    html,
  });
}

type DeliverableEmailProps = {
  to: string;
  name?: string | null;
  projectId: string;
  projectName: string;
  deliverableTitle: string;
  deliverableUrl?: string | null;
};

export async function sendDeliverableAdded({
  to,
  name,
  projectId,
  projectName,
  deliverableTitle,
  deliverableUrl,
}: DeliverableEmailProps) {
  if (!resend) return;
  const portalUrl = projectPortalUrl(projectId);
  const html = emailLayout(`
    <p style="margin:0 0 16px;">${name ? `Salut ${name},` : "Salut,"}</p>
    <p style="margin:0 0 16px;">
      Nouveau livrable sur <strong>${escapeHtml(projectName)}</strong> :
    </p>
    <p style="margin:0 0 24px;font-size:16px;">
      <strong style="color:#A3E635;">${escapeHtml(deliverableTitle)}</strong>
    </p>
    <p style="margin:0 0 24px;">
      <a href="${deliverableUrl ?? portalUrl}" style="display:inline-block;padding:12px 20px;background:#A3E635;color:#0A0A0A;text-decoration:none;border-radius:10px;font-weight:600;">
        ${deliverableUrl ? "Ouvrir le livrable" : "Voir sur le portail"}
      </a>
    </p>
    <p style="margin:0;font-size:12px;color:#A1A1AA;">
      Toujours dispo dans ton espace : <a href="${portalUrl}" style="color:#A3E635;">${portalUrl}</a>
    </p>
  `);
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${projectName} — nouveau livrable`,
    html,
  });
}

type NoteEmailProps = {
  to: string;
  name?: string | null;
  projectId: string;
  projectName: string;
  body: string;
};

export async function sendClientNote({
  to,
  name,
  projectId,
  projectName,
  body,
}: NoteEmailProps) {
  if (!resend) return;
  const portalUrl = projectPortalUrl(projectId);
  const preview = body.length > 280 ? body.slice(0, 280) + "…" : body;
  const html = emailLayout(`
    <p style="margin:0 0 16px;">${name ? `Salut ${name},` : "Salut,"}</p>
    <p style="margin:0 0 16px;">Update sur <strong>${escapeHtml(projectName)}</strong> :</p>
    <blockquote style="margin:0 0 24px;padding:14px 16px;background:#0A0A0A;border-left:3px solid #A3E635;border-radius:6px;color:#FAFAFA;white-space:pre-wrap;font-size:14px;line-height:1.55;">
      ${escapeHtml(preview)}
    </blockquote>
    <p style="margin:0 0 24px;">
      <a href="${portalUrl}" style="display:inline-block;padding:12px 20px;background:#A3E635;color:#0A0A0A;text-decoration:none;border-radius:10px;font-weight:600;">
        Voir sur le portail
      </a>
    </p>
  `);
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${projectName} — update`,
    html,
  });
}

type SupportReplyEmailProps = {
  to: string;
  name?: string | null;
  projectId: string;
  projectName: string;
  reply: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
};

export async function sendSupportReplyToClient({
  to,
  name,
  projectId,
  projectName,
  reply,
  status,
}: SupportReplyEmailProps) {
  if (!resend) return;
  const portalUrl = projectPortalUrl(projectId);
  const html = emailLayout(`
    <p style="margin:0 0 16px;">${name ? `Salut ${name},` : "Salut,"}</p>
    <p style="margin:0 0 16px;">
      On a répondu à ta demande sur <strong>${escapeHtml(projectName)}</strong> :
    </p>
    <blockquote style="margin:0 0 16px;padding:14px 16px;background:#0A0A0A;border-left:3px solid #A3E635;border-radius:6px;color:#FAFAFA;white-space:pre-wrap;font-size:14px;line-height:1.55;">
      ${escapeHtml(reply)}
    </blockquote>
    <p style="margin:0 0 24px;">
      <span style="display:inline-block;padding:4px 10px;background:rgba(163,230,53,0.1);color:#A3E635;border:1px solid rgba(163,230,53,0.3);border-radius:6px;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">
        ${status}
      </span>
    </p>
    <p style="margin:0 0 24px;">
      <a href="${portalUrl}" style="display:inline-block;padding:12px 20px;background:#A3E635;color:#0A0A0A;text-decoration:none;border-radius:10px;font-weight:600;">
        Voir sur le portail
      </a>
    </p>
    <p style="margin:0;color:#A1A1AA;font-size:12px;">Tu peux répondre directement à cet email.</p>
  `);
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${projectName} — réponse à ta demande`,
    html,
  });
}

/* ---------------------- Admin-initiated templates ----------------------- */

/**
 * Generic admin → client/lead email sender. The admin chooses one of the
 * predefined templates (welcome / quote_sent / project_update / feedback /
 * custom) and the body + subject are filled from a template registry.
 */
export type AdminEmailTemplate =
  | "WELCOME"
  | "QUOTE_SENT"
  | "PROJECT_UPDATE"
  | "FEEDBACK_REQUEST"
  | "CUSTOM";

type AdminEmailVars = {
  recipientName?: string;
  projectName?: string;
  customSubject?: string;
  customBody?: string;
  ctaUrl?: string;
  ctaLabel?: string;
};

function renderAdminTemplate(template: AdminEmailTemplate, vars: AdminEmailVars) {
  const greet = vars.recipientName ? `Hi ${vars.recipientName},` : "Hi,";
  const cta =
    vars.ctaUrl && vars.ctaLabel
      ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(vars.ctaUrl)}" style="display:inline-block;background:#A3E635;color:#0A0A0A;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;">${escapeHtml(vars.ctaLabel)}</a></p>`
      : "";

  switch (template) {
    case "WELCOME":
      return {
        subject: vars.projectName
          ? `Welcome aboard — ${vars.projectName}`
          : "Welcome aboard",
        html: `
<p style="margin:0 0 16px;">${escapeHtml(greet)}</p>
<p style="margin:0 0 16px;">Thrilled to start working with you${vars.projectName ? ` on ${escapeHtml(vars.projectName)}` : ""}. Here's what happens next:</p>
<ol style="padding-left:18px;color:#D4D4D8;line-height:1.7;margin:0 0 16px;">
  <li>I'll send you a kickoff doc within 24h.</li>
  <li>We schedule a 30 min sync to align on scope.</li>
  <li>You'll get a private client portal to track everything.</li>
</ol>
${cta}
<p style="margin:24px 0 0;color:#A1A1AA;font-size:13px;">Just reply if anything's unclear.</p>
        `,
      };
    case "QUOTE_SENT":
      return {
        subject: vars.projectName
          ? `Your quote for ${vars.projectName}`
          : "Your quote",
        html: `
<p style="margin:0 0 16px;">${escapeHtml(greet)}</p>
<p style="margin:0 0 16px;">Your quote is ready. Fixed price, clear scope, committed timeline — no surprises.</p>
${cta || `<p style="margin:24px 0 0;color:#A1A1AA;font-size:13px;">Attached to this email / linked in your client portal.</p>`}
<p style="margin:24px 0 0;color:#A1A1AA;font-size:13px;">Reply with any questions — happy to walk through it on a call.</p>
        `,
      };
    case "PROJECT_UPDATE":
      return {
        subject: vars.projectName
          ? `Update on ${vars.projectName}`
          : "Project update",
        html: `
<p style="margin:0 0 16px;">${escapeHtml(greet)}</p>
<p style="margin:0 0 16px;">Quick update on where we are:</p>
<div style="white-space:pre-line;padding:16px;background:#1C1C1C;border-radius:8px;color:#D4D4D8;line-height:1.7;">${escapeHtml(vars.customBody ?? "")}</div>
${cta}
        `,
      };
    case "FEEDBACK_REQUEST":
      return {
        subject: vars.projectName
          ? `Quick feedback on ${vars.projectName}?`
          : "Quick feedback?",
        html: `
<p style="margin:0 0 16px;">${escapeHtml(greet)}</p>
<p style="margin:0 0 16px;">Could you spare 2 minutes to share your feedback on ${vars.projectName ? escapeHtml(vars.projectName) : "the work so far"}? Anything that feels off, missing, or could be sharper — I want to hear it.</p>
${cta}
<p style="margin:24px 0 0;color:#A1A1AA;font-size:13px;">A reply to this email works too.</p>
        `,
      };
    case "CUSTOM":
    default:
      return {
        subject: vars.customSubject || "A message from Hulabe",
        html: `
<p style="margin:0 0 16px;">${escapeHtml(greet)}</p>
<div style="white-space:pre-line;color:#D4D4D8;line-height:1.7;">${escapeHtml(vars.customBody ?? "")}</div>
${cta}
        `,
      };
  }
}

export async function sendAdminEmail(params: {
  to: string;
  template: AdminEmailTemplate;
  vars?: AdminEmailVars;
  /** Override the auto-generated subject. */
  subject?: string;
  /** Optional cc (e.g. the admin who sent it). */
  cc?: string;
}) {
  if (!resend) {
    throw new Error("Resend is not configured (RESEND_API_KEY missing).");
  }
  const tpl = renderAdminTemplate(params.template, params.vars ?? {});
  const html = emailLayout(tpl.html);
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    cc: params.cc,
    subject: params.subject || tpl.subject,
    html,
    replyTo: NOTIFICATION_EMAIL,
  });
}
