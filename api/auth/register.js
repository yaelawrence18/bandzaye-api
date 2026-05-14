import bcrypt from "bcryptjs"
import crypto from "crypto"
import sql from "../../lib/db.js"
import { sendVerificationEmail } from "../../lib/emailService.js"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" })

  const { username, email, password, role } = req.body

  if (!username || !email || !password)
    return res.status(400).json({ message: "Tous les champs sont obligatoires." })

  const userRole = role === "business" ? "business" : "user"

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0)
      return res.status(409).json({ message: "Cet email est déjà utilisé." })

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await sql`
      INSERT INTO users (nom, email, password, role) 
      VALUES (${username}, ${email}, ${hashedPassword}, ${userRole}) 
      RETURNING id
    `

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await sql`
      INSERT INTO auth_tokens (user_id, token, type, expires_at) 
      VALUES (${result[0].id}, ${token}, 'verify_email', ${expiresAt})
    `

    await sendVerificationEmail(email, token)

    res.status(201).json({ message: "Compte créé. Vérifie ton email pour l'activer." })
  } catch (err) {
    console.error("Erreur register:", err)
    res.status(500).json({ message: "Erreur serveur" })
  }
}
