import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import sql from "../../lib/db.js"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" })

  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ message: "Email et mot de passe requis." })

  try {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`
    if (result.length === 0)
      return res.status(401).json({ message: "Identifiants incorrects." })

    const user = result[0]
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(401).json({ message: "Identifiants incorrects." })

    if (!user.email_verified)
      return res.status(403).json({ message: "Confirme ton email avant de te connecter." })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      message: "Connexion réussie",
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
    })
  } catch (err) {
    console.error("Erreur login:", err)
    res.status(500).json({ message: "Erreur serveur" })
  }
}
