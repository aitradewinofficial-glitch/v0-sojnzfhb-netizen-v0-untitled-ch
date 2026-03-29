import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ShieldCheck,
  DollarSign,
  Users,
  Truck,
  Factory,
  Globe,
  TrendingUp,
  CheckCircle,
  Store,
  Briefcase,
  BarChart,
  Building,
  BadgeCheck,
  Rocket,
} from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { CategoriesNavbar } from "@/components/categories-navbar"
import { getCategories, getSubcategories } from "@/lib/db"

export const metadata: Metadata = {
  title: "За нас | Madix Groundbaits",
  description:
    "Научете повече за историята на Мадикс, нашите ценности и ангажимент към качеството. Производство на захранки и стръв за риболов от 1996 г.",
}

export default async function AboutPage() {
  // Fetch categories and subcategories for navigation
  const [categories, subcategories] = await Promise.all([getCategories(), getSubcategories()])

  const principles = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-yellow-600" />,
      title: "Високо качество",
      description:
        "Поддържаме постоянно  високо качество на произвежданите от нас продукти посредством подбор на доставчиците и постоянен качествен контрол на всеки етап от производството.",
    },
    {
      icon: <DollarSign className="w-8 h-8 text-yellow-600" />,
      title: "Атрактивни цени",
      description:
        "Предлагаме цени, съобразени с икономическата ситуация и жизнения стандарт без това да влияе на качеството на крайните продукти.",
    },
    {
      icon: <Users className="w-8 h-8 text-yellow-600" />,
      title: "Коректност",
      description:
        "В течение на годините сме  си създали имидж на коректен партньор, който работи за изграждането на дългосрочни бизнес отношения със своите клиенти.",
    },
    {
      icon: <Truck className="w-8 h-8 text-yellow-600" />,
      title: "Безплатна доставка",
      description: "Осигуряваме безплатен транспорт до всеки търговски обект в страната.",
    },
  ]

  const milestones = [
    {
      year: "1996 г.",
      title: "Основаване",
      event:
        "Създадена е фирма „Мадикс“ като малко семейно предприятие с фокус върху производството на захранки и стръв за риболов. ",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
    {
      year: "1999 г.",
      title: "Първи екип и по-голяма база",
      event: "Разширяване на екипа  с първите служители и преместване в по-голямо помещение.",
      icon: <Users className="w-5 h-5 text-blue-500" />,
    },
    {
      year: "2003 г.",
      title: "Първи по-големи клиенти",
      event: "Някои от най-големите търговци в България започват да дистрибутират нашите продукти в цялата страна.",
      icon: <Store className="w-5 h-5 text-orange-500" />,
    },
    {
      year: "2009 г.",
      title: "Първи клиенти извън България",
      event:
        "Започваме сътрудничество с голяма румънска компания, произвеждайки част от нашите продукти под тяхна марка.",
      icon: <Globe className="w-5 h-5 text-cyan-500" />,
    },
    {
      year: "2012 г.",
      title: "Разширяване на пазарите",
      event: "Навлизаме в няколко европейски държави с марката Мадикс.",
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
    },
    {
      year: "2014 г.",
      title: "Собствена фабрика",
      event:
        "Закупуваме бивша лимонадена фабрика с площ от 900 кв.м. и след кратък ремонт инсталираме две поточни линии и започваме работа там.",
      icon: <Factory className="w-5 h-5 text-gray-600" />,
    },
    {
      year: "2018 г.",
      title: "Ново разширяване на пазарите",
      event: "Явяваме се на няколко европейски изложения и бързо намираме много нови клиенти в цяла Европа.",
      icon: <Briefcase className="w-5 h-5 text-indigo-500" />,
    },
    {
      year: "2022 г.",
      title: "Скок в мащаба",
      event:
        "Някои от най-големите компании в Европа ни се доверяват и започваме да произвеждаме за редица марки в нашата фабрика. Обемите стават големи и нуждата от реорганизация, по-голям екип и застроена площ става належаща.",
      icon: <BarChart className="w-5 h-5 text-red-500" />,
    },
    {
      year: "2023 г.",
      title: "Разширяване на фабриката",
      event:
        "Нуждата от застроена площ ни кара да разширим производствената площ с още 400 кв.м. и инсталиране на 500 кв. м. мобилни халета за съхранен��е на суровини.",
      icon: <Building className="w-5 h-5 text-teal-500" />,
    },
    {
      year: "Днес",
      title: "Утвърдено име в Европа",
      event:
        "Днес сме утвърдено име в риболовния бранш в цяла Европа. Имаме клиенти от почти всяка страна в ЕС. Наложили сме се като надежден партньор и в производството на продукти с марка на клиента.",
      icon: <BadgeCheck className="w-5 h-5 text-yellow-500" />,
    },
    {
      year: "Бъдещето",
      title: "Гледаме напред",
      event:
        "Винаги сме работили в дългосрочна перспектива и сме търсили устойчивия, а не бърз растеж. След 30 години натрупан опит от две поколения управлявали семейния бизнес, гледаме напред по-уверени от всякога. Въпреки динамичните времена в които живеем, ние от Мадикс градим бъдещето на компанията вярвайки, че коректността и професионализма ще са винаги на мода.",
      icon: <Rocket className="w-5 h-5 text-pink-500" />,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader categories={categories || []} subcategories={subcategories || []} isEnglish={false} />
      <CategoriesNavbar categories={categories || []} subcategories={subcategories || []} isEnglish={false} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* Hero Section */}
          <section className="mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">
              Запознайте се с <span className="text-yellow-600">Madix Groundbaits</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              От 1996 г. съчетаваме страстта към риболова с производството на висококачествени захранки и стръв,
              превръщайки хобито в професия.
            </p>
          </section>

          {/* Story Section */}
          <Card className="mb-16 shadow-xl overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
                <Image
                  src="/images/design-mode/new-madiks.png"
                  alt="Лого на Мадикс Groundbaits"
                  width={400}
                  height={250}
                  className="object-contain"
                />
              </div>
              <div className="md:w-1/2 p-8 md:p-10">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-3xl font-bold text-gray-800">Нашата концепция</CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-gray-700 space-y-5 leading-relaxed text-base">
                  <p>
                    Основната дейност на фирмата е производство на захранки и стръв за риболов. С течение на годините
                    ние разширяваме продукт��вата гама с цел да удовлетворим нуждите на всеки рибар, влагайки само
                    висококачествени суровини. Точните пропорции в различните рецепти са прецизирани за да се достигне
                    до оптимална ефективност.
                  </p>
                  <p>
                    Неуморно продължаваме да търсим все по–нови и ефективни решения, за да може нашите продукти да са
                    полезни във всяка едно ситуация, възникнала по време на риболов.
                  </p>
                </CardContent>
              </div>
            </div>
          </Card>

          {/* Milestones Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">Ключови моменти в развитието ни</h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gray-300 md:before:mx-auto md:before:left-0 md:before:right-0">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex items-center md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-gray-50 group-hover:border-yellow-500 text-gray-500 group-hover:text-yellow-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors">
                    {milestone.icon}
                  </div>
                  <div className="w-full ml-6 md:ml-0 md:w-[calc(50%-2.5rem)] md:px-6">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-500 mb-1">{milestone.year}</p>
                        <p className="font-bold text-yellow-600 text-lg mb-2">{milestone.title}</p>
                        <p className="text-gray-600 text-sm">{milestone.event}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Principles Section */}
          <section>
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Нашите принципи</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {principles.map((principle, index) => (
                <Card
                  key={index}
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300 text-center flex flex-col items-center"
                >
                  <CardHeader className="pb-3 pt-6">
                    <div className="bg-yellow-100 p-4 rounded-full mb-3 inline-block">{principle.icon}</div>
                    <CardTitle className="text-xl font-semibold text-gray-800">{principle.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-gray-600 text-sm px-2">{principle.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter categories={categories || []} isEnglish={false} />
    </div>
  )
}
