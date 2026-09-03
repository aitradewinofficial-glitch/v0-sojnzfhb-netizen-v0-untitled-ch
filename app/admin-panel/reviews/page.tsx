"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Trash2, Edit, Star, Check, X, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { StarRating } from "@/components/star-rating"

interface Review {
  id: number
  product_id: string
  product_title: string
  rating: number
  reviewer_name: string | null
  reviewer_email: string | null
  review_text: string | null
  is_approved: boolean
  created_at: string
  updated_at: string
}

interface EditReviewForm {
  id: number
  rating: number
  reviewer_name: string
  review_text: string
  is_approved: boolean
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<EditReviewForm | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reviews?page=${page}&limit=20`)
      const data = await response.json()
      if (data.success) {
        setReviews(data.reviews)
        setTotalPages(data.pagination?.pages || 1)
      } else {
        toast.error(data.error || "Грешка при зареждане на отзивите")
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast.error("Грешка при зареждане на отзивите")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleDelete = async (reviewId: number) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този отзив?")) return

    try {
      const response = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Отзивът е изтрит успешно")
        fetchReviews()
      } else {
        toast.error(data.error || "Грешка при изтриване на отзива")
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      toast.error("Грешка при изтриване на отзива")
    }
  }

  const handleToggleApproval = async (reviewId: number, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, isApproved: !currentStatus }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success(currentStatus ? "Отзивът е скрит" : "Отзивът е одобрен")
        fetchReviews()
      } else {
        toast.error(data.error || "Грешка при актуализиране на отзива")
      }
    } catch (error) {
      console.error("Error updating review:", error)
      toast.error("Грешка при актуализиране на отзива")
    }
  }

  const handleOpenEditModal = (review: Review) => {
    setEditingReview({
      id: review.id,
      rating: review.rating,
      reviewer_name: review.reviewer_name || "",
      review_text: review.review_text || "",
      is_approved: review.is_approved,
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingReview) return

    setIsUpdating(true)
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: editingReview.id,
          rating: editingReview.rating,
          reviewerName: editingReview.reviewer_name,
          reviewText: editingReview.review_text,
          isApproved: editingReview.is_approved,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Отзивът е актуализиран успешно")
        setEditModalOpen(false)
        setEditingReview(null)
        fetchReviews()
      } else {
        toast.error(data.error || "Грешка при актуализиране на отзива")
      }
    } catch (error) {
      console.error("Error updating review:", error)
      toast.error("Грешка при актуализиране на отзива")
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Управление на отзиви</h1>
        <Button onClick={() => fetchReviews()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Опресни
        </Button>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Отзиви от клиенти</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
          ) : reviews.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Продукт</th>
                      <th className="text-left py-3 px-4">Оценка</th>
                      <th className="text-left py-3 px-4">Име</th>
                      <th className="text-left py-3 px-4">Отзив</th>
                      <th className="text-left py-3 px-4">Дата</th>
                      <th className="text-left py-3 px-4">Статус</th>
                      <th className="text-left py-3 px-4">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => (
                      <tr key={review.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-neutral-700 line-clamp-1 max-w-[200px]">
                            {review.product_title}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "text-amber-400 fill-amber-400" : "text-neutral-200 fill-neutral-200"
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-600">
                          {review.reviewer_name || "Анонимен"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-neutral-600 line-clamp-2 max-w-[250px]">
                            {review.review_text || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-500">
                          {formatDate(review.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              review.is_approved
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {review.is_approved ? "Одобрен" : "Скрит"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleApproval(review.id, review.is_approved)}
                              className="bg-background text-foreground"
                              title={review.is_approved ? "Скрий отзива" : "Одобри отзива"}
                            >
                              {review.is_approved ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(review)}
                              className="bg-background text-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 bg-background"
                              onClick={() => handleDelete(review.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || loading}
                  className="bg-background text-foreground"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Предишна
                </Button>
                <span className="text-sm text-gray-700">
                  Страница {page} от {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                  disabled={page >= totalPages || loading}
                  className="bg-background text-foreground"
                >
                  Следваща
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <Star className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-gray-500">Няма налични отзиви.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Review Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактиране на отзив</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Оценка
                </label>
                <StarRating
                  rating={editingReview.rating}
                  interactive
                  onRatingChange={(rating) =>
                    setEditingReview({ ...editingReview, rating })
                  }
                  size="lg"
                />
              </div>

              <div>
                <label htmlFor="reviewerName" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Име на рецензента
                </label>
                <Input
                  id="reviewerName"
                  value={editingReview.reviewer_name}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, reviewer_name: e.target.value })
                  }
                  placeholder="Въведете име"
                  className="bg-white"
                />
              </div>

              <div>
                <label htmlFor="reviewText" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Текст на отзива
                </label>
                <Textarea
                  id="reviewText"
                  value={editingReview.review_text}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, review_text: e.target.value })
                  }
                  placeholder="Въведете текст на отзива"
                  className="bg-white min-h-[100px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isApproved"
                  checked={editingReview.is_approved}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, is_approved: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isApproved" className="text-sm font-medium text-neutral-700">
                  Одобрен (видим за потребителите)
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpen(false)
                setEditingReview(null)
              }}
            >
              Отказ
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Запазване...
                </>
              ) : (
                "Запази промените"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
