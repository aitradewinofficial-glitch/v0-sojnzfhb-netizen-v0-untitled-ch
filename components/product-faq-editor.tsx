"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, GripVertical, Save } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface FAQ {
  id?: string
  product_id: string
  question: string
  question_en: string
  answer: string
  answer_en: string
  display_order: number
  is_active: boolean
  isNew?: boolean
  isEdited?: boolean
}

interface ProductFAQEditorProps {
  productId: string
}

export function ProductFAQEditor({ productId }: ProductFAQEditorProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchFAQs()
  }, [productId])

  const fetchFAQs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/product-faqs?productId=${productId}&includeInactive=true`)
      const data = await response.json()
      if (data.success && data.faqs) {
        setFaqs(data.faqs.map((faq: any) => ({
          ...faq,
          question_en: faq.question_en || "",
          answer_en: faq.answer_en || "",
        })))
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error)
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на въпросите.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addNewFAQ = () => {
    const newFaq: FAQ = {
      product_id: productId,
      question: "",
      question_en: "",
      answer: "",
      answer_en: "",
      display_order: faqs.length,
      is_active: true,
      isNew: true,
    }
    setFaqs([...faqs, newFaq])
    setExpandedIndex(faqs.length)
  }

  const updateFAQ = (index: number, field: keyof FAQ, value: any) => {
    const updatedFaqs = [...faqs]
    updatedFaqs[index] = {
      ...updatedFaqs[index],
      [field]: value,
      isEdited: true,
    }
    setFaqs(updatedFaqs)
  }

  const moveFAQ = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === faqs.length - 1)
    ) {
      return
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const updatedFaqs = [...faqs]
    const temp = updatedFaqs[index]
    updatedFaqs[index] = updatedFaqs[newIndex]
    updatedFaqs[newIndex] = temp

    // Update display_order
    updatedFaqs.forEach((faq, i) => {
      faq.display_order = i
      faq.isEdited = true
    })

    setFaqs(updatedFaqs)
    setExpandedIndex(newIndex)
  }

  const deleteFAQ = async (index: number) => {
    const faq = faqs[index]
    
    if (faq.isNew) {
      // Just remove from state if it's a new unsaved FAQ
      setFaqs(faqs.filter((_, i) => i !== index))
      return
    }

    if (!confirm("Сигурни ли сте, че искате да изтриете този въпрос?")) {
      return
    }

    try {
      const response = await fetch(`/api/product-faqs?id=${faq.id}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        setFaqs(faqs.filter((_, i) => i !== index))
        toast({
          title: "Успех",
          description: "Въпросът е изтрит успешно.",
        })
      } else {
        toast({
          title: "Грешка",
          description: data.error || "Неуспешно изтриване на въпроса.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error)
      toast({
        title: "Грешка",
        description: "Възникна грешка при изтриване на въпроса.",
        variant: "destructive",
      })
    }
  }

  const saveFAQ = async (index: number) => {
    const faq = faqs[index]
    
    if (!faq.question.trim() || !faq.answer.trim()) {
      toast({
        title: "Грешка",
        description: "Въпросът и отговорът са задължителни.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const method = faq.isNew ? "POST" : "PUT"
      const body = faq.isNew
        ? {
            productId: faq.product_id,
            question: faq.question,
            answer: faq.answer,
            question_en: faq.question_en || null,
            answer_en: faq.answer_en || null,
            display_order: faq.display_order,
          }
        : {
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
            question_en: faq.question_en || null,
            answer_en: faq.answer_en || null,
            display_order: faq.display_order,
            is_active: faq.is_active,
          }

      const response = await fetch("/api/product-faqs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        const updatedFaqs = [...faqs]
        updatedFaqs[index] = {
          ...data.faq,
          question_en: data.faq.question_en || "",
          answer_en: data.faq.answer_en || "",
          isNew: false,
          isEdited: false,
        }
        setFaqs(updatedFaqs)

        toast({
          title: "Успех",
          description: faq.isNew ? "Въпросът е добавен успешно." : "Въпросът е обновен успешно.",
        })
      } else {
        toast({
          title: "Грешка",
          description: data.error || "Неуспешно запазване на въпроса.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving FAQ:", error)
      toast({
        title: "Грешка",
        description: "Възникна грешка при запазване на въпроса.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Зареждане на въпроси...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-cyan-400">
          Често задавани въпроси ({faqs.length})
        </h3>
        <Button
          onClick={addNewFAQ}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Добави въпрос
        </Button>
      </div>

      {faqs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Няма добавени въпроси. Кликнете "Добави въпрос" за да започнете.
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id || `new-${index}`}
              className={`border rounded-lg overflow-hidden ${
                faq.isNew ? "border-cyan-500/50 bg-cyan-950/20" : "border-gray-700 bg-gray-800/50"
              }`}
            >
              {/* Header */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-700/30"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <GripVertical className="h-4 w-4 text-gray-500" />
                <div className="flex-1 truncate">
                  <span className="text-sm font-medium text-white">
                    {faq.question || "(Нов въпрос)"}
                  </span>
                  {faq.isNew && (
                    <span className="ml-2 text-xs text-cyan-400">(незаписан)</span>
                  )}
                  {faq.isEdited && !faq.isNew && (
                    <span className="ml-2 text-xs text-yellow-400">(променен)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveFAQ(index, "up")
                    }}
                    disabled={index === 0}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveFAQ(index, "down")
                    }}
                    disabled={index === faqs.length - 1}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteFAQ(index)
                    }}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedIndex === index && (
                <div className="border-t border-gray-700 p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bulgarian */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-300">Български</h4>
                      <div>
                        <Label htmlFor={`question-${index}`} className="text-gray-400">
                          Въпрос *
                        </Label>
                        <Input
                          id={`question-${index}`}
                          value={faq.question}
                          onChange={(e) => updateFAQ(index, "question", e.target.value)}
                          placeholder="Въведете въпрос..."
                          className="bg-gray-900 border-gray-700 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`answer-${index}`} className="text-gray-400">
                          Отговор *
                        </Label>
                        <Textarea
                          id={`answer-${index}`}
                          value={faq.answer}
                          onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                          placeholder="Въведете отговор..."
                          rows={3}
                          className="bg-gray-900 border-gray-700 text-white mt-1"
                        />
                      </div>
                    </div>

                    {/* English */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-300">English</h4>
                      <div>
                        <Label htmlFor={`question-en-${index}`} className="text-gray-400">
                          Question
                        </Label>
                        <Input
                          id={`question-en-${index}`}
                          value={faq.question_en}
                          onChange={(e) => updateFAQ(index, "question_en", e.target.value)}
                          placeholder="Enter question..."
                          className="bg-gray-900 border-gray-700 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`answer-en-${index}`} className="text-gray-400">
                          Answer
                        </Label>
                        <Textarea
                          id={`answer-en-${index}`}
                          value={faq.answer_en}
                          onChange={(e) => updateFAQ(index, "answer_en", e.target.value)}
                          placeholder="Enter answer..."
                          rows={3}
                          className="bg-gray-900 border-gray-700 text-white mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active toggle and Save button */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`active-${index}`}
                        checked={faq.is_active}
                        onCheckedChange={(checked) => updateFAQ(index, "is_active", checked)}
                      />
                      <Label htmlFor={`active-${index}`} className="text-gray-400 text-sm">
                        Активен
                      </Label>
                    </div>
                    <Button
                      onClick={() => saveFAQ(index)}
                      disabled={saving}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Запази
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
