import { NextResponse } from "next/server"
import { ECONT_CONFIG, fetchEcontOffices } from "@/lib/econt-api"
import type { EcontOffice } from "@/lib/econt-api"

// Hardcoded production credentials
const ECONT_USERNAME = "bobikab04@gmail.com"
const ECONT_PASSWORD = "Bobi04077812@"

const officesCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

function getCachedOffices(cityId: string) {
  const cacheKey = `offices_${cityId}`
  const cached = officesCache.get(cacheKey)

  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_DURATION) {
    officesCache.delete(cacheKey)
    return null
  }

  return cached.data
}

function setCachedOffices(cityId: string, data: any) {
  const cacheKey = `offices_${cityId}`
  officesCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get("cityId")

    if (!cityId) {
      return NextResponse.json(
        {
          success: false,
          error: "City ID is required",
        },
        { status: 400 },
      )
    }

    console.log(`🏢 API: Starting offices fetch for city: ${cityId}`)

    const cachedData = getCachedOffices(cityId)
    if (cachedData) {
      console.log("✅ API: Returning cached offices data")
      return NextResponse.json(cachedData)
    }

    const offices = await fetchEcontOffices(cityId)
    console.log(`✅ API: Successfully fetched ${offices.length} offices`)

    setCachedOffices(cityId, offices)

    return NextResponse.json(offices)
  } catch (error: any) {
    console.error("❌ API: Error in /api/econt/offices route:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch offices",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  console.log("🏢 Starting Econt Offices API call...")

  try {
    const body = await request.json().catch(() => ({}))
    const { cityId } = body

    if (!cityId) {
      return NextResponse.json({ error: "City ID is required" }, { status: 400 })
    }

    console.log(`🏢 Fetching offices for city ID: ${cityId}`)

    const cachedData = getCachedOffices(cityId)
    if (cachedData) {
      console.log("✅ API: Returning cached offices data")
      return NextResponse.json(cachedData)
    }

    // Try multiple endpoints in order of preference
    const endpoints = [
      {
        name: "Legacy XML Service",
        url: ECONT_CONFIG.PRODUCTION.LEGACY_XML,
        method: "legacy",
      },
      {
        name: "Production SOAP",
        url: ECONT_CONFIG.PRODUCTION.SOAP_ENDPOINT,
        method: "soap",
      },
      {
        name: "Demo SOAP",
        url: ECONT_CONFIG.DEMO.SOAP_ENDPOINT,
        method: "soap",
      },
    ]

    let lastError = null

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying ${endpoint.name}: ${endpoint.url}`)

        let response: Response
        let requestBody: string

        if (endpoint.method === "legacy") {
          // Legacy XML format
          requestBody = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <client>
    <username>${escapeXml(ECONT_USERNAME)}</username>
    <password>${escapeXml(ECONT_PASSWORD)}</password>
  </client>
  <request_type>offices</request_type>
  <offices>
    <city_id>${escapeXml(cityId)}</city_id>
  </offices>
</request>`

          response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
              Accept: "text/xml, application/xml, text/plain",
              "User-Agent": "Mozilla/5.0 (compatible; EcontAPI/1.0)",
              "Cache-Control": "no-cache",
            },
            body: `xml=${encodeURIComponent(requestBody)}`,
          })
        } else {
          // SOAP format
          requestBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetOffices xmlns="http://tempuri.org/">
      <username>${ECONT_USERNAME}</username>
      <password>${ECONT_PASSWORD}</password>
      <cityId>${cityId}</cityId>
    </GetOffices>
  </soap:Body>
</soap:Envelope>`

          response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "text/xml; charset=utf-8",
              SOAPAction: "http://tempuri.org/GetOffices",
              "User-Agent": "Mozilla/5.0 (compatible; EcontAPI/1.0)",
            },
            body: requestBody,
          })
        }

        console.log(`📡 Response status: ${response.status}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const responseText = await response.text()
        console.log(`📄 Response length: ${responseText.length} characters`)
        console.log(`📄 Response preview: ${responseText.substring(0, 500)}...`)

        // Check if response is HTML/JavaScript (error page)
        if (responseText.includes("<html") || responseText.includes("<script") || responseText.includes("<!DOCTYPE")) {
          console.log(`❌ ${endpoint.name} returned HTML instead of XML`)
          throw new Error("Received HTML response instead of XML")
        }

        // Parse XML response
        const allOffices = parseEcontOfficesResponse(responseText)

        if (allOffices && allOffices.length > 0) {
          console.log(`✅ ${endpoint.name} SUCCESS! Found ${allOffices.length} Bulgarian offices (after country filter during parsing)`)
          
          // Filter offices by the requested cityId
          const offices = allOffices.filter((office) => {
            // Match by cityId if available
            if (office.cityId && office.cityId === cityId) return true
            return false
          })

          console.log(`✅ After filtering by cityId ${cityId}: ${offices.length} offices`)

          // If cityId filtering returned nothing, return all Bulgarian offices
          // The client will do additional city name filtering
          const result = offices.length > 0 ? offices : allOffices
          setCachedOffices(cityId, result)
          return NextResponse.json(result)
        } else {
          console.log(`⚠️ ${endpoint.name} returned empty offices list`)
          throw new Error("No offices found in response")
        }
      } catch (error: any) {
        console.log(`❌ ${endpoint.name} failed:`, error.message)
        lastError = error
        continue
      }
    }

    // If all endpoints failed
    console.log("🚨 All endpoints failed!")
    return NextResponse.json(
      {
        error: "All endpoints failed or returned invalid responses",
        details: lastError?.message || "Unknown error",
        endpoints: endpoints.map((e) => e.name),
      },
      { status: 500 },
    )
  } catch (error: any) {
    console.error("🚨 Critical error in /api/econt/offices route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function parseEcontOfficesResponse(xmlText: string): EcontOffice[] {
  try {
    console.log("🔍 Parsing XML response for offices...")

    const offices: EcontOffice[] = []

    // Method 1: Look for <e> elements (Econt legacy format)
    let officeMatches = xmlText.match(/<e[^>]*>[\s\S]*?<\/e>/g)
    if (!officeMatches) {
      // Method 2: Look for <office> elements
      officeMatches = xmlText.match(/<office[^>]*>[\s\S]*?<\/office>/g)
    }
    if (!officeMatches) {
      // Method 3: Look for <Office> elements (SOAP format)
      officeMatches = xmlText.match(/<Office[^>]*>[\s\S]*?<\/Office>/g)
    }

    if (officeMatches) {
      console.log(`🏢 Found ${officeMatches.length} office elements`)

      officeMatches.forEach((officeXml, index) => {
        try {
          const id = extractXmlValue(officeXml, "id") || extractXmlValue(officeXml, "ID") || String(index)
          const name = extractXmlValue(officeXml, "name") || extractXmlValue(officeXml, "Name") || ""
          const nameEn = extractXmlValue(officeXml, "name_en") || extractXmlValue(officeXml, "NameEn")
          const address = extractXmlValue(officeXml, "address") || extractXmlValue(officeXml, "Address") || ""
          const phone = extractXmlValue(officeXml, "phone") || extractXmlValue(officeXml, "Phone") || ""
          const workBegin =
            extractXmlValue(officeXml, "work_begin") || extractXmlValue(officeXml, "WorkBegin") || "09:00"
          const workEnd = extractXmlValue(officeXml, "work_end") || extractXmlValue(officeXml, "WorkEnd") || "18:00"
          const workBeginSaturday =
            extractXmlValue(officeXml, "work_begin_saturday") || extractXmlValue(officeXml, "WorkBeginSaturday")
          const workEndSaturday =
            extractXmlValue(officeXml, "work_end_saturday") || extractXmlValue(officeXml, "WorkEndSaturday")
          const isMachine =
            extractXmlValue(officeXml, "is_machine") === "1" || extractXmlValue(officeXml, "IsMachine") === "true"

          // Location data
          const latitude = extractXmlValue(officeXml, "latitude") || extractXmlValue(officeXml, "Latitude")
          const longitude = extractXmlValue(officeXml, "longitude") || extractXmlValue(officeXml, "Longitude")

          // City data - extract city_id, city_name, and country_code from the XML
          const officeCityId = extractXmlValue(officeXml, "id_city") || extractXmlValue(officeXml, "city_id") || extractXmlValue(officeXml, "CityId") || extractXmlValue(officeXml, "cityId")
          const officeCityName = extractXmlValue(officeXml, "city_name") || extractXmlValue(officeXml, "CityName") || extractXmlValue(officeXml, "cityName")
          const countryCode = extractXmlValue(officeXml, "country_code") || extractXmlValue(officeXml, "CountryCode")

          if (id && name) {
            // Skip non-Bulgarian offices
            if (countryCode && countryCode !== "BGR") {
              return
            }

            const office: EcontOffice & { countryCode?: string } = {
              id: String(id),
              name: String(name),
              nameEn: nameEn ? String(nameEn) : undefined,
              address: String(address),
              phone: String(phone),
              workBegin: String(workBegin),
              workEnd: String(workEnd),
              workBeginSaturday: workBeginSaturday ? String(workBeginSaturday) : undefined,
              workEndSaturday: workEndSaturday ? String(workEndSaturday) : undefined,
              isMachine: Boolean(isMachine),
              cityId: officeCityId ? String(officeCityId) : undefined,
              cityName: officeCityName ? String(officeCityName) : undefined,
            }

            if (latitude && longitude) {
              office.location = {
                latitude: Number.parseFloat(latitude),
                longitude: Number.parseFloat(longitude),
              }
            }

            offices.push(office)
          }
        } catch (err) {
          console.warn(`⚠️ Failed to parse office ${index}:`, err)
        }
      })
    }

    console.log(`🎉 Successfully parsed ${offices.length} Bulgarian offices`)
    // Log sample office IDs for debugging
    if (offices.length > 0) {
      console.log(`📋 Sample office cityIds: ${offices.slice(0, 5).map(o => o.cityId).join(', ')}`)
      console.log(`📋 Sample office names: ${offices.slice(0, 3).map(o => o.name).join(', ')}`)
    }
    return offices
  } catch (error: any) {
    console.error("❌ Error parsing offices XML:", error)
    return []
  }
}

function extractXmlValue(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, "i")
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}
