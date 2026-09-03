"use client"

import { FormEvent, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Bot, FileText, KeyRound, LockKeyhole, ScrollText, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UsersTab } from "@/components/madix-ai/users-tab"
import { ChatClient } from "@/components/madix-ai/chat-client"
import { RolesTab } from "@/components/madix-ai/roles-tab"
import { DocumentsTab } from "@/components/madix-ai/documents-tab"
import { AuditTab } from "@/components/madix-ai/audit-tab"

export function AdminClient() {
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/madix-ai/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Входът неуспешен.")
      setAuthenticated(true)
      setPassword("")
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Входът неуспешен.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Изкуствен интелект</h1>
        <p className="text-sm text-muted-foreground">Управление на MADIX AI потребители, роли и достъп, документи и одит на заявките.</p>
      </div>

      {!authenticated ? (
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle>Вход в MADIX AI</CardTitle>
            <CardDescription>Въведете потребителско име и парола, за да продължите.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="madix-ai-username">Потребителско име</Label>
                <Input id="madix-ai-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="madix-ai-password">Парола</Label>
                <Input id="madix-ai-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
              </div>
              {error ? <p className="flex items-center gap-2 text-sm text-destructive" role="alert"><AlertCircle className="h-4 w-4" aria-hidden="true" />{error}</p> : null}
              <Button className="w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Влизане..." : "Вход"}</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="chat" className="flex flex-1 flex-col">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="chat" className="gap-1.5"><Bot className="h-4 w-4" /><span className="hidden sm:inline">Чат</span></TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" /><span className="hidden sm:inline">Потребители</span></TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5"><KeyRound className="h-4 w-4" /><span className="hidden sm:inline">Роли и достъп</span></TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5"><FileText className="h-4 w-4" /><span className="hidden sm:inline">Документи</span></TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5"><ScrollText className="h-4 w-4" /><span className="hidden sm:inline">Одит лог</span></TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-4 flex-1"><ChatClient /></TabsContent>
          <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
          <TabsContent value="roles" className="mt-4"><RolesTab /></TabsContent>
          <TabsContent value="documents" className="mt-4"><DocumentsTab /></TabsContent>
          <TabsContent value="audit" className="mt-4"><AuditTab /></TabsContent>
        </Tabs>
      )}
    </div>
  )
}
