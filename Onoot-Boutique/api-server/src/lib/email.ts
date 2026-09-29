import nodemailer from 'nodemailer';
import { logger } from './logger';

// ─── Configuration Transporter ───────────────────────────────────────────────
export function createTransporter(forcedPort?: number) {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  // Cloud providers (Render, AWS) block port 587. Port 465 (SSL) is open and reliable.
  const envPort = Number(process.env.SMTP_PORT);
  const port = forcedPort || (envPort && envPort !== 587 ? envPort : 465);
  const isSecure = port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }

  return {
    sendMail: async (mailOptions: nodemailer.SendMailOptions) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 [EMAIL LOG] To: ${mailOptions.to}`);
      console.log(`📌 [SUBJECT]: ${mailOptions.subject}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { messageId: 'simulated-' + Date.now() };
    },
  } as any;
}

export async function sendMailWithFallback(mailOptions: nodemailer.SendMailOptions): Promise<any> {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  if (!user || !pass) {
    logger.warn('SMTP_USER or SMTP_PASS is missing. Email simulation mode active.');
    return { messageId: 'simulated-' + Date.now() };
  }

  // 1st attempt: Port 465 (Direct SSL)
  try {
    const transporter465 = createTransporter(465);
    const info = await transporter465.sendMail(mailOptions);
    logger.info({ to: mailOptions.to, port: 465, messageId: info.messageId }, 'Email sent successfully via port 465');
    return info;
  } catch (err465: any) {
    logger.warn({ err: err465.message }, 'Failed sending via port 465, attempting port 2525 fallback...');
    // 2nd attempt: Port 2525 (Alternative STARTTLS)
    try {
      const transporter2525 = createTransporter(2525);
      const info = await transporter2525.sendMail(mailOptions);
      logger.info({ to: mailOptions.to, port: 2525, messageId: info.messageId }, 'Email sent successfully via port 2525');
      return info;
    } catch (err2525: any) {
      logger.warn({ err: err2525.message }, 'Failed sending via port 2525, attempting port 587 as last resort...');
      // 3rd attempt: Port 587
      const transporter587 = createTransporter(587);
      return await transporter587.sendMail(mailOptions);
    }
  }
}

export const getFromAddress = () => {
  const from = (process.env.SMTP_FROM || '').trim();
  if (from.includes('<') && from.includes('>') && from.includes('@')) return from;
  const cleanEmail =
    (from.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] ||
    'onootboutique@gmail.com';
  return `"Onoot Boutique" <${cleanEmail}>`;
};

// ─── Email professionnel de la boutique ─────────────────────────────────────
export const SHOP_EMAIL = (process.env.SHOP_EMAIL || process.env.BOUTIQUE_EMAIL || 'onootboutique@gmail.com').trim();

// ─── Base URLs dynamiques (Production Vercel vs Local) ────────────────────────
export function getBoutiqueUrl(): string {
  const url = process.env.BOUTIQUE_URL || process.env.CLIENT_URL || process.env.FRONTEND_URL;
  if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    return 'https://onoot-boutique.vercel.app';
  }
  return (url || 'http://localhost:5182').replace(/\/+$/, '');
}

export function getAdminUrl(): string {
  const url = process.env.ADMIN_URL;
  if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    return 'https://onoot-boutique-admin.vercel.app';
  }
  return (url || 'http://localhost:5181').replace(/\/+$/, '');
}

// ─── Design System ────────────────────────────────────────────────────────────
const C = {
  orange:      '#E87C2A',
  orangeDark:  '#D06820',
  orange2:     '#C96A20',
  blue:        '#4BB5E8',
  blueDark:    '#3A9FD4',
  yellow:      '#F5C430',
  yellowDark:  '#E0AF20',
  green:       '#3DB649',
  dark:        '#111827',
  body:        '#374151',
  muted:       '#6B7280',
  light:       '#9CA3AF',
  bg:          '#F3F4F6',
  white:       '#FFFFFF',
  card:        '#F9FAFB',
  border:      '#E5E7EB',
  dash:        '#D1D5DB',
};

// ─── Lucide SVG Icons (inline, email-safe) ────────────────────────────────────
// Each icon is a 16×16 inline SVG matching the Lucide stroke style
const icon = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  key:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
  mail:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  user:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
  mapPin:   `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  phone:    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.5 6.5l.42-.42a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17Z"/></svg>`,
  bag:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  creditCard:`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  package:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="M3.3 7 12 12l8.7-5"/><path d="m7.5 4.27 9 5.15"/></svg>`,
  packageAmber: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;flex-shrink:0;"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="M3.3 7 12 12l8.7-5"/><path d="m7.5 4.27 9 5.15"/></svg>`,
  truck:    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
  shield:   `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
  check:    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><path d="M20 6 9 17l-5-5"/></svg>`,
  calBlue:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  clipBoard: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`,
  xCircleRed: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  alertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BE123C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;flex-shrink:0;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
};

// ─── Logo Onoot Boutique EXACT (copie de OnootLogo.tsx) ──────────────────────
// 3 sacs vectoriels bleu/jaune/orange + texte Onoot / BOUTIQUE
const ONOOT_LOGO_HTML = `
<table role="presentation" cellspacing="0" cellpadding="0" align="center">
  <tr>
    <!-- Sacs SVG (taille md = 44px comme OnootLogo) -->
    <td valign="middle" style="padding-right:10px;">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Sac bleu (arrière gauche, -14deg) -->
        <g transform="rotate(-14 14 26)">
          <rect x="4" y="14" width="16" height="20" rx="2.5" fill="#4BB5E8"/>
          <rect x="4" y="14" width="16" height="5" rx="0" fill="#3A9FD4"/>
          <path d="M9 14 Q9 9.5 12 9.5 Q15 9.5 15 14" stroke="#1D3D6B" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        </g>
        <!-- Sac jaune (centre) -->
        <rect x="14" y="11" width="16" height="23" rx="2.5" fill="#F5C430"/>
        <rect x="14" y="11" width="16" height="6" rx="0" fill="#E0AF20"/>
        <path d="M18 11 Q18 6 22 6 Q26 6 26 11" stroke="#1D3D6B" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <!-- Sac orange (avant droit, +14deg) -->
        <g transform="rotate(14 30 24)">
          <rect x="24" y="12" width="16" height="22" rx="2.5" fill="#E87C2A"/>
          <rect x="24" y="12" width="16" height="6" rx="0" fill="#D06820"/>
          <path d="M28 12 Q28 7 32 7 Q36 7 36 12" stroke="#1D3D6B" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        </g>
      </svg>
    </td>
    <!-- Texte Onoot / BOUTIQUE -->
    <td valign="middle">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:20px;font-weight:800;color:#111827;line-height:1;letter-spacing:-0.6px;">Onoot</div>
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:8px;font-weight:700;color:#3DB649;letter-spacing:3.5px;line-height:1;margin-top:3px;text-transform:uppercase;">BOUTIQUE</div>
    </td>
  </tr>
</table>`;

// ─── Bande tricolore signature + En-tête avec logo ───────────────────────────
const TICKET_HEADER = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <!-- Bande tricolore 3px bleue/jaune/orange -->
  <tr>
    <td style="padding:0;line-height:0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="33%" style="background-color:${C.blue};height:6px;font-size:0;line-height:0;"></td>
          <td width="34%" style="background-color:${C.yellow};height:6px;font-size:0;line-height:0;"></td>
          <td width="33%" style="background-color:${C.orange};height:6px;font-size:0;line-height:0;"></td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Logo centré -->
  <tr>
    <td align="center" style="background-color:${C.card};padding:26px 20px 20px;border-bottom:2px dashed ${C.dash};">
      ${ONOOT_LOGO_HTML}
    </td>
  </tr>
</table>`;

// ─── Footer ───────────────────────────────────────────────────────────────────
const TICKET_FOOTER = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="background-color:${C.card};border-top:2px dashed ${C.dash};padding:18px 28px;text-align:center;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${C.muted};font-size:13px;font-weight:500;margin:0 0 4px;">Merci de votre confiance !</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${C.light};font-size:11px;margin:0;">
        &copy; ${new Date().getFullYear()} Onoot Boutique &middot; Accessoires High-Tech &amp; Gadgets Premium
      </p>
    </td>
  </tr>
</table>`;

// ─── Enveloppe Ticket Générique ───────────────────────────────────────────────
const wrapInTicket = (body: string, preheader = '') => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Onoot Boutique</title>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${C.bg};padding:36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px;background-color:${C.white};border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.09);border:1px solid ${C.border};">
          <tr><td>${TICKET_HEADER}</td></tr>
          <tr><td style="padding:32px 32px 28px;">${body}</td></tr>
          <tr><td>${TICKET_FOOTER}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  pending:   { label: 'En attente de traitement', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', desc: 'Votre commande a bien été reçue et est en attente de validation par notre équipe.' },
  confirmed: { label: 'Commande Confirmée',        color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD', desc: 'Bonne nouvelle ! Votre commande a été confirmée et est en cours de préparation.' },
  shipped:   { label: 'En cours de livraison',     color: '#4338CA', bg: '#E0E7FF', border: '#A5B4FC', desc: 'Votre colis a été confié à notre transporteur et est en route vers chez vous.' },
  delivered: { label: 'Commande Livrée',            color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', desc: 'Votre commande a été livrée avec succès. Nous espérons que vos articles vous plairont !' },
  cancelled: { label: 'Commande Annulée',           color: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5', desc: 'Votre commande a été annulée. Contactez notre support pour toute assistance.' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIVIDER = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;"><tr><td style="border-top:2px dashed ${C.dash};font-size:0;height:0;"></td></tr></table>`;

/** Formate la localisation proprement sans doublons : ville et commune (ex: "Abidjan, Cocody"). */
function formatLocation(address?: string, city?: string, _country?: string): string {
  const rawParts: string[] = [];
  if (city && city.trim()) rawParts.push(...city.split(','));
  if (address && address.trim()) rawParts.push(...address.split(','));

  const cleanParts: string[] = [];
  const seen = new Set<string>();

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      cleanParts.push(trimmed);
    }
  }

  return cleanParts.join(', ');
}

const ctaButton = (label: string, href: string) => `
<div style="text-align:center;margin-top:28px;">
  <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${C.orange} 0%,${C.orange2} 100%);color:${C.white};text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.2px;padding:14px 36px;border-radius:10px;box-shadow:0 4px 14px rgba(232,124,42,0.38);">
    ${label} &rarr;
  </a>
</div>`;

// Ligne de données avec icône Lucide SVG inline
const dataRow = (svgIcon: string, label: string, value: string) => `
<tr>
  <td style="padding:9px 0;color:${C.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;vertical-align:middle;white-space:nowrap;">
    ${svgIcon}${label}
  </td>
  <td style="padding:9px 0;color:${C.dark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:600;text-align:right;vertical-align:middle;">${value}</td>
</tr>`;

// Titre de section (style comme ticket)
const sectionTitle = (svgIcon: string, label: string) => `
<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;display:flex;align-items:center;">
  ${svgIcon}${label}
</p>`;

// ─── 1. Email de connexion ────────────────────────────────────────────────────
export async function sendLoginNotification(
  toEmail: string,
  userName: string,
  meta?: { ip?: string; date?: Date; provider?: string }
): Promise<void> {
  if (!toEmail) return;
  const transporter = createTransporter();
  const dateStr = (meta?.date || new Date()).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const provider = meta?.provider === 'google' ? 'Google OAuth' : 'Email & Mot de passe';

  const body = `
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;text-align:center;">Alerte de sécurité</p>
    <h2 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:800;color:${C.dark};margin:0 0 10px;text-align:center;letter-spacing:-0.4px;">Connexion détectée</h2>
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;color:${C.body};text-align:center;margin:0 0 4px;">Bonjour <strong>${userName || 'cher(e) client(e)'}</strong>,</p>
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:${C.muted};text-align:center;margin:0 0 24px;line-height:1.6;">Une connexion à votre compte Onoot Boutique vient d'être effectuée avec succès.</p>

    ${DIVIDER}

    ${sectionTitle(icon.shield, 'Détails de la connexion')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:4px 16px;">
      ${dataRow(icon.calendar, 'Date &amp; heure', dateStr)}
      ${dataRow(icon.key,      'Méthode',          provider)}
      ${dataRow(icon.mail,     'Compte',            toEmail)}
    </table>

    ${DIVIDER}

    <div style="background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 18px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#1E40AF;font-weight:500;margin:0;line-height:1.6;text-align:center;">
        ${icon.shield}Si vous n'êtes pas à l'origine de cette connexion, <strong>changez votre mot de passe immédiatement</strong>.
      </p>
    </div>

    ${ctaButton('Accéder à la boutique', getBoutiqueUrl())}`;

  const html = wrapInTicket(body, 'Connexion réussie sur votre compte Onoot Boutique');

  try {
    await sendMailWithFallback({ from: getFromAddress(), to: toEmail, subject: 'Connexion réussie – Onoot Boutique', html });
    logger.info({ to: toEmail }, 'Login notification email sent');
  } catch (err: any) {
    logger.error({ err: err.message, to: toEmail }, 'Failed to send login notification email');
  }
}

// ─── 2. Email de confirmation de commande ─────────────────────────────────────
export async function sendOrderConfirmation(order: any, customerEmail: string): Promise<void> {
  if (!customerEmail) return;
  const transporter = createTransporter();
  const orderIdShort = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
  const totalFormatted = (order.totalAmount || 0).toLocaleString('fr-FR');
  const dateFormatted = (order.createdAt ? new Date(order.createdAt) : new Date()).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const shipping = order.shippingAddress || {};

  const shippingCost = typeof order.shippingCost === "number" ? order.shippingCost : 0;
  const itemsTotal = typeof order.itemsTotal === "number" && order.itemsTotal > 0 ? order.itemsTotal : ((order.totalAmount || 0) - shippingCost);
  const itemsTotalFormatted = itemsTotal.toLocaleString('fr-FR');
  const shippingCostFormatted = shippingCost.toLocaleString('fr-FR');

  const itemsHtml = (order.items || []).map((item: any) => `
    <tr style="border-bottom:1px solid ${C.dash};">
      <td style="padding:12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="font-size:14px;font-weight:700;color:${C.dark};">${item.productName || 'Article'}</div>
        <div style="font-size:12px;color:${C.muted};margin-top:3px;">Qté&nbsp;: <strong>${item.quantity}</strong> &times; ${(item.price || 0).toLocaleString('fr-FR')}&nbsp;FCFA</div>
      </td>
      <td style="padding:12px 0;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:700;color:${C.dark};">
        ${((item.price || 0) * (item.quantity || 1)).toLocaleString('fr-FR')}&nbsp;FCFA
      </td>
    </tr>`).join('');

  const body = `
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;text-align:center;">Reçu de commande</p>
    <h1 style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:900;color:${C.dark};margin:0 0 6px;text-align:center;">#${orderIdShort}</h1>
    <p style="text-align:center;margin:0 0 20px;">
      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};">
        ${icon.calendar}${dateFormatted}
      </span>
    </p>

    <!-- Badge succès -->
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;background-color:#DCFCE7;color:#15803D;border:1px solid #86EFAC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;padding:6px 16px;border-radius:9999px;">
        ${icon.check}&nbsp;Commande enregistrée avec succès
      </span>
    </div>

    ${DIVIDER}

    ${sectionTitle(icon.user, 'Destinataire')}
    <div style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px 18px;margin-bottom:22px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:800;color:${C.dark};margin:0 0 8px;">${shipping.fullName || 'Client'}</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0 0 4px;">${icon.mapPin}${formatLocation(shipping.address, shipping.city)}</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0;">${icon.phone}${shipping.phone || ''}</p>
    </div>

    ${DIVIDER}

    ${sectionTitle(icon.bag, 'Achats')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itemsHtml}</table>

    ${DIVIDER}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:4px 16px;margin-bottom:14px;">
      ${dataRow(icon.creditCard, 'Paiement',  order.paymentMethod || 'Paiement à la livraison')}
      ${dataRow(icon.package,    'Statut',    'En attente de validation')}
    </table>

    <!-- Détail des montants -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:8px 16px;margin-bottom:16px;">
      <tr>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};padding:6px 0;">Sous-total articles :</td>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;color:${C.dark};text-align:right;">${itemsTotalFormatted}&nbsp;FCFA</td>
      </tr>
      <tr>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};padding:6px 0;border-top:1px dashed ${C.dash};">Frais de livraison (${shipping.city || 'Standard'}) :</td>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;color:${C.orange};text-align:right;border-top:1px dashed ${C.dash};">+ ${shippingCostFormatted}&nbsp;FCFA</td>
      </tr>
    </table>

    <!-- Total sombre -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color:${C.dark};border-radius:14px;padding:18px 22px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:500;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;">TOTAL À PAYER AU LIVREUR</td>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:24px;font-weight:900;color:${C.white};text-align:right;">${totalFormatted}&nbsp;FCFA</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('Suivre ma commande', `${getBoutiqueUrl()}/orders/${order._id}`)}`;

  const html = wrapInTicket(body, `Confirmation de votre commande #${orderIdShort}`);
  try {
    await sendMailWithFallback({ from: getFromAddress(), to: customerEmail, subject: `✅ Commande #ORD-${orderIdShort} confirmée – Onoot Boutique`, html });
    logger.info({ to: customerEmail, orderId: order._id }, 'Order confirmation email sent');
  } catch (err: any) {
    logger.error({ err: err.message, to: customerEmail }, 'Failed to send order confirmation email');
  }
}

// ─── 2b. Notification nouvelle commande pour la Boutique (onootboutique@gmail.com) ───
export async function sendShopNewOrderNotification(order: any, shopEmail: string = SHOP_EMAIL): Promise<void> {
  if (!shopEmail) return;
  const transporter = createTransporter();
  const orderIdShort = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
  const totalFormatted = (order.totalAmount || 0).toLocaleString('fr-FR');
  const dateFormatted = (order.createdAt ? new Date(order.createdAt) : new Date()).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const shipping = order.shippingAddress || {};

  const itemsHtml = (order.items || []).map((item: any) => `
    <tr style="border-bottom:1px solid ${C.dash};">
      <td style="padding:12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="font-size:14px;font-weight:700;color:${C.dark};">${item.productName || 'Article'}</div>
        <div style="font-size:12px;color:${C.muted};margin-top:3px;">Qté&nbsp;: <strong>${item.quantity}</strong> &times; ${(item.price || 0).toLocaleString('fr-FR')}&nbsp;FCFA</div>
      </td>
      <td style="padding:12px 0;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:700;color:${C.dark};">
        ${((item.price || 0) * (item.quantity || 1)).toLocaleString('fr-FR')}&nbsp;FCFA
      </td>
    </tr>`).join('');

  const notesHtml = order.notes ? `
    ${DIVIDER}
    ${sectionTitle(icon.clipBoard, 'Note du client')}
    <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:12px 16px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#92400E;margin:0;">${order.notes}</p>
    </div>` : '';

  const body = `
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:${C.orange};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;text-align:center;">Notification Boutique &bull; Nouvelle commande</p>
    <h1 style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:900;color:${C.dark};margin:0 0 6px;text-align:center;">#${orderIdShort}</h1>
    <p style="text-align:center;margin:0 0 20px;">
      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};">
        ${icon.calendar}${dateFormatted}
      </span>
    </p>

    <!-- Badge alerte nouvelle commande (icône Lucide Package) -->
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;background-color:#FEF3C7;color:#B45309;border:1px solid #FDE68A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;padding:6px 16px;border-radius:9999px;">
        ${icon.packageAmber}Nouvelle commande à préparer &bull; ${totalFormatted}&nbsp;FCFA
      </span>
    </div>

    ${DIVIDER}

    ${sectionTitle(icon.user, 'Client &amp; Coordonnées')}
    <div style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px 18px;margin-bottom:22px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:800;color:${C.dark};margin:0 0 8px;">${shipping.fullName || 'Client'}</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0 0 4px;">${icon.mapPin}${formatLocation(shipping.address, shipping.city)}</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0 0 4px;">${icon.phone}<a href="tel:${shipping.phone || ''}" style="color:${C.dark};text-decoration:none;font-weight:600;">${shipping.phone || 'Non renseigné'}</a></p>
      ${order.customerEmail ? `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};margin:0;">${icon.mail}${order.customerEmail}</p>` : ''}
    </div>

    ${DIVIDER}

    ${sectionTitle(icon.bag, 'Articles commandés')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itemsHtml}</table>

    ${notesHtml}

    ${DIVIDER}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:4px 16px;margin-bottom:14px;">
      ${dataRow(icon.creditCard, 'Mode de règlement', order.paymentMethod || 'Paiement à la livraison')}
      ${dataRow(icon.package,    'Statut initial',    'En attente de traitement')}
    </table>

    <!-- Détail des montants -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:8px 16px;margin-bottom:16px;">
      <tr>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};padding:6px 0;">Prix colis (Articles) :</td>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;color:${C.dark};text-align:right;">${((order.itemsTotal ?? (order.totalAmount - (order.shippingCost || 0))) || 0).toLocaleString('fr-FR')}&nbsp;FCFA</td>
      </tr>
      <tr>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};padding:6px 0;border-top:1px dashed ${C.dash};">Frais de livraison (${shipping.city || 'Standard'}) :</td>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;color:${C.orange};text-align:right;border-top:1px dashed ${C.dash};">+ ${((order.shippingCost || 0)).toLocaleString('fr-FR')}&nbsp;FCFA</td>
      </tr>
    </table>

    <!-- Total sombre -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color:${C.dark};border-radius:14px;padding:18px 22px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:500;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;">MONTANT TOTAL À ENCAISSER</td>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:24px;font-weight:900;color:${C.white};text-align:right;">${totalFormatted}&nbsp;FCFA</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('Ouvrir dans l\'espace Admin', `${getAdminUrl()}/orders`)}`;

  const html = wrapInTicket(body, `[Boutique] Nouvelle commande #${orderIdShort} (${totalFormatted} FCFA)`);
  try {
    await sendMailWithFallback({
      from: getFromAddress(),
      to: shopEmail,
      subject: `[Nouvelle commande] Client #ORD-${orderIdShort} (${totalFormatted} FCFA) – Onoot Boutique`,
      html,
    });
    logger.info({ to: shopEmail, orderId: order._id }, 'Shop new order notification email sent');
  } catch (err: any) {
    logger.error({ err: err.message, to: shopEmail }, 'Failed to send shop new order notification email');
  }
}

// ─── 3. Email de mise à jour de statut ───────────────────────────────────────
export async function sendOrderStatusUpdate(
  order: any,
  customerEmail: string,
  newStatus: string,
  estimatedDeliveryDate?: string
): Promise<void> {
  if (!customerEmail) return;
  const transporter = createTransporter();
  const orderIdShort = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
  const s = STATUS_CONFIG[newStatus] || {
    label: newStatus, color: C.blue, bg: '#EFF6FF', border: '#93C5FD',
    desc: `Le statut de votre commande est désormais : ${newStatus}.`,
  };

  // Icône de statut (Lucide SVG coloré selon le statut)
  const statusIconSvg: Record<string, string> = {
    pending:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    confirmed: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><path d="M20 6 9 17l-5-5"/></svg>`,
    shipped:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
    delivered: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="M3.3 7 12 12l8.7-5"/></svg>`,
    cancelled: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  };
  const statusIcon = statusIconSvg[newStatus] || '';

  const deliveryBlock = estimatedDeliveryDate ? `
    ${DIVIDER}
    <div style="background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);border:1px solid #93C5FD;border-radius:14px;padding:20px;text-align:center;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">
        ${icon.calBlue}Livraison prévue
      </p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:20px;font-weight:900;color:#1E3A8A;margin:0;">${estimatedDeliveryDate}</p>
    </div>` : '';

  const body = `
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;text-align:center;">Suivi de commande</p>
    <h1 style="font-family:'Courier New',Courier,monospace;font-size:28px;font-weight:900;color:${C.dark};margin:0 0 18px;text-align:center;">#${orderIdShort}</h1>

    <!-- Badge statut dynamique -->
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;background-color:${s.bg};color:${s.color};border:1px solid ${s.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:800;padding:8px 20px;border-radius:9999px;">
        ${statusIcon}${s.label}
      </span>
    </div>
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:${C.body};text-align:center;margin:0;line-height:1.6;">${s.desc}</p>

    ${deliveryBlock}

    ${DIVIDER}

    ${sectionTitle(icon.clipBoard, 'Récapitulatif')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:4px 16px;margin-bottom:20px;">
      ${dataRow(icon.user,       'Destinataire',  order.shippingAddress?.fullName || 'Client')}
      ${dataRow(icon.mapPin,     'Localisation',  formatLocation(order.shippingAddress?.address, order.shippingAddress?.city))}
      ${dataRow(icon.creditCard, 'Montant total', `${(order.totalAmount || 0).toLocaleString('fr-FR')} FCFA`)}
    </table>

    <!-- Total sombre -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color:${C.dark};border-radius:14px;padding:16px 22px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:500;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;">TOTAL COMMANDE</td>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:900;color:${C.white};text-align:right;">${(order.totalAmount || 0).toLocaleString('fr-FR')}&nbsp;FCFA</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('Voir ma commande', `${getBoutiqueUrl()}/orders/${order._id}`)}`;

  const html = wrapInTicket(body, `Mise à jour de votre commande #${orderIdShort} : ${s.label}`);
  try {
    await sendMailWithFallback({ from: getFromAddress(), to: customerEmail, subject: `${s.label} — Commande #ORD-${orderIdShort} · Onoot Boutique`, html });
    logger.info({ to: customerEmail, status: newStatus }, 'Order status update email sent');
  } catch (err: any) {
    logger.error({ err: err.message, to: customerEmail }, 'Failed to send order status update email');
  }
}

// ─── 4. Email de notification d'annulation pour la boutique ─────────────────
export async function sendShopOrderCancelledNotification(
  order: any,
  cancelReason?: string,
  shopEmail: string = SHOP_EMAIL
): Promise<void> {
  if (!shopEmail) return;
  const transporter = createTransporter();
  const rawId = order._id ? order._id.toString() : (order.id ? order.id.toString() : '');
  const orderIdShort = rawId ? rawId.slice(-8).toUpperCase() : 'N/A';
  const totalFormatted = (order.totalAmount || 0).toLocaleString('fr-FR');
  const dateFormatted = (order.createdAt ? new Date(order.createdAt) : new Date()).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const shipping = order.shippingAddress || {};

  const itemsHtml = (order.items || []).map((item: any) => `
    <tr style="border-bottom:1px solid ${C.dash};">
      <td style="padding:12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="font-size:14px;font-weight:700;color:${C.dark};">${item.productName || 'Article'}</div>
        <div style="font-size:12px;color:${C.muted};margin-top:3px;">Qté&nbsp;: <strong>${item.quantity}</strong> &times; ${(item.price || 0).toLocaleString('fr-FR')}&nbsp;FCFA</div>
      </td>
      <td style="padding:12px 0;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:700;color:${C.dark};">
        ${((item.price || 0) * (item.quantity || 1)).toLocaleString('fr-FR')}&nbsp;FCFA
      </td>
    </tr>`).join('');

  const reasonText = (cancelReason && cancelReason.trim()) || (order.cancelReason && order.cancelReason.trim()) || 'Aucun motif précisé par le client';

  const body = `
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;text-align:center;">Alerte Boutique &bull; Commande Annulée</p>
    <h1 style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:900;color:${C.dark};margin:0 0 6px;text-align:center;">#${orderIdShort}</h1>
    <p style="text-align:center;margin:0 0 20px;">
      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};">
        ${icon.calendar}${dateFormatted}
      </span>
    </p>

    <!-- Badge commande annulée (icône Lucide xCircleRed) -->
    <div style="text-align:center;margin-bottom:20px;">
      <span style="display:inline-block;background-color:#FEE2E2;color:#991B1B;border:1px solid #FCA5A5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;padding:6px 16px;border-radius:9999px;">
        ${icon.xCircleRed}Commande annulée par le client &bull; ${totalFormatted}&nbsp;FCFA
      </span>
    </div>

    <!-- Motif d'annulation mis en avant -->
    <div style="background-color:#FFF1F2;border:1px solid #FECDD3;border-left:4px solid #E11D48;border-radius:12px;padding:16px 18px;margin-bottom:24px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:#BE123C;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">
        ${icon.alertTriangle}Motif de l'annulation fourni par le client :
      </p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:700;color:#881337;margin:0;line-height:1.5;">
        &laquo;&nbsp;${reasonText}&nbsp;&raquo;
      </p>
    </div>

    ${DIVIDER}

    ${sectionTitle(icon.user, 'Client &amp; Coordonnées')}
    <div style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px 18px;margin-bottom:22px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:800;color:${C.dark};margin:0 0 8px;">${shipping.fullName || 'Client'}</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0 0 4px;">${icon.mapPin}${formatLocation(shipping.address, shipping.city)}</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0 0 4px;">${icon.phone}<a href="tel:${shipping.phone || ''}" style="color:${C.dark};text-decoration:none;font-weight:600;">${shipping.phone || 'Non renseigné'}</a></p>
      ${order.customerEmail ? `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};margin:0;">${icon.mail}${order.customerEmail}</p>` : ''}
    </div>

    ${DIVIDER}

    ${sectionTitle(icon.bag, 'Articles de la commande annulée')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itemsHtml}</table>

    ${DIVIDER}

    <!-- Total sombre -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color:${C.dark};border-radius:14px;padding:18px 22px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:500;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;">MONTANT TOTAL ANNULÉ</td>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:24px;font-weight:900;color:${C.white};text-align:right;">${totalFormatted}&nbsp;FCFA</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('Gérer dans l\'espace Admin', `${getAdminUrl()}/orders`)}`;

  const html = wrapInTicket(body, `[Commande Annulée] Client #${orderIdShort} (${totalFormatted} FCFA) - Motif : ${reasonText}`);
  try {
    await sendMailWithFallback({
      from: getFromAddress(),
      to: shopEmail,
      subject: `[Commande Annulée] Client #ORD-${orderIdShort} (${totalFormatted} FCFA) – Onoot Boutique`,
      html,
    });
    logger.info({ to: shopEmail, orderId: rawId, reason: reasonText }, 'Shop order cancelled notification email sent');
  } catch (err: any) {
    logger.error({ err: err.message, to: shopEmail }, 'Failed to send shop order cancelled notification email');
  }
}

// ─── 5. Email de notification pour la boutique lors d'une inscription standard (sans Google) ───
export async function sendShopNewUserRegisteredNotification(
  user: any,
  shopEmail: string = SHOP_EMAIL
): Promise<void> {
  if (!shopEmail) return;

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || 'Nouveau client';
  const email = user.email || 'Non renseigné';
  const phone = user.phone || 'Non renseigné';
  const dateFormatted = (user.createdAt ? new Date(user.createdAt) : new Date()).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const body = `
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:${C.blue};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;text-align:center;">Alerte Boutique &bull; Nouveau Compte</p>
    <h1 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:24px;font-weight:900;color:${C.dark};margin:0 0 6px;text-align:center;">Nouveau client inscrit !</h1>
    <p style="text-align:center;margin:0 0 20px;">
      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};">
        ${icon.calendar}${dateFormatted}
      </span>
    </p>

    <!-- Badge inscription naturelle (site web) -->
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;background-color:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;padding:6px 16px;border-radius:9999px;">
        ${icon.user}Inscription standard (formulaire boutique sans Google)
      </span>
    </div>

    ${DIVIDER}

    ${sectionTitle(icon.user, 'Coordonnées du nouveau client')}
    <div style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px 18px;margin-bottom:22px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:800;color:${C.dark};margin:0 0 8px;">${fullName}</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0 0 6px;">${icon.mail}<strong>Email :</strong> <a href="mailto:${email}" style="color:${C.blueDark};text-decoration:none;font-weight:600;">${email}</a></p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0 0 6px;">${icon.phone}<strong>Téléphone :</strong> <a href="tel:${phone}" style="color:${C.dark};text-decoration:none;font-weight:600;">${phone}</a></p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};margin:0;">${icon.key}<strong>Type d'authentification :</strong> Inscription locale (Email + Mot de passe)</p>
    </div>

    ${DIVIDER}

    ${ctaButton('Consulter dans le Panel Admin', `${getAdminUrl()}/users`)}`;

  const html = wrapInTicket(body, `[Boutique] Nouveau compte client créé par ${fullName} (${email})`);

  try {
    await sendMailWithFallback({
      from: getFromAddress(),
      to: shopEmail,
      subject: `[Nouveau Client] ${fullName} vient de créer son compte – Onoot Boutique`,
      html,
    });
    logger.info({ to: shopEmail, userEmail: email }, 'Shop new user registration notification email sent');
  } catch (err: any) {
    logger.error({ err: err.message, to: shopEmail }, 'Failed to send shop new user registration notification email');
  }
}

// ─── 6. Email de réinitialisation de mot de passe ────────────────────────────
export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string,
  userName?: string
): Promise<void> {
  if (!toEmail) return;

  const body = `
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:${C.orange};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;text-align:center;">Sécurité du compte</p>
    <h1 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:24px;font-weight:900;color:${C.dark};margin:0 0 10px;text-align:center;">Mot de passe oublié ?</h1>
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;color:${C.body};text-align:center;margin:0 0 6px;">Bonjour <strong>${userName || 'cher(e) client(e)'}</strong>,</p>
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:${C.muted};text-align:center;margin:0 0 24px;line-height:1.6;">
      Une demande de réinitialisation de votre mot de passe pour votre compte Onoot Boutique a été effectuée.
    </p>

    ${DIVIDER}

    <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#92400E;font-weight:500;margin:0;line-height:1.6;text-align:center;">
        Cliquez sur le bouton ci-dessous pour choisir votre nouveau mot de passe en toute sécurité. <strong>Ce lien expire dans 1 heure.</strong>
      </p>
    </div>

    ${ctaButton('Réinitialiser mon mot de passe', resetLink)}

    ${DIVIDER}

    <div style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:14px 16px;margin-top:20px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:${C.muted};margin:0;line-height:1.5;text-align:center;">
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute tranquillité. Votre compte reste parfaitement protégé.
      </p>
    </div>`;

  const html = wrapInTicket(body, 'Réinitialisation de votre mot de passe Onoot Boutique');

  try {
    await sendMailWithFallback({
      from: getFromAddress(),
      to: toEmail,
      subject: '🔑 Réinitialisation de votre mot de passe – Onoot Boutique',
      html,
    });
    logger.info({ to: toEmail }, 'Password reset email sent');
  } catch (err: any) {
    logger.error({ err: err.message, to: toEmail }, 'Failed to send password reset email');
  }
}

// ─── 7. Notification pour la boutique lors d'une réinitialisation de mot de passe client ───
export async function sendShopPasswordResetNotification(
  user: any,
  shopEmail: string = SHOP_EMAIL
): Promise<void> {
  if (!shopEmail) return;

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || 'Client';
  const email = user.email || 'Non renseigné';
  const dateFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const body = `
    <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:${C.orange};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;text-align:center;">Alerte Sécurité Boutique</p>
    <h1 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:24px;font-weight:900;color:${C.dark};margin:0 0 6px;text-align:center;">Mot de passe client réinitialisé</h1>
    <p style="text-align:center;margin:0 0 20px;">
      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};">
        ${icon.calendar}${dateFormatted}
      </span>
    </p>

    <!-- Badge alerte réinitialisation -->
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;background-color:#FEF3C7;color:#B45309;border:1px solid #FDE68A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;padding:6px 16px;border-radius:9999px;">
        ${icon.key}&nbsp;Procédure de récupération terminée avec succès
      </span>
    </div>

    ${DIVIDER}

    ${sectionTitle(icon.user, 'Compte client concerné')}
    <div style="background-color:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px 18px;margin-bottom:22px;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:800;color:${C.dark};margin:0 0 8px;">${fullName}</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0 0 6px;">${icon.mail}<strong>Email :</strong> <a href="mailto:${email}" style="color:${C.blueDark};text-decoration:none;font-weight:600;">${email}</a></p>
      ${user.phone ? `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.body};margin:0 0 6px;">${icon.phone}<strong>Téléphone :</strong> <a href="tel:${user.phone}" style="color:${C.dark};text-decoration:none;font-weight:600;">${user.phone}</a></p>` : ''}
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.muted};margin:0;">${icon.shield}<strong>Action :</strong> Mot de passe réinitialisé via le lien sécurisé envoyé par email.</p>
    </div>

    ${DIVIDER}

    ${ctaButton('Consulter le compte dans l\'espace Admin', `${getAdminUrl()}/users`)}`;

  const html = wrapInTicket(body, `[Sécurité] Réinitialisation de mot de passe par ${fullName} (${email})`);

  try {
    await sendMailWithFallback({
      from: getFromAddress(),
      to: shopEmail,
      subject: `[Sécurité] Mot de passe réinitialisé – ${fullName} (${email})`,
      html,
    });
    logger.info({ to: shopEmail, userEmail: email }, 'Shop password reset notification email sent');
  } catch (err: any) {
    logger.error({ err: err.message, to: shopEmail }, 'Failed to send shop password reset notification email');
  }
}




