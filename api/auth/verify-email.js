import sql from "../../lib/db.js"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req.method === "OPTIONS") return res.status(200).end()

  const { token } = req.query

  try {
    const result = await sql`
      SELECT * FROM auth_tokens 
      WHERE token = ${token} AND type = 'verify_email' AND used = FALSE AND expires_at > NOW()
    `
    if (result.length === 0)
      return res.status(400).json({ message: "Lien invalide ou expiré" })

    const { user_id, id } = result[0]
    await sql`UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE id = ${user_id}`
    await sql`UPDATE auth_tokens SET used = TRUE WHERE id = ${id}`

    res.json({ message: "Email vérifié avec succès !" })
  } catch (err) {
    console.error("Erreur verify-email:", err)
    res.status(500).json({ message: "Erreur serveur" })
  }
}
