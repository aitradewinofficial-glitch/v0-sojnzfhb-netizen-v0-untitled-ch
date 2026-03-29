import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Calendar } from "lucide-react"

interface NewsItem {
  id: number
  title: string
  title_en: string | null
  summary: string | null
  summary_en: string | null
  image_url: string | null
  link_url: string | null
  slug: string | null
  is_featured: boolean
  created_at: string
}

interface NewsSectionProps {
  news: NewsItem[]
  isEnglish?: boolean
}

export function NewsSection({ news, isEnglish = false }: NewsSectionProps) {
  if (!news || news.length === 0) {
    return null
  }

  // Take up to 4 news items for display
  const displayNews = news.slice(0, 4)
  const featuredNews = displayNews.find((n) => n.is_featured) || displayNews[0]
  const otherNews = displayNews.filter((n) => n.id !== featuredNews.id).slice(0, 3)

  const getTitle = (item: NewsItem) => {
    if (isEnglish && item.title_en) return item.title_en
    return item.title
  }

  const getSummary = (item: NewsItem) => {
    if (isEnglish && item.summary_en) return item.summary_en
    return item.summary
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isEnglish ? "en-US" : "bg-BG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const NewsCard = ({ item, isFeatured = false }: { item: NewsItem; isFeatured?: boolean }) => {
    const content = (
      <div
        className={`group relative overflow-hidden rounded-2xl bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
          isFeatured ? "h-full" : "h-full"
        }`}
      >
        {/* Image */}
        <div className={`relative overflow-hidden ${isFeatured ? "aspect-[16/10]" : "aspect-[16/9]"}`}>
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={getTitle(item)}
              fill
              sizes={isFeatured ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 768px) 100vw, 20vw"}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-4xl text-gray-300">M</div>
            </div>
          )}
          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
        </div>

        {/* Content */}
        <div className={`p-4 ${isFeatured ? "sm:p-6" : "sm:p-4"}`}>
          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(item.created_at)}</span>
            {item.is_featured && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium uppercase tracking-wide">
                {isEnglish ? "Featured" : "Важно"}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-semibold text-gray-900 leading-snug group-hover:text-amber-600 transition-colors duration-300 ${
              isFeatured ? "text-xl sm:text-2xl line-clamp-2" : "text-base line-clamp-2"
            }`}
          >
            {getTitle(item)}
          </h3>

          {/* Summary - only on featured */}
          {isFeatured && getSummary(item) && (
            <p className="mt-3 text-sm sm:text-base text-gray-500 line-clamp-2 leading-relaxed">
              {getSummary(item)}
            </p>
          )}

          {/* Read more link */}
          <div
            className={`flex items-center gap-1.5 text-amber-600 font-medium transition-all duration-300 group-hover:gap-2.5 ${
              isFeatured ? "mt-4 text-sm" : "mt-3 text-xs"
            }`}
          >
            <span>{isEnglish ? "Read more" : "Прочети повече"}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    )

    // Determine the link destination
    const getNewsLink = () => {
      if (item.link_url) return item.link_url
      const slug = item.slug || item.id
      return isEnglish ? `/en/news/${slug}` : `/news/${slug}`
    }

    const link = getNewsLink()
    const isExternal = link.startsWith("http")

    if (isExternal) {
      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
        >
          {content}
        </a>
      )
    }

    return (
      <Link href={link} className="block h-full">
        {content}
      </Link>
    )
  }

  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header - Apple style */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block mb-3 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-700 tracking-wide uppercase">
            {isEnglish ? "Latest" : "Актуално"}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900 text-balance">
            {isEnglish ? "News" : "Новини"}
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            {isEnglish
              ? "Stay updated with the latest news, promotions and fishing tips"
              : "Бъдете в крак с последните новини, промоции и риболовни съвети"}
          </p>
        </div>

        {/* News Grid - Bento-style layout */}
        {otherNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
            {/* Featured news - larger card */}
            <div className="md:col-span-7 lg:col-span-8">
              <NewsCard item={featuredNews} isFeatured />
            </div>

            {/* Other news - stacked on the right */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4 sm:gap-6">
              {otherNews.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          /* Single news item - full width */
          <div className="max-w-3xl mx-auto">
            <NewsCard item={featuredNews} isFeatured />
          </div>
        )}
      </div>
    </section>
  )
}
