const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    // Use LEFT JOIN to pull vehicle model without excluding Rentals that may have missing FK rows
    const [results] = await db.query(`
      SELECT r.*, v.model AS vehicleModel, c.customerName AS customerName, l1.locationName AS pickupLocationName, l2.locationName AS dropoffLocationName
      FROM Rentals r
      LEFT JOIN Vehicles v ON r.vehicleID = v.vehicleID
      LEFT JOIN Customers c ON r.customerID = c.customerID
      LEFT JOIN Locations l1 ON r.pickupLocationID = l1.locationID
      LEFT JOIN Locations l2 ON r.dropoffLocationID = l2.locationID
      ORDER BY r.startDate DESC
    `);

    res.render('rentals/index', { rentals: results });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;