"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, KeyRound, FileText, ScrollText } from "lucide-react"
import { UsersTab } from "@/components/madix-ai/users-tab"
import { RolesTab } from "@/components/madix-ai/roles-tab"
import { DocumentsTab } from "@/components/madix-ai/documents-tab"
import { AuditTab } from "@/components/madix-ai/audit-tab"

export function AdminClient() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Администрация</h1>
        <p className="text-sm text-muted-foreground">
          Управление на потребители, роли и достъп, преглед на документите и одит на заявките.
        </p>
      </div>

      <Tabs defaultValue="users" className="flex flex-1 flex-col">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Потребители</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">Роли и достъп</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Документи</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">Одит лог</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RolesTab />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
