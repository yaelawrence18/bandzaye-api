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

  // GET — récupérer toutes les annonces actives
  if (req.method === "GET") {
    try {
      const announcements = await sql`
        SELECT a.*, u.nom as business_nom
        FROM announcements a
        JOIN users u ON a.user_id = u.id
        WHERE a.actif = TRUE
        ORDER BY a.created_at DESC
      `
      return res.json(announcements)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: "Erreur serveur" })
    }
  }

  // POST — créer une annonce (business uniquement)
  if (req.method === "POST") {
    const user = verifyToken(req)
    if (!user) return res.status(401).json({ message: "Non autorisé" })

    const { titre, description, photo, lien } = req.body
    if (!titre) return res.status(400).json({ message: "Titre obligatoire" })

    try {
      const result = await sql`
        INSERT INTO announcements (user_id, titre, description, photo, lien)
        VALUES (${user.id}, ${titre}, ${description}, ${photo}, ${lien})
        RETURNING id
      `
      return res.status(201).json({ message: "Annonce créée", id: result[0].id })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: "Erreur serveur" })
    }
  }

  res.status(405).json({ message: "Méthode non autorisée" })
}
