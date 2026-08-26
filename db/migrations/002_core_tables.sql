-- GlobeBridge schema — core entities
-- Depends on: 001_init.sql (creates the database)

USE globebridge;

-- ---------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  company_name  VARCHAR(255) NOT NULL,
  industry      VARCHAR(150),
  country       VARCHAR(100),
  city          VARCHAR(100),
  website       VARCHAR(255),
  email         VARCHAR(255),
  phone         VARCHAR(50),
  description   TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companies_name (company_name),
  INDEX idx_companies_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  phone          VARCHAR(50),
  role           ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  company_id     INT,
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- buyers
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buyers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  company_name   VARCHAR(255) NOT NULL,
  contact_person VARCHAR(150),
  email          VARCHAR(255),
  phone          VARCHAR(50),
  country        VARCHAR(100),
  city           VARCHAR(100),
  product        VARCHAR(255),
  hs_code        VARCHAR(20),
  hs_chapter     VARCHAR(10),
  import_volume  VARCHAR(100),
  website        VARCHAR(255),
  verified       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_buyers_company_name (company_name),
  INDEX idx_buyers_country (country),
  INDEX idx_buyers_product (product),
  INDEX idx_buyers_hs_code (hs_code),
  INDEX idx_buyers_hs_chapter (hs_chapter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  company_name   VARCHAR(255) NOT NULL,
  contact_person VARCHAR(150),
  email          VARCHAR(255),
  phone          VARCHAR(50),
  country        VARCHAR(100),
  city           VARCHAR(100),
  product        VARCHAR(255),
  hs_code        VARCHAR(20),
  hs_chapter     VARCHAR(10),
  export_volume  VARCHAR(100),
  website        VARCHAR(255),
  verified       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_suppliers_company_name (company_name),
  INDEX idx_suppliers_country (country),
  INDEX idx_suppliers_product (product),
  INDEX idx_suppliers_hs_code (hs_code),
  INDEX idx_suppliers_hs_chapter (hs_chapter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- hs_codes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_codes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(20) NOT NULL,
  description  VARCHAR(500) NOT NULL,
  chapter      VARCHAR(10) NOT NULL,
  bcd          VARCHAR(20),
  sws          VARCHAR(20),
  igst         VARCHAR(20),
  country      VARCHAR(100) DEFAULT 'India',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hs_codes_code_country (code, country),
  INDEX idx_hs_codes_chapter (chapter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- shipments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  exporter             VARCHAR(255),
  importer             VARCHAR(255),
  product              VARCHAR(255),
  hs_code              VARCHAR(20),
  quantity             DECIMAL(15,2),
  unit                 VARCHAR(30),
  shipment_value       DECIMAL(15,2),
  origin_country       VARCHAR(100),
  destination_country  VARCHAR(100),
  origin_port          VARCHAR(150),
  destination_port     VARCHAR(150),
  shipment_date        DATE,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shipments_hs_code (hs_code),
  INDEX idx_shipments_shipment_date (shipment_date),
  INDEX idx_shipments_origin_country (origin_country),
  INDEX idx_shipments_destination_country (destination_country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
