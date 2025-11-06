const express = require('express');
const router = express.Router();
const db = require('../db');

// List all vehicle-location assignments and provide vehicles/locations for the add form
router.get('/', (req, res) => {
  const listSql = `
    SELECT vl.vehicleLocationID, vl.vehicleID, v.model, vl.locationID, l.locationName, vl.createdAt
    FROM VehicleLocations vl
    JOIN Vehicles v ON vl.vehicleID = v.vehicleID
    JOIN Locations l ON vl.locationID = l.locationID
    ORDER BY v.model, l.locationName
  `;

  db.query(listSql, (err, results) => {
    if (err) throw err;
    // fetch vehicles and locations for dropdowns
    db.query('SELECT vehicleID, model, year, isAvailable FROM Vehicles ORDER BY model', (err2, vehicles) => {
      if (err2) throw err2;
      db.query('SELECT locationID, locationName FROM Locations ORDER BY locationName', (err3, locations) => {
        if (err3) throw err3;
        res.render('vehicles_locations/index', { vehicleLocations: results, vehicles, locations });
      });
    });
  });
});

// Update a vehicle-location assignment
router.post('/', (req, res) => {
  const { vehicleID, locationID } = req.body;
  const updateSql = 'UPDATE VehicleLocations SET locationID = ? WHERE vehicleID = ? ORDER BY createdAt DESC LIMIT 1';
  db.query(updateSql, [locationID, vehicleID], (err, result) => {
    if (err) throw err;
    res.redirect('/vehicles_locations');
  });
});

// Delete an assignment
router.get('/delete/:id', (req, res) => {
  const { id } = req.params;
  res.redirect('/vehicles_locations');
});

module.exports = router;
