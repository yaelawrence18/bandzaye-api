import jwt from "jsonwebtoken"
import sql from "../../lib/db.js"

function verifyToken(req) {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  if (req.method === "OPTIONS") return res.status(200).end()

  // GET — récupérer les posts live (les 50 derniers)
  if (req.method === "GET") {
    try {
      const posts = await sql`
        SELECT lp.*, u.nom as auteur
        FROM live_posts lp
        JOIN users u ON lp.user_id = u.id
        ORDER BY lp.created_at DESC
        LIMIT 50
      `
      return res.json(posts)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: "Erreur serveur" })
    }
  }

  // POST — créer un post live
  if (req.method === "POST") {
    const user = verifyToken(req)
    if (!user) return res.status(401).json({ message: "Non autorisé" })

    const { contenu, adresse, latitude, longitude } = req.body
    if (!contenu) return res.status(400).json({ message: "Contenu obligatoire" })

    try {
      const result = await sql`
        INSERT INTO live_posts (user_id, contenu, adresse, latitude, longitude)
        VALUES (${user.id}, ${contenu}, ${adresse}, ${latitude}, ${longitude})
        RETURNING id
      `
      return res.status(201).json({ message: "Post publié", id: result[0].id })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: "Erreur serveur" })
    }
  }

  res.status(405).json({ message: "Méthode non autorisée" })
}
