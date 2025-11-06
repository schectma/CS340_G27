const express = require('express');
const router = express.Router();
const db = require('../db');

// List all vehicle-location assignments and provide vehicles/locations for the add form
router.get('/', async (req, res) => {
  const listSql = `
    SELECT vl.vehicleLocationID, vl.vehicleID, v.model, vl.locationID, l.locationName, vl.createdAt
    FROM VehicleLocations vl
    JOIN Vehicles v ON vl.vehicleID = v.vehicleID
    JOIN Locations l ON vl.locationID = l.locationID
    ORDER BY v.model, l.locationName
  `;

  try {
    const [results] = await db.query(listSql);
    const [vehicles] = await db.query('SELECT vehicleID, model, year, isAvailable FROM Vehicles ORDER BY model');
    const [locations] = await db.query('SELECT locationID, locationName FROM Locations ORDER BY locationName');
    res.render('vehicles_locations/index', { vehicleLocations: results, vehicles, locations });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// Update a vehicle-location assignment
router.post('/', async (req, res) => {
  const { vehicleID, locationID } = req.body;
  const updateSql = 'UPDATE VehicleLocations SET locationID = ? WHERE vehicleID = ? ORDER BY createdAt DESC LIMIT 1';
  try {
    await db.query(updateSql, [locationID, vehicleID]);
    res.redirect('/vehicles_locations');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// Delete an assignment (no-op in previous code; keep redirect)
router.get('/delete/:id', (req, res) => {
  res.redirect('/vehicles_locations');
});

module.exports = router;
