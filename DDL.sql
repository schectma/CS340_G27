SET FOREIGN_KEY_CHECKS=0;
SET AUTOCOMMIT = 0;

-- Drop all tables if they exist to reset the database
DROP TABLE IF EXISTS `Rentals`;

DROP TABLE IF EXISTS `VehicleLocations`;

DROP TABLE IF EXISTS `Customers`;

DROP TABLE IF EXISTS `Locations`;

DROP TABLE IF EXISTS `Vehicles`;

CREATE TABLE `Vehicles` (
    `vehicleID` INT NOT NULL AUTO_INCREMENT,
    `model` VARCHAR(100) NOT NULL,
    `year` INT NOT NULL,
    `basePrice` DECIMAL(10, 2) NOT NULL,
    `isAvailable` BOOL NOT NULL DEFAULT 1,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`vehicleID`),
    CONSTRAINT `chk_basePrice_nonneg` CHECK (`basePrice` >= 0) -- ensures that the base price cannot be negative
);

CREATE TABLE `Locations` (
    `locationID` INT NOT NULL AUTO_INCREMENT,
    `locationName` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`locationID`)
);

CREATE TABLE `Customers` (
    `customerID` INT NOT NULL AUTO_INCREMENT,
    `customerName` VARCHAR(100) NOT NULL,
    `customerEmail` VARCHAR(100) NOT NULL,
    `customerPhone` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`customerID`),
    CONSTRAINT `uniq_customer_email` UNIQUE (`customerEmail`) -- Prevents duplicate email addresses
);

CREATE TABLE `VehicleLocations` (
    `vehicleLocationID` INT NOT NULL AUTO_INCREMENT,
    `vehicleID` INT NOT NULL,
    `locationID` INT NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`vehicleLocationID`),
    CONSTRAINT `fk_vl_vehicle` FOREIGN KEY (`vehicleID`) REFERENCES `Vehicles` (`vehicleID`) ON DELETE CASCADE ON UPDATE CASCADE, -- cascade deletes when vehicle is removed
    CONSTRAINT `fk_vl_location` FOREIGN KEY (`locationID`) REFERENCES `Locations` (`locationID`) ON DELETE CASCADE ON UPDATE CASCADE -- cascade deletes when location is removed
);

CREATE TABLE `Rentals` (
    `rentalID` INT NOT NULL AUTO_INCREMENT,
    `vehicleID` INT NOT NULL,
    `customerID` INT NOT NULL,
    `pickupLocationID` INT NOT NULL,
    `dropoffLocationID` INT NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `totalCost` DECIMAL(10, 2) NOT NULL,
    `isActive` BOOL NOT NULL DEFAULT 1,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`rentalID`),
    CONSTRAINT `fk_rentals_vehicle` FOREIGN KEY (`vehicleID`) REFERENCES `Vehicles` (`vehicleID`) ON DELETE RESTRICT ON UPDATE CASCADE, -- prevents deleting vehicle with active rentals
    CONSTRAINT `fk_rentals_customer` FOREIGN KEY (`customerID`) REFERENCES `Customers` (`customerID`) ON DELETE RESTRICT ON UPDATE CASCADE, -- prevents deleting customer with rentals
    CONSTRAINT `fk_rentals_pickup_location` FOREIGN KEY (`pickupLocationID`) REFERENCES `Locations` (`locationID`) ON DELETE RESTRICT ON UPDATE CASCADE, -- prevents deleting location used in rentals
    CONSTRAINT `fk_rentals_dropoff_location` FOREIGN KEY (`dropoffLocationID`) REFERENCES `Locations` (`locationID`) ON DELETE RESTRICT ON UPDATE CASCADE, -- prevents deleting location used in rentals
    CONSTRAINT `chk_dates` CHECK (`startDate` <= `endDate`), -- Ensures rental start date is before or equal to end date
    CONSTRAINT `chk_totalCost_nonneg` CHECK (`totalCost` >= 0) -- Ensures rental cost cannot be negative
);

INSERT INTO Vehicles (model, year, basePrice, isAvailable) VALUES
    ("Ascent", 2022, 40.00, 0),
    ("BRAT", 2001, 60.00, 0),
    ("Camry", 2006, 90.00, 1),
    ("Durango", 2020, 30.00, 1),
    ("Elantra", 2019, 10.00, 1);

INSERT INTO Locations (locationName) VALUES
    ("Albany"),
    ("Birmingham"),
    ("Calverton"),
    ("Detroit"),
    ("Edmunds");

INSERT INTO Customers (customerName, customerEmail, customerPhone) VALUES
    ("Albert", "albert@domain.com", "012-345-6789"),
    ("Benny", "benny@domain.com", "012-345-6790"),
    ("Charles", "charles@domain.com", "012-345-6791"),
    ("Daniel", "daniel@domain.com", "012-345-6792"),
    ("Edgar", "edgar@domain.com", "012-345-6793");

INSERT INTO VehicleLocations (vehicleID, locationID) VALUES
    (1, 1),
    (2, 2),
    (3, 3),
    (4, 4),
    (5, 5);

INSERT INTO Rentals (vehicleID, customerID, pickupLocationID, dropoffLocationID, startDate, endDate, totalCost, isActive) VALUES
    (1, 1, 1, 2, '2025-10-20', '2025-10-25', 200.00, 1),
    (2, 2, 2, 3, '2025-10-22', '2025-10-28', 360.00, 1),
    (4, 3, 1, 3, '2025-09-10', '2025-09-15', 150.00, 0),
    (5, 4, 2, 1, '2025-09-01', '2025-09-07', 60.00, 0),
    (4, 5, 3, 2, '2025-08-15', '2025-08-20', 150.00, 0);

SET FOREIGN_KEY_CHECKS=1;
COMMIT;