"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  Check,
  Loader2,
  Plus,
  Minus,
  MapIcon,
  List,
  ChevronLeft,
  RefreshCw,
  Edit,
  User,
  Phone,
  X,
} from "lucide-react"
import type { EcontCity, EcontOffice } from "@/lib/econt-api"
import type { User as UserTypeFromAuth } from "@/lib/auth"

interface UserType extends UserTypeFromAuth {
  isEuropean?: boolean
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

const RADIUS_OPTIONS = [2, 5, 10, 20, 50]

// Haversine formula to calculate distance between two lat/lon points in kilometers
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Helper function to format office working hours with localization
const getOfficeWorkingTime = (office: EcontOffice, isEnglish: boolean): string => {
  const weekdays = `${office.workBegin} - ${office.workEnd}`
  const saturdayLabel = isEnglish ? "Saturday" : "Събота"
  const restDayLabel = isEnglish ? "Rest day" : "Почивен ден"
  const weekdaysLabel = isEnglish ? "Weekdays" : "Делнични дни"

  const saturday =
    office.workBeginSaturday && office.workEndSaturday
      ? `${saturdayLabel}: ${office.workBeginSaturday} - ${office.workEndSaturday}`
      : `${saturdayLabel}: ${restDayLabel}`
  return `${weekdaysLabel}: ${weekdays}. ${saturday}.`
}

// Helper function to get category title based on language
const getCityTitle = (city: EcontCity, isEnglish: boolean) => {
  if (isEnglish) {
    return city.nameEn || city.name || "No name"
  }
  return city.name || city.nameEn || "Без име"
}

// Helper function to get office title based on language
const getOfficeTitle = (office: EcontOffice, isEnglish: boolean) => {
  if (isEnglish) {
    return office.nameEn || office.name || "No name"
  }
  return office.name || office.nameEn || "Без име"
}

const translations = {
  en: {
    title: "Delivery Options",
    office: "Office",
    address: "Address",
    searchPlaceholder: "Search for office or address...",
  },
  bg: {
    title: "Опции за доставка",
    office: "Офис",
    address: "Адрес",
    searchPlaceholder: "Търсене на офис или адрес...",
  },
}

interface EcontDeliverySelectorProps {
  onOfficeSelect: (office: EcontOffice | null) => void
  selectedOffice: EcontOffice | null
  isEnglish?: boolean
  customerNameProp?: string
  customerPhoneProp?: string
  onCustomerDataChange?: (name: string, phone: string) => void
  currentUser?: UserType | null
  isLoadingUser?: boolean
  language?: "en" | "bg"
  onAddressChange?: (address: string) => void
  addressData?: string
}

export default function EcontDeliverySelector({
  language = "bg",
  onOfficeSelect,
  onAddressChange,
  selectedOffice,
  addressData,
  isEnglish = false,
  customerNameProp = "",
  customerPhoneProp = "",
  onCustomerDataChange,
  currentUser,
  isLoadingUser,
}: EcontDeliverySelectorProps) {
  const { toast } = useToast()

  // States
  const [openCitySelect, setOpenCitySelect] = useState(false)
  const [selectedCity, setSelectedCity] = useState<EcontCity | null>(null)
  const [cities, setCities] = useState<EcontCity[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [citySearchInput, setCitySearchInput] = useState("")
  const [debouncedCitySearch, setDebouncedCitySearch] = useState("")
  const [cityError, setCityError] = useState<string | null>(null)

  const [offices, setOffices] = useState<EcontOffice[]>([])
  const [loadingOffices, setLoadingOffices] = useState(false)
  const [officeError, setOfficeError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedRadius, setSelectedRadius] = useState<number>(RADIUS_OPTIONS[0])
  const [officeStreetAddress, setOfficeStreetAddress] = useState("")
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  const [officeSuggestions, setOfficeSuggestions] = useState<
    Array<{ id: string; displayText: string; office: EcontOffice }>
  >([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [loadingAddressSuggestions, setLoadingAddressSuggestions] = useState(false)
  const [myLocationInput, setMyLocationInput] = useState("")
  const [currentAddressDisplay, setCurrentAddressDisplay] = useState<string | null>(null)
  const [officeTypeFilter, setOfficeTypeFilter] = useState<"OFFICE" | "AUTOMAT" | null>(null)

  const [showOfficeDetails, setShowOfficeDetails] = useState(false)
  const [distanceToSelectedOffice, setDistanceToSelectedOffice] = useState<number | null>(null)
  const [showMap, setShowMap] = useState(true)
  const [cityCenterCoords, setCityCenterCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showSearchForm, setShowSearchForm] = useState(true)
  const [showSyncButton, setShowSyncButton] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)

  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [editingName, setEditingName] = useState("")
  const [editingPhone, setEditingPhone] = useState("")

  const [previousFormState, setPreviousFormState] = useState<{
    selectedCity: EcontCity | null
    officeStreetAddress: string
    userLocation: { latitude: number; longitude: number } | null
    myLocationInput: string
    selectedRadius: number
    officeTypeFilter: "OFFICE" | "AUTOMAT" | null
  } | null>(null)

  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)

  const [hasUserEditedAddress, setHasUserEditedAddress] = useState(false)

  const [filteredOffices, setFilteredOffices] = useState<EcontOffice[]>([])

  const [isLocationBasedSearch, setIsLocationBasedSearch] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [_cities, _setCities] = useState<EcontCity[]>([])
  // const [activeTab, setActiveTab] = useState("office")

  const [showOfficeModal, setShowOfficeModal] = useState(false)
  const [selectedOfficeDetails, setSelectedOfficeDetails] = useState<any>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [isCustomerDetailsConfirmed, setIsCustomerDetailsConfirmed] = useState(false)

  const cityMarker = useRef(null)

  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const googleMap = useRef<any>(null)
  const officeMarkers = useRef<any[]>([])
  const userLocationMarker = useRef<any>(null)
  const infoWindow = useRef<any>(null)
  const officesRef = useRef<EcontOffice[]>([])
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Close suggestions dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowAddressSuggestions(false)
      }
    }

    if (showAddressSuggestions) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showAddressSuggestions])

  // Translations
  const t = {
    searchOffices: isEnglish ? "Search Offices" : "Търси офиси",
    selectCity: isEnglish ? "Select City" : "Населено място",
    radius: isEnglish ? "Radius" : "Радиус",
    myLocation: isEnglish ? "My Location" : "Моето местопоожение",
    search: isEnglish ? "Search" : "Търси",
    courierOffice: isEnglish ? "Courier Office" : "Куриерски офис",
    econtMachine: isEnglish ? "Econt Machine" : "Еконтомат",
    map: isEnglish ? "Map" : "Карта",
    list: isEnglish ? "List" : "Списък",
    back: isEnglish ? "Back" : "Назад",
    address: isEnglish ? "Address" : "Адрес",
    workingHours: isEnglish ? "Working Hours" : "Работно време",
    contact: isEnglish ? "Contact" : "Контакт",
    noOfficesFound: isEnglish ? "No offices found" : "Няма намерени офиси",
    loading: isEnglish ? "Loading..." : "Зареждане...",
    selectCityFirst: isEnglish ? "Please select a city first" : "Моля, изберете град първо",
    enterStreet: isEnglish ? "Please enter a street address" : "Моля, въведете улица",
    addressNotFound: isEnglish ? "Address not found" : "Адресът не е намерен",
    locationFound: isEnglish ? "Location found" : "Местоположение намерено",
    sync: isEnglish ? "Sync Now" : "Синхронизирай сега",
    syncing: isEnglish ? "Syncing..." : "Синхронизиране...",
    streetAddress: isEnglish ? "Street address" : "Улица адрес",
    searchForAddress: isEnglish
      ? "Search for an address to find nearby offices."
      : "Търсете адрес, за да намерите близки офиси.",
    useSearchToFindNearbyOffices: isEnglish
      ? "Use the search form to find offices near a specific address."
      : "Използвайте формата за търсене, за да намерите офиси близо до конкретен адрес. ",
  }

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDjuMW-6OeII4jEw0UWh5-W4E8NfKMFwng&libraries=maps`
      script.async = true
      script.defer = true
      script.onload = () => {
        console.log("Google Maps API loaded")
        setGoogleMapsLoaded(true)
      }
      document.head.appendChild(script)
    } else {
      setGoogleMapsLoaded(true)
    }
  }, [])

  const fetchOffices = async (
    cityId: string,
    typeFilter?: string,
    userLat?: number,
    userLon?: number,
    radius?: number,
  ): Promise<EcontOffice[]> => {
    setLoadingOffices(true)
    setOfficeError(null)

    try {
      console.log("[v0] fetchOffices called with cityId:", cityId)
      const response = await fetch("/api/econt/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityId: cityId }),
      })
      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] API error:", errorData)
        setOfficeError(errorData.error || "Failed to fetch offices")
        return []
      }
      const data: EcontOffice[] = await response.json()
      console.log("[v0] Raw API data count:", data.length)

      // Filter out any mock or invalid data
      let filteredOffices = data.filter((office) => {
        // Only include offices with valid location data and complete information
        return (
          office.location &&
          office.location.latitude &&
          office.location.longitude &&
          office.address &&
          office.name &&
          office.phone &&
          // Remove any mock addresses or test data
          !office.address.toLowerCase().includes("mock") &&
          !office.address.toLowerCase().includes("test") &&
          !office.name.toLowerCase().includes("mock") &&
          !office.name.toLowerCase().includes("test") &&
          // Ensure coordinates are valid numbers
          !isNaN(office.location.latitude) &&
          !isNaN(office.location.longitude) &&
          office.location.latitude !== 0 &&
          office.location.longitude !== 0
        )
      })
      console.log("[v0] After filtering invalid data:", filteredOffices.length)

      // Filter offices by the selected city - this is critical because the Econt API
      // may return ALL offices globally instead of just the requested city's offices
      if (selectedCity) {
        const cityNameLower = selectedCity.name.toLowerCase()
        const cityNameEnLower = (selectedCity.nameEn || "").toLowerCase()
        
        const cityFilteredOffices = filteredOffices.filter((office) => {
          // Match by cityId if available
          if (office.cityId && office.cityId === cityId) return true
          // Match by city name in the office name or address
          const officeName = office.name.toLowerCase()
          const officeAddress = office.address.toLowerCase()
          const officeCityName = (office.cityName || "").toLowerCase()
          
          if (officeCityName && (officeCityName === cityNameLower || officeCityName === cityNameEnLower)) return true
          if (officeName.includes(cityNameLower) || officeAddress.includes(cityNameLower)) return true
          if (cityNameEnLower && (officeName.includes(cityNameEnLower) || officeAddress.includes(cityNameEnLower))) return true
          return false
        })
        
        console.log("[v0] After city filtering:", cityFilteredOffices.length, "for city:", selectedCity.name)
        
        // Only apply city filter if it found results (avoid filtering out everything)
        if (cityFilteredOffices.length > 0) {
          filteredOffices = cityFilteredOffices
        } else {
          console.log("[v0] City filter found 0 offices, keeping all and using geographic bounds")
          // If name matching fails, try geographic proximity - offices within ~30km of city center
          // We'll use geocoding result from the map to filter, but as fallback just keep all
        }
      }

      // Apply filtering based on the 'isMachine' field
      if (typeFilter === "OFFICE") {
        filteredOffices = filteredOffices.filter((office) => office.isMachine === false)
      } else if (typeFilter === "AUTOMAT") {
        filteredOffices = filteredOffices.filter((office) => office.isMachine === true)
      }
      console.log("[v0] After type filtering:", filteredOffices.length)

      // Apply user location and radius filtering after server response
      if (userLat && userLon && radius !== undefined) {
        filteredOffices = filteredOffices.filter((office) => {
          if (office.location && office.location.latitude && office.location.longitude) {
            const distance = haversineDistance(userLat, userLon, office.location.latitude, office.location.longitude)
            return distance <= radius
          }
          return false
        })
        console.log("[v0] After radius filtering:", filteredOffices.length)
      }

      console.log("[v0] Final filtered offices:", filteredOffices.length)
      setOffices(filteredOffices)
      setFilteredOffices(filteredOffices)
      return filteredOffices
    } catch (error: any) {
      console.log("[v0] fetchOffices error:", error)
      setOfficeError(`Error loading offices: ${error.message}`)
      return []
    } finally {
      setLoadingOffices(false)
    }
  }

  const fetchOfficeSuggestions = (query: string) => {
    // Don't show suggestions if we're in the middle of selecting one
    if (isSelectingSuggestion || isAutoFilling) {
      return
    }

    if (!selectedCity) {
      setAddressSuggestions([])
      setOfficeSuggestions([])
      setShowAddressSuggestions(false)
      return
    }

    const cityOffices = filteredOffices.filter(
      (office) =>
        office.cityId === selectedCity.id || office.address.toLowerCase().includes(selectedCity.name.toLowerCase()),
    )

    // Filter by the user's query text, but fall back to all city offices if no matches
    const queryLower = query.toLowerCase().trim()
    let matchingOffices = cityOffices
    if (queryLower) {
      const filtered = cityOffices.filter((office) => office.address.toLowerCase().includes(queryLower))
      // Only use filtered results if there are matches, otherwise show all
      if (filtered.length > 0) {
        matchingOffices = filtered
      }
    }

    const suggestions = matchingOffices.map((office) => {
      return {
        id: office.id,
        displayText: office.address,
        office: office,
      }
    })

    setOfficeSuggestions(suggestions)
    setAddressSuggestions(suggestions.map((s) => s.displayText))
    setShowAddressSuggestions(suggestions.length > 0)
  }

  useEffect(() => {
    if (isSelectingSuggestion || isAutoFilling) {
      return
    }

    const timeoutId = setTimeout(() => {
      if (officeStreetAddress) {
        fetchOfficeSuggestions(officeStreetAddress)
      } else {
        setAddressSuggestions([])
        setOfficeSuggestions([])
        setShowAddressSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [officeStreetAddress, filteredOffices])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedCitySearch(citySearchInput)
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [citySearchInput])

  const filteredCities = useMemo(() => {
    if (!debouncedCitySearch.trim()) return cities

    const searchTerm = debouncedCitySearch.toLowerCase()
    return cities.filter((city) => {
      const cityName = city.name.toLowerCase()
      const cityNameEn = city.nameEn?.toLowerCase() || ""
      return cityName.includes(searchTerm) || cityNameEn.includes(searchTerm)
    })
  }, [cities, debouncedCitySearch])

  const fetchCities = async () => {
    setLoadingCities(true)
    setCityError(null)

    try {
      const response = await fetch("/api/econt/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: "BGR" }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        setCityError(errorData.error || "Failed to fetch cities")
        return
      }
      const data: EcontCity[] = await response.json()

      // Filter out any mock cities
      const validCities = data.filter((city) => {
        return city.name && city.id && !city.name.includes("Mock") && !city.name.includes("Test")
      })

      setCities(validCities)
      if (validCities.length === 0) setCityError("No cities available.")
      else setShowSyncButton(false)
    } catch (error: any) {
      setCityError(`Error loading cities: ${error.message}`)
      setShowSyncButton(true)
    } finally {
      setLoadingCities(false)
    }
  }

  useEffect(() => {
    if (!mapRef.current || !showMap || mapInitialized || !googleMapsLoaded) return

    console.log("Initializing Google Maps...")

    try {
      // Clear any existing content
      if (mapRef.current) {
        mapRef.current.innerHTML = ""
      }

      // Initialize Google Map
      googleMap.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 42.7, lng: 25.0 }, // Center on Bulgaria
        zoom: 7,
        maxZoom: 18,
        minZoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      setMapInitialized(true)
      console.log("Google Maps initialized successfully")
    } catch (error) {
      console.error("Error initializing Google Maps:", error)
    }

    return () => {
      // Cleanup markers
      officeMarkers.current.forEach((marker) => {
        if (marker.setMap) marker.setMap(null)
      })
      officeMarkers.current = []

      if (userLocationMarker.current && userLocationMarker.current.setMap) {
        userLocationMarker.current.setMap(null)
        userLocationMarker.current = null
      }

      if (cityMarker.current && cityMarker.current.setMap) {
        cityMarker.current.setMap(null)
        cityMarker.current = null
      }

      googleMap.current = null
      setMapInitialized(false)
    }
  }, [showMap, googleMapsLoaded])

  useEffect(() => {
    if (!googleMap.current) return

    // Clear existing city marker
    if (cityMarker.current) {
      cityMarker.current.setMap(null)
      cityMarker.current = null
    }

    // Priority 1: Selected office (highest priority)
    if (selectedOffice && selectedOffice.location) {
      const position = {
        lat: selectedOffice.location.latitude,
        lng: selectedOffice.location.longitude,
      }
      googleMap.current.panTo(position)
      googleMap.current.setZoom(16)
      console.log("[v0] Centering on selected office:", selectedOffice.name)
      return // Exit early to prevent other centering logic
    }

    // Priority 2: Selected city (use geocoding to get coordinates)
    // Always center on the selected city - the markers effect will handle fitBounds after offices load
    if (selectedCity) {
      const cityName = getCityTitle(selectedCity, isEnglish)
      console.log("[v0] City centering effect: city:", cityName, "offices count:", offices.length)

      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode(
        {
          address: `${cityName}, Bulgaria`,
          region: "BG",
        },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            const cityPosition = results[0].geometry.location
            console.log("[v0] Geocoding successful for:", cityName, cityPosition.toJSON())
            
            // Store city center coordinates for filtering offices by distance
            setCityCenterCoords({ lat: cityPosition.lat(), lng: cityPosition.lng() })

            // Always center the map on the selected city immediately
            // This ensures the map moves to the correct city when selected
            if (googleMap.current) {
              googleMap.current.panTo(cityPosition)
              googleMap.current.setZoom(13)
              console.log("[v0] Map centered on city via geocoding:", cityName)
            }

            // Always add the city marker regardless
            if (googleMap.current) {
              cityMarker.current = new window.google.maps.Marker({
                position: cityPosition,
                map: googleMap.current,
                title: cityName,
                icon: {
                  url:
                    "data:image/svg+xml;charset=UTF-8," +
                    encodeURIComponent(`
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
                      </svg>
                    `),
                  scaledSize: new window.google.maps.Size(24, 24),
                  anchor: new window.google.maps.Point(12, 12),
                },
              })
            }
          } else {
            console.error("[v0] Geocoding failed for city:", cityName, status)
            // Fallback to Bulgaria center if geocoding fails
            googleMap.current?.panTo({ lat: 42.7, lng: 25.0 })
            googleMap.current?.setZoom(7)
          }
        },
      )
      return // Exit early to prevent default centering
    }

    // Priority 3: No selection - center on Bulgaria
    if (!selectedCity && offices.length === 0) {
      googleMap.current.panTo({ lat: 42.7, lng: 25.0 })
      googleMap.current.setZoom(7)
      console.log("[v0] No city selected, centering on Bulgaria")
    }
  }, [selectedOffice, selectedCity, isEnglish])

  useEffect(() => {
    if (googleMap.current && showMap && mapInitialized && window.google) {
      console.log("[v0] Markers effect: offices count:", offices.length, "selectedOffice:", selectedOffice?.name || "none")

      // Clear existing office markers only (NOT city marker - that's managed by the other effect)
      officeMarkers.current.forEach((marker) => {
        if (marker.setMap) marker.setMap(null)
      })
      officeMarkers.current = []

      if (infoWindow.current) {
        infoWindow.current.close()
      }

      // Place office markers
      if (offices.length > 0) {
        offices.forEach((office, index) => {
          if (office.location && office.location.latitude && office.location.longitude) {
            const position = {
              lat: office.location.latitude,
              lng: office.location.longitude,
            }

            const marker = new window.google.maps.Marker({
              position: position,
              map: googleMap.current,
              title: office.name,
              icon: {
                url: "/images/econt-marker.png",
                scaledSize: new window.google.maps.Size(
                  selectedOffice?.id === office.id ? 40 : 32,
                  selectedOffice?.id === office.id ? 40 : 32,
                ),
              },
            })

            // Add click listener
            marker.addListener("click", () => {
              console.log("Clicked office:", office.name, office.id)

              onOfficeSelect(office)
              setSelectedOfficeDetails(office)
              setShowOfficeModal(true)

              // Center map on selected office
              googleMap.current.panTo(position)
              googleMap.current.setZoom(16)

              setCurrentAddressDisplay(office.address)
              console.log("Office selected successfully, showing details")
            })

            officeMarkers.current.push(marker)
            console.log(`Added office marker ${index + 1}:`, office.name, office.id)
          }
        })

        // Fit map bounds to show all office markers if no specific office is selected
        // But only include offices within 30km of the city center to avoid zooming out too far
        if (!selectedOffice && officeMarkers.current.length > 0) {
          const bounds = new window.google.maps.LatLngBounds()
          let includedOfficesCount = 0
          
          offices.forEach((office) => {
            if (office.location && office.location.latitude && office.location.longitude) {
              // If we have city center coords, only include offices within 30km
              if (cityCenterCoords) {
                const distance = haversineDistance(
                  cityCenterCoords.lat, 
                  cityCenterCoords.lng, 
                  office.location.latitude, 
                  office.location.longitude
                )
                if (distance <= 30) {
                  bounds.extend({ lat: office.location.latitude, lng: office.location.longitude })
                  includedOfficesCount++
                }
              } else {
                bounds.extend({ lat: office.location.latitude, lng: office.location.longitude })
                includedOfficesCount++
              }
            }
          })
          
          // Only fitBounds if we have offices to show, otherwise the city centering handles it
          if (includedOfficesCount > 0) {
            googleMap.current.fitBounds(bounds)
            // Limit zoom levels after fitting bounds - don't zoom too far out or too close
            const listener = window.google.maps.event.addListener(googleMap.current, "idle", () => {
              if (googleMap.current) {
                const currentZoom = googleMap.current.getZoom()
                // Don't zoom out too far (prevents showing all offices globally)
                if (currentZoom < 10 && selectedCity) {
                  googleMap.current.setZoom(12)
                }
                if (currentZoom > 16) {
                  googleMap.current.setZoom(16)
                }
              }
              window.google.maps.event.removeListener(listener)
            })
            console.log("[v0] Fitted map bounds to", includedOfficesCount, "nearby office markers (within 30km)")
          } else {
            console.log("[v0] No nearby offices found, keeping city-centered view")
          }
        }
      }
    }
  }, [offices, selectedOffice, showOfficeDetails, showMap, mapInitialized, cityCenterCoords])

  // Fetch cities on mount
  useEffect(() => {
    fetchCities()
  }, [])

  // Fetch offices when city changes
  useEffect(() => {
    if (selectedCity && !showOfficeDetails && !isLocationBasedSearch) {
      fetchOffices(
        selectedCity?.id || "",
        officeTypeFilter,
        userLocation?.latitude,
        userLocation?.longitude,
        selectedRadius,
      )
        .then((data) => {
          setOffices(data)
          if (data.length === 0) {
            setOfficeError(`No offices available for this city.`)
          }
        })
        .catch((error) => {
          setOfficeError(`Error loading offices: ${error.message}`)
        })
    } else if (!selectedCity && !showOfficeDetails) {
      setOffices([])
      onOfficeSelect(null)
      setOfficeError(null)
    }
  }, [selectedCity, officeTypeFilter, userLocation, selectedRadius, showOfficeDetails, isLocationBasedSearch])

  // useEffect(() => {
  //   if (offices.length > 0) {
  //     setShowSearchForm(false)
  //   }
  // }, [offices.length])

  // useEffect(() => {
  //   if (selectedCity && !hasUserEditedAddress && (!officeStreetAddress || officeStreetAddress.trim() === "")) {
  //     setIsAutoFilling(true)
  //     setOfficeStreetAddress("Centre")
  //   }
  // }, [selectedCity])

  // Keep offices ref in sync with offices state
  useEffect(() => {
    officesRef.current = offices
  }, [offices])

  const handleMyLocationClick = async () => {
    if (navigator.geolocation) {
      if (loadingCities) {
        toast({
          title: "Loading cities",
          description: "Please wait while we load the cities list.",
          duration: 3000,
        })
        return
      }

      if (cities.length === 0) {
        toast({
          title: "No cities available",
          description: "Could not load cities list. Please try again later.",
          variant: "destructive",
          duration: 5000,
        })
        return
      }

      setIsLocationBasedSearch(true)

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ latitude, longitude })
          setMyLocationInput(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`)

          setCurrentAddressDisplay(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`)

          if (googleMap.current && mapInitialized && window.google) {
            const position = { lat: latitude, lng: longitude }
            googleMap.current.panTo(position)
            googleMap.current.setZoom(12)

            // Remove existing user location marker
            if (userLocationMarker.current && userLocationMarker.current.setMap) {
              userLocationMarker.current.setMap(null)
            }

            // Create user location marker (blue dot)
            userLocationMarker.current = new window.google.maps.Marker({
              position: position,
              map: googleMap.current,
              title: "Your Location",
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
            })
          }

          setTimeout(async () => {
            try {
              // Use a real reverse geocoding service instead of mock data
              const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                  headers: {
                    "User-Agent": "EcontDeliveryApp/1.0",
                  },
                },
              )

              if (!geoResponse.ok) {
                throw new Error("Geocoding service unavailable")
              }

              const geoData = await geoResponse.json()

              if (geoData && geoData.address) {
                const address = geoData.address
                const street = address.road || address.pedestrian || address.path || ""
                const houseNumber = address.house_number || ""
                const city = address.city || address.town || address.village || address.municipality || ""
                const postcode = address.postcode || ""
                const country = address.country || "България"

                // Construct full address
                let fullAddress = ""
                if (street) {
                  fullAddress += street
                  if (houseNumber) {
                    fullAddress += ` ${houseNumber}`
                  }
                }
                if (city) {
                  if (fullAddress) fullAddress += ", "
                  fullAddress += city
                }
                if (postcode) {
                  fullAddress += ` ${postcode}`
                }
                if (country) {
                  fullAddress += `, ${country}`
                }

                setCurrentAddressDisplay(fullAddress || `${city}, ${country}`)

                // Try to find matching city in Econt cities list
                const foundCity = cities.find(
                  (econtCity) =>
                    econtCity.name.toLowerCase() === city.toLowerCase() ||
                    (econtCity.nameEn && econtCity.nameEn.toLowerCase() === city.toLowerCase()),
                )

                if (foundCity) {
                  console.log("[v0] Found city for location:", foundCity.name)
                  setSelectedCity(foundCity)
                  try {
                    console.log("[v0] Fetching offices for location-based search with params:", {
                      cityId: foundCity.id,
                      typeFilter: officeTypeFilter,
                      latitude,
                      longitude,
                      radius: selectedRadius,
                    })
                    await fetchOffices(foundCity.id, officeTypeFilter, latitude, longitude, selectedRadius)
                    console.log("[v0] Location-based office fetch completed")
                  } catch (error) {
                    console.error("[v0] Error fetching offices:", error)
                  }
                  toast({
                    title: t.locationFound,
                    description: `Location found and city selected: ${foundCity.name}.`,
                    duration: 2000,
                  })
                } else {
                  console.log("[v0] City not found in Econt list:", city)
                  // If city not found in Econt list, still show the address
                  toast({
                    title: t.locationFound,
                    description:
                      "Location found, but city not available for Econt delivery. Please select a nearby city manually.",
                    duration: 2000,
                  })
                }
              }
            } catch (geoError) {
              console.error("Error during reverse geocoding:", geoError)
            } finally {
              setIsLocationBasedSearch(false)
            }
          }, 0)
        },
        (error) => {
          console.error("Geolocation error:", error)
          setMyLocationInput("")
          setIsLocationBasedSearch(false)
          let errorMessage = "Failed to get location."
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please allow location access in browser settings."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable."
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out."
              break
          }
          toast({
            title: "Geolocation error",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 3000,
          maximumAge: 120000,
        },
      )
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleZoomIn = () => {
    if (googleMap.current) {
      const currentZoom = googleMap.current.getZoom()
      googleMap.current.setZoom(currentZoom + 1)
    }
  }

  const handleZoomOut = () => {
    if (googleMap.current) {
      const currentZoom = googleMap.current.getZoom()
      googleMap.current.setZoom(currentZoom - 1)
    }
  }

  const handleEditAddress = () => {
    setPreviousFormState({
      selectedCity,
      officeStreetAddress,
      userLocation,
      myLocationInput,
      selectedRadius,
      officeTypeFilter,
    })

    if (previousFormState) {
      setSelectedCity(previousFormState.selectedCity)
      setOfficeStreetAddress(previousFormState.officeStreetAddress)
      setUserLocation(previousFormState.userLocation)
      setMyLocationInput(previousFormState.myLocationInput)
      setSelectedRadius(previousFormState.selectedRadius)
      setOfficeTypeFilter(previousFormState.officeTypeFilter)
    }

    setCurrentAddressDisplay(null)
    onOfficeSelect(null)
    setShowOfficeDetails(false)
    setOffices([])
    setShowSearchForm(true)
  }

  useEffect(() => {
    if (isAutoFilling) {
      return
    }

    const timeoutId = setTimeout(() => {
      if (officeStreetAddress && selectedCity) {
        fetchOfficeSuggestions(officeStreetAddress)
      } else {
        setAddressSuggestions([])
        setOfficeSuggestions([])
        setShowAddressSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [officeStreetAddress, filteredOffices, selectedCity])

  return (
    <div className="space-y-4">
      {showSyncButton && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex items-center justify-between">
          <p className="text-sm">Econt data may not be up to date. Please sync.</p>
          <Button
            onClick={async () => {
              setIsSyncing(true)
              await fetchCities()
              setIsSyncing(false)
            }}
            disabled={isSyncing}
            className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isSyncing ? t.syncing : t.sync}
          </Button>
        </div>
      )}

      {showSearchForm ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Popover open={openCitySelect} onOpenChange={setOpenCitySelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-white/80 backdrop-blur-sm border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 font-medium h-12 px-4"
                    disabled={loadingCities}
                  >
                    {loadingCities ? t.loading : selectedCity ? getCityTitle(selectedCity, isEnglish) : t.selectCity}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
  className="w-[--radix-popover-trigger-width] p-0 border-0 shadow-xl rounded-xl bg-white"
  side="bottom"
  avoidCollisions={false}
>
                  <Command className="rounded-xl">
                    <CommandInput
                      placeholder="Search city..."
                      value={citySearchInput}
                      onValueChange={setCitySearchInput}
                      className="border-0 focus:ring-0 h-12 px-4 text-gray-700"
                    />
                    <CommandList>
                      {loadingCities ? (
                        <CommandEmpty className="py-6 text-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" /> {t.loading}
                        </CommandEmpty>
                      ) : cityError ? (
                        <CommandEmpty className="py-6 text-center text-red-500">
                          <div>{cityError}</div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 bg-transparent rounded-lg"
                            onClick={fetchCities}
                          >
                            Try again
                          </Button>
                        </CommandEmpty>
                      ) : cities.length === 0 ? (
                        <CommandEmpty className="py-6 text-center">No cities available.</CommandEmpty>
                      ) : (
                        <>
                          <CommandEmpty>No cities found.</CommandEmpty>
                          <CommandGroup>
                            {filteredCities.map((city) => (
                              <CommandItem
                                key={city.id}
                                value={city.name}
                                onSelect={() => {
                                  // Clear existing offices, markers, and city center when selecting a new city
                                  setOffices([])
                                  setFilteredOffices([])
                                  onOfficeSelect(null)
                                  setCityCenterCoords(null) // Clear so fitBounds won't run until new coords are set
                                  setSelectedCity(city)
                                  setOpenCitySelect(false)
                                  setCitySearchInput("")
                                }}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-lg mx-2 my-1"
                              >
                                <Check
                                  className={cn(
                                    "mr-3 h-4 w-4 text-blue-500",
                                    selectedCity?.id === city.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <span className="text-gray-700 font-medium">{getCityTitle(city, isEnglish)}</span>
                                <span className="text-gray-500 ml-2">({city.postCode})</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="relative" ref={suggestionsRef}>
              <Input
                placeholder="Търсене на офис по име или адрес"
                className="bg-white/80 backdrop-blur-sm border-0 rounded-xl shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200 h-12 px-4 text-gray-700 font-medium placeholder:text-gray-500"
                value={officeStreetAddress}
                onChange={(e) => {
                  setOfficeStreetAddress(e.target.value)
                  setHasUserEditedAddress(true)
                  setIsSelectingSuggestion(false)
                  setIsAutoFilling(false)
                }}
                onFocus={() => {
                  if (addressSuggestions.length > 0) {
                    setShowAddressSuggestions(true)
                  }
                }}
                onBlur={() => {
                  // Click-outside is handled by the suggestionsRef useEffect
                }}
              />
              {showAddressSuggestions && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-md border-0 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {addressSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 hover:bg-gray-50/80 cursor-pointer text-sm border-b border-gray-100/50 last:border-b-0 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl text-gray-700"
                      onClick={() => {
                        // Get the selected office data FIRST before clearing anything
                        const selectedOfficeSuggestion = officeSuggestions[index]
                        
                        // Hide suggestions immediately and clear the arrays to prevent any re-showing
                        setShowAddressSuggestions(false)
                        setAddressSuggestions([])
                        setOfficeSuggestions([])
                        setIsSelectingSuggestion(true)

                        if (selectedOfficeSuggestion) {
                          const office = selectedOfficeSuggestion.office
                          setOfficeStreetAddress(selectedOfficeSuggestion.displayText)
                          onOfficeSelect(office)
                          setShowOfficeDetails(true)

                          // Calculate distance if user location is available
                          if (userLocation && office.location) {
                            const distance = haversineDistance(
                              userLocation.latitude,
                              userLocation.longitude,
                              office.location.latitude,
                              office.location.longitude,
                            )
                            setDistanceToSelectedOffice(distance)
                          }
                        }
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {!showSearchForm && currentAddressDisplay && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    {isEnglish ? "Your Location" : "Вашето местоположение"}
                  </h3>
                  <p className="text-blue-800 text-sm">{currentAddressDisplay}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditAddress}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100 bg-transparent"
                >
                  {isEnglish ? "Edit" : "Редактирай"}
                </Button>
              </div>
            </div>
          )}

          {showMap && !showSearchForm && showOfficeDetails && selectedOffice && (
            <div className="absolute top-[60%] left-4 right-4 -translate-y-1/2 bg-white p-6 rounded-lg shadow-2xl z-50 max-w-md border-2 border-gray-300">
              <div className="flex items-center mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800 p-1 -ml-2"
                  onClick={() => {
                    console.log("Closing office details")
                    onOfficeSelect(null)
                    setShowOfficeDetails(false)
                    setDistanceToSelectedOffice(null)
                  }}
                >
                  <ChevronLeft className="h-5 w-5 mr-1" /> {t.back}
                </Button>
              </div>

              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{getOfficeTitle(selectedOffice, isEnglish)}</h2>
                {distanceToSelectedOffice !== null && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    {distanceToSelectedOffice.toFixed(2)} km
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm text-gray-700 mb-6">
                <div>
                  <span className="font-semibold">{t.address}:</span>
                  <p className="mt-1">{selectedOffice.address}</p>
                </div>

                <div>
                  <span className="font-semibold">{t.workingHours}:</span>
                  <p className="mt-1">{getOfficeWorkingTime(selectedOffice, isEnglish)}</p>
                </div>

                {selectedOffice.phone && (
                  <div>
                    <span className="font-semibold">{t.contact}:</span>
                    <p className="mt-1">{selectedOffice.phone}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                {isLoadingUser ? (
                  <div className="flex items-center justify-center p-4 space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-gray-600 text-sm">
                      {isEnglish ? "Loading data..." : "Зареждане на данни..."}
                    </span>
                  </div>
                ) : currentUser && !isEditingCustomer ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">
                        {isEnglish ? "Contact Details" : "Данни за контакт"}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingCustomer(true)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-3 w-3" />
                        {isEnglish ? "Edit" : "Промени"}
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium text-gray-600 mr-2">{isEnglish ? "Name:" : "��ме:"}</span>
                        {customerNameProp || (isEnglish ? "No data" : "Няма данни")}
                      </p>
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium text-gray-600 mr-2">{isEnglish ? "Phone:" : "Телефон:"}</span>
                        {customerPhoneProp || (isEnglish ? "No data" : "Няма данни")}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 pt-2">
                      {isEnglish
                        ? "Data is from your profile. You can change it for this order."
                        : "Данните са от вашия профил. Можете да ги промените за тази поръчка."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {isEnglish ? "Please fill in your details" : "Моля, попълни данните си"}
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isEnglish ? "Name / Company" : "Име / Фирма"}
                      </label>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder={isEnglish ? "Your name or company name" : "Вашето име или име на фирма"}
                        className="bg-gray-50/80 backdrop-blur-sm border-0 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 h-11 px-4 text-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isEnglish ? "Phone" : "Телефон"}
                      </label>
                      <Input
                        value={editingPhone}
                        onChange={(e) => setEditingPhone(e.target.value)}
                        placeholder="08XXXXXXX"
                        className="bg-gray-50/80 backdrop-blur-sm border-0 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 h-11 px-4 text-gray-700"
                      />
                    </div>

                    {isEditingCustomer && (
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingCustomer(false)
                            setEditingName(customerNameProp)
                            setEditingPhone(customerPhoneProp)
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {isEnglish ? "Cancel" : "Отказ"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (onCustomerDataChange) {
                              onCustomerDataChange(editingName, editingPhone)
                            }
                            setIsEditingCustomer(false)
                          }}
                          className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {isEnglish ? "Save" : "Запази"}
                        </Button>
                      </div>
                    )}

                    {!isEditingCustomer && !currentUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (onCustomerDataChange) {
                            onCustomerDataChange(editingName, editingPhone)
                          }
                        }}
                        className="w-full mt-4 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {isEnglish ? "Confirm Details" : "Потвърди данните"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {!showMap && (
            <div className="space-y-4">
              {/* Confirm Order Button */}
              <Button
                onClick={() => {
                  if (selectedOffice && onOfficeSelect) {
                    onOfficeSelect(selectedOffice)
                  }
                }}
                disabled={!selectedOffice || !isCustomerDetailsConfirmed}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 mr-2" />
                {isEnglish ? "Confirm Order" : "Потвърди поръчка"}
              </Button>

              <div className="absolute inset-0 bg-white p-4 rounded-xl overflow-y-auto z-20">
                <div className="flex items-center mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800 p-1 -ml-2"
                    onClick={() => {
                      setShowSearchForm(true)
                      setCurrentAddressDisplay(null)
                      onOfficeSelect(null)
                      setShowOfficeDetails(false)
                      setOffices([])
                      setShowMap(true)
                    }}
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" /> {t.back}
                  </Button>
                  <h2 className="text-xl font-semibold ml-2">Econt Offices ({t.list})</h2>
                </div>

                {loadingOffices ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : officeError ? (
                  <div className="text-red-500 text-center py-4">{officeError}</div>
                ) : !userLocation ? (
                  <div className="text-gray-500 text-center py-8">
                    <p className="mb-2">{t.searchForAddress}</p>
                    <p className="text-sm">{t.useSearchToFindNearbyOffices}</p>
                  </div>
                ) : offices.length > 0 ? (
                  <ul className="space-y-3">
                    {offices.map((office) => (
                      <li
                        key={office.id}
                        className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          onOfficeSelect(office)
                          setShowOfficeDetails(true)
                          setShowMap(true)
                          if (userLocation && office.location) {
                            const distance = haversineDistance(
                              userLocation.latitude,
                              userLocation.longitude,
                              office.location.latitude,
                              office.location.longitude,
                            )
                            setDistanceToSelectedOffice(distance)
                          } else {
                            setDistanceToSelectedOffice(null)
                          }
                          setCurrentAddressDisplay(office.address)
                        }}
                      >
                        <p className="font-semibold">{getOfficeTitle(office, isEnglish)}</p>
                        <p className="text-sm text-gray-600">{office.address}</p>
                        <p className="text-xs text-gray-500">{getOfficeWorkingTime(office, isEnglish)}</p>
                        {userLocation && office.location && (
                          <p className="text-xs text-gray-500">
                            {haversineDistance(
                              userLocation.latitude,
                              userLocation.longitude,
                              office.location.latitude,
                              office.location.longitude,
                            ).toFixed(2)}{" "}
                            km
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 text-center py-4">{t.noOfficesFound}</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showOfficeModal && selectedOfficeDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={() => setShowOfficeModal(false)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Назад
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Office Name and Distance */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {getOfficeTitle(selectedOfficeDetails, isEnglish)}
                </h2>
                {userLocation && selectedOfficeDetails.location && (
                  <p className="text-sm text-gray-600">
                    {haversineDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      selectedOfficeDetails.location.latitude,
                      selectedOfficeDetails.location.longitude,
                    ).toFixed(2)}{" "}
                    km
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Адрес:</h3>
                <p className="text-gray-700">{selectedOfficeDetails.address}</p>
              </div>

              {/* Working Hours */}
              {selectedOfficeDetails.workingTime && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Работно време:</h3>
                  <p className="text-gray-700">{getOfficeWorkingTime(selectedOfficeDetails, isEnglish)}</p>
                </div>
              )}

              {/* Contact */}
              {selectedOfficeDetails.phone && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Контакт:</h3>
                  <p className="text-gray-700">{selectedOfficeDetails.phone}</p>
                </div>
              )}

              {/* Customer Details Form */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Моля, попълни данните си</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Име / Фирма</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Вашето име или име на фирма"
                      className="w-full px-4 py-3 bg-gray-50/80 backdrop-blur-sm border-0 rounded-xl shadow-sm focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-gray-700 placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="08XXXXXXX"
                      className="w-full px-4 py-3 bg-gray-50/80 backdrop-blur-sm border-0 rounded-xl shadow-sm focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-gray-700 placeholder:text-gray-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      console.log("Customer details:", {
                        name: customerName,
                        phone: customerPhone,
                        office: selectedOfficeDetails,
                      })

                      // Update customer data if callback provided
                      if (onCustomerDataChange) {
                        onCustomerDataChange(customerName, customerPhone)
                      }

                      // Set customer details as confirmed to enable order button
                      setIsCustomerDetailsConfirmed(true)

                      // Close modal
                      setShowOfficeModal(false)

                      // Show success message
                      toast({
                        title: "Данните са потвърдени",
                        description: "Сега можете да потвърдите поръчката си.",
                      })
                    }}
                    disabled={!customerName.trim() || !customerPhone.trim()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Потвърди данните
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative h-[500px] bg-gray-100 rounded-xl overflow-hidden">
        {/* Map/List Toggle */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full shadow-lg flex p-1">
          <Button
            variant="ghost"
            className={cn(
              "rounded-full px-4 py-2 flex items-center gap-2",
              showMap ? "bg-[#0071e3] text-white hover:bg-[#0077ed]" : "text-gray-700 hover:bg-gray-100",
            )}
            onClick={() => setShowMap(true)}
          >
            <MapIcon className="w-5 h-5" />
            {t.map}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "rounded-full px-4 py-2 flex items-center gap-2",
              !showMap ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100",
            )}
            onClick={() => setShowMap(false)}
          >
            <List className="w-5 h-5" />
            {t.list}
          </Button>
        </div>

        {/* Zoom Controls */}
        {showMap && (
          <div className="absolute bottom-4 right-4 z-10 flex flex-col bg-white rounded-md shadow-lg">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none rounded-t-md" onClick={handleZoomIn}>
              <Plus className="h-5 w-5" />
            </Button>
            <div className="h-px w-full bg-gray-200" />
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none rounded-b-md" onClick={handleZoomOut}>
              <Minus className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* OpenLayers Map Container */}
        {showMap ? (
          <div
            ref={mapRef}
            className="w-full h-full"
            style={{
              background: "#f0f0f0",
              position: "relative",
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export { EcontDeliverySelector }
