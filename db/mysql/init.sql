-- Complete MySQL schema for HMS application
-- Reconstructed from application source code + original nodelogin.sql

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- -------------------------------------------
-- Core tables
-- -------------------------------------------

CREATE TABLE department (
  dept_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  dname VARCHAR(255) NOT NULL,
  contact_info VARCHAR(255) NOT NULL,
  locationName VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE department AUTO_INCREMENT = 100;

CREATE TABLE patients (
  patient_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  patient_name VARCHAR(255) NOT NULL,
  DOB DATE NOT NULL,
  balance REAL DEFAULT 0,
  phone_number VARCHAR(255),
  address VARCHAR(255) NOT NULL,
  is_discharged INT DEFAULT 0,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE patients AUTO_INCREMENT = 100;

CREATE TABLE staff (
  staff_id INT NOT NULL AUTO_INCREMENT,
  staff_name VARCHAR(255) NOT NULL,
  occupation VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  onleave INT DEFAULT 0,
  max_allowed INT DEFAULT 10,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  dept_id INT,
  PRIMARY KEY (staff_id),
  FOREIGN KEY (dept_id) REFERENCES department(dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE staff AUTO_INCREMENT = 100;

CREATE TABLE works_for (
  staff_id INT NOT NULL,
  dept_id INT NOT NULL,
  salary REAL NOT NULL,
  startdate DATE NOT NULL,
  FOREIGN KEY (dept_id) REFERENCES department(dept_id),
  FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE appointments (
  aptid INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  aptdate DATE NOT NULL,
  followedby INT,
  remarks VARCHAR(255),
  staff_id INT NOT NULL,
  patient_id INT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
  FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE appointments AUTO_INCREMENT = 100;

CREATE TABLE ratings (
  rating_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  patient_id INT NOT NULL,
  ratingstar INT NOT NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(staff_id),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE ratings AUTO_INCREMENT = 100;

CREATE TABLE bills (
  bill_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  amount_due INT NOT NULL,
  total_amount INT,
  due_date DATE,
  patient_id INT NOT NULL,
  aptid INT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
  FOREIGN KEY (aptid) REFERENCES appointments(aptid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE bills AUTO_INCREMENT = 100;

CREATE TABLE admin (
  username VARCHAR(255) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Tables referenced by db_controller.js
-- -------------------------------------------

CREATE TABLE doctor (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  dob DATE,
  gender VARCHAR(50),
  address VARCHAR(255),
  phone VARCHAR(255),
  image VARCHAR(255),
  department VARCHAR(255),
  biography TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE employee (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  join_date DATE,
  role VARCHAR(255),
  salary REAL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE store (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  p_date DATE,
  expire VARCHAR(255),
  expire_end DATE,
  price REAL,
  quantity INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE complain (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  message TEXT,
  name VARCHAR(255),
  email VARCHAR(255),
  subject VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE departments (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  department_name VARCHAR(255) NOT NULL,
  department_desc TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE leaves (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  employee VARCHAR(255),
  emp_id INT,
  leave_type VARCHAR(255),
  date_from DATE,
  date_to DATE,
  reason TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email_status VARCHAR(50) DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE verify (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255),
  email VARCHAR(255),
  token VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE temp (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255),
  token VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Legacy appointment table used by db_controller.js
CREATE TABLE appointment (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  patient_name VARCHAR(255),
  department VARCHAR(255),
  doctor_name VARCHAR(255),
  date DATE,
  time VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Triggers
-- -------------------------------------------

DELIMITER //

CREATE TRIGGER updateMaxAllowed
AFTER INSERT ON appointments
FOR EACH ROW
BEGIN
  UPDATE staff SET max_allowed = max_allowed - 1 WHERE staff_id = NEW.staff_id;
END //

CREATE TRIGGER updateMaxAllowed1
AFTER DELETE ON appointments
FOR EACH ROW
BEGIN
  UPDATE staff SET max_allowed = max_allowed + 1 WHERE staff_id = OLD.staff_id;
END //

-- -------------------------------------------
-- Stored Procedures
-- -------------------------------------------

CREATE PROCEDURE GetStaffInfo(IN id INT)
BEGIN
  SELECT * FROM staff WHERE staff_id = id;
END //

CREATE PROCEDURE GetPatientBills(IN p_id INT)
BEGIN
  SELECT b.bill_id, b.amount_due, b.due_date, a.title, a.aptdate
  FROM bills b
  INNER JOIN appointments a ON b.aptid = a.aptid
  WHERE b.patient_id = p_id
  ORDER BY b.due_date DESC;
END //

CREATE PROCEDURE GetDepartmentStaff(IN d_id INT)
BEGIN
  SELECT s.staff_id, s.staff_name, s.occupation, s.email, w.salary
  FROM staff s
  INNER JOIN works_for w ON s.staff_id = w.staff_id
  WHERE w.dept_id = d_id;
END //

CREATE PROCEDURE CreateAppointmentWithBill(
  IN p_title VARCHAR(255),
  IN p_aptdate DATE,
  IN p_staff_id INT,
  IN p_patient_id INT,
  IN p_amount INT
)
BEGIN
  DECLARE new_aptid INT;
  INSERT INTO appointments (title, aptdate, staff_id, patient_id)
  VALUES (p_title, p_aptdate, p_staff_id, p_patient_id);
  SET new_aptid = LAST_INSERT_ID();
  INSERT INTO bills (amount_due, patient_id, due_date, aptid)
  VALUES (p_amount, p_patient_id, DATE_ADD(p_aptdate, INTERVAL 30 DAY), new_aptid);
  UPDATE patients SET balance = balance + p_amount WHERE patient_id = p_patient_id;
END //

-- -------------------------------------------
-- User-Defined Functions
-- -------------------------------------------

CREATE FUNCTION GetStaffRating(s_id INT)
RETURNS DECIMAL(3,2)
DETERMINISTIC
BEGIN
  DECLARE avg_rating DECIMAL(3,2);
  SELECT COALESCE(AVG(ratingstar), 0) INTO avg_rating
  FROM ratings
  WHERE staff_id = s_id;
  RETURN avg_rating;
END //

CREATE FUNCTION GetPatientBalance(p_id INT)
RETURNS REAL
DETERMINISTIC
BEGIN
  DECLARE bal REAL;
  SELECT COALESCE(balance, 0) INTO bal
  FROM patients
  WHERE patient_id = p_id;
  RETURN bal;
END //

CREATE FUNCTION IsStaffAvailable(s_id INT)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
  DECLARE avail INT;
  SELECT max_allowed INTO avail FROM staff WHERE staff_id = s_id;
  IF avail > 0 THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END //

DELIMITER ;

-- -------------------------------------------
-- Seed data
-- -------------------------------------------

INSERT INTO department (dname, contact_info, locationName) VALUES
  ('Cardiology', '555-0101', 'Building A, Floor 2'),
  ('Neurology', '555-0102', 'Building B, Floor 1'),
  ('Orthopedics', '555-0103', 'Building A, Floor 3'),
  ('Pediatrics', '555-0104', 'Building C, Floor 1'),
  ('Dermatology', '555-0105', 'Building B, Floor 3');

INSERT INTO admin (username, email, password) VALUES
  ('admin', 'admin@hospital.com', 'admin123');

INSERT INTO patients (patient_name, DOB, balance, phone_number, address, username, email, password) VALUES
  ('Alice Johnson', '1985-03-15', 0, '555-1001', '123 Oak St', 'alice', 'alice@email.com', 'pass123'),
  ('Bob Smith', '1990-07-22', 0, '555-1002', '456 Elm St', 'bob', 'bob@email.com', 'pass123'),
  ('Carol Williams', '1978-11-08', 0, '555-1003', '789 Pine St', 'carol', 'carol@email.com', 'pass123');

INSERT INTO staff (staff_name, occupation, dob, username, email, password, dept_id) VALUES
  ('Dr. Sarah Chen', 'Cardiologist', '1975-06-12', 'drchen', 'chen@hospital.com', 'doc123', 100),
  ('Dr. James Wilson', 'Neurologist', '1980-02-28', 'drwilson', 'wilson@hospital.com', 'doc123', 101),
  ('Dr. Maria Garcia', 'Orthopedic Surgeon', '1982-09-03', 'drgarcia', 'garcia@hospital.com', 'doc123', 102),
  ('Dr. Ahmed Patel', 'Pediatrician', '1988-04-17', 'drpatel', 'patel@hospital.com', 'doc123', 103);

INSERT INTO works_for (staff_id, dept_id, salary, startdate) VALUES
  (100, 100, 150000, '2015-01-10'),
  (101, 101, 145000, '2016-03-15'),
  (102, 102, 155000, '2017-07-01'),
  (103, 103, 140000, '2019-09-20');

INSERT INTO appointments (title, aptdate, staff_id, patient_id, remarks) VALUES
  ('General Checkup', '2024-01-15', 100, 100, 'Routine cardiac assessment'),
  ('Follow-up Visit', '2024-01-20', 101, 101, 'Post-treatment evaluation'),
  ('Consultation', '2024-02-01', 102, 102, 'Knee pain assessment'),
  ('Annual Physical', '2024-02-10', 100, 101, NULL),
  ('Specialist Referral', '2024-02-15', 103, 100, 'Pediatric consultation for child');

INSERT INTO ratings (staff_id, patient_id, ratingstar) VALUES
  (100, 100, 5),
  (100, 101, 4),
  (101, 101, 5),
  (102, 102, 3),
  (103, 100, 4);

INSERT INTO bills (amount_due, total_amount, due_date, patient_id, aptid) VALUES
  (50000, 50000, '2024-02-15', 100, 100),
  (50000, 50000, '2024-02-20', 101, 101),
  (50000, 50000, '2024-03-01', 102, 102);

INSERT INTO employee (name, email, contact, join_date, role, salary) VALUES
  ('John Davis', 'john@hospital.com', '555-2001', '2018-05-01', 'Nurse', 60000),
  ('Emily Brown', 'emily@hospital.com', '555-2002', '2019-08-15', 'Receptionist', 45000),
  ('Michael Lee', 'michael@hospital.com', '555-2003', '2020-01-10', 'Lab Technician', 55000),
  ('Sarah Miller', 'sarah@hospital.com', '555-2004', '2017-03-20', 'Pharmacist', 65000);

INSERT INTO store (name, p_date, expire, expire_end, price, quantity) VALUES
  ('Amoxicillin', '2024-01-01', '2', '2026-01-01', 15.99, 500),
  ('Ibuprofen', '2024-01-01', '3', '2027-01-01', 8.50, 1000),
  ('Metformin', '2024-02-01', '2', '2026-02-01', 12.00, 300),
  ('Lisinopril', '2024-01-15', '2', '2026-01-15', 22.50, 200),
  ('Omeprazole', '2024-03-01', '1', '2025-03-01', 18.75, 450);

INSERT INTO departments (department_name, department_desc) VALUES
  ('Cardiology', 'Heart and cardiovascular system care'),
  ('Neurology', 'Brain and nervous system disorders'),
  ('Orthopedics', 'Musculoskeletal system treatment'),
  ('Pediatrics', 'Medical care for infants and children'),
  ('Dermatology', 'Skin conditions and treatments');

INSERT INTO doctor (first_name, last_name, email, dob, gender, address, phone, department, biography) VALUES
  ('Sarah', 'Chen', 'chen@hospital.com', '1975-06-12', 'Female', '100 Medical Dr', '555-3001', 'Cardiology', 'Board-certified cardiologist with 20 years experience'),
  ('James', 'Wilson', 'wilson@hospital.com', '1980-02-28', 'Male', '200 Hospital Ave', '555-3002', 'Neurology', 'Specialist in neurological disorders'),
  ('Maria', 'Garcia', 'garcia@hospital.com', '1982-09-03', 'Female', '300 Health Blvd', '555-3003', 'Orthopedics', 'Expert orthopedic surgeon'),
  ('Ahmed', 'Patel', 'patel@hospital.com', '1988-04-17', 'Male', '400 Care Lane', '555-3004', 'Pediatrics', 'Compassionate pediatric specialist');

COMMIT;
