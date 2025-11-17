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

    // Fetch dropdown data for inline Add Rental form
    const [vehicles] = await db.query('SELECT vehicleID, model, year, isAvailable FROM Vehicles ORDER BY model');
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
    return res.status(400).send('Missing required field');
  }
  if (startDate > endDate) {
    return res.status(400).send('Start date must be before or equal to end date');
  }

  try {
    await db.query(
      `INSERT INTO Rentals (vehicleID, customerID, pickupLocationID, dropoffLocationID, startDate, endDate, totalCost, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicleID, customerID, pickupLocationID, dropoffLocationID, startDate, endDate, totalCost || 0, active]
    );
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
    await db.query('DELETE FROM Rentals WHERE rentalID = ?', [id]);
    res.redirect('/rentals');
  } catch (err) {
    console.error(err);
    const errorMessage = getErrorMessage(err);
    res.redirect(`/rentals?error=${encodeURIComponent(errorMessage)}`);
  }
});

module.exports = router;
