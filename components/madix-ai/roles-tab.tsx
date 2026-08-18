"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Lock, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { fetcher, type Area, type Role } from "@/components/madix-ai/types"

const ROLES_KEY = "/api/madix-ai/admin/roles"

type RoleWithAreas = Role & { areaIds: number[] }

export function RolesTab() {
  const { data } = useSWR<{ roles: RoleWithAreas[]; areas: Area[] }>(ROLES_KEY, fetcher)
  const roles = data?.roles ?? []
  const areas = data?.areas ?? []

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {roles.map((role) => (
        <RoleCard key={role.id} role={role} areas={areas} />
      ))}
      <Card className="flex items-center gap-3 border-dashed bg-muted/20 p-4 text-sm text-muted-foreground md:col-span-2">
        <Lock className="h-4 w-4 shrink-0" />
        <span>
          Правата се проверяват от системата преди всеки отговор. AI никога не решава сам кой има достъп — той получава
          само документите от разрешените области.
        </span>
      </Card>
    </div>
  )
}

function RoleCard({ role, areas }: { role: RoleWithAreas; areas: Area[] }) {
  const [selected, setSelected] = useState<number[]>(role.areaIds)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...role.areaIds].sort())

  function toggle(areaId: number) {
    setSelected((prev) => (prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]))
  }

  async function save() {
    setSaving(true)
    const res = await fetch(ROLES_KEY, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId: role.id, areaIds: selected }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: `Правата за „${role.name}" са запазени` })
      mutate(ROLES_KEY)
    } else {
      toast({ title: "Грешка при запис", variant: "destructive" })
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">{role.name}</h3>
          <p className="text-xs text-muted-foreground">{role.description}</p>
        </div>
        <Badge variant="outline">{selected.length} области</Badge>
      </div>

      <div className="flex flex-col gap-2">
        {areas.map((area) => (
          <label
            key={area.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-md border p-2.5 text-sm transition-colors hover:bg-muted/50"
          >
            <Checkbox checked={selected.includes(area.id)} onCheckedChange={() => toggle(area.id)} />
            <span className="flex flex-1 items-center gap-1.5">
              {area.confidential && <Lock className="h-3.5 w-3.5 text-destructive" />}
              {area.name}
            </span>
          </label>
        ))}
      </div>

      <Button onClick={save} disabled={!dirty || saving} size="sm" className="gap-1.5 self-end">
        <Save className="h-4 w-4" />
        Запази
      </Button>
    </Card>
  )
}
