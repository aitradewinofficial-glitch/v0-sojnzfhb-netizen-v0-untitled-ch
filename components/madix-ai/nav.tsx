"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, MessagesSquare, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/madix-ai", label: "Чат", icon: MessagesSquare },
  { href: "/madix-ai/admin", label: "Администрация", icon: ShieldCheck },
]

export function MadixAiNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/madix-ai" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">MADIX AI</span>
            <span className="text-xs text-muted-foreground">Вътрешен асистент</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
