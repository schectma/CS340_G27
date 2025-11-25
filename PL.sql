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
    -- Upsert vehicle location atomically
    INSERT INTO VehicleLocations (vehicleID, locationID)
    VALUES (p_vehicleID, p_locationID)
    ON DUPLICATE KEY UPDATE
        locationID = VALUES(locationID);
END //

DELIMITER ;