-- Stored Procedures for Vehicle Rental System

-- UpsertVehicleLocation: Insert or update a vehicle's location assignment
-- If the vehicle already has a location, update the most recent one
-- Otherwise, insert a new vehicle-location assignment

DROP PROCEDURE IF EXISTS UpsertVehicleLocation;

DELIMITER //

CREATE PROCEDURE UpsertVehicleLocation(
    IN p_vehicleID INT,
    IN p_locationID INT
)
BEGIN
    -- Input validation for p_vehicleID and p_locationID
    IF p_vehicleID IS NULL OR p_vehicleID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid vehicleID: must be a positive integer';
    END IF;
    IF p_locationID IS NULL OR p_locationID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid locationID: must be a positive integer';
    END IF;
    DECLARE v_vehicleExists INT DEFAULT 0;
    DECLARE v_locationExists INT DEFAULT 0;
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
END //

DELIMITER ;