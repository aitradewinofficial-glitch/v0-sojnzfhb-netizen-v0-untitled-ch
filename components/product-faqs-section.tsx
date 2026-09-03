"use client"

import { useState, useEffect } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQ {
  id: string
  question: string
  question_en?: string
  answer: string
  answer_en?: string
  display_order: number
}

interface ProductFAQsSectionProps {
  productId: string
  isEnglish?: boolean
}

export function ProductFAQsSection({ productId, isEnglish = false }: ProductFAQsSectionProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch(`/api/product-faqs?productId=${productId}`)
        const data = await response.json()
        if (data.success && data.faqs) {
          setFaqs(data.faqs)
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
  }, [productId])

  if (loading) {
    return null
  }

  if (faqs.length === 0) {
    return null
  }

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getQuestion = (faq: FAQ) => {
    if (isEnglish && faq.question_en) {
      return faq.question_en
    }
    return faq.question
  }

  const getAnswer = (faq: FAQ) => {
    if (isEnglish && faq.answer_en) {
      return faq.answer_en
    }
    return faq.answer
  }

  // Generate FAQ JSON-LD structured data
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": getQuestion(faq),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": getAnswer(faq)
      }
    }))
  }

  return (
    <>
      {/* FAQ JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      <section className="py-10 md:py-14 border-t border-neutral-200/60">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-neutral-500" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                {isEnglish ? "Frequently Asked Questions" : "Често задавани въпроси"}
              </h2>
            </div>
            <p className="text-neutral-500 text-sm">
              {isEnglish 
                ? "Find answers to common questions about this product" 
                : "Намерете отговори на често задавани въпроси за този продукт"}
            </p>
          </div>

          <div className="space-y-3 max-w-3xl">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white border border-neutral-200/80 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-neutral-50 transition-colors"
                >
                  <span className="font-medium text-neutral-800 pr-4">
                    {getQuestion(faq)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-neutral-400 shrink-0 transition-transform duration-200",
                      expandedId === faq.id && "rotate-180"
                    )}
                  />
                </button>
                
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    expandedId === faq.id ? "max-h-96" : "max-h-0"
                  )}
                >
                  <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0">
                    <div className="border-t border-neutral-100 pt-4">
                      <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
                        {getAnswer(faq)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
