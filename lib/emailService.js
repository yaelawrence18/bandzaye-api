import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.APP_URL || "https://bandzaye.vercel.app"

export async function sendVerificationEmail(email, token) {
  await resend.emails.send({
    from: "noreply@bandzaye.com",
    to: email,
    subject: "Confirme ton adresse email — BANDZAYE",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0f;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="letter-spacing:4px;color:#2563eb;">BANDZAYE</h2>
        <p>Confirme ton adresse email pour activer ton compte.</p>
        <a href="${APP_URL}/verify-email?token=${token}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
          CONFIRMER MON EMAIL
        </a>
        <p style="color:#6b7280;font-size:12px;">Lien valable 24h. Si tu n'as pas créé de compte, ignore cet email.</p>
      </div>
    `,
  })
}

export async function sendResetPasswordEmail(email, token) {
  await resend.emails.send({
    from: "noreply@bandzaye.com",
    to: email,
    subject: "Réinitialise ton mot de passe — BANDZAYE",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0f;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="letter-spacing:4px;color:#2563eb;">BANDZAYE</h2>
        <p>Tu as demandé à réinitialiser ton mot de passe.</p>
        <a href="${APP_URL}/reset-password?token=${token}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
          RÉINITIALISER MON MOT DE PASSE
        </a>
        <p style="color:#6b7280;font-size:12px;">Lien valable 1h. Si tu n'as pas fait cette demande, ignore cet email.</p>
      </div>
    `,
  })
}
