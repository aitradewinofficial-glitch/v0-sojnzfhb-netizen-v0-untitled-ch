"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"

export function Sidebar({ items }: { items: any[] }) {
  const pathname = usePathname()

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
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-800">
        <Link href="/admin-panel" className="flex items-center space-x-2 text-xl font-bold">
          <span>Админ панел</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
                item.active ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <Link href="/" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
          <Home className="h-5 w-5" />
          <span>Към сайта</span>
        </Link>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  return <Sidebar items={[]} />
}
