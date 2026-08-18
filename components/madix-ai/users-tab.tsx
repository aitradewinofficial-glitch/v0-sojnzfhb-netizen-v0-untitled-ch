"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Plus, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { fetcher, type MadixUser, type Role } from "@/components/madix-ai/types"

const USERS_KEY = "/api/madix-ai/admin/users"
const ROLES_KEY = "/api/madix-ai/admin/roles"

export function UsersTab() {
  const { data: usersData } = useSWR<{ users: MadixUser[] }>(USERS_KEY, fetcher)
  const { data: rolesData } = useSWR<{ roles: Role[] }>(ROLES_KEY, fetcher)
  const users = usersData?.users ?? []
  const roles = rolesData?.roles ?? []

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [roleId, setRoleId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  async function addUser() {
    if (!name.trim() || !email.trim()) {
      toast.error("Попълнете име и имейл")
      return
    }
    setSaving(true)
    const res = await fetch(USERS_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, roleId: roleId || null }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success("Потребителят е добавен")
      setName("")
      setEmail("")
      setRoleId("")
      mutate(USERS_KEY)
    } else {
      toast.error("Грешка при добавяне")
    }
  }

  async function patchUser(id: number, body: Record<string, unknown>) {
    await fetch(`${USERS_KEY}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    mutate(USERS_KEY)
  }

  async function removeUser(id: number) {
    await fetch(`${USERS_KEY}/${id}`, { method: "DELETE" })
    mutate(USERS_KEY)
    toast.success("Потребителят е изтрит")
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Нов потребител</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="u-name">Име</Label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Име Фамилия" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="u-email">Имейл</Label>
            <Input id="u-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@madix.bg" />
          </div>
          <div className="space-y-1">
            <Label>Роля</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Изберете роля" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={addUser} disabled={saving} className="w-full gap-1.5">
              <Plus className="h-4 w-4" />
              Добави
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Име</TableHead>
              <TableHead>Имейл</TableHead>
              <TableHead>Роля</TableHead>
              <TableHead className="text-center">Активен</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Select
                    value={u.role_id ? String(u.role_id) : ""}
                    onValueChange={(v) => patchUser(u.id, { roleId: Number(v) })}
                  >
                    <SelectTrigger className="h-8 w-[160px]">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Switch checked={u.active} onCheckedChange={(c) => patchUser(u.id, { active: c })} />
                    {!u.active && <Badge variant="outline">спрян</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeUser(u.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Изтрий</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
