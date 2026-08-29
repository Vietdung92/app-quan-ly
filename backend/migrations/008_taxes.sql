-- Migration 008: Thuế hộ chủ nhà (import từ sheet THUẾ file Eureka)
-- Guard: chạy đúng 1 lần
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.apartment_taxes') IS NOT NULL THEN
    RAISE EXCEPTION 'Taxes already imported - skipping (this is safe)';
  END IF;
END $$;

CREATE TABLE apartment_taxes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  owner_name VARCHAR(150),
  tax_code VARCHAR(50),
  months INT,
  start_date DATE,
  end_date DATE,
  declared_rent NUMERIC(14,0),
  monthly_tax NUMERIC(14,0),
  file_label VARCHAR(100),
  drive_link TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tax_payments (
  id SERIAL PRIMARY KEY,
  tax_id INT NOT NULL REFERENCES apartment_taxes(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  amount NUMERIC(14,0) NOT NULL DEFAULT 0,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_date DATE,
  fund_transaction_id INT REFERENCES fund_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  UNIQUE (tax_id, month)
);
CREATE INDEX idx_tax_payments_month ON tax_payments(month);

INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('Sarina _A408', 'HUGH KI JOON', NULL, NULL, NULL, NULL, 3658000, NULL, 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-09', 3658000, 'paid', '2025-09-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-10', 3658000, 'paid', '2025-10-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-11', 3658000, 'paid', '2025-11-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-12', 3658000, 'paid', '2025-12-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-01', 3658000, 'paid', '2026-01-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-02', 3658000, 'paid', '2026-02-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-03', 3658000, 'paid', '2026-03-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-04', 3658000, 'paid', '2026-04-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-05', 3658000, 'paid', '2026-05-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-06', 3658000, 'paid', '2026-06-28' FROM apartment_taxes WHERE label = 'Sarina _A408';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('Sadora_C1104', 'HUGH KI JOON', 8, '2026-05-09', '2027-05-08', 30000000, 3000000, 'C1104', 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-09', 2850000, 'paid', '2025-09-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-10', 2850000, 'paid', '2025-10-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-11', 2850000, 'paid', '2025-11-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-12', 2850000, 'paid', '2025-12-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-01', 2850000, 'paid', '2026-01-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-02', 2850000, 'paid', '2026-02-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-03', 2850000, 'paid', '2026-03-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-04', 2850000, 'paid', '2026-04-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-05', 2850000, 'paid', '2026-05-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-06', 3000000, 'paid', '2026-06-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-07', 3000000, 'paid', '2026-07-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-08', 3000000, 'paid', '2026-08-28' FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-09', 3000000, 'pending', NULL FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-10', 3000000, 'pending', NULL FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-11', 3000000, 'pending', NULL FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-12', 3000000, 'pending', NULL FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-01', 3000000, 'pending', NULL FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-02', 3000000, 'pending', NULL FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-03', 3000000, 'pending', NULL FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-04', 3000000, 'pending', NULL FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-05', 3000000, 'pending', NULL FROM apartment_taxes WHERE label = 'Sadora_C1104';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('Lexington_LE363', 'NGUYEN THI HA', 12, '2026-06-15', '2028-06-14', 12000000, 1340000, NULL, 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-09', 1340000, 'paid', '2025-09-28' FROM apartment_taxes WHERE label = 'Lexington_LE363';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-10', 1340000, 'paid', '2025-10-28' FROM apartment_taxes WHERE label = 'Lexington_LE363';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-11', 1340000, 'paid', '2025-11-28' FROM apartment_taxes WHERE label = 'Lexington_LE363';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2025-12', 1340000, 'paid', '2025-12-28' FROM apartment_taxes WHERE label = 'Lexington_LE363';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-01', 1340000, 'paid', '2026-01-28' FROM apartment_taxes WHERE label = 'Lexington_LE363';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-02', 1340000, 'paid', '2026-02-28' FROM apartment_taxes WHERE label = 'Lexington_LE363';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-03', 1340000, 'paid', '2026-03-28' FROM apartment_taxes WHERE label = 'Lexington_LE363';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-04', 1340000, 'paid', '2026-04-28' FROM apartment_taxes WHERE label = 'Lexington_LE363';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('Q2_2703AB', 'HAN SUK HO', 12, '2026-01-23', '2027-01-22', 18500000, 1850000, '2703AB', 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-02', 1850000, 'paid', '2026-02-28' FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-03', 1850000, 'paid', '2026-03-28' FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-04', 1850000, 'paid', '2026-04-28' FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-05', 1850000, 'paid', '2026-05-28' FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-06', 1850000, 'paid', '2026-06-28' FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-07', 1850000, 'paid', '2026-07-28' FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-08', 1850000, 'paid', '2026-08-28' FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-09', 1850000, 'pending', NULL FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-10', 1850000, 'pending', NULL FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-11', 1850000, 'pending', NULL FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-12', 1850000, 'pending', NULL FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-01', 1850000, 'pending', NULL FROM apartment_taxes WHERE label = 'Q2_2703AB';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('BB18.20B', 'LEE SUNYOUNG', 12, '2026-01-24', '2027-01-23', 15000000, 1500000, 'BB18-20B', 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-02', 1500000, 'paid', '2026-02-28' FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-03', 1500000, 'paid', '2026-03-28' FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-04', 1500000, 'paid', '2026-04-28' FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-05', 1500000, 'paid', '2026-05-28' FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-06', 1500000, 'paid', '2026-06-28' FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-07', 1500000, 'paid', '2026-07-28' FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-08', 1500000, 'paid', '2026-08-28' FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-09', 1500000, 'pending', NULL FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-10', 1500000, 'pending', NULL FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-11', 1500000, 'pending', NULL FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-12', 1500000, 'pending', NULL FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-01', 1500000, 'pending', NULL FROM apartment_taxes WHERE label = 'BB18.20B';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('MAP_B4008', 'HUGH KI JOON', 12, '2026-03-01', '2027-02-28', 22000000, 2200000, 'B4008', 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-03', 2200000, 'paid', '2026-03-28' FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-04', 2200000, 'paid', '2026-04-28' FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-05', 2200000, 'paid', '2026-05-28' FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-06', 2200000, 'paid', '2026-06-28' FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-07', 2200000, 'paid', '2026-07-28' FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-08', 2200000, 'paid', '2026-08-28' FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-09', 2200000, 'pending', NULL FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-10', 2200000, 'pending', NULL FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-11', 2200000, 'pending', NULL FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-12', 2200000, 'pending', NULL FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-01', 2200000, 'pending', NULL FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-02', 2200000, 'pending', NULL FROM apartment_taxes WHERE label = 'MAP_B4008';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('EH_T4 2706', 'HAN SUK HO', 12, '2026-03-02', '2027-03-01', 77000000, 7700000, 'T4 2706', 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-03', 7700000, 'paid', '2026-03-28' FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-04', 7700000, 'paid', '2026-04-28' FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-05', 7700000, 'paid', '2026-05-28' FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-06', 7700000, 'paid', '2026-06-28' FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-07', 7700000, 'paid', '2026-07-28' FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-08', 7700000, 'paid', '2026-08-28' FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-09', 7700000, 'pending', NULL FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-10', 7700000, 'pending', NULL FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-11', 7700000, 'pending', NULL FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-12', 7700000, 'pending', NULL FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-01', 7700000, 'pending', NULL FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-02', 7700000, 'pending', NULL FROM apartment_taxes WHERE label = 'EH_T4 2706';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('METRO_C1203A', 'NGUYEN THI HA', 12, '2026-05-01', '2027-04-30', 35000000, 3500000, 'C1203A', 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-05', 3500000, 'paid', '2026-05-28' FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-06', 3500000, 'paid', '2026-06-28' FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-07', 3500000, 'paid', '2026-07-28' FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-08', 3500000, 'paid', '2026-08-28' FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-09', 3500000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-10', 3500000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-11', 3500000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-12', 3500000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-01', 3500000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-02', 3500000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-03', 3500000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-04', 3500000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_C1203A';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('METRO_ C 21-01', 'NGUYEN THI HA', 11, '2026-06-15', '2027-06-13', 50000000, 5000000, NULL, 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-06', 5000000, 'paid', '2026-06-28' FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-07', 5000000, 'paid', '2026-07-28' FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-08', 5000000, 'paid', '2026-08-28' FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-09', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-10', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-11', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-12', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-01', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-02', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-03', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-04', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-05', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-06', 5000000, 'pending', NULL FROM apartment_taxes WHERE label = 'METRO_ C 21-01';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('T3-0801', 'HAGH  KI JOON', 17, '2026-08-01', '2027-12-31', 124498000, 12449800, NULL, 'https://drive.google.com/drive/folders/1');
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-08', 12449800, 'paid', '2026-08-28' FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-09', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-10', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-11', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2026-12', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-01', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-02', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-03', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-04', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-05', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO tax_payments (tax_id, month, amount, status, paid_date) SELECT id, '2027-06', 12449800, 'pending', NULL FROM apartment_taxes WHERE label = 'T3-0801';
INSERT INTO apartment_taxes (label, owner_name, months, start_date, end_date, declared_rent, monthly_tax, file_label, drive_link) VALUES ('Sunshine S1.A22.02', 'HAN SUK HO', 24, '2026-08-15', '2028-06-14', 25000000, 2500000, NULL, 'https://drive.google.com/drive/folders/1');
COMMIT;
