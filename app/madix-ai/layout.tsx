import type React from "react"
import type { Metadata } from "next"
import { MadixAiNav } from "@/components/madix-ai/nav"

export const metadata: Metadata = {
  title: "MADIX AI — Вътрешен асистент",
  description: "Вътрешен AI асистент на MADIX Groundbaits с контрол на достъпа по роли.",
}

export default function MadixAiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <MadixAiNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">{children}</main>
    </div>
  )
}
