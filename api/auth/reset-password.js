import bcrypt from "bcryptjs"
import sql from "../../lib/db.js"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" })

  const { token, newPassword } = req.body

  try {
    const result = await sql`
      SELECT * FROM auth_tokens 
      WHERE token = ${token} AND type = 'reset_password' AND used = FALSE AND expires_at > NOW()
    `
    if (result.length === 0)
      return res.status(400).json({ message: "Lien invalide ou expiré" })

    const hashed = await bcrypt.hash(newPassword, 10)
    await sql`UPDATE users SET password = ${hashed} WHERE id = ${result[0].user_id}`
    await sql`UPDATE auth_tokens SET used = TRUE WHERE id = ${result[0].id}`

    res.json({ message: "Mot de passe mis à jour." })
  } catch (err) {
    console.error("Erreur reset-password:", err)
    res.status(500).json({ message: "Erreur serveur" })
  }
}
