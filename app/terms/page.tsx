import { SiteHeader } from "@/components/site-header"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { SiteFooter } from "@/components/site-footer"
import { getCategories, getSubcategories } from "@/lib/data"

export default async function TermsPage() {
  const [categories, subcategories] = await Promise.all([getCategories(), getSubcategories()])

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader categories={categories} subcategories={subcategories} isEnglish={false} />
      <CategoriesNavbar categories={categories} subcategories={subcategories} isEnglish={false} />

      <main className="container mx-auto px-4">
        <div className="py-6 md:py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Общи условия</h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Общи положения</h2>
              <p className="text-gray-700 mb-4">
                Настоящите общи условия регулират отношенията между МАДИКС ЕООД и клиентите при покупка на стоки от
                онлайн магазина. Използването на уебсайта означава пълно съгласие с тези условия.
              </p>
              <p className="text-gray-700 mb-4">
                МАДИКС ЕООД си запазва правото да променя тези условия по всяко време без предварително уведомяване.
                Промените влизат в сила от момента на публикуването им на уебсайта.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Поръчки и плащания</h2>
              <p className="text-gray-700 mb-4">
                Поръчките се приемат онлайн чрез уебсайта или по телефон. Всяка поръчка се счита за валидна след
                потвърждение от наша страна.
              </p>
              <p className="text-gray-700 mb-4">Плащането може да се извърши по следните начини:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Наложен платеж при доставка</li>
                <li>Банков превод</li>
                <li>Плащане в офиса</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Доставка</h2>
              <p className="text-gray-700 mb-4">
                Доставката се извършва до посочения от клиента адрес в рамките на работните дни. Срокът за доставка е
                1-3 работни дни за София и 2-5 работни дни за страната.
              </p>
              <p className="text-gray-700 mb-4">
                Доставката е безплатна за поръчки над 100 лв. За по-малки поръчки таксата за доставка е 5 лв.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Връщане и рекламации</h2>
              <p className="text-gray-700 mb-4">
                Клиентът има право да върне стоката в 14-дневен срок от получаването й, ако тя не отговаря на описанието
                или има производствени дефекти.
              </p>
              <p className="text-gray-700 mb-4">
                Рекламациите се приемат в писмен вид на електронна поща или в офиса на фирмата. Разглеждането на
                рекламации става в срок до 14 работни дни.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">5. Гаранция</h2>
              <p className="text-gray-700 mb-4">
                Всички продукти се продават с гаранция според условията на производителя. Гаранцията не покрива повреди
                от неправилна употреба или естествено износване.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Защита на личните данни</h2>
              <p className="text-gray-700 mb-4">
                МАДИКС ЕООД се задължава да пази конфиденциалността на личните данни на клиентите в съответствие с
                Регламента за защита на личните данни (GDPR).
              </p>
              <p className="text-gray-700 mb-4">
                Личните данни се използват единствено за обработка на поръчки и комуникация с клиентите.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Отговорност</h2>
              <p className="text-gray-700 mb-4">
                МАДИКС ЕООД не носи отговорност за щети, възникнали от неправилна употреба на продуктите или
                несъблюдаване на инструкциите за употреба.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Приложимо право</h2>
              <p className="text-gray-700 mb-4">
                Настоящите общи условия се регулират от българското законодателство. Всички спорове се решават от
                компетентните български съдилища.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Контакти</h2>
              <p className="text-gray-700 mb-4">За въпроси относно общите условия можете да се свържете с нас:</p>
              <div className="text-gray-700"></div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter categories={categories} isEnglish={false} />
    </div>
  )
}
