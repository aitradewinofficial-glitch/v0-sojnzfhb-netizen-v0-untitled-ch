"use client"

import useSWR from "swr"
import { Lock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { fetcher } from "@/components/madix-ai/types"

type Doc = {
  id: number
  area_name: string
  title: string
  doc_type: string
  content: string
  version: string | null
  updated_at: string
}

export function DocumentsTab() {
  const { data } = useSWR<{ documents: Doc[] }>("/api/madix-ai/admin/documents", fetcher)
  const documents = data?.documents ?? []

  // Group by area
  const grouped = documents.reduce<Record<string, Doc[]>>((acc, d) => {
    ;(acc[d.area_name] ??= []).push(d)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center gap-3 bg-muted/20 p-4 text-sm text-muted-foreground">
        <span>
          Това са демонстрационни документи в базата. В реалната система на тяхно място стои локалният connector, който
          чете от общата папка на фирмата и подава само разрешеното.
        </span>
      </Card>

      {Object.entries(grouped).map(([area, docs]) => {
        const confidential = area.includes("Поверително")
        return (
          <Card key={area} className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold">{area}</h3>
              {confidential && (
                <Badge variant="destructive" className="gap-1">
                  <Lock className="h-3 w-3" />
                  поверително
                </Badge>
              )}
              <Badge variant="secondary">{docs.length}</Badge>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {docs.map((d) => (
                <AccordionItem key={d.id} value={String(d.id)}>
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2 text-left">
                      {d.title}
                      <Badge variant="outline" className="font-normal">
                        {d.doc_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{d.version}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {d.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        )
      })}
    </div>
  )
}
