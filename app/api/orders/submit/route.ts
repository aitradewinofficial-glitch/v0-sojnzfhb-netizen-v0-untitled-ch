import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import {
  sql,
  getProductById,
  getCategoryById,
  getSubcategoryById,
  dbInitialized,
  getActiveQuantityPromotionForSubcategory,
  getCustomerByEmail,
  getCustomerByPhone,
} from "@/lib/db"
import { sendEmail } from "@/lib/email"
import type { Product } from "@/lib/types"

interface CartItem {
  id: string
  quantity: number
  title?: string
  price?: number
  photourl?: string
  isEuropeanPrice?: boolean
  subcateid?: string | null
  freeItems?: number
  promo_buy_qty?: number | null
  promo_free_qty?: number | null
}

interface EcontOfficeInfo {
  id?: string
  name: string
  address: string
  phone: string
  workBegin?: string
  workEnd?: string
}

interface OrderSubmissionBody {
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerCity?: string
  deliveryAddress?: string
  items: CartItem[]
  totalAmount: number
  originalTotalPrice?: number
  additionalInfo?: string
  deliveryOption?: "home" | "econt"
  econtOffice?: EcontOfficeInfo
  isEuropeanCustomer?: boolean
  discountPercent?: number
  discountAmount?: number
}

export async function POST(req: NextRequest) {
  try {
    console.log("📦 Starting order submission process...")

    if (!dbInitialized) {
      console.error("❌ Database not initialized.")
      return NextResponse.json(
        { error: "Вътрешна грешка на сървъра. Моля, опитайте отново по-късно.", details: "Database not initialized" },
        { status: 500 },
      )
    }

    const body: OrderSubmissionBody = await req.json()
    console.log("📋 Received order data:", {
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      deliveryOption: body.deliveryOption,
      econtOffice: body.econtOffice ? `${body.econtOffice.name} - ${body.econtOffice.address}` : null,
      itemsCount: body.items?.length || 0,
      totalAmount: body.totalAmount,
      originalTotalPrice: body.originalTotalPrice,
    })

    const {
      items: cartItemsFromClient,
      customerName,
      customerPhone,
      customerEmail: initialCustomerEmail,
      customerCity,
      deliveryAddress,
      totalAmount,
      originalTotalPrice,
      deliveryOption,
      econtOffice,
      additionalInfo: baseAdditionalInfo,
      isEuropeanCustomer = false,
      discountPercent = 0,
      discountAmount = 0,
    } = body

    // Validation
    if (
      !customerName ||
      !customerPhone ||
      !cartItemsFromClient ||
      cartItemsFromClient.length === 0 ||
      typeof totalAmount !== "number" ||
      typeof originalTotalPrice !== "number"
    ) {
      console.error("❌ Missing required fields")
      return NextResponse.json(
        { error: "Липсват задължителни полета (име, телефон, артикули, оригинална или обща сума)" },
        { status: 400 },
      )
    }

    // Build the address field with Econt information
    let finalAddressInfo = baseAdditionalInfo || ""

    if (deliveryOption === "econt" && econtOffice) {
      console.log("🏢 Adding Econt office information to address...")
      const econtInfo = `Доставка до Еконт офис:
Офис: ${econtOffice.name}
Адрес: ${econtOffice.address}
Телефон: ${econtOffice.phone}`

      if (finalAddressInfo.trim()) {
        finalAddressInfo = `${finalAddressInfo}\n\n${econtInfo}`
      } else {
        finalAddressInfo = econtInfo
      }
    } else if (deliveryOption === "home") {
      console.log("🏠 Setting home delivery option...")
      const homeDeliveryInfo = "Доставка до дома"
      const cityInfo = customerCity?.trim() ? `Населено място: ${customerCity.trim()}` : ""
      const addressParts = [homeDeliveryInfo, cityInfo, finalAddressInfo.trim()].filter(Boolean)
      finalAddressInfo = addressParts.join("\n\n")
    }

    console.log("📍 Final address info:", finalAddressInfo)

    // Customer lookup logic
    let finalCustomerEmailForOrder = initialCustomerEmail
    let customerType: string | null = "regular"

    if (initialCustomerEmail) {
      const customer = await getCustomerByEmail(initialCustomerEmail)
      if (customer) {
        customerType = customer.type || "regular"
        finalCustomerEmailForOrder = customer.objectid
        console.log(`👤 Customer found by email. Type: ${customerType}`)
      }
    } else if (customerPhone) {
      const customerByPhone = await getCustomerByPhone(customerPhone)
      if (customerByPhone && customerByPhone.objectid) {
        finalCustomerEmailForOrder = customerByPhone.objectid
        customerType = customerByPhone.type || "regular"
        console.log(`👤 Customer found by phone. Type: ${customerType}`)
      }
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${uuidv4().substr(0, 8)}`
    console.log(`🆔 Generated order ID: ${orderId}`)

    // Calculate discount factor
    let discountFactor = 1
    if (originalTotalPrice > 0 && totalAmount < originalTotalPrice) {
      discountFactor = totalAmount / originalTotalPrice
    }

    // Process cart items
    console.log("🛒 Processing cart items...")
    const processedCartItemsForDb = await Promise.all(
      cartItemsFromClient.map(async (clientItem: CartItem) => {
        const product: Product | null = await getProductById(clientItem.id)
        const quantity = Number(clientItem.quantity) || 1

        let baseItemPrice: number
        if (typeof clientItem.price === "number" && clientItem.price >= 0) {
          baseItemPrice = clientItem.price
        } else {
          baseItemPrice = Number.parseFloat(product?.price || "0")
          if (clientItem.isEuropeanPrice && product?.europe_price) {
            baseItemPrice = Number.parseFloat(product.europe_price)
          } else if (customerType === "wholesaler" && product?.wholesalerprice) {
            baseItemPrice = Number.parseFloat(product.wholesalerprice)
          } else if (customerType === "retail" && product?.retailerprice) {
            baseItemPrice = Number.parseFloat(product.retailerprice)
          }
        }

        const finalPricePaidPerUnit = baseItemPrice * discountFactor
        let itemFreeCount: number = clientItem.freeItems || 0

        // Check for promotions
        const itemSubcategoryId = clientItem.subcateid || product?.subcateid
        if (itemSubcategoryId) {
          const promotion = await getActiveQuantityPromotionForSubcategory(itemSubcategoryId, customerType)
          if (
            promotion &&
            promotion.buy_quantity > 0 &&
            typeof promotion.bonus_quantity === "number" &&
            promotion.bonus_quantity >= 0
          ) {
            if (quantity >= promotion.buy_quantity) {
              itemFreeCount = Math.floor(quantity / promotion.buy_quantity) * promotion.bonus_quantity
            }
          }
        }

        // Build category path
        let categoryPath = product?.title || clientItem.title || "Продукт без име"
        let categoryName = null
        let subcategoryName = null
        if (product?.cateid) {
          const category = await getCategoryById(product.cateid)
          if (category) {
            categoryName = category.title
            categoryPath = category.title
            if (product.subcateid) {
              const subcategory = await getSubcategoryById(product.subcateid)
              if (subcategory) {
                subcategoryName = subcategory.title
                categoryPath = `${category.title} > ${subcategory.title}`
              }
            }
          }
        }

        return {
          id: product?.objectid || clientItem.id,
          productId: product?.objectid || clientItem.id,
          name: product?.title || clientItem.title || "Неизвестен продукт",
          title: product?.title || clientItem.title || "Неизвестен продукт",
          quantity: quantity,
          price_paid: Number(finalPricePaidPerUnit.toFixed(2)),
          original_item_price: Number(baseItemPrice.toFixed(2)),
          photourl: product?.photourl || clientItem.photourl,
          categoryPath: categoryPath,
          categoryName: categoryName,
          subcategoryName: subcategoryName,
          freeCount: itemFreeCount,
          isEuropeanPrice: clientItem.isEuropeanPrice || (customerType === "european" && !!product?.europe_price),
          promo_buy_qty: clientItem.promo_buy_qty,
          promo_free_qty: clientItem.promo_free_qty,
        }
      }),
    )

    const totalFreeItemsInOrder = processedCartItemsForDb.reduce((acc, item) => acc + (item.freeCount || 0), 0)
    const serverCalculatedFinalTotal = processedCartItemsForDb.reduce(
      (sum, item) => sum + item.price_paid * item.quantity,
      0,
    )

    // Validate totals
    if (Math.abs(serverCalculatedFinalTotal - totalAmount) > 0.01 * cartItemsFromClient.length) {
      console.warn(`⚠️ Price discrepancy: Client ${totalAmount}, Server ${serverCalculatedFinalTotal.toFixed(2)}`)
    }

    const customerIdentifierForDb = finalCustomerEmailForOrder || customerPhone
    const itemsJsonForDb = JSON.stringify(processedCartItemsForDb)

    console.log("💾 Inserting order into database...")

    // Insert order into database - using only existing columns
    const result = await sql`
      INSERT INTO simple_orders (
        order_id, customer_name, customer_phone, 
        customer_email,
        delivery_address, 
        total_amount, 
        items, free_items_count, status, created_at
      ) VALUES (
        ${orderId}, 
        ${customerName},
        ${customerPhone},
        ${customerIdentifierForDb},
        ${finalAddressInfo},
        ${Number(totalAmount).toFixed(2)}, 
        ${itemsJsonForDb}::jsonb,
        ${totalFreeItemsInOrder},
        'new', NOW()
      )
      RETURNING id;
    `

    if (!result || result.length === 0 || !result[0].id) {
      throw new Error("Неуспешно създаване на поръчка в базата данни")
    }

    console.log(`✅ Order created successfully. DB ID: ${result[0].id}, Order ID: ${orderId}`)

    // Send email notification
    try {
      console.log("📧 Sending email notification...")
      const emailResult = await sendEmail({
        to: "info@madiks.bg",
        subject: `Нова поръчка #${orderId}`,
        text: `Нова поръчка #${orderId}\n\nКлиент: ${customerName}\nТелефон: ${customerPhone}\nАдрес: ${finalAddressInfo}\nОбща сума: ${totalAmount.toFixed(2)} лв.\n\nПоръчани продукти:\n${processedCartItemsForDb.map((item) => `- ${item.name} x${item.quantity} = ${item.price_paid.toFixed(2)} лв.`).join("\n")}`,
        html: `Нова поръчка #${orderId}<br><br>Клиент: ${customerName}<br>Телефон: ${customerPhone}<br>Адрес: ${finalAddressInfo}<br>Обща сума: ${totalAmount.toFixed(2)} лв.<br><br>Поръчани продукти:<br>${processedCartItemsForDb.map((item) => `- ${item.name} x${item.quantity} = ${item.price_paid.toFixed(2)} лв.`).join("<br>")}`,
      })

      if (emailResult.success) {
        console.log("✅ Email notification sent successfully")
      } else {
        console.error("❌ Failed to send email notification:", emailResult.error)
      }
    } catch (emailError) {
      console.error("❌ Email notification error:", emailError)
      // Don't fail the order if email fails
    }

    console.log("🎉 Order submission completed successfully!")

    return NextResponse.json({
      success: true,
      orderId: orderId,
      orderDbId: result[0].id,
      message: "Поръчката беше създадена успешно!",
      finalTotalAmountSaved: Number(totalAmount.toFixed(2)),
    })
  } catch (error: any) {
    console.error("🚨 Critical error in order submission:", error)
    let errorMessage = "Възникна грешка при създаването на поръчката."
    if (error.message && error.code && error.severity) {
      errorMessage += ` Детайли: ${error.message} (Код: ${error.code}, Ниво: ${error.severity})`
    } else if (error.message) {
      errorMessage += ` Детайли: ${error.message}`
    }
    return NextResponse.json({ error: errorMessage, details: error.stack }, { status: 500 })
  }
}
