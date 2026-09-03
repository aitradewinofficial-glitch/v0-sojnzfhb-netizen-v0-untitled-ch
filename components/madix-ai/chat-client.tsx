"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { Bot, Lock, Send, User, FileText, ShieldAlert } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { fetcher, type Area, type MadixUser, type Role, type ChatSource } from "@/components/madix-ai/types"

type Message = {
  role: "user" | "assistant"
  content: string
  sources?: ChatSource[]
  deniedAreas?: string[]
}

const suggestions = [
  "Каква е рецептата за Method Feeder Скопекс?",
  "Как се настройва смесител СМ-500?",
  "Какво е работното време на фабриката?",
  "Какви са заплатите на операторите?",
]

export function ChatClient() {
  const { data } = useSWR<{ users: MadixUser[]; roles: Role[]; areas: Area[] }>("/api/madix-ai/meta", fetcher)
  const [userId, setUserId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const users = data?.users ?? []
  const areas = data?.areas ?? []

  // Default to the first active user once loaded.
  useEffect(() => {
    if (!userId && users.length > 0) setUserId(String(users[0].id))
  }, [users, userId])

  const currentUser = useMemo(() => users.find((u) => String(u.id) === userId), [users, userId])

  // Which areas the current role can access (mirrors server RBAC for display).
  const { data: rolesData } = useSWR<{ roles: Array<Role & { areaIds: number[] }>; areas: Area[] }>(
    "/api/madix-ai/admin/roles",
    fetcher,
  )
  const allowedAreas = useMemo(() => {
    if (!currentUser?.role_id || !rolesData) return []
    const role = rolesData.roles.find((r) => r.id === currentUser.role_id)
    if (!role) return []
    return areas.filter((a) => role.areaIds.includes(a.id))
  }, [currentUser, rolesData, areas])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  async function send(question: string) {
    const q = question.trim()
    if (!q || !userId || loading) return
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: q }])
    setLoading(true)
    try {
      const res = await fetch("/api/madix-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), question: q }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: json.error ?? "Възникна грешка." }])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: json.answer,
            sources: json.sources ?? [],
            deniedAreas: json.deniedAreas ?? [],
          },
        ])
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Мрежова грешка. Опитайте отново." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Identity + access bar */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Влязъл като:</span>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Изберете служител" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name} — {u.role_name ?? "без роля"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Достъп до:</span>
          {allowedAreas.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            allowedAreas.map((a) => (
              <Badge key={a.id} variant={a.confidential ? "destructive" : "secondary"} className="gap-1">
                {a.confidential && <Lock className="h-3 w-3" />}
                {a.name}
              </Badge>
            ))
          )}
        </div>
      </Card>

      {/* Conversation */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: "52vh" }}>
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="h-7 w-7" />
              </span>
              <div className="space-y-1">
                <p className="text-base font-semibold">С какво да помогна?</p>
                <p className="max-w-md text-sm text-muted-foreground text-balance">
                  Питайте за рецепти, процедури, настройки на машини или фирмени правила. Виждате само информация,
                  разрешена за вашата роля.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </span>
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Composer */}
        <div className="p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Напишете въпрос..."
              className="min-h-[44px] resize-none"
              rows={1}
              disabled={!userId}
            />
            <Button onClick={() => send(input)} disabled={!input.trim() || loading || !userId} size="icon" className="h-11 w-11 shrink-0">
              <Send className="h-4 w-4" />
              <span className="sr-only">Изпрати</span>
            </Button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            Всяка заявка се записва в одит лога. Достъпът се проверява от системата преди отговора.
          </p>
        </div>
      </Card>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-muted text-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>
      <div className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {message.content}
        </div>

        {message.deniedAreas && message.deniedAreas.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Опит за достъп до ограничена област: {message.deniedAreas.join(", ")}. Записано в одит лога.
            </span>
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Източници</span>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] text-muted-foreground"
                >
                  <FileText className="h-3 w-3" />
                  {s.title}
                  <span className="text-muted-foreground/60">· {s.area}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
