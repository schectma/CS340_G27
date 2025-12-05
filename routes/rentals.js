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

    // Fetch dropdown data for inline Add Rental form - only show vehicles without active rentals
    const [vehicles] = await db.query(`
      SELECT v.vehicleID, v.model, v.year, v.basePrice, v.isAvailable 
      FROM Vehicles v
      WHERE v.isAvailable = 1
      AND NOT EXISTS (
        SELECT 1 FROM Rentals r 
        WHERE r.vehicleID = v.vehicleID 
        AND r.isActive = 1
      )
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
  if (startDate > endDate) {
    return res.redirect('/rentals?error=' + encodeURIComponent('Start date must be before or equal to end date'));
  }

  try {
    // Check if vehicle is available and not on an active rental
    const [vehicle] = await db.query(
      `SELECT isAvailable FROM Vehicles 
       WHERE vehicleID = ? 
       AND isAvailable = 1
       AND NOT EXISTS (SELECT 1 FROM Rentals WHERE vehicleID = ? AND isActive = 1)`,
      [vehicleID, vehicleID]
    );
    if (!vehicle) {
      return res.redirect('/rentals?error=' + encodeURIComponent('This vehicle is currently unavailable or on an active rental. Please select a different vehicle.'));
    }
    if (!vehicle[0].isAvailable) {
      return res.redirect('/rentals?error=' + encodeURIComponent('This vehicle is currently unavailable. Please select a different vehicle.'));
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
    // Get the most recent vehicle location for available vehicles
    const [result] = await db.query(`
      SELECT vl.locationID, l.locationName 
      FROM VehicleLocations vl
      JOIN Locations l ON vl.locationID = l.locationID
      WHERE vl.vehicleID = ?
      ORDER BY vl.createdAt DESC
      LIMIT 1
    `, [id]);
    
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
