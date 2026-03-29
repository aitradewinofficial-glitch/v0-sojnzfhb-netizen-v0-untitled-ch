import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { getCategories, getSubcategories, transformCategoriesToBulgarian } from "@/lib/data"

export const metadata = {
  title: "Плащане - Мадикс",
  description: "Информация за процеса на плащане и условията за поръчка в онлайн магазин Мадикс.",
}

export const dynamic = "force-dynamic"

export default async function PaymentPage() {
  const categories = await getCategories()
  const allSubcategories = await getSubcategories()

  const bulgarianCategories = transformCategoriesToBulgarian(categories)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader categories={bulgarianCategories} subcategories={allSubcategories} />
      <CategoriesNavbar categories={bulgarianCategories} subcategories={allSubcategories} isEnglish={false} />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Плащане</h1>

        <div className="max-w-3xl mx-auto space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">1. РЕГИСТРАЦИЯ</h2>
            <p>Регистрацията в сайта за риболов НЕ е необходима, за да извършите поръчка.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">2. КОШНИЦА</h2>
            <p>
              Под снимките и описанието на всеки продукт има бутон <strong>КУПИ</strong>, както и възможност за
              определяне на желаното количество за покупка. Натискането на този бутон записва избраното количество от
              дадения продукт във виртуална „кошница”. Съдържанието на кошницата се запазва, докато решите да преминете
              към покупка на стоките. Вие може да разглеждате съдържанието на кошницата, да добавяте нови продукти или
              да премахвате тези, които не желаете. Цената, която е посочена е за един брой и НЕ включва цената по
              доставка на посочения от Вас адрес. От бутон <strong>ПРОДЪЛЖИ ПАЗАРУВАНЕТО</strong> можете да се върнете в
              магазина и да добавите продукти към своята поръчка. Преди да преминете към плащане, имате възможност да
              използвате кодове за отстъпки - купон код или ваучер код, като натиснете съответния бутон. Чрез бутон{" "}
              <strong>ПЛАЩАНЕ</strong> преминавате към последната стъпка от пазаруването.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">3. ПЛАЩАНЕ</h2>
            <p>
              Натискането на бутон <strong>ПЛАЩАНЕ</strong>, Ви отвежда към процедурата по поръчка, която включва:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Да се регистрирате или да довършите поръчката като гост</li>
              <li>Въвеждането на коректен и точен адрес, име, фамилия и мобилен телефон</li>
              <li>Детайли за плащане и доставка</li>
              <li>
                При довършване на поръчката можете да оставите коментар или конкретно изискване към начина на доставка
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">4. ПОТВЪРЖДЕНИЕ ЗА ПОРЪЧКА</h2>
            <p>Наш оператор ще се свърже с вас на посоченият телефонен номер за да потвърдите поръчката.</p>
            <p>
              Условията за поръчка, доставка и плащане съответстват на условията, посочени в Закона за защита на
              потребителите.
            </p>
            <p>
              Поръчката е акт на действие, който потребителят прави свободно, по собствен избор, и обвързва със силата
              на договор потребителя и онлайн магазин Мадикс.
            </p>
            <p>
              Плащането на поръчаната стока не е авансово и се приема като задатък с пълен размер на крайната цена на
              продукта.
            </p>
            <p>
              Всяка предоставена от потребителя или лицето, ползващо сайта със свободен достъп лична информация, ще бъде
              използвана в съответствие със Закона за защита на личните данни и нейното предоставяне от страна на
              потребителя е напълно доброволно.
            </p>
            <p className="mt-6 text-center font-semibold">Поздрави от екипа на Мадикс !!!</p>
          </section>
        </div>
      </main>
      <SiteFooter categories={bulgarianCategories} isEnglish={false} />
    </div>
  )
}
