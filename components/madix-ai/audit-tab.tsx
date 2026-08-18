"use client"

import { useState } from "react"
import useSWR from "swr"
import { ShieldAlert, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetcher } from "@/components/madix-ai/types"

type AuditEntry = {
  id: number
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

export function AuditTab() {
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const { data } = useSWR<{ entries: AuditEntry[] }>(
    `/api/madix-ai/admin/audit${flaggedOnly ? "?flagged=true" : ""}`,
    fetcher,
    { refreshInterval: 5000 },
  )
  const entries = data?.entries ?? []
  const flaggedCount = entries.filter((e) => e.flagged).length

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Записват се всички заявки. Ръководството одитира най-вече опитите за забранени области.</span>
        </div>
        <div className="flex items-center gap-2">
          {!flaggedOnly && flaggedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <ShieldAlert className="h-3 w-3" />
              {flaggedCount} сигнал(а)
            </Badge>
          )}
          <Label htmlFor="flagged-toggle" className="text-sm">
            Само сигнали
          </Label>
          <Switch id="flagged-toggle" checked={flaggedOnly} onCheckedChange={setFlaggedOnly} />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Време</TableHead>
              <TableHead>Потребител</TableHead>
              <TableHead>Въпрос</TableHead>
              <TableHead>Област</TableHead>
              <TableHead className="text-center">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Няма записи.
                </TableCell>
              </TableRow>
            )}
            {entries.map((e) => (
              <TableRow key={e.id} className={e.flagged ? "bg-destructive/5" : undefined}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("bg-BG", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{e.user_name ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{e.role_name ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[280px]">
                  <span className="line-clamp-2 text-sm">{e.question}</span>
                </TableCell>
                <TableCell className="text-xs">
                  {e.flagged ? (
                    <span className="text-destructive">{e.denied_areas || "ограничена"}</span>
                  ) : (
                    <span className="text-muted-foreground">{e.matched_areas || "—"}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {e.flagged ? (
                    <Badge variant="destructive" className="gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      сигнал
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      ок
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
