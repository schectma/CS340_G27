
/*****************************************************************
* DML based on example provided on PS3 Draft assignment page.
*****************************************************************/

-- ==========================
-- Customers (CRD)
-- ==========================

-- Get all customers and their info for customers page
SELECT customerID, customerName, customerEmail, customerPhone, createdAt
FROM Customers
ORDER BY customerName;

-- Create a new customer for the customers page
INSERT INTO Customers (customerName, customerEmail, customerPhone)
VALUES (@customerName, @customerEmail, @customerPhone);

-- Delete a customer from the customers page
DELETE FROM Customers
WHERE customerID = @customerID;

-- Update a customer
UPDATE Customers
SET customerName = @customerName,
    customerEmail = @customerEmail,
    customerPhone = @customerPhone
WHERE customerID = @customerID;


-- ==========================
-- Vehicles (full CRUD)
-- ==========================

-- Get all vehicles and their info for vechicles page
SELECT vehicleID, model, year, basePrice, isAvailable, createdAt
FROM Vehicles
ORDER BY model, year;

-- Get a single vehicle for the update form
SELECT vehicleID, model, year, basePrice, isAvailable
FROM Vehicles
WHERE vehicleID = @vehicleID;

-- Insert a new vehicle into the vehicles table
INSERT INTO Vehicles (model, year, basePrice, isAvailable)
VALUES (@model, @year, @basePrice, @isAvailable);

-- Update a vehicle
UPDATE Vehicles
SET model = @model,
    year = @year,
    basePrice = @basePrice,
    isAvailable = @isAvailable
WHERE vehicleID = @vehicleID;

-- Delete a vehicle
DELETE FROM Vehicles
WHERE vehicleID = @vehicleID;


-- ==========================
-- Locations (CRD)
-- ==========================

-- Get all locations and their info for locations page
SELECT locationID, locationName, createdAt
FROM Locations
ORDER BY locationName;

-- Insert a new location
INSERT INTO Locations (locationName)
VALUES (@locationName);

-- Delete a location
DELETE FROM Locations
WHERE locationID = @locationID;

-- Update a location
UPDATE Locations
SET locationName = @locationName
WHERE locationID = @locationID;


-- ==========================
-- VehicleLocations (CRD)
-- ==========================

-- Get all vehicle-location pairs
SELECT vl.vehicleLocationID, vl.vehicleID, v.model, vl.locationID, l.locationName, vl.createdAt
FROM VehicleLocations vl
JOIN Vehicles v ON vl.vehicleID = v.vehicleID
JOIN Locations l ON vl.locationID = l.locationID
ORDER BY v.model, l.locationName;

-- Insert (add vehicle to location)
INSERT INTO VehicleLocations (vehicleID, locationID)
VALUES (@vehicleID, @locationID);

-- Delete an assignment (remove vehicle from location)
DELETE FROM VehicleLocations
WHERE vehicleLocationID = @vehicleLocationID;

-- Update a vehicle-location assignment (example: change location for the latest assignment for a vehicle)
UPDATE VehicleLocations
SET locationID = @locationID
WHERE vehicleID = @vehicleID
ORDER BY createdAt DESC
LIMIT 1;

-- Or update by primary key
UPDATE VehicleLocations
SET vehicleID = @vehicleID,
    locationID = @locationID
WHERE vehicleLocationID = @vehicleLocationID;


-- ==========================
-- Rentals (full CRUD)
-- ==========================

-- Get all rentals and their info for rentals page
SELECT r.rentalID,
       r.vehicleID,
       v.model AS vehicleModel,
       r.customerID,
       c.customerName,
       r.pickupLocationID,
       pl.locationName AS pickupLocationName,
       r.dropoffLocationID,
       dl.locationName AS dropoffLocationName,
       r.startDate,
       r.endDate,
       r.totalCost,
       r.isActive,
       r.createdAt
FROM Rentals r -- Use JOINS to show names instead of IDs
JOIN Vehicles v ON r.vehicleID = v.vehicleID
JOIN Customers c ON r.customerID = c.customerID
JOIN Locations pl ON r.pickupLocationID = pl.locationID
JOIN Locations dl ON r.dropoffLocationID = dl.locationID
ORDER BY r.startDate DESC;

-- Get the data needed to populate the New Rental form (dropdowns)
SELECT vehicleID, model, year, basePrice, isAvailable
FROM Vehicles
ORDER BY model;

-- Customers for dropdown
SELECT customerID, customerName
FROM Customers
ORDER BY customerName;

-- Locations for pickup/dropoff dropdowns
SELECT locationID, locationName
FROM Locations
ORDER BY locationName;

-- Insert a new rental
INSERT INTO Rentals (vehicleID, customerID, pickupLocationID, dropoffLocationID, startDate, endDate, totalCost, isActive)
VALUES (@vehicleID, @customerID, @pickupLocationID, @dropoffLocationID, @startDate, @endDate, @totalCost, @isActive);

-- Delete a rental
DELETE FROM Rentals
WHERE rentalID = @rentalID;

-- Update to mark a rental active/inactive
UPDATE Rentals
SET isActive = @isActive
WHERE rentalID = @rentalID;
