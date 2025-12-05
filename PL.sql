-- ===========================================
-- CS340 Portfolio Project - PL.sql
-- Citations:
-- - Entire file adapted from CS340 course concepts and starter code examples (December 2025).
--   Originality: Adapted stored procedure structures and SQL syntax from course materials.
--   AI Assistance: Used GitHub Copilot for debugging syntax errors, optimizing queries, and
--   generating procedure logic.

USE VehicleRentalDB;

-- ===========================================
-- CREATE Operations
-- ===========================================

-- CreateCustomer: Insert a new customer into the database
DROP PROCEDURE IF EXISTS CreateCustomer;

DELIMITER /
/

CREATE PROCEDURE CreateCustomer(
    IN p_customerName VARCHAR(100),
    IN p_customerEmail VARCHAR(100),
    IN p_customerPhone VARCHAR(100)
)
BEGIN
    -- Input validation
    IF p_customerName IS NULL OR p_customerName = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer name cannot be empty';
    END IF;
    IF p_customerEmail IS NULL OR p_customerEmail = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer email cannot be empty';
    END IF;
    IF p_customerPhone IS NULL OR p_customerPhone = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer phone cannot be empty';
    END IF;
    
    -- Insert new customer
    INSERT INTO Customers (customerName, customerEmail, customerPhone)
    VALUES (p_customerName, p_customerEmail, p_customerPhone);
END
/
/

DELIMITER;

-- ===========================================
-- UPDATE Operations
-- ===========================================

-- UpdateVehicle: Update an existing vehicle's information
DROP PROCEDURE IF EXISTS UpdateVehicle;

DELIMITER /
/

CREATE PROCEDURE UpdateVehicle(
    IN p_vehicleID INT,
    IN p_model VARCHAR(100),
    IN p_year INT,
    IN p_basePrice DECIMAL(10, 2),
    IN p_isAvailable TINYINT
)
BEGIN
    DECLARE v_vehicleExists INT DEFAULT 0;
    
    -- Input validation
    IF p_vehicleID IS NULL OR p_vehicleID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vehicleID';
    END IF;
    IF p_model IS NULL OR p_model = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle model cannot be empty';
    END IF;
    IF p_year IS NULL OR p_year < 1900 OR p_year > 2100 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vehicle year';
    END IF;
    IF p_basePrice IS NULL OR p_basePrice < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Base price cannot be negative';
    END IF;
    
    -- Check if vehicle exists
    SELECT COUNT(*) INTO v_vehicleExists FROM Vehicles WHERE vehicleID = p_vehicleID;
    IF v_vehicleExists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle does not exist';
    END IF;
    
    -- Update vehicle
    UPDATE Vehicles 
    SET model = p_model,
        year = p_year,
        basePrice = p_basePrice,
        isAvailable = p_isAvailable
    WHERE vehicleID = p_vehicleID;
END
/
/

DELIMITER;

-- ===========================================
-- DELETE Operations
-- ===========================================

-- DeleteRental: Delete a rental record
DROP PROCEDURE IF EXISTS DeleteRental;

DELIMITER /
/

CREATE PROCEDURE DeleteRental(
    IN p_rentalID INT
)
BEGIN
    DECLARE v_rentalExists INT DEFAULT 0;
    DECLARE v_vehicleID INT DEFAULT NULL;
    DECLARE v_isActive TINYINT DEFAULT 0;
    
    -- Input validation
    IF p_rentalID IS NULL OR p_rentalID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid rentalID';
    END IF;
    
    -- Check if rental exists and get vehicle ID and active status
    SELECT COUNT(*), MAX(vehicleID), MAX(isActive) 
    INTO v_rentalExists, v_vehicleID, v_isActive 
    FROM Rentals 
    WHERE rentalID = p_rentalID;
    
    IF v_rentalExists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rental does not exist';
    END IF;
    
    -- Delete rental
    DELETE FROM Rentals WHERE rentalID = p_rentalID;
    
    -- Make the vehicle available again if there are no other rentals for this vehicle
    UPDATE Vehicles 
    SET isAvailable = 1 
    WHERE vehicleID = v_vehicleID
    AND NOT EXISTS (
        SELECT 1 FROM Rentals 
        WHERE vehicleID = v_vehicleID
    );
END
/
/

DELIMITER;

-- DeleteVehicleLocation: Delete a vehicle-location assignment (M:N relationship)
DROP PROCEDURE IF EXISTS DeleteVehicleLocation;

DELIMITER /
/

CREATE PROCEDURE DeleteVehicleLocation(
    IN p_vehicleLocationID INT
)
BEGIN
    DECLARE v_assignmentExists INT DEFAULT 0;
    
    -- Input validation
    IF p_vehicleLocationID IS NULL OR p_vehicleLocationID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vehicleLocationID';
    END IF;
    
    -- Check if assignment exists
    SELECT COUNT(*) INTO v_assignmentExists FROM VehicleLocations WHERE vehicleLocationID = p_vehicleLocationID;
    IF v_assignmentExists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle location assignment does not exist';
    END IF;
    
    -- Delete vehicle location assignment
    DELETE FROM VehicleLocations WHERE vehicleLocationID = p_vehicleLocationID;
END
/
/

DELIMITER;

-- ===========================================
-- M:N UPDATE Operations
-- ===========================================

-- UpsertVehicleLocation: Insert or update a vehicle's location assignment
-- If the vehicle already has a location, update the most recent one
-- Otherwise, insert a new vehicle-location assignment

DROP PROCEDURE IF EXISTS UpsertVehicleLocation;

DELIMITER /
/

CREATE PROCEDURE UpsertVehicleLocation(
    IN p_vehicleID INT,
    IN p_locationID INT
)
BEGIN
    DECLARE v_vehicleExists INT DEFAULT 0;
    DECLARE v_locationExists INT DEFAULT 0;
    
    -- Input validation for p_vehicleID and p_locationID
    IF p_vehicleID IS NULL OR p_vehicleID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vehicleID: must be a positive integer';
    END IF;
    IF p_locationID IS NULL OR p_locationID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid locationID: must be a positive integer';
    END IF;
    
    SELECT COUNT(*) INTO v_vehicleExists FROM Vehicles WHERE vehicleID = p_vehicleID;
    IF v_vehicleExists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'vehicleID does not exist in Vehicles table';
    END IF;
    SELECT COUNT(*) INTO v_locationExists FROM Locations WHERE locationID = p_locationID;
    IF v_locationExists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'locationID does not exist in Locations table';
    END IF;
    
    -- Upsert vehicle location atomically
    INSERT INTO VehicleLocations (vehicleID, locationID)
    VALUES (p_vehicleID, p_locationID)
    ON DUPLICATE KEY UPDATE
        locationID = VALUES(locationID);
END
/
/

DELIMITER;