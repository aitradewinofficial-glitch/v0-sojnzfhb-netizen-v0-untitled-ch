import { MailIcon, PhoneIcon, ClockIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { SiteFooter } from "@/components/site-footer"
import { getCategories, getSubcategories } from "@/lib/data"

export default async function ContactPage() {
  // Зареждаме категориите и подкатегориите за навигацията
  const categories = await getCategories()
  const subcategories = await getSubcategories()

  return (
    <>
      {/* Навигация */}
      <SiteHeader categories={categories} subcategories={subcategories} isLoggedIn={false} />
      <CategoriesNavbar categories={categories} subcategories={subcategories} currentCategoryId={undefined} isEnglish={false} />

      {/* Съдържание започва директно под навбара */}
      <div className="min-h-screen bg-gray-50 text-gray-800 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-900">Свържете се с нас</h1>
            <p className="text-lg text-gray-600 text-center mb-10 md:mb-12">
              Имате въпроси или се нуждаете от помощ? Не се колебайте да се свържете с нас. Нашият екип е на
              разположение, за да ви съдейства.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-1 md:max-w-md md:mx-auto gap-8 mb-12">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                    <ClockIcon className="h-6 w-6 mr-3 text-red-600" />
                    Работно време
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-medium text-gray-800">Работно време:</span> 08:00 - 17:00
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Почивни дни:</span> събота и неделя
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 text-center">Директен контакт</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <a href="tel:+359894352204" aria-label="Обадете се на +359 894 352204" className="inline-block">
                    <div className="bg-red-100 p-3 rounded-full mb-2 hover:bg-red-200 transition-colors">
                      <PhoneIcon className="h-7 w-7 text-red-600" />
                    </div>
                  </a>
                  <h3 className="font-medium text-gray-900 mb-1">Телефон</h3>
                  <a href="tel:+359894352204" className="text-red-600 hover:text-red-700 transition-colors">
                    +359 894 352204
                  </a>
                </div>
                <div className="flex flex-col items-center">
                  <a
                    href="mailto:info@madiks.bg"
                    aria-label="Изпратете имейл на info@madiks.bg"
                    className="inline-block"
                  >
                    <div className="bg-red-100 p-3 rounded-full mb-2 hover:bg-red-200 transition-colors">
                      <MailIcon className="h-7 w-7 text-red-600" />
                    </div>
                  </a>
                  <h3 className="font-medium text-gray-900 mb-1">Имейл</h3>
                  <a href="mailto:info@madiks.bg" className="text-red-600 hover:text-red-700 transition-colors">
                    info@madiks.bg
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <SiteFooter categories={categories} isEnglish={false} />
    </>
  )
}
