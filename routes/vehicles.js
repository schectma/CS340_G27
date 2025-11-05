const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.query('SELECT * FROM Vehicles', (err, results) => {
    if (err) throw err;
    res.render('vehicles/index', { vehicles: results });
  });
});

router.post('/', (req, res) => {
  const { model, year, basePrice, isAvailable } = req.body;
  const available = isAvailable ? 1 : 0;
  db.query('INSERT INTO Vehicles (model, year, basePrice, isAvailable) VALUES (?, ?, ?, ?)', [model, year, basePrice, available], (err) => {
    if (err) throw err;
    res.redirect('/vehicles');
  });
});

router.get('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM Vehicles WHERE vehicleID = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/vehicles');
  });
});

router.get('/update/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM Vehicles WHERE vehicleID = ?', [id], (err, results) => {
    if (err) throw err;
    res.render('vehicles/update', { vehicle: results[0] });
  });
});

router.post('/update/:id', (req, res) => {
  const { id } = req.params;
  const { model, year, basePrice, isAvailable } = req.body;
  const available = isAvailable ? 1 : 0;
  db.query('UPDATE Vehicles SET model = ?, year = ?, basePrice = ?, isAvailable = ? WHERE vehicleID = ?', [model, year, basePrice, available, id], (err) => {
    if (err) throw err;
    res.redirect('/vehicles');
  });
});

module.exports = router;