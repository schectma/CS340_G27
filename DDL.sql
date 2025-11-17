DROP PROCEDURE IF EXISTS ResetDatabase;

DELIMITER /
/

CREATE PROCEDURE ResetDatabase()
BEGIN
    SET FOREIGN_KEY_CHECKS = 0;
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
    CONSTRAINT `chk_basePrice_nonneg` CHECK (`basePrice` >= 0), -- ensures that the base price cannot be negative
    CONSTRAINT `uniq_vehicle_model` UNIQUE (`model`) -- allow FK references by vehicle model
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
    CONSTRAINT `uniq_customer_email` UNIQUE (`customerEmail`), -- Prevents duplicate email addresses
    CONSTRAINT `uniq_customer_phone` UNIQUE (`customerPhone`) -- Prevents duplicate phone numbers
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
    `vehicleModel` VARCHAR(100) DEFAULT NULL,
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
    CONSTRAINT `fk_rentals_vehicleModel` FOREIGN KEY (`vehicleModel`) REFERENCES `Vehicles` (`model`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_rentals_customer` FOREIGN KEY (`customerID`) REFERENCES `Customers` (`customerID`) ON DELETE RESTRICT ON UPDATE CASCADE, -- prevents deleting customer with rentals
    CONSTRAINT `fk_rentals_pickup_location` FOREIGN KEY (`pickupLocationID`) REFERENCES `Locations` (`locationID`) ON DELETE RESTRICT ON UPDATE CASCADE, -- prevents deleting location used in rentals
    CONSTRAINT `fk_rentals_dropoff_location` FOREIGN KEY (`dropoffLocationID`) REFERENCES `Locations` (`locationID`) ON DELETE RESTRICT ON UPDATE CASCADE, -- prevents deleting location used in rentals
    CONSTRAINT `chk_dates` CHECK (`startDate` <= `endDate`), -- Ensures rental start date is before or equal to end date
    CONSTRAINT `chk_totalCost_nonneg` CHECK (`totalCost` >= 0) -- Ensures rental cost cannot be negative
);


-- Insert sample data into the tables

INSERT INTO
    `Customers` (
        `customerName`,
        `customerEmail`,
        `customerPhone`
    )
VALUES (
        'Albert',
        'Albert@domain.com',
        '012-345-6789'
    ),
    (
        'Benny',
        'Benny@domain.com',
        '012-345-6790'
    ),
    (
        'Charles',
        'Charles@domain.com',
        '012-345-6791'
    ),
    (
        'Daniel',
        'Daniel@domain.com',
        '012-345-6792'
    ),
    (
        'Edgar',
        'Edgar@domain.com',
        '012-345-6793'
    );

INSERT INTO
    `Vehicles` (
        `model`,
        `year`,
        `basePrice`,
        `isAvailable`
    )
VALUES ('Ascent', 2022, 40, 0), -- Currently on active rental, so unavailable
    ('BRAT', 2001, 60, 0), -- Currently on active rental, so unavailable
    ('Camry', 2006, 90, 1), -- Available for rental
    ('Durango', 2020, 30, 1), -- Available for rental
    ('Elantra', 2019, 10, 1);
-- Available for rental

INSERT INTO
    `Locations` (`locationName`)
VALUES ('Albany'),
    ('Birmingham'),
    ('Calverton');

INSERT INTO
    `VehicleLocations` (`vehicleID`, `locationID`)
VALUES (1, 1), -- Ascent at Albany (currently on rental from Albany)
    (2, 2), -- BRAT at Birmingham (currently on rental from Birmingham)
    (3, 3), -- Camry at Calverton (available, no rental history)
    (4, 2), -- Durango at Birmingham (last dropoff location from most recent rental)
    (5, 1);
-- Elantra at Albany (last dropoff location from rental)

INSERT INTO
    `Rentals` (
        `vehicleID`,
        `customerID`,
        `pickupLocationID`,
        `dropoffLocationID`,
        `startDate`,
        `endDate`,
        `totalCost`,
        `isActive`
    )
VALUES (
        1, -- Ascent (currently on active rental)
        1, -- Albert
        1, -- Pickup: Albany
        2, -- Dropoff: Birmingham
        '2025-10-20',
        '2025-10-25',
        200.00, -- 5 days * $40/day
        1 -- Active rental
    ),
    (
        2, -- BRAT (currently on active rental)
        2, -- Benny
        2, -- Pickup: Birmingham
        3, -- Dropoff: Calverton
        '2025-10-22',
        '2025-10-28',
        360.00, -- 6 days * $60/day
        1 -- Active rental
    ),
    (
        4, -- Durango (completed rental)
        3, -- Charles
        1, -- Pickup: Albany
        3, -- Dropoff: Calverton
        '2025-09-10',
        '2025-09-15',
        150.00, -- 5 days * $30/day
        0 -- Completed
    ),
    (
        5, -- Elantra (completed rental)
        4, -- Daniel
        2, -- Pickup: Birmingham
        1, -- Dropoff: Albany
        '2025-09-01',
        '2025-09-07',
        60.00, -- 6 days * $10/day
        0 -- Completed
    ),
    (
        4, -- Durango (another completed rental)
        5, -- Edgar
        3, -- Pickup: Calverton
        2, -- Dropoff: Birmingham
        '2025-08-15',
        '2025-08-20',
        150.00, -- 5 days * $30/day
        0 -- Completed
    );

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;

END //
/

DELIMITER;