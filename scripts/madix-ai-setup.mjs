import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function main() {
  console.log("MADIX AI setup: creating tables...")

  await sql`
    CREATE TABLE IF NOT EXISTS madix_ai_areas (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      confidential BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS madix_ai_roles (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS madix_ai_role_areas (
      role_id INTEGER NOT NULL REFERENCES madix_ai_roles(id) ON DELETE CASCADE,
      area_id INTEGER NOT NULL REFERENCES madix_ai_areas(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, area_id)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS madix_ai_users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      password TEXT,
      role_id INTEGER REFERENCES madix_ai_roles(id) ON DELETE SET NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`ALTER TABLE madix_ai_users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE`
  await sql`ALTER TABLE madix_ai_users ADD COLUMN IF NOT EXISTS password TEXT`

  await sql`
    CREATE TABLE IF NOT EXISTS madix_ai_documents (
      id SERIAL PRIMARY KEY,
      area_id INTEGER NOT NULL REFERENCES madix_ai_areas(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL DEFAULT 'document',
      content TEXT NOT NULL,
      version TEXT DEFAULT 'v1',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS madix_ai_audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_name TEXT,
      role_name TEXT,
      question TEXT NOT NULL,
      matched_areas TEXT,
      denied_areas TEXT,
      allowed BOOLEAN NOT NULL DEFAULT true,
      flagged BOOLEAN NOT NULL DEFAULT false,
      sources TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  // Full-text-ish search helper index
  await sql`CREATE INDEX IF NOT EXISTS madix_ai_documents_area_idx ON madix_ai_documents(area_id)`

  console.log("MADIX AI setup: seeding areas...")

  const areas = [
    ["01_Obshti", "01 Общи", "Обща фирмена информация, политики, работно време, контакти.", false],
    ["02_Proizvodstvo", "02 Производство", "Рецепти за захранки, производствени процедури, настройки на машини.", false],
    ["03_Prodazhbi", "03 Продажби", "Ценови листи, търговски условия, скриптове за клиенти.", false],
    ["04_Snabdyavane", "04 Снабдяване и логистика", "Доставчици, суровини, складова наличност, транспорт.", false],
    ["99_Poveritelno", "99 Поверително", "Заплати, маржове, договори, стратегически данни.", true],
  ]
  for (const [code, name, description, confidential] of areas) {
    await sql`
      INSERT INTO madix_ai_areas (code, name, description, confidential)
      VALUES (${code}, ${name}, ${description}, ${confidential})
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, confidential = EXCLUDED.confidential
    `
  }

  const areaRows = await sql`SELECT id, code FROM madix_ai_areas`
  const areaId = Object.fromEntries(areaRows.map((r) => [r.code, r.id]))

  console.log("MADIX AI setup: seeding roles...")

  const roles = [
    ["Оператор", "Работник на производствена линия."],
    ["Продажби", "Търговски отдел и обслужване на клиенти."],
    ["Снабдяване", "Отдел снабдяване и логистика."],
    ["Ръководство", "Мениджмънт с пълен достъп."],
  ]
  for (const [name, description] of roles) {
    await sql`
      INSERT INTO madix_ai_roles (name, description)
      VALUES (${name}, ${description})
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    `
  }

  const roleRows = await sql`SELECT id, name FROM madix_ai_roles`
  const roleId = Object.fromEntries(roleRows.map((r) => [r.name, r.id]))

  console.log("MADIX AI setup: mapping roles to areas...")

  const roleAreaMap = {
    Оператор: ["01_Obshti", "02_Proizvodstvo"],
    Продажби: ["01_Obshti", "03_Prodazhbi"],
    Снабдяване: ["01_Obshti", "04_Snabdyavane"],
    Ръководство: ["01_Obshti", "02_Proizvodstvo", "03_Prodazhbi", "04_Snabdyavane", "99_Poveritelno"],
  }
  for (const [rName, areaCodes] of Object.entries(roleAreaMap)) {
    for (const code of areaCodes) {
      await sql`
        INSERT INTO madix_ai_role_areas (role_id, area_id)
        VALUES (${roleId[rName]}, ${areaId[code]})
        ON CONFLICT DO NOTHING
      `
    }
  }

  console.log("MADIX AI setup: seeding employees...")

  const users = [
    ["Иван Оператор", "operator@madix.bg", "operator", "operator123", "Оператор"],
    ["Ема Продажби", "sales@madix.bg", "sales", "sales123", "Продажби"],
    ["Габи Снабдяване", "supply@madix.bg", "supply", "supply123", "Снабдяване"],
    ["Директор Мадикс", "director@madix.bg", "director", "director123", "Ръководство"],
  ]
  for (const [name, email, username, password, rName] of users) {
    await sql`
      INSERT INTO madix_ai_users (name, email, username, password, role_id)
      VALUES (${name}, ${email}, ${username}, ${password}, ${roleId[rName]})
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role_id = EXCLUDED.role_id,
        username = EXCLUDED.username, password = EXCLUDED.password
    `
  }

  console.log("MADIX AI setup: seeding documents...")

  const docs = [
    // 01 Общи
    ["01_Obshti", "Работно време и вътрешен ред", "процедура",
      "Работното време на фабриката е от 07:00 до 16:00 в делнични дни, с обедна почивка 12:00-12:30. Влизането в производствените помещения става само с работно облекло и предпазни обувки. Пропуски се издават от отдел Човешки ресурси. При отсъствие се уведомява прекият ръководител най-малко 2 часа преди началото на смяната.", "v3"],
    ["01_Obshti", "Контакти на отделите", "справка",
      "Производство: вътр. 101. Продажби: вътр. 102, sales@madix.bg. Снабдяване: вътр. 103. Счетоводство: вътр. 104. Технически проблеми и IT: вътр. 105. Спешни случаи (авария): 112, след което управител на смяна.", "v2"],
    // 02 Производство
    ["02_Proizvodstvo", "Рецепта: Захранка Method Feeder Скопекс", "рецепта",
      "Базова смес за 25 кг партида: 40% царевично брашно, 25% бисквитено брашно, 15% соев шрот, 10% пшеничен глутен (за лепливост), 5% млечен протеин, 5% ароматен премикс Скопекс. Влажност при замесване 18-20%. Аромат Скопекс се добавя 12 мл на кг сухо вещество. Смесване 8 минути на бавни обороти, след което 4 минути на бързи. Готовата смес се пресява през сито 3 мм.", "v4"],
    ["02_Proizvodstvo", "Рецепта: Пелети халибут 6 мм", "рецепта",
      "Суровини за 50 кг: рибно брашно 55%, пшенично брашно 20%, халибутово масло 12%, кръвно брашно 8%, свързващ агент 5%. Температура на екструдера зона 1: 85°C, зона 2: 110°C, зона 3: 120°C. Матрица 6 мм. Скорост на подаване 40 кг/час. Сушене при 60°C за 6 часа до крайна влажност под 9%.", "v2"],
    ["02_Proizvodstvo", "Процедура: Настройка на смесител СМ-500", "процедура",
      "Преди пуск проверете нивото на масло в редуктора (мин. маркировка). Стартирайте на бавни обороти (режим 1) за 30 секунди на празен ход. Максимално зареждане 500 кг. НИКОГА не отваряйте капака преди пълно спиране на роторите - блокировката трябва да свети зелено. Почистване след всяка партида със сгъстен въздух, забранено миене с вода на електрическите части. Планова смяна на лагерите на всеки 1200 работни часа.", "v5"],
    ["02_Proizvodstvo", "Процедура: Настройка на екструдер ЕКС-2", "процедура",
      "Загряване на зоните до работна температура преди подаване на суровина (изчакайте стабилизация ±2°C). Проверка на налягането - работен диапазон 80-140 бара. При налягане над 150 бара незабавно спрете подаването и проверете матрицата за задръстване. Смяна на матрица само при спрян и охладен под 40°C екструдер. Записвайте партидния номер в дневника на линията.", "v3"],
    // 03 Продажби
    ["03_Prodazhbi", "Ценова листа на едро 2026", "ценова листа",
      "Захранки Method Feeder 1 кг: 4.80 лв на едро при поръчка над 100 бр. Пелети халибут 6 мм 5 кг: 28.00 лв на едро. Отстъпка за дистрибутори: 12% при годишен оборот над 20 000 лв, 18% над 50 000 лв. Минимална поръчка за доставка без транспортна такса: 300 лв.", "v2"],
    ["03_Prodazhbi", "Скрипт за обслужване на клиент", "скрипт",
      "Поздрав: 'Мадикс Граундбейтс, добър ден, с какво мога да помогна?'. Винаги питайте за вид риболов (шаранов, фидер, спининг) преди препоръка. При рекламация - извинение, приемане на данни, срок за отговор до 48 часа. Не обещавайте отстъпки над стандартните без одобрение от търговски мениджър.", "v1"],
    // 04 Снабдяване
    ["04_Snabdyavane", "Списък с доставчици на суровини", "справка",
      "Рибно брашно: доставчик АкваПротеин ООД, срок на доставка 10 дни, мин. количество 1 тон. Царевично брашно: Агрозърно АД, 5 дни. Ароматни премикси: внос от Германия, срок 21 дни, поръчва се с 1 месец аванс. Опаковки и пликове: ПластПак ЕООД, 7 дни.", "v3"],
    ["04_Snabdyavane", "Процедура за приемане на доставка", "процедура",
      "При получаване се проверява придружаваща документация (фактура, сертификат за качество на партидата). Претегляне и сверяване с поръчката - допустимо отклонение ±2%. Взима се проба за влажност от рибно и царевично брашно. Несъответствия се снимат и докладват на снабдяване същия ден. Заприхождаване в складовата система в рамките на 24 часа.", "v2"],
    // 99 Поверително
    ["99_Poveritelno", "Ведомост заплати - обобщено", "поверително",
      "Средна брутна заплата производствен оператор: 1850 лв. Търговски представител: 2400 лв + бонус до 15% от оборота. Ръководител смяна: 3200 лв. Бонусният фонд за Q1 2026 е 42 000 лв, разпределя се по преценка на ръководството.", "v1"],
    ["99_Poveritelno", "Маржове по продуктови групи", "поверително",
      "Захранки Method Feeder: себестойност 2.10 лв, марж на едро ~56%. Пелети халибут: себестойност 3.40 лв за 5 кг разфасовка, марж ~48%. Ароматизирани спод миксове: най-висок марж ~64%. Стратегия 2026: повишаване на дела на висoкомаржовите продукти с 8%.", "v1"],
  ]
  for (const [code, title, docType, content, version] of docs) {
    // avoid duplicate seeds by title
    const existing = await sql`SELECT id FROM madix_ai_documents WHERE title = ${title}`
    if (existing.length === 0) {
      await sql`
        INSERT INTO madix_ai_documents (area_id, title, doc_type, content, version)
        VALUES (${areaId[code]}, ${title}, ${docType}, ${content}, ${version})
      `
    }
  }

  const counts = await sql`
    SELECT
      (SELECT COUNT(*) FROM madix_ai_areas) AS areas,
      (SELECT COUNT(*) FROM madix_ai_roles) AS roles,
      (SELECT COUNT(*) FROM madix_ai_users) AS users,
      (SELECT COUNT(*) FROM madix_ai_documents) AS documents
  `
  console.log("MADIX AI setup: done.", counts[0])
}

main().catch((e) => {
  console.error("MADIX AI setup failed:", e)
  process.exit(1)
})
