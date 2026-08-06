"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  Home,
  UserCheck,
  ShoppingBag,
  Percent,
  ImageIcon,
  Undo2,
  Factory,
  Bell,
  Rss,
  Star,
  Newspaper,
  Search,
  Boxes,
  Fish,
} from "lucide-react"

export function Sidebar({ items }: { items: any[] }) {
  const pathname = usePathname()
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const loadLowStock = async () => {
      try {
        const res = await fetch("/api/admin/supply/materials")
        if (!res.ok) return
        const materials = await res.json()
        if (cancelled || !Array.isArray(materials)) return
        const count = materials.filter((m: any) => Number(m.stock) < Number(m.min_quantity)).length
        setLowStockCount(count)
      } catch {
        // тихо игнорираме
      }
    }
    loadLowStock()
    const interval = setInterval(loadLowStock, 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const navItems = [
    {
      title: "Табло",
      href: "/admin-panel",
      icon: LayoutDashboard,
      active: isActive("/admin-panel") && pathname === "/admin-panel",
    },
    {
      title: "Продукти",
      href: "/admin-panel/products",
      icon: Package,
      active: isActive("/admin-panel/products"),
    },
    {
      title: "Отзиви",
      href: "/admin-panel/reviews",
      icon: Star,
      active: isActive("/admin-panel/reviews"),
    },
    {
      title: "Категории",
      href: "/admin-panel/categories",
      icon: Tag,
      active: isActive("/admin-panel/categories"),
    },
    {
      title: "Клиенти",
      href: "/admin-panel/users",
      icon: Users,
      active: isActive("/admin-panel/users") && !isActive("/admin-panel/users/approval"),
    },
    {
      title: "Одобрение на клиенти",
      href: "/admin-panel/users/approval",
      icon: UserCheck,
      active: isActive("/admin-panel/users/approval"),
    },
    {
      title: "Рибари",
      href: "/admin-panel/fishermen",
      icon: Fish,
      active: isActive("/admin-panel/fishermen"),
    },
    {
      title: "Поръчки",
      href: "/admin-panel/orders",
      icon: ShoppingBag,
      active: isActive("/admin-panel/orders"),
    },
    {
      title: "Промоции",
      href: "/admin-panel/promotions",
      icon: Percent,
      active: isActive("/admin-panel/promotions"),
    },
    {
      title: "Заявки за връщане",
      href: "/admin-panel/returns",
      icon: Undo2,
      active: isActive("/admin-panel/returns"),
    },
    {
      title: "Производство",
      href: "/admin-panel/production",
      icon: Factory,
      active: isActive("/admin-panel/production"),
    },
    {
      title: "Снабдяване",
      href: "/admin-panel/supply",
      icon: Boxes,
      active: isActive("/admin-panel/supply"),
      badge: lowStockCount,
    },
    {
      title: "Новини",
      href: "/admin-panel/news",
      icon: Newspaper,
      active: isActive("/admin-panel/news"),
    },
    {
      title: "Банери (Карусел)",
      href: "/admin-panel/home-image",
      icon: ImageIcon,
      active: isActive("/admin-panel/home-image"),
    },
    {
      title: "Настройки на банер",
      href: "/admin-panel/banner-settings",
      icon: Bell,
      active: isActive("/admin-panel/banner-settings"),
    },
    {
      title: "Meta Product Feed",
      href: "/admin-panel/meta-feed",
      icon: Rss,
      active: isActive("/admin-panel/meta-feed"),
    },
    {
      title: "SEO Настройки",
      href: "/admin-panel/seo-settings",
      icon: Search,
      active: isActive("/admin-panel/seo-settings"),
    },
    {
      title: "Към сайта",
      href: "/",
      icon: Home,
    },
  ]

  return (
    <div className="h-full flex flex-col text-white" style={{ background: "linear-gradient(180deg, #1a0a00 0%, #2d1200 40%, #1a0a00 100%)" }}>
      {/* Logo header */}
      <div className="px-5 py-5 border-b border-orange-900/40">
        <Link href="/admin-panel" className="flex items-center justify-center">
          <div className="relative h-10 w-36">
            <Image
              src="/images/design-mode/new-madiks.png"
              alt="Madix"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <p className="text-center text-[10px] font-semibold tracking-[0.2em] uppercase text-orange-400/70 mt-2">
          Админ панел
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-auto py-4 px-3">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium",
                item.active
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-900/40"
                  : "text-orange-200/70 hover:text-white hover:bg-orange-500/20",
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", item.active ? "text-white" : "text-orange-400")} />
              <span className="flex-1">{item.title}</span>
              {item.badge > 0 && (
                <span className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-orange-900/40">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-orange-200/70 hover:text-white hover:bg-orange-500/20 transition-all duration-150"
        >
          <Home className="h-4 w-4 shrink-0 text-orange-400" />
          <span>Към сайта</span>
        </Link>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  return <Sidebar items={[]} />
}
