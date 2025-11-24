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
    DECLARE v_exists INT DEFAULT 0;
    
    -- Check if vehicle already has a location assignment
    SELECT COUNT(*) INTO v_exists
    FROM VehicleLocations
    WHERE vehicleID = p_vehicleID
    LIMIT 1;
    
    IF v_exists > 0 THEN
        -- Update the most recent assignment for this vehicle
        UPDATE VehicleLocations
        SET locationID = p_locationID
        WHERE vehicleID = p_vehicleID
        ORDER BY createdAt DESC
        LIMIT 1;
    ELSE
        -- Insert new vehicle-location assignment
        INSERT INTO VehicleLocations (vehicleID, locationID)
        VALUES (p_vehicleID, p_locationID);
    END IF;
END //

DELIMITER ;