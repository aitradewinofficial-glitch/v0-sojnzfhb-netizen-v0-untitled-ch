export type Area = {
  id: number
  code: string
  name: string
  description: string | null
  confidential: boolean
}

export type Role = {
  id: number
  name: string
  description: string | null
}

export type MadixUser = {
  id: number
  name: string
  email: string
  username: string | null
  password: string | null
  role_id: number | null
  role_name: string | null
  active: boolean
}

export type ChatSource = {
  title: string
  area: string
  version: string | null
  docType: string
}

export const fetcher = (url: string) => fetch(url).then((r) => r.json())
