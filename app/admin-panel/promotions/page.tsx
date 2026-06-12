"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  type SubcategoryPromotionDisplay,
  applyPromotion,
  removePromotion,
  getSubcategoriesWithActivePromotions,
} from "./actions"
import { Badge } from "@/components/ui/badge"

// Типове клиенти, за които могат да се СЪЗДАВАТ нови промоции
const creatableCustomerTypes = [{ value: "retailer", label: "Търговец на дребно" }]

// Функция за получаване на етикет за ВСЕКИ тип клиент (за показване на съществуващи промоции)
function getCustomerTypeLabel(customerType: string | null): string {
  if (customerType === null) return "Обща (за всички)"
  if (customerType === "retailer") return "Търговец на дребно"
  if (customerType === "wholesaler") return "Търговец на едро"
  // Добавете други познати типове, ако е необходимо
  return customerType // Връща стойността, ако типът е непознат
}

// Нов интерфейс за групирани промоции
interface GroupedPromotionDisplay {
  key: string // Уникален ключ за групата (комбинация от параметри)
  min_quantity: number
  bonus_quantity: number
  customer_type: string | null
  description: string | null
  applied_to_subcategories: { id: string; title: string }[] // Списък с подкатегории, към които се отнася тази група
}

export default function PromotionsPage() {
  const [allSubcategories, setAllSubcategories] = useState<SubcategoryPromotionDisplay[]>([])
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<Set<string>>(new Set())
  const [minQuantityInput, setMinQuantityInput] = useState<string>("")
  const [bonusQuantityInput, setBonusQuantityInput] = useState<string>("")
  const [descriptionInput, setDescriptionInput] = useState<string>("")
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>("retailer") // По подразбиране и единствена опция

  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Ново състояние за групираните промоции
  const [groupedPromotions, setGroupedPromotions] = useState<GroupedPromotionDisplay[]>([])

  // Функция за групиране на промоциите за показване
  const groupPromotionsForDisplay = useCallback((subcategories: SubcategoryPromotionDisplay[]) => {
    const groups: { [key: string]: GroupedPromotionDisplay } = {}

    subcategories.forEach((sc) => {
      sc.active_promotions.forEach((promo) => {
        // Създаваме уникален ключ за групата на базата на параметрите на промоцията
        const groupKey = `${promo.min_quantity}-${promo.bonus_quantity}-${promo.customer_type || "null"}-${promo.description || "null"}`

        if (!groups[groupKey]) {
          groups[groupKey] = {
            key: groupKey,
            min_quantity: promo.min_quantity,
            bonus_quantity: promo.bonus_quantity,
            customer_type: promo.customer_type,
            description: promo.description,
            applied_to_subcategories: [],
          }
        }
        // Добавяме текущата подкатегория към списъка на тази група
        groups[groupKey].applied_to_subcategories.push({
          id: sc.id,
          title: sc.title,
        })
      })
    })

    // Сортираме групите за последователно показване
    const sortedGroups = Object.values(groups).sort((a, b) => {
      // Първично сортиране по тип клиент, след това по минимално количество, след това по бонусно количество
      const customerTypeA = a.customer_type || ""
      const customerTypeB = b.customer_type || ""
      if (customerTypeA !== customerTypeB) return customerTypeA.localeCompare(customerTypeB)
      if (a.min_quantity !== b.min_quantity) return a.min_quantity - b.min_quantity
      return a.bonus_quantity - b.bonus_quantity
    })

    return sortedGroups
  }, [])

  const fetchSubcategoriesData = useCallback(async () => {
    setIsLoading(true)
    const result = await getSubcategoriesWithActivePromotions()
    if (result.success && result.data) {
      setAllSubcategories(result.data)
      setGroupedPromotions(groupPromotionsForDisplay(result.data)) // Актуализираме групираните промоции
    } else {
      toast({
        title: "Грешка при зареждане",
        description: result.error || "Неуспешно зареждане на подкатегории и промоции.",
        variant: "destructive",
      })
      setAllSubcategories([])
      setGroupedPromotions([])
    }
    setIsLoading(false)
  }, [groupPromotionsForDisplay])

  useEffect(() => {
    startTransition(fetchSubcategoriesData)
  }, [fetchSubcategoriesData])

  const handleSubcategoryToggle = (subcategoryId: string) => {
    setSelectedSubcategoryIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId)
      } else {
        newSet.add(subcategoryId)
      }
      return newSet
    })
  }

  const handleApplyPromotion = async () => {
    if (selectedSubcategoryIds.size === 0 || !minQuantityInput || !bonusQuantityInput) {
      toast({
        title: "Внимание",
        description: "Моля, изберете поне една подкатегория и попълнете количествата.",
        variant: "destructive",
      })
      return
    }

    const minQty = Number.parseInt(minQuantityInput, 10)
    const bonusQty = Number.parseInt(bonusQuantityInput, 10)

    if (isNaN(minQty) || isNaN(bonusQty) || minQty <= 0 || bonusQty < 0) {
      toast({
        title: "Невалидни данни",
        description: "Количествата трябва да са положителни числа (купи > 0, безплатно >= 0).",
        variant: "destructive",
      })
      return
    }

    const customerTypeForAction = selectedCustomerType

    startTransition(async () => {
      const result = await applyPromotion(
        Array.from(selectedSubcategoryIds),
        minQty,
        bonusQty,
        customerTypeForAction,
        descriptionInput,
      )
      if (result.success) {
        toast({
          title: "Успех",
          description: `Промоцията е приложена за избраните ${selectedSubcategoryIds.size} подкатегории (Тип клиент: ${getCustomerTypeLabel(
            customerTypeForAction,
          )}).`,
        })
        fetchSubcategoriesData()
        setSelectedSubcategoryIds(new Set())
        setDescriptionInput("")
      } else {
        toast({
          title: "Грешка",
          description: result.error || "Неуспешно прилагане на промоцията.",
          variant: "destructive",
        })
      }
    })
  }

  const handleRemovePromotionForSelected = async () => {
    if (selectedSubcategoryIds.size === 0) {
      toast({
        title: "Внимание",
        description: "Моля, изберете поне една подкатегория.",
        variant: "destructive",
      })
      return
    }
    const customerTypeForAction = selectedCustomerType
    startTransition(async () => {
      const result = await removePromotion(Array.from(selectedSubcategoryIds), customerTypeForAction)
      if (result.success) {
        toast({
          title: "Успех",
          description: `Промоцията (Тип: ${getCustomerTypeLabel(customerTypeForAction)}) е премахната за избраните ${selectedSubcategoryIds.size} подкатегории.`,
        })
        fetchSubcategoriesData()
        setSelectedSubcategoryIds(new Set())
      } else {
        toast({
          title: "Грешка",
          description: result.error || "Неуспешно премахване на промоцията.",
          variant: "destructive",
        })
      }
    })
  }

  // Нова функция за премахване на групирана промоция
  const handleRemoveGroupedPromotion = async (groupedPromo: GroupedPromotionDisplay) => {
    startTransition(async () => {
      let allSuccess = true
      for (const scInfo of groupedPromo.applied_to_subcategories) {
        // Извикваме съществуващата removePromotion за всяка индивидуална подкатегория
        const result = await removePromotion([scInfo.id], groupedPromo.customer_type)
        if (!result.success) {
          allSuccess = false
          toast({
            title: "Грешка при премахване",
            description: `Неуспешно премахване на промоция за подкатегория ${scInfo.title}: ${result.error || "Неизвестна грешка"}`,
            variant: "destructive",
          })
        }
      }

      if (allSuccess) {
        toast({
          title: "Успех",
          description: `Всички свързани промоции са премахнати.`,
        })
        fetchSubcategoriesData() // Презареждаме данните, за да обновим UI
      } else {
        toast({
          title: "Частичен успех/грешка",
          description: "Някои промоции не бяха премахнати успешно. Моля, проверете конзолата за повече информация.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Управление на промоции за подкатегории</CardTitle>
          <CardDescription>
            Изберете подкатегории и дефинирайте промоция: при закупуване на X артикула, Y от тях стават безплатни.
            Промоцията е само за тип клиент "Търговец на дребно".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block">Изберете подкатегории:</Label>
            {isLoading && <p>Зареждане на подкатегории...</p>}
            {!isLoading && allSubcategories.length === 0 && <p>Няма намерени подкатегории.</p>}
            {!isLoading && allSubcategories.length > 0 && (
              <ScrollArea className="h-60 w-full rounded-md border p-4">
                <div className="space-y-2">
                  {allSubcategories.map((sc) => (
                    <div key={sc.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`sc-${sc.id}`}
                        checked={selectedSubcategoryIds.has(sc.id)}
                        onCheckedChange={() => handleSubcategoryToggle(sc.id)}
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor={`sc-${sc.id}`} className="font-normal">
                          {sc.title}
                        </Label>
                        {sc.active_promotions.length > 0 ? (
                          <div className="text-xs text-muted-foreground space-x-1 mt-0.5">
                            Активни:
                            {sc.active_promotions.map((p, index) => (
                              <Badge variant="secondary" key={`${sc.id}-promo-${index}`} className="font-normal">
                                {getCustomerTypeLabel(p.customer_type)}: При {p.min_quantity} бр., {p.bonus_quantity} от
                                тях безплатно
                                {p.description ? ` (${p.description})` : ""}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">Няма активни промоции</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="customer-type">Тип клиент за действие</Label>
              <Select value={selectedCustomerType} onValueChange={setSelectedCustomerType} disabled={true}>
                <SelectTrigger id="customer-type">
                  <SelectValue placeholder="Избери тип клиент" />
                </SelectTrigger>
                <SelectContent>
                  {creatableCustomerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Промоциите могат да се задават само за "Търговец на дребно".
              </p>
            </div>
            <div>
              <Label htmlFor="min-quantity">Общо количество за промоция (X)</Label>
              <Input
                id="min-quantity"
                type="number"
                placeholder="напр. 100"
                value={minQuantityInput}
                onChange={(e) => setMinQuantityInput(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="bonus-quantity">От тях безплатни (Y)</Label>
              <Input
                id="bonus-quantity"
                type="number"
                placeholder="напр. 10"
                value={bonusQuantityInput}
                onChange={(e) => setBonusQuantityInput(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="promotion-description">Описание на промоцията (по желание)</Label>
              <Input
                id="promotion-description"
                type="text"
                placeholder="напр. Специална оферта"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleApplyPromotion} disabled={isPending || selectedSubcategoryIds.size === 0}>
              {isPending ? "Задаване..." : "Задай/Обнови промоция (за избраните)"}
            </Button>
            <Button
              variant="outline"
              onClick={handleRemovePromotionForSelected}
              disabled={isPending || selectedSubcategoryIds.size === 0}
            >
              {isPending ? "Премахване..." : "Премахни промоция (за избраните по тип)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Преглед на ВСИЧКИ активни промоции</CardTitle>
          <CardDescription>
            Този списък показва всички активни промоции, групирани по техните параметри. Логиката е: "При покупка на X
            артикула, Y от тях са безплатни". Можете да премахвате групирани промоции от тук.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Зареждане...</p>}
          {!isLoading && groupedPromotions.length === 0 && <p>Няма активни промоции за показване.</p>}
          {!isLoading && groupedPromotions.length > 0 && (
            <ScrollArea className="h-96 w-full">
              <ul className="space-y-3">
                {groupedPromotions.map((group) => (
                  <li key={group.key} className="p-3 border rounded-md">
                    <h4 className="font-semibold mb-1">
                      <Badge variant="outline" className="mr-2">
                        {getCustomerTypeLabel(group.customer_type)}
                      </Badge>
                      При {group.min_quantity} бр., {group.bonus_quantity} от тях са безплатни
                      {group.description ? ` (${group.description})` : ""}
                    </h4>
                    <div className="text-sm text-muted-foreground mb-2">
                      Прилага се за: {group.applied_to_subcategories.map((sc) => sc.title).join(", ")}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveGroupedPromotion(group)}
                      disabled={isPending}
                    >
                      Премахни тази група промоции
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
