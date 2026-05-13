import crypto from "crypto"
import sql from "../../lib/db.js"
import { sendResetPasswordEmail } from "../../lib/emailService.js"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" })

  const { email } = req.body

  try {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`
    if (result.length > 0) {
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000)
      await sql`
        INSERT INTO auth_tokens (user_id, token, type, expires_at) 
        VALUES (${result[0].id}, ${token}, 'reset_password', ${expiresAt})
      `
      await sendResetPasswordEmail(email, token)
    }
    res.json({ message: "Si cet email existe, un lien a été envoyé." })
  } catch (err) {
    console.error("Erreur forgot-password:", err)
    res.status(500).json({ message: "Erreur serveur" })
  }
}
