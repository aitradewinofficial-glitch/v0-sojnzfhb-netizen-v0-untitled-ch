import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { SiteFooter } from "@/components/site-footer"
import { getCategories, getSubcategories } from "@/lib/db"

export const metadata: Metadata = {
  title: "Политика за поверителност | Madix Groundbaits",
  description:
    "Политика за поверителност на Madix Groundbaits - как събираме, използваме и защитаваме вашите лични данни.",
}

export default async function PrivacyPage() {
  const categories = await getCategories()
  const subcategories = await getSubcategories()

  return (
    <>
      <SiteHeader categories={categories} subcategories={subcategories} isEnglish={false} />
      <CategoriesNavbar categories={categories} subcategories={subcategories} isEnglish={false} />

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Политика за поверителност</h1>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Общи положения</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Тази политика за поверителност описва как събираме, използваме, съхраняваме и защитаваме личните данни
                  на потребителите на нашия уебсайт. Ние се ангажираме да защитаваме поверителността на вашите лични
                  данни в съответствие с приложимото законодателство.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Събиране на лични данни</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Ние събираме лични данни, които ни предоставяте доброволно при:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Регистрация на потребителски акаунт</li>
                  <li>Извършване на поръчка</li>
                  <li>Абониране за бюлетин</li>
                  <li>Свързване с нас чрез контактни форми</li>
                  <li>Използване на уебсайта (чрез cookies)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Видове събирани данни</h2>
                <p className="text-gray-600 leading-relaxed mb-4">Можем да събираме следните видове лични данни:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Име и фамилия</li>
                  <li>Електронна поща</li>
                  <li>Телефонен номер</li>
                  <li>Адрес за доставка</li>
                  <li>Информация за плащане</li>
                  <li>IP адрес и данни за браузъра</li>
                  <li>Предпочитания и поведение на сайта</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Използване на личните данни</h2>
                <p className="text-gray-600 leading-relaxed mb-4">Използваме събраните лични данни за следните цели:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Обработка и изпълнение на поръчки</li>
                  <li>Предоставяне на клиентска поддръжка</li>
                  <li>Изпращане на информация за продукти и услуги</li>
                  <li>Подобряване на потребителското изживяване</li>
                  <li>Спазване на правни задължения</li>
                  <li>Предотвратяване на измами</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Споделяне на лични данни</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Ние не продав��ме, не отдаваме под наем и не споделяме вашите лични данни с трети страни, освен в
                  следните случаи:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>С ваше изрично съгласие</li>
                  <li>За изпълнение на услуги (куриерски услуги, плащания)</li>
                  <li>При правно задължение</li>
                  <li>За защита на нашите права и интереси</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Съхранение на данни</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Личните данни се съхраняват толкова дълго, колкото е необходимо за постигане на целите, за които са
                  събрани, или според изискванията на приложимото законодателство. След изтичане на този период данните
                  се изтриват или анонимизират.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Сигурност на данните</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Прилагаме подходящи технически и организационни мерки за защита на личните данни срещу неоторизован
                  достъп, промяна, разкриване или унищожаване. Това включва:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>SSL криптиране на данните</li>
                  <li>Сигурни сървъри и бази данни</li>
                  <li>Ограничен достъп до личните данни</li>
                  <li>Редовни актуализации на сигурността</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Cookies</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Нашият уебсайт използва cookies за подобряване на потребителското изживяване. Cookies са малки
                  текстови файлове, които се съхраняват на вашето устройство. Можете да управлявате настройките за
                  cookies чрез вашия браузър.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Вашите права</h2>
                <p className="text-gray-600 leading-relaxed mb-4">Имате следните права относно вашите лични данни:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Право на достъп до данните</li>
                  <li>Право на поправка на неточни данни</li>
                  <li>Право на изтриване на данните</li>
                  <li>Право на ограничаване на обработката</li>
                  <li>Право на преносимост на данните</li>
                  <li>Право на възражение срещу обработката</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Промени в политиката</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Запазваме си правото да актуализираме тази политика за поверителност. Всички промени ще бъдат
                  публикувани на тази страница с посочване на датата на последната актуализация.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Контакти</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  За въпроси относно тази политика за поверителност или упражняване на вашите права можете да се
                  свържете с нас.
                </p>
              </section>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">Последна актуализация: {new Date().toLocaleDateString("bg-BG")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter categories={categories} isEnglish={false} />
    </>
  )
}
