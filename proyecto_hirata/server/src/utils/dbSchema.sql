CREATE DATABASE IF NOT EXISTS hirata_db;
USE hirata_db;

-- USUARIOS Y ROLES
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES 
('admin'),
('superadmin'),
('driver'),
('maintenance'),
('developer');

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL DEFAULT 3,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- CAMIONES

CREATE TABLE trucks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_number VARCHAR(20) NOT NULL UNIQUE,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  status ENUM('disponible', 'en uso', 'en mantenimiento') DEFAULT 'disponible',
  total_mileage INT DEFAULT 0,
  last_maintenance_mileage INT DEFAULT 0,
  maintenance_threshold INT DEFAULT 5000,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ASIGNACIONES (HISTÓRICO)

CREATE TABLE truck_driver (
  id INT AUTO_INCREMENT PRIMARY KEY,
  truck_id INT NOT NULL,
  driver_id INT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,

  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- REGISTRO DE KILOMETRAJE

CREATE TABLE mileage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  truck_id INT NOT NULL,
  driver_id INT NOT NULL,
  mileage_value INT NOT NULL,
  difference_mileage INT,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- MANTENIMIENTOS

CREATE TABLE maintenances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  truck_id INT NOT NULL,
  maintenance_mileage INT NOT NULL,
  type ENUM('preventivo', 'correctivo') DEFAULT 'preventivo',
  status ENUM('programado', 'en curso', 'completado') DEFAULT 'programado',
  scheduled_date DATE,
  start_date DATE,
  end_date DATE,
  description TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (truck_id) REFERENCES trucks(id)
);

-- HISTORIAL DE MANTENIMIENTO

CREATE TABLE maintenance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  maintenance_id INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (maintenance_id) REFERENCES maintenances(id)
);
