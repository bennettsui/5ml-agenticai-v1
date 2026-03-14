-- =============================================================================
-- Arrisonapps — Product Seed
-- Version: 002
-- Description: Idempotent seed for brands and product catalogue.
--              Safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================================
SET search_path TO arrisonapps, public;

-- ---------------------------------------------------------------------------
-- BRANDS (insert if slug not already present)
-- ---------------------------------------------------------------------------
INSERT INTO brands (slug, name, origin, sort_order) VALUES
  ('bolivar',            'Bolivar',           'Cuba', 10),
  ('cohiba',             'Cohiba',            'Cuba', 20),
  ('cuaba',              'Cuaba',             'Cuba', 30),
  ('el-rey-del-mundo',   'El Rey del Mundo',  'Cuba', 40),
  ('hoyo-de-monterrey',  'Hoyo de Monterrey', 'Cuba', 50),
  ('h-upmann',           'H. Upmann',         'Cuba', 60),
  ('juan-lopez',         'Juan Lopez',        'Cuba', 70),
  ('montecristo',        'Montecristo',       'Cuba', 80),
  ('partagas',           'Partagás',          'Cuba', 90),
  ('por-larranaga',      'Por Larrañaga',     'Cuba', 100),
  ('quai-dorsay',        'Quai d''Orsay',     'Cuba', 110),
  ('ramon-allones',      'Ramon Allones',     'Cuba', 120),
  ('romeo-y-julieta',    'Romeo y Julieta',   'Cuba', 130),
  ('san-cristobal',      'San Cristobal',     'Cuba', 140),
  ('trinidad',           'Trinidad',          'Cuba', 150)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- Columns: sku, brand_slug, series, vitola, strength, packaging_qty,
--          packaging_type, is_limited_edition, is_travel_humidor, tags, notes
--
-- SKU convention:  BRAND(3)-SERIES(abbrev)-PACKSIZE
--   e.g.  COH-S6-25 = Cohiba Siglo VI 25-pack
--         BOL-HAM-25 = Bolivar Hamaki 25
--         TRI-REC-12 = Trinidad Reyes 12
-- ---------------------------------------------------------------------------
WITH b AS (SELECT id, slug FROM brands)
INSERT INTO products
  (sku, brand_id, series, vitola, strength, packaging_qty, packaging_type,
   is_limited_edition, is_travel_humidor, tags, short_description)
SELECT
  v.sku,
  b.id,
  v.series,
  v.vitola,
  v.strength,
  v.qty,
  v.ptype,
  v.le,
  v.th,
  v.tags,
  v.notes
FROM (VALUES
  -- ── Bolivar ────────────────────────────────────────────────────────────────
  ('BOL-HAM-25',    'bolivar',          'Hamaki',                        'Hamaki',         'full',   25, 'box',            TRUE,  FALSE, ARRAY['LE']::TEXT[],               NULL),
  ('BOL-BEL-25',    'bolivar',          'Belicosos Finos',               'Belicoso',       'full',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),

  -- ── Cohiba ─────────────────────────────────────────────────────────────────
  ('COH-S6-10',     'cohiba',           'Siglo VI',                      'Gran Corona',    'medium', 10, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('COH-S6-25',     'cohiba',           'Siglo VI',                      'Gran Corona',    'medium', 25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('COH-S6T-15',    'cohiba',           'Siglo VI Tubos',                'Gran Corona',    'medium', 15, 'tube',           FALSE, FALSE, ARRAY['Tubos']::TEXT[],            NULL),
  ('COH-ROB-25',    'cohiba',           'Robustos',                      'Robusto',        'medium', 25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('COH-SHT-10',    'cohiba',           'Short',                         'Demi Tasse',     'medium', 10, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   'Short 10''s'),
  ('COH-MD5-25',    'cohiba',           'Maduro 5 Mágicos',              'Magicos',        'full',   25, 'box',            FALSE, FALSE, ARRAY['Maduro']::TEXT[],           NULL),
  ('COH-50A-TH',    'cohiba',           '50th Aniversario Travel Humidor','Various',       'medium',  8, 'travel-humidor', TRUE,  TRUE,  ARRAY['Limited','Humidor']::TEXT[], 'Price 22000/box; stock 8 boxes at CENTRAL Sanyard'),
  ('COH-55A-10',    'cohiba',           '55th Anniversario',             'Siglo VI',       'medium', 10, 'box',            TRUE,  FALSE, ARRAY['LE']::TEXT[],               NULL),

  -- ── Cuaba ──────────────────────────────────────────────────────────────────
  ('CUA-GEN-25',    'cuaba',            'Generosos',                     'Perfecto',       'medium', 25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('CUA-PIR-10',    'cuaba',            'Pirámides',                     'Pirámide',       'medium', 10, 'box',            TRUE,  FALSE, ARRAY['LE']::TEXT[],               NULL),

  -- ── El Rey del Mundo ───────────────────────────────────────────────────────
  ('ERD-CAS-25',    'el-rey-del-mundo', 'Cañonazo',                      'Cañonazo',       'mild',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('ERD-CS-25',     'el-rey-del-mundo', 'Choix Supreme',                 'Choix Supreme',  'mild',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),

  -- ── Hoyo de Monterrey ──────────────────────────────────────────────────────
  ('HOY-EPI1-25',   'hoyo-de-monterrey','Epicure No.1',                  'Corona Extra',   'mild',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('HOY-EPI2-25',   'hoyo-de-monterrey','Epicure No.2',                  'Robusto',        'mild',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),

  -- ── H. Upmann ──────────────────────────────────────────────────────────────
  ('HUP-MAG-50',    'h-upmann',         'Magnum 50',                     'Robusto Extra',  'medium', 50, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('HUP-MAG54-25',  'h-upmann',         'Magnum 54',                     'Toro',           'medium', 25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   'Number inferred from image'),
  ('HUP-MF-25',     'h-upmann',         'Magnum Finite',                 'Toro',           'medium', 25, 'box',            TRUE,  FALSE, ARRAY['EL']::TEXT[],               NULL),
  ('HUP-COL-BOOK',  'h-upmann',         'Colección Habanos Book',        NULL,             'medium',  1, 'box',            FALSE, FALSE, ARRAY['Book','Collection']::TEXT[], 'Exact year unreadable'),

  -- ── Juan Lopez ─────────────────────────────────────────────────────────────
  ('JLO-SN2-25',    'juan-lopez',       'Selección No.2',                'Mareva',         'medium', 25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),

  -- ── Montecristo ────────────────────────────────────────────────────────────
  ('MON-NO2-10',    'montecristo',      'No.2',                          'Piramide',       'medium', 10, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('MON-NO2-25',    'montecristo',      'No.2',                          'Piramide',       'medium', 25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('MON-OR-20',     'montecristo',      'Open Regata',                   'Robusto',        'mild',   20, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('MON-PE-10',     'montecristo',      'Petit Edmundo',                 'Petit Edmundo',  'medium', 10, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('MON-SUP-25',    'montecristo',      'Supremos',                      'Piramide',       'medium', 25, 'box',            TRUE,  FALSE, ARRAY['LE']::TEXT[],               NULL),

  -- ── Partagás ───────────────────────────────────────────────────────────────
  ('PAR-ELS-25',    'partagas',         'E.L. Salomones 2022',           'Gran Piramide',  'full',   25, 'box',            TRUE,  FALSE, ARRAY['EL']::TEXT[],               NULL),
  ('PAR-LUS-25',    'partagas',         'Lusitanias',                    'Prominente',     'full',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('PAR-MDN2-25',   'partagas',         'Maduro No.2',                   'Piramide',       'full',   25, 'box',            FALSE, FALSE, ARRAY['Maduro']::TEXT[],           NULL),
  ('PAR-SD4-25',    'partagas',         'Serie D No.4',                  'Robusto',        'full',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('PAR-SE2-25',    'partagas',         'Serie E No.2',                  'Piramide',       'full',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('PAR-SP2-25',    'partagas',         'Serie P No.2',                  'Piramide',       'full',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),

  -- ── Por Larrañaga ──────────────────────────────────────────────────────────
  ('POR-PC-50',     'por-larranaga',    'Petit Coronas',                 'Mareva',         'mild',   50, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),

  -- ── Quai d'Orsay ───────────────────────────────────────────────────────────
  ('QDO-N50-10',    'quai-dorsay',      'No.50',                         'Robusto',        'mild',   10, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   'History entry Quai d''Orsay – 50 10''s'),

  -- ── Ramon Allones ──────────────────────────────────────────────────────────
  ('RAM-ABS-20',    'ramon-allones',    'Absolutos',                     'Lonsdale',       'full',   20, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   'Pack size inferred'),
  ('RAM-AEX-25',    'ramon-allones',    'Allones Extra',                 'Prominente',     'full',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('RAM-AN3-10',    'ramon-allones',    'Allones No.3',                  'Panatela',       'full',   10, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('RAM-SS-25',     'ramon-allones',    'Specially Selected',            'Robusto',        'full',   25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),

  -- ── Romeo y Julieta ────────────────────────────────────────────────────────
  ('ROM-CEL-25',    'romeo-y-julieta',  'Celestino Vega LCDH',           'Hermoso No.4',  'medium', 25, 'box',            FALSE, FALSE, ARRAY['LCDH']::TEXT[],             NULL),
  ('ROM-GCH-HUM',   'romeo-y-julieta',  'Gran Churchill Humidor',        'Churchill',     'medium',  1, 'travel-humidor', TRUE,  TRUE,  ARRAY['Humidor','Limited']::TEXT[], 'Text approximated; image slightly blurry'),
  ('ROM-NO2T-25',   'romeo-y-julieta',  'No.2',                          'No.2',          'medium', 25, 'tube',           FALSE, FALSE, ARRAY['Tubos']::TEXT[],            'History entry R Y J – No.2 A/T 25''s'),
  ('ROM-SC-10',     'romeo-y-julieta',  'Short Churchills',              'Minuto',        'medium', 10, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   'History entry 10''s pack'),
  ('ROM-SC-25',     'romeo-y-julieta',  'Short Churchill',               'Minuto',        'medium', 25, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   'History entry R Y J – Short Churchill 25''s'),

  -- ── San Cristobal ──────────────────────────────────────────────────────────
  ('SCR-25A-HUM',   'san-cristobal',    '25 Aniversario Humidor',        NULL,            'full',    1, 'travel-humidor', TRUE,  TRUE,  ARRAY['Humidor','Limited']::TEXT[], 'Exact text slightly blurred'),

  -- ── Trinidad ───────────────────────────────────────────────────────────────
  ('TRI-CAB-12',    'trinidad',         'Cabildos',                      'Laguito No.1',  'medium', 12, 'box',            TRUE,  FALSE, ARRAY['EL']::TEXT[],               NULL),
  ('TRI-COL-BOOK',  'trinidad',         'Colección Habanos Cazadores Book', NULL,          'medium',  1, 'box',            FALSE, FALSE, ARRAY['Book','Collection']::TEXT[], 'Exact series name inferred'),
  ('TRI-ESM-12',    'trinidad',         'Esmeralda',                     'Laguito No.1',  'medium', 12, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('TRI-FUN-24',    'trinidad',         'Fundadores',                    'Laguito No.1',  'medium', 24, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('TRI-ING-12',    'trinidad',         'Ingenios',                      'Laguito No.1',  'medium', 12, 'box',            TRUE,  FALSE, ARRAY['EL']::TEXT[],               NULL),
  ('TRI-LTR-12',    'trinidad',         'La Trova LCDH',                 'Hermoso No.4',  'medium', 12, 'box',            FALSE, FALSE, ARRAY['LCDH']::TEXT[],             NULL),
  ('TRI-ML-12',     'trinidad',         'Media Luna',                    'Laguito No.1',  'medium', 12, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('TRI-REC-12',    'trinidad',         'Reyes',                         'Laguito No.1',  'medium', 12, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('TRI-TOP-12',    'trinidad',         'Topes',                         'Laguito No.1',  'medium', 12, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL),
  ('TRI-VIG-12',    'trinidad',         'Vigia',                         'Laguito No.1',  'medium', 12, 'box',            FALSE, FALSE, ARRAY[]::TEXT[],                   NULL)

) AS v(sku, bslug, series, vitola, strength, qty, ptype, le, th, tags, notes)
JOIN b ON b.slug = v.bslug
ON CONFLICT (sku) DO NOTHING;
