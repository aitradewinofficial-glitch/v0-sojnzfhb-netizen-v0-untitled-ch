import { neon } from "@neondatabase/serverless"

// Dedicated Neon client for the MADIX AI module. We use a separate client from
// lib/db.ts on purpose: that module rewrites the word "products" -> "new_products"
// in every query, which we do not want for this feature.
const sql = neon(process.env.DATABASE_URL!)

export type Area = {
  id: number
  code: string
  name: string
  description: string | null
  confidential: boolean
}

export type Role = {
  id: number
  name: string
  description: string | null
}

export type MadixUser = {
  id: number
  name: string
  email: string
  username: string | null
  password: string | null
  role_id: number | null
  role_name: string | null
  active: boolean
}

export type MadixDocument = {
  id: number
  area_id: number
  area_name: string
  title: string
  doc_type: string
  content: string
  version: string | null
  updated_at: string
}

export type RetrievedChunk = {
  documentId: number
  title: string
  areaName: string
  docType: string
  version: string | null
  content: string
  score: number
}

// ---------- Users / roles / areas ----------

export async function getUsers(): Promise<MadixUser[]> {
  return (await sql`
    SELECT u.id, u.name, u.email, u.username, u.password, u.role_id, u.active, r.name AS role_name
    FROM madix_ai_users u
    LEFT JOIN madix_ai_roles r ON r.id = u.role_id
    ORDER BY u.name ASC
  `) as MadixUser[]
}

export async function getUserById(id: number): Promise<MadixUser | null> {
  const rows = (await sql`
    SELECT u.id, u.name, u.email, u.username, u.password, u.role_id, u.active, r.name AS role_name
    FROM madix_ai_users u
    LEFT JOIN madix_ai_roles r ON r.id = u.role_id
    WHERE u.id = ${id}
  `) as MadixUser[]
  return rows[0] ?? null
}

export async function getRoles(): Promise<Role[]> {
  return (await sql`SELECT id, name, description FROM madix_ai_roles ORDER BY id ASC`) as Role[]
}

export async function getAreas(): Promise<Area[]> {
  return (await sql`SELECT id, code, name, description, confidential FROM madix_ai_areas ORDER BY code ASC`) as Area[]
}

export async function getRoleAreas(roleId: number): Promise<Area[]> {
  return (await sql`
    SELECT a.id, a.code, a.name, a.description, a.confidential
    FROM madix_ai_role_areas ra
    JOIN madix_ai_areas a ON a.id = ra.area_id
    WHERE ra.role_id = ${roleId}
    ORDER BY a.code ASC
  `) as Area[]
}

export async function setRoleAreas(roleId: number, areaIds: number[]): Promise<void> {
  await sql`DELETE FROM madix_ai_role_areas WHERE role_id = ${roleId}`
  for (const areaId of areaIds) {
    await sql`
      INSERT INTO madix_ai_role_areas (role_id, area_id)
      VALUES (${roleId}, ${areaId})
      ON CONFLICT DO NOTHING
    `
  }
}

export async function createUser(
  name: string,
  email: string,
  roleId: number | null,
  username: string,
  password: string,
): Promise<void> {
  await sql`
    INSERT INTO madix_ai_users (name, email, role_id, username, password)
    VALUES (${name}, ${email}, ${roleId}, ${username}, ${password})
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role_id = EXCLUDED.role_id,
      username = EXCLUDED.username, password = EXCLUDED.password
  `
}

export async function updateUser(
  id: number,
  fields: { name?: string; roleId?: number | null; active?: boolean; username?: string; password?: string },
): Promise<void> {
  if (fields.name !== undefined) await sql`UPDATE madix_ai_users SET name = ${fields.name} WHERE id = ${id}`
  if (fields.roleId !== undefined) await sql`UPDATE madix_ai_users SET role_id = ${fields.roleId} WHERE id = ${id}`
  if (fields.active !== undefined) await sql`UPDATE madix_ai_users SET active = ${fields.active} WHERE id = ${id}`
  if (fields.username !== undefined) await sql`UPDATE madix_ai_users SET username = ${fields.username} WHERE id = ${id}`
  if (fields.password !== undefined) await sql`UPDATE madix_ai_users SET password = ${fields.password} WHERE id = ${id}`
}

export async function deleteUser(id: number): Promise<void> {
  await sql`DELETE FROM madix_ai_users WHERE id = ${id}`
}

// ---------- Documents ----------

export async function getDocuments(): Promise<MadixDocument[]> {
  return (await sql`
    SELECT d.id, d.area_id, a.name AS area_name, d.title, d.doc_type, d.content, d.version, d.updated_at
    FROM madix_ai_documents d
    JOIN madix_ai_areas a ON a.id = d.area_id
    ORDER BY a.code ASC, d.title ASC
  `) as MadixDocument[]
}

// ---------- Retrieval (RBAC-scoped) ----------

// SECURITY: this is the single choke point that enforces access. The set of
// areas is derived from the user's role and passed to the SQL query, so a
// document from a forbidden area can never reach the model.
export async function retrieveForUser(
  allowedAreaIds: number[],
  query: string,
  limit = 4,
): Promise<RetrievedChunk[]> {
  if (allowedAreaIds.length === 0) return []

  const candidates = (await sql`
    SELECT d.id, d.title, d.doc_type, d.content, d.version, a.name AS area_name
    FROM madix_ai_documents d
    JOIN madix_ai_areas a ON a.id = d.area_id
    WHERE d.area_id = ANY(${allowedAreaIds})
  `) as Array<{
    id: number
    title: string
    doc_type: string
    content: string
    version: string | null
    area_name: string
  }>

  // Lightweight lexical scoring (prototype-grade RAG without embeddings):
  // score = number of query terms that appear in title/content, title weighted.
  const terms = normalize(query)
    .split(/\s+/)
    .filter((t) => t.length >= 3)

  const scored = candidates
    .map((doc) => {
      const haystackTitle = normalize(doc.title)
      const haystackBody = normalize(doc.content)
      let score = 0
      for (const term of terms) {
        if (haystackTitle.includes(term)) score += 3
        if (haystackBody.includes(term)) score += 1
      }
      return {
        documentId: doc.id,
        title: doc.title,
        areaName: doc.area_name,
        docType: doc.doc_type,
        version: doc.version,
        content: doc.content,
        score,
      }
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[.,;:!?()"'«»\-]/g, " ")
}

// Detect whether the user tried to reach an area they are NOT allowed to see.
// Used only for audit flagging (never to leak content).
export async function detectDeniedAreas(
  allowedAreaIds: number[],
  query: string,
): Promise<Array<{ id: number; name: string }>> {
  const allAreas = await getAreas()
  const denied = allAreas.filter((a) => !allowedAreaIds.includes(a.id))
  if (denied.length === 0) return []

  const q = normalize(query)
  const hits: Array<{ id: number; name: string }> = []

  // Keyword hints that suggest the user is probing a specific restricted area.
  const areaKeywords: Record<string, string[]> = {
    "99 Поверително": ["заплат", "заплата", "заплати", "марж", "маржове", "бонус", "себестойност", "договор"],
  }

  for (const area of denied) {
    const kws = areaKeywords[area.name] ?? []
    const nameHit = q.includes(normalize(area.name))
    const kwHit = kws.some((kw) => q.includes(kw))
    if (nameHit || kwHit) hits.push({ id: area.id, name: area.name })
  }
  return hits
}

// ---------- Audit log ----------

export async function logQuery(entry: {
  userId: number | null
  userName: string | null
  roleName: string | null
  question: string
  matchedAreas: string[]
  deniedAreas: string[]
  allowed: boolean
  flagged: boolean
  sources: string[]
}): Promise<void> {
  await sql`
    INSERT INTO madix_ai_audit_log
      (user_id, user_name, role_name, question, matched_areas, denied_areas, allowed, flagged, sources)
    VALUES (
      ${entry.userId},
      ${entry.userName},
      ${entry.roleName},
      ${entry.question},
      ${entry.matchedAreas.join(", ")},
      ${entry.deniedAreas.join(", ")},
      ${entry.allowed},
      ${entry.flagged},
      ${entry.sources.join(" | ")}
    )
  `
}

export type AuditEntry = {
  id: number
  user_id: number | null
  user_name: string | null
  role_name: string | null
  question: string
  matched_areas: string | null
  denied_areas: string | null
  allowed: boolean
  flagged: boolean
  sources: string | null
  created_at: string
}

export async function getAuditLog(opts: { flaggedOnly?: boolean; limit?: number } = {}): Promise<AuditEntry[]> {
  const limit = opts.limit ?? 200
  if (opts.flaggedOnly) {
    return (await sql`
      SELECT * FROM madix_ai_audit_log WHERE flagged = true ORDER BY created_at DESC LIMIT ${limit}
    `) as AuditEntry[]
  }
  return (await sql`
    SELECT * FROM madix_ai_audit_log ORDER BY created_at DESC LIMIT ${limit}
  `) as AuditEntry[]
}
