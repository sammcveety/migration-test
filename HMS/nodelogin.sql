-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 16, 2020 at 12:41 PM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nodelogin`
--

-- --------------------------------------------------------
create table patients
(
patient_id int NOT NULL primary key AUTO_INCREMENT,
patient_name varchar(255) NOT NULL,
DOB date NOT NULL,
balance real default 0, 
phone_number varchar(255),
address varchar(255) not null,
is_discharged int DEFAULT 0,
username varchar(25) not null unique,
email varchar(25) not null,
password varchar(25) not null
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE patients AUTO_INCREMENT = 100;

create table department
(
`dept_id` int not null primary key AUTO_INCREMENT,
`dname` varchar(255) not null,
`contact_info` varchar(255) not null,
`locationName` varchar(255) not null
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE department AUTO_INCREMENT = 100;

create table staff
(
staff_id int not null AUTO_INCREMENT,
staff_name varchar(255) not null,
occupation varchar(255) not null,
dob date not null,
onleave int default 0,
max_allowed int default 10,
username varchar(255) not null unique,
email varchar(255) not null,
password varchar(255) not null,
dept_id int,
primary key(staff_id),
foreign key (dept_id) references department(dept_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE staff AUTO_INCREMENT = 100;


create table works_for(
staff_id int not null,
dept_id int not null,
salary real not null,
startdate date not null,
foreign key (dept_id) references department(dept_id),
foreign key (staff_id) references staff(staff_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

create table ratings
(
rating_id int not null primary key AUTO_INCREMENT,
staff_id int not null,
patient_id int not null,
ratingstar int not null,
foreign key (staff_id) references staff(staff_id),
foreign key (patient_id) references patients(patient_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE ratings AUTO_INCREMENT = 100;

create table admin
(
username varchar(255) not null primary key,
email varchar(255) not null,
password int not null
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for table `appointment`
--
create table appointments
(
aptid int not null primary key AUTO_INCREMENT,
title varchar(255) not null,
aptdate date not null,
followedby int,
remarks varchar(255),
staff_id int not null,
patient_id int not null,
foreign key (patient_id) references patients(patient_id),
foreign key (staff_id) references staff(staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
--
ALTER TABLE appointments AUTO_INCREMENT = 100;

create table bills
(
bill_id int not null primary key AUTO_INCREMENT,
amount_due int not null,
total_amount int,
due_date date,
patient_id int not null,
apt_id int not null,
foreign key (patient_id) references patients(patient_id),
foreign key (apt_id) references appointments(apt_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE bills AUTO_INCREMENT = 100;

CREATE TRIGGER updateMaxAllowed
AFTER insert on appointments
FOR EACH ROW  
BEGIN
update staff set max_allowed=max_allowed-1 where staff_id=NEW.staff_id;
END;

CREATE TRIGGER updateMaxAllowed1
AFTER delete on appointments
FOR EACH ROW  
BEGIN
update staff set max_allowed=max_allowed+1 where staff_id=NEW.staff_id;
END;

DELIMITER //

CREATE PROCEDURE GetStaffInfo(
	IN id int
)
BEGIN
	SELECT * 
 	FROM staff
	WHERE staff_id = id;
END //

DELIMITER ;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;