"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MadixAiLoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setPending(true)
    try {
      const response = await fetch("/api/madix-ai/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) throw new Error("Невалидно потребителско име или парола.")
      router.replace("/admin-panel/madix-ai")
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Възникна грешка.")
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole aria-hidden="true" className="size-6" />
          </div>
          <CardTitle>Изкуствен интелект</CardTitle>
          <p className="text-sm text-muted-foreground">Вход за AI администратори</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="ai-username">Потребителско име</Label>
              <Input id="ai-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-password">Парола</Label>
              <Input id="ai-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" disabled={pending} type="submit">{pending ? "Проверка…" : "Вход"}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
