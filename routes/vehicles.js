const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Vehicles');
    res.render('vehicles/index', { vehicles: results });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/', async (req, res) => {
  const { model, year, basePrice, isAvailable } = req.body;
  const available = isAvailable ? 1 : 0;
  try {
    await db.query('INSERT INTO Vehicles (model, year, basePrice, isAvailable) VALUES (?, ?, ?, ?)', [model, year, basePrice, available]);
    res.redirect('/vehicles');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Vehicles WHERE vehicleID = ?', [id]);
    res.redirect('/vehicles');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/update/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query('SELECT * FROM Vehicles WHERE vehicleID = ?', [id]);
    res.render('vehicles/update', { vehicle: results[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { model, year, basePrice, isAvailable } = req.body;
  const available = isAvailable ? 1 : 0;
  try {
    await db.query('UPDATE Vehicles SET model = ?, year = ?, basePrice = ?, isAvailable = ? WHERE vehicleID = ?', [model, year, basePrice, available, id]);
    res.redirect('/vehicles');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;