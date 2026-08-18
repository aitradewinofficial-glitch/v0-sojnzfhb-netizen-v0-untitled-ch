import { generateText } from "ai"
import {
  getUserById,
  getRoleAreas,
  retrieveForUser,
  detectDeniedAreas,
  logQuery,
} from "@/lib/madix-ai/service"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = Number(body.userId)
    const question = String(body.question ?? "").trim()

    if (!userId || !question) {
      return Response.json({ error: "Липсва потребител или въпрос." }, { status: 400 })
    }

    // 1) Resolve the user and their role.
    const user = await getUserById(userId)
    if (!user || !user.active) {
      return Response.json({ error: "Потребителят не е намерен или е деактивиран." }, { status: 403 })
    }
    if (!user.role_id) {
      return Response.json({ error: "На потребителя не е присвоена роля." }, { status: 403 })
    }

    // 2) SYSTEM decides which areas this role may access — NOT the AI.
    const allowedAreas = await getRoleAreas(user.role_id)
    const allowedAreaIds = allowedAreas.map((a) => a.id)

    // 3) Retrieve only documents from allowed areas.
    const chunks = await retrieveForUser(allowedAreaIds, question, 4)

    // 4) Detect probing of restricted areas (for auditing only).
    const denied = await detectDeniedAreas(allowedAreaIds, question)

    const matchedAreas = [...new Set(chunks.map((c) => c.areaName))]
    const sources = chunks.map((c) => `${c.title} (${c.version ?? "v1"})`)

    let answer: string
    let noContext = false

    if (chunks.length === 0) {
      noContext = true
      if (denied.length > 0) {
        answer =
          "Този въпрос изглежда се отнася до област, до която вашата роля няма достъп (" +
          denied.map((d) => d.name).join(", ") +
          "). Заявката беше записана. Ако смятате, че се нуждаете от достъп, обърнете се към вашия ръководител."
      } else {
        answer =
          "Не намирам информация по този въпрос в достъпните за вас документи. Опитайте да преформулирате или се обърнете към съответния отдел."
      }
    } else {
      // 5) Build the grounded prompt strictly from allowed context.
      const context = chunks
        .map(
          (c, i) =>
            `[Източник ${i + 1}] Област: ${c.areaName} | Документ: ${c.title} (${c.version ?? "v1"}) | Тип: ${c.docType}\n${c.content}`,
        )
        .join("\n\n---\n\n")

      const result = await generateText({
        model: "openai/gpt-4o-mini",
        system:
          "Ти си вътрешният асистент на фабриката за захранки MADIX Groundbaits. " +
          "Отговаряш САМО на базата на предоставените източници по-долу. " +
          "Ако отговорът го няма в източниците, честно кажи, че нямаш информация — не измисляй. " +
          "Отговаряй на български език, кратко и по същество. " +
          "Когато цитираш рецепта или процедура, посочвай точните стойности от документа. " +
          "Накрая изброявай използваните източници.",
        prompt: `Източници:\n\n${context}\n\n---\n\nВъпрос на служителя: ${question}`,
      })
      answer = result.text
    }

    // 6) ALWAYS log the query (audit trail).
    await logQuery({
      userId: user.id,
      userName: user.name,
      roleName: user.role_name,
      question,
      matchedAreas,
      deniedAreas: denied.map((d) => d.name),
      allowed: denied.length === 0,
      flagged: denied.length > 0,
      sources,
    })

    return Response.json({
      answer,
      sources: chunks.map((c) => ({
        title: c.title,
        area: c.areaName,
        version: c.version,
        docType: c.docType,
      })),
      deniedAreas: denied.map((d) => d.name),
      noContext,
    })
  } catch (err) {
    console.error("[v0] MADIX AI chat error:", err)
    return Response.json({ error: "Възникна грешка при обработката на заявката." }, { status: 500 })
  }
}
