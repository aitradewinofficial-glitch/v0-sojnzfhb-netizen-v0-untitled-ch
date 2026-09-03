import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"
import {
  getCategories,
  getSubcategories,
  getOrdersByCustomer,
  getCustomerByPhone,
  getFishermenCountByPhone,
} from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { CustomerDashboard, type Order } from "@/components/customer-dashboard"

export const dynamic = "force-dynamic"

export default async function AccountDashboardPage() {
  const user = await getUser()

  if (!user || (!user.phone && !user.email)) {
    redirect("/account")
  }

  const categories = await getCategories()
  const allSubcategories = await getSubcategories()

  let orders: Order[] = []
  const identifierForOrders = user.phone || user.email

  if (identifierForOrders) {
    console.log(`AccountDashboardPage: Fetching orders with identifier: ${identifierForOrders}`)
    const ordersData = await getOrdersByCustomer(identifierForOrders)
    orders = ordersData.map((order: any) => ({
      objectid: order.objectid,
      orderid: order.orderid,
      status: order.status,
      createdat: order.createdat,
      bill: order.bill,
      items: order.items,
    }))
    console.log(`AccountDashboardPage: Fetched ${orders.length} orders.`)
  } else {
    console.error("AccountDashboardPage: No identifier (phone or email) found for user. This should not happen.")
  }

  let enrichedUser = { ...user }
  if (user.phone && (!user.isCustomer || !user.customerType)) {
    console.log(`AccountDashboardPage: User identified by phone ${user.phone}, attempting to enrich user data.`)
    const customerDetails = await getCustomerByPhone(user.phone)
    if (customerDetails) {
      console.log(`AccountDashboardPage: Found customer details for phone ${user.phone}:`, customerDetails)
      enrichedUser = {
        ...enrichedUser,
        email: enrichedUser.email || customerDetails.objectid,
        isCustomer: true,
        customerType: customerDetails.type || enrichedUser.customerType,
        discountPercent: customerDetails.discountpercent || enrichedUser.discountPercent,
        storeName: customerDetails.storename || enrichedUser.storeName,
        companyName: customerDetails.companyname || enrichedUser.companyName,
      }
    } else {
      console.log(`AccountDashboardPage: No additional customer details found for phone ${user.phone}.`)
    }
  }

  let fishermenCount = 0
  if (user.phone) {
    fishermenCount = await getFishermenCountByPhone(user.phone)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {" "}
      {/* Промяна на фона и текста */}
      <SiteHeader categories={categories} subcategories={allSubcategories} />
      <CustomerDashboard user={enrichedUser} orders={orders} fishermenCount={fishermenCount} />
    </div>
  )
}
