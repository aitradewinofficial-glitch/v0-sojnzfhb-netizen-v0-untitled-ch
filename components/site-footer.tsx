import Link from "next/link"
import { FaTiktok } from "react-icons/fa"
import { Facebook, Youtube, Instagram, MapPin, Phone, Mail, ArrowUpRight } from "lucide-react"

interface Category {
  id: string
  title: string
  title_en?: string
}

interface SiteFooterProps {
  categories?: Category[]
  isEnglish?: boolean
}

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string
  children: React.ReactNode
  external?: boolean
}) {
  const className =
    "group flex items-center gap-1 text-neutral-400 hover:text-white transition-colors duration-300 text-sm leading-relaxed"

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-[-2px] group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.06] text-neutral-400 hover:bg-white/[0.12] hover:text-white hover:scale-110 transition-all duration-300"
      aria-label={label}
    >
      {children}
    </a>
  )
}

export function SiteFooter({ categories = [], isEnglish = false }: SiteFooterProps) {
  const currentYear = new Date().getFullYear()

  const aboutLinks = isEnglish
    ? [
      { href: "/en/about", label: "About us" },
      { href: "/en/contact", label: "Contact" },
      {
        href: "https://96ghfafarqg1wwmp.public.blob.vercel-storage.com/Catalog%202025%20Web.pdf",
        label: "Catalog",
        external: true,
      },
    ]
    : [
      { href: "/about", label: "За нас" },
      { href: "/contact", label: "Контакти" },
      {
        href: "https://96ghfafarqg1wwmp.public.blob.vercel-storage.com/Catalog%202025%20Web.pdf",
        label: "Каталог",
        external: true,
      },
    ]

  const infoLinks = isEnglish
    ? [
      { href: "/en/terms", label: "Terms and Conditions" },
      { href: "/en/delivery-returns", label: "Shipping and Returns" },
      { href: "/en/payment", label: "Payment" },
      { href: "/en/privacy", label: "Privacy Policy" },
    ]
    : [
      { href: "/terms", label: "Общи условия" },
      { href: "/delivery-returns", label: "Доставка и връщане" },
      { href: "/payment", label: "Плащане" },
      { href: "/privacy", label: "Политика за поверителност" },
    ]

  return (
    <footer className="bg-neutral-950 text-white">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

      <div className="container mx-auto px-4 py-16 lg:py-20">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href={isEnglish ? "/en" : "/"} className="inline-block mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                Madix
                <span className="text-neutral-500 font-normal ml-1.5 text-lg">Groundbaits</span>
              </h2>
            </Link>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-xs mb-8">
              {isEnglish
                ? "Premium fishing groundbaits crafted with precision. Designed for serious anglers who demand the best."
                : "Висококачествени риболовни захранки, изработени с прецизност. Създадени за сериозни риболовци, които изискват най-доброто."}
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-neutral-500 text-sm">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{isEnglish ? "Bulgaria" : "България"}</span>
              </div>
              <a
                href="tel:+359888123456"
                className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 transition-colors text-sm"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span>+359 894 352204</span>
              </a>
              <a
                href="mailto:info@madiks.bg"
                className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 transition-colors text-sm"
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@madiks.bg</span>
              </a>
            </div>
          </div>

          {/* Categories column */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-5">
              {isEnglish ? "Categories" : "Категории"}
            </h3>
            {categories.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {categories.map((category) => (
                  <FooterLink
                    key={category.id}
                    href={isEnglish ? `/en/category/${category.id}` : `/category/${category.id}`}
                  >
                    {isEnglish ? category.title_en || category.title : category.title}
                  </FooterLink>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 text-sm">
                {isEnglish ? "No categories available." : "Няма налични категории."}
              </p>
            )}
          </div>

          {/* About column */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-5">
              {isEnglish ? "About Madix" : "За Мадикс"}
            </h3>
            <div className="flex flex-col gap-2.5">
              {aboutLinks.map((link) => (
                <FooterLink key={link.href} href={link.href} external={link.external}>
                  {link.label}
                </FooterLink>
              ))}
            </div>
          </div>

          {/* Information column */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-5">
              {isEnglish ? "Information" : "Информация"}
            </h3>
            <div className="flex flex-col gap-2.5">
              {infoLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-800/80 my-12" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Social icons */}
          <div className="flex items-center gap-3">
            <SocialLink href="https://www.facebook.com/madiksbg" label="Facebook">
              <Facebook className="h-4 w-4" />
            </SocialLink>
            <SocialLink href="https://www.youtube.com/@madixltd2794" label="YouTube">
              <Youtube className="h-4 w-4" />
            </SocialLink>
            <SocialLink href="https://www.instagram.com/madiks.bg/" label="Instagram">
              <Instagram className="h-4 w-4" />
            </SocialLink>
            <SocialLink href="https://www.tiktok.com/@madixltd" label="TikTok">
              <FaTiktok className="h-4 w-4" />
            </SocialLink>
          </div>

          {/* Copyright */}
          <p className="text-neutral-600 text-xs tracking-wide">
            {isEnglish
              ? `\u00A9 ${currentYear} Madix Groundbaits. All rights reserved.`
              : `\u00A9 ${currentYear} Мадикс Граундбейтс. Всички права запазени.`}
          </p>
        </div>
      </div>
    </footer>
  )
}
