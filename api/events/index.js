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

  if (req.method === "GET") {
    try {
      const events = await sql`
        SELECT e.*, u.nom as auteur
        FROM events e
        JOIN users u ON e.user_id = u.id
        ORDER BY e.created_at DESC
      `
      return res.json(events)
    } catch (err) {
      return res.status(500).json({ message: "Erreur serveur" })
    }
  }

  if (req.method === "POST") {
    const user = verifyToken(req)
    if (!user) return res.status(401).json({ message: "Non autorisé" })

    const { titre, description, categorie, adresse, latitude, longitude, date_event, photo } = req.body
    if (!titre || !categorie)
      return res.status(400).json({ message: "Titre et catégorie obligatoires" })

    try {
      const result = await sql`
        INSERT INTO events (user_id, titre, description, categorie, adresse, latitude, longitude, date_event, photo)
        VALUES (${user.id}, ${titre}, ${description}, ${categorie}, ${adresse}, ${latitude}, ${longitude}, ${date_event}, ${photo})
        RETURNING id
      `
      return res.status(201).json({ message: "Événement créé", id: result[0].id })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: "Erreur serveur" })
    }
  }

  res.status(405).json({ message: "Méthode non autorisée" })
}
