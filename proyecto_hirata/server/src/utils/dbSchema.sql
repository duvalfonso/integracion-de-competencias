CREATE DATABASE hirata_db;
USE hirata_db;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'driver', 'maintenance') DEFAULT 'driver',
  is_enabled BOOLEAN DEFAULT TRUE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trucks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  brand VARCHAR(50) NOT NULL
  model VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  total_mileage INT DEFAULT 0,
  last_maintenance_mileage INT DEFAULT 0,
  maintenance_threshold INT DEFAULT 5000,
  status ENUM('en espera', 'en uso', 'en mantenimiento', 'inactivo') DEFAULT 'en espera'
);

INSERT INTO trucks (plate_number, brand, model, year, total_mileage, last_maintenance_mileage)
VALUES
('A0A0A0', 'marca', 'Modelo', 2025, 1, 0);

CREATE TABLE truck_driver (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  truck_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,

  UNIQUE (driver_id),
  FOREIGN KEY (driver_id) REFERENCES users(id),
  FOREIGN KEY (truck_id) REFERENCES trucks(id)
);

CREATE TABLE mileage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  truck_id INT NOT NULL,
  driver_id INT NOT NULL,
  mileage_value INT NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

CREATE TABLE maintenance_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  truck_id INT NOT NULL,
  service_date DATE NOT NULL,
  service_type ENUM('Preventivo', 'Correctivo') NOT NULL,
  description TEXT NOT NULL,
  mileage_at_service INT NOT NULL,
  FOREIGN KEY (truck_id) REFERENCES trucks(id)
);
