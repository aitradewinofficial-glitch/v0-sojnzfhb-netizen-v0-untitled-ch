"use client"

import Image from "next/image"
import Link from "next/link"
import { X, ArrowLeft, Scale } from "lucide-react"
import { useCompare } from "@/context/compare-context"
import { Button } from "@/components/ui/button"

export function ComparePageClient() {
  const { items, removeItem, clearAll } = useCompare()

  if (items.length === 0) {
    return (
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
              <Scale className="w-10 h-10 text-neutral-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-3">
              Няма продукти за сравнение
            </h1>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              Добавете продукти за сравнение, като натиснете бутона "Сравни" на страницата на продукта.
            </p>
            <Button asChild className="rounded-full bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Към началната страница
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Сравни продукти
            </h1>
            <p className="text-neutral-500 mt-1">
              {items.length} {items.length === 1 ? "продукт" : "продукта"} за сравнение
            </p>
          </div>
          <Button
            onClick={clearAll}
            variant="outline"
            className="rounded-full border-neutral-300 hover:bg-neutral-100 text-neutral-700"
          >
            Изчисти всички
          </Button>
        </div>

        {/* Compare Table */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-neutral-200/60">
                  <th className="p-4 text-left text-sm font-semibold text-neutral-500 w-32">
                    Характеристика
                  </th>
                  {items.map((item) => (
                    <th key={item.id} className="p-4 text-center min-w-[200px]">
                      <div className="relative">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-neutral-100 hover:bg-red-100 text-neutral-500 hover:text-red-600 flex items-center justify-center transition-colors"
                          aria-label="Премахни от сравнение"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Product Image */}
                <tr className="border-b border-neutral-100">
                  <td className="p-4 text-sm font-medium text-neutral-500">Снимка</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4">
                      <Link href={`/product/${item.id}`} className="block">
                        <div className="aspect-square relative rounded-xl bg-neutral-50 overflow-hidden max-w-[160px] mx-auto border border-neutral-100">
                          <Image
                            src={item.photourl || `/placeholder.svg?height=160&width=160&query=${encodeURIComponent(item.title)}`}
                            alt={item.title}
                            fill
                            className="object-contain p-3"
                            unoptimized
                          />
                        </div>
                      </Link>
                    </td>
                  ))}
                </tr>

                {/* Product Title */}
                <tr className="border-b border-neutral-100">
                  <td className="p-4 text-sm font-medium text-neutral-500">Наименование</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 text-center">
                      <Link 
                        href={`/product/${item.id}`}
                        className="font-semibold text-neutral-900 hover:text-amber-600 transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                    </td>
                  ))}
                </tr>

                {/* Price */}
                <tr className="border-b border-neutral-100">
                  <td className="p-4 text-sm font-medium text-neutral-500">Цена</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 text-center">
                      <span className="text-xl font-bold text-neutral-900">
                        {item.price.toFixed(2)} лв.
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Description */}
                <tr className="border-b border-neutral-100">
                  <td className="p-4 text-sm font-medium text-neutral-500 align-top">Описание</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 text-center">
                      <p className="text-sm text-neutral-600 line-clamp-4">
                        {item.description || "Няма описание"}
                      </p>
                    </td>
                  ))}
                </tr>

                {/* Category */}
                <tr className="border-b border-neutral-100">
                  <td className="p-4 text-sm font-medium text-neutral-500">Категория</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 text-center">
                      <span className="text-sm text-neutral-600">
                        {item.categoryTitle || "—"}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Subcategory */}
                <tr className="border-b border-neutral-100">
                  <td className="p-4 text-sm font-medium text-neutral-500">Подкатегория</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 text-center">
                      <span className="text-sm text-neutral-600">
                        {item.subcategoryTitle || "—"}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="p-4 text-sm font-medium text-neutral-500">Действия</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 text-center">
                      <div className="flex flex-col gap-2">
                        <Button
                          asChild
                          className="rounded-full bg-neutral-900 hover:bg-neutral-800 text-white"
                        >
                          <Link href={`/product/${item.id}`}>
                            Виж продукта
                          </Link>
                        </Button>
                        <Button
                          onClick={() => removeItem(item.id)}
                          variant="outline"
                          className="rounded-full border-neutral-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          Премахни
                        </Button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-10 text-center">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-neutral-300 hover:bg-neutral-100 text-neutral-700 px-8"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Продължи пазаруването
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
