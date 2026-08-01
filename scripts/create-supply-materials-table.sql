-- Снабдяване: таблица за материали (опаковки, етикети, пликове и т.н.)
CREATE TABLE IF NOT EXISTS supply_materials (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  stock NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_materials_category ON supply_materials(category);

-- Рецепта: кои материали и колко се харчат за 1 бр. производствен продукт.
-- 5 слота според заданието: Етикет 1, Етикет 2, Стикер, Опаковка, Кашон.
ALTER TABLE production_products
  ADD COLUMN IF NOT EXISTS label1_material_id INTEGER REFERENCES supply_materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS label1_qty NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS label2_material_id INTEGER REFERENCES supply_materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS label2_qty NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sticker_material_id INTEGER REFERENCES supply_materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sticker_qty NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS packaging_material_id INTEGER REFERENCES supply_materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS packaging_qty NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS box_material_id INTEGER REFERENCES supply_materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS box_qty NUMERIC NOT NULL DEFAULT 0;
