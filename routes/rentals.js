const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper function to get user-friendly error messages
function getErrorMessage(err) {
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return 'Cannot create rental: referenced vehicle, customer, or location does not exist.';
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return 'This rental information already exists.';
  }
  return 'An unexpected database error occurred.';
}

router.get('/', async (req, res) => {
  try {
    // Use LEFT JOIN to pull vehicle model without excluding Rentals that may have missing FK rows
    const [rentals] = await db.query(`
      SELECT r.*, v.model AS vehicleModel, c.customerName AS customerName, l1.locationName AS pickupLocationName, l2.locationName AS dropoffLocationName
      FROM Rentals r
      LEFT JOIN Vehicles v ON r.vehicleID = v.vehicleID
      LEFT JOIN Customers c ON r.customerID = c.customerID
      LEFT JOIN Locations l1 ON r.pickupLocationID = l1.locationID
      LEFT JOIN Locations l2 ON r.dropoffLocationID = l2.locationID
      ORDER BY r.startDate DESC
    `);

    // Include vehicles that are currently rented so they can be reserved at
    // their scheduled return location after the current rental ends.
    const [vehicles] = await db.query(`
      SELECT v.vehicleID, v.model, v.year, v.basePrice, v.isAvailable,
             vl.locationID AS currentLocationID,
             l.locationName AS currentLocationName,
             activeRental.endDate AS earliestStartDate,
             activeRental.dropoffLocationID AS scheduledLocationID,
             scheduledLocation.locationName AS scheduledLocationName
      FROM Vehicles v
      LEFT JOIN (
        SELECT vl1.vehicleID, vl1.locationID
        FROM VehicleLocations vl1
        INNER JOIN (
          SELECT vehicleID, MAX(createdAt) AS latestCreatedAt
          FROM VehicleLocations
          GROUP BY vehicleID
        ) latest ON latest.vehicleID = vl1.vehicleID
                  AND latest.latestCreatedAt = vl1.createdAt
      ) vl ON vl.vehicleID = v.vehicleID
      LEFT JOIN Locations l ON l.locationID = vl.locationID
      LEFT JOIN (
        SELECT r1.vehicleID, DATE_FORMAT(r1.endDate, '%Y-%m-%d') AS endDate,
               r1.dropoffLocationID
        FROM Rentals r1
        INNER JOIN (
          SELECT vehicleID, MIN(endDate) AS earliestEndDate
          FROM Rentals
          WHERE isActive = 1
          GROUP BY vehicleID
        ) r2 ON r2.vehicleID = r1.vehicleID
            AND r2.earliestEndDate = r1.endDate
        WHERE r1.isActive = 1
      ) activeRental ON activeRental.vehicleID = v.vehicleID
      LEFT JOIN Locations scheduledLocation
        ON scheduledLocation.locationID = activeRental.dropoffLocationID
      WHERE v.isAvailable = 1 OR activeRental.vehicleID IS NOT NULL
      ORDER BY v.model
    `);
    const [customers] = await db.query('SELECT customerID, customerName FROM Customers ORDER BY customerName');
    const [locations] = await db.query('SELECT locationID, locationName FROM Locations ORDER BY locationName');

    res.render('rentals/index', { rentals, vehicles, customers, locations, error: req.query.error });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// Handle creation of a new rental from the inline form
router.post('/', async (req, res) => {
  const { vehicleID, customerID, pickupLocationID, dropoffLocationID, startDate, endDate, totalCost, isActive } = req.body;
  const active = isActive ? 1 : 0;

  // Basic validation consistent with other routes in repo
  if (!vehicleID || !customerID || !pickupLocationID || !dropoffLocationID || !startDate || !endDate) {
    console.error('Missing required rental field');
    return res.redirect('/rentals?error=' + encodeURIComponent('Missing required field'));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return res.redirect('/rentals?error=' + encodeURIComponent('Dates must use the YYYY-MM-DD format'));
  }
  if (startDate > endDate) {
    return res.redirect('/rentals?error=' + encodeURIComponent('Start date must be before or equal to end date'));
  }

  try {
    const [vehicleRows] = await db.query(`
      SELECT v.isAvailable, vl.locationID AS currentLocationID
      FROM Vehicles v
      LEFT JOIN (
        SELECT vl1.vehicleID, vl1.locationID
        FROM VehicleLocations vl1
        INNER JOIN (
          SELECT vehicleID, MAX(createdAt) AS latestCreatedAt
          FROM VehicleLocations
          GROUP BY vehicleID
        ) latest ON latest.vehicleID = vl1.vehicleID
                  AND latest.latestCreatedAt = vl1.createdAt
      ) vl ON vl.vehicleID = v.vehicleID
      WHERE v.vehicleID = ?
    `, [vehicleID]);
    if (vehicleRows.length === 0) {
      return res.redirect('/rentals?error=' + encodeURIComponent('This vehicle does not exist.'));
    }

    const [activeRentals] = await db.query(`
      SELECT pickupLocationID, dropoffLocationID,
             DATE_FORMAT(startDate, '%Y-%m-%d') AS startDate,
             DATE_FORMAT(endDate, '%Y-%m-%d') AS endDate
      FROM Rentals
      WHERE vehicleID = ? AND isActive = 1
      ORDER BY endDate
    `, [vehicleID]);

    const vehicle = vehicleRows[0];
    const overlappingRental = activeRentals.find(rental =>
      startDate < rental.endDate && endDate > rental.startDate
    );
    if (overlappingRental) {
      return res.redirect('/rentals?error=' + encodeURIComponent(
        `This vehicle is already reserved from ${overlappingRental.startDate} through ${overlappingRental.endDate}.`
      ));
    }

    let expectedLocationID = vehicle.currentLocationID;
    if (activeRentals.length > 0) {
      const completedBeforeStart = activeRentals.filter(rental => rental.endDate <= startDate);
      if (completedBeforeStart.length > 0) {
        expectedLocationID = completedBeforeStart[completedBeforeStart.length - 1].dropoffLocationID;
      }
    } else if (!vehicle.isAvailable) {
      return res.redirect('/rentals?error=' + encodeURIComponent(
        'This vehicle is unavailable and has no scheduled return. Please select a different vehicle.'
      ));
    }

    if (!expectedLocationID) {
      return res.redirect('/rentals?error=' + encodeURIComponent(
        'This vehicle has no recorded location and cannot be booked until its location is recorded.'
      ));
    }
    if (String(pickupLocationID) !== String(expectedLocationID)) {
      return res.redirect('/rentals?error=' + encodeURIComponent(
        'The selected vehicle is not available at that pickup location for the selected dates.'
      ));
    }

    const nextRental = activeRentals.find(rental =>
      rental.startDate >= endDate && rental.startDate > startDate
    );
    if (nextRental && String(dropoffLocationID) !== String(nextRental.pickupLocationID)) {
      return res.redirect('/rentals?error=' + encodeURIComponent(
        'This vehicle must be dropped off at the next scheduled rental pickup location.'
      ));
    }

    await db.query(
      `INSERT INTO Rentals (vehicleID, customerID, pickupLocationID, dropoffLocationID, startDate, endDate, totalCost, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicleID, customerID, pickupLocationID, dropoffLocationID, startDate, endDate, totalCost || 0, active]
    );

    // Update vehicle availability to unavailable when any rental is created
    await db.query('UPDATE Vehicles SET isAvailable = 0 WHERE vehicleID = ?', [vehicleID]);

    res.redirect('/rentals');
  } catch (err) {
    console.error(err);
    const errorMessage = getErrorMessage(err);
    res.redirect(`/rentals?error=${encodeURIComponent(errorMessage)}`);
  }
});

// Delete a rental
router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Call stored procedure to delete rental
    await db.query('CALL DeleteRental(?)', [id]);
    res.redirect('/rentals');
  } catch (err) {
    console.error(err);
    const errorMessage = getErrorMessage(err);
    res.redirect(`/rentals?error=${encodeURIComponent(errorMessage)}`);
  }
});

// API endpoint to get vehicle's current location
router.get('/vehicle-location/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(`
      SELECT
        COALESCE(
          (
            SELECT r.dropoffLocationID
            FROM Rentals r
            WHERE r.vehicleID = ? AND r.isActive = 1
            ORDER BY r.endDate
            LIMIT 1
          ),
          currentLocation.locationID
        ) AS locationID,
        COALESCE(
          (
            SELECT l.locationName
            FROM Rentals r
            JOIN Locations l ON l.locationID = r.dropoffLocationID
            WHERE r.vehicleID = ? AND r.isActive = 1
            ORDER BY r.endDate
            LIMIT 1
          ),
          currentLocation.locationName
        ) AS locationName,
        (
          SELECT DATE_FORMAT(r.endDate, '%Y-%m-%d')
          FROM Rentals r
          WHERE r.vehicleID = ? AND r.isActive = 1
          ORDER BY r.endDate
          LIMIT 1
        ) AS earliestStartDate
      FROM (
        SELECT 1 AS vehicleRow
      ) seed
      LEFT JOIN (
        SELECT vl.locationID, l.locationName
        FROM VehicleLocations vl
        JOIN Locations l ON l.locationID = vl.locationID
        WHERE vl.vehicleID = ?
        ORDER BY vl.createdAt DESC
        LIMIT 1
      ) currentLocation ON 1 = 1
    `, [id, id, id, id]);
    
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json({ locationID: null, locationName: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicle location' });
  }
});

module.exports = router;
