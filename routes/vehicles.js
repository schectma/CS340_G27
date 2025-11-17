const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper function to get user-friendly error messages
function getErrorMessage(err) {
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return 'Cannot delete this vehicle because it has active rentals. Please complete all rentals for this vehicle first.';
  }
  if (err.code === 'ER_DUP_ENTRY') {
    if (err.message.includes('model')) {
      return 'A vehicle with this model already exists.';
    }
    return 'A vehicle with this information already exists.';
  }
  return 'An unexpected database error occurred.';
}

router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Vehicles');
    res.render('vehicles/index', { vehicles: results, error: req.query.error });
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
    const errorMessage = getErrorMessage(err);
    res.redirect(`/vehicles?error=${encodeURIComponent(errorMessage)}`);
  }
});

router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Vehicles WHERE vehicleID = ?', [id]);
    res.redirect('/vehicles');
  } catch (err) {
    console.error(err);
    const errorMessage = getErrorMessage(err);
    res.redirect(`/vehicles?error=${encodeURIComponent(errorMessage)}`);
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
    const errorMessage = getErrorMessage(err);
    res.redirect(`/vehicles?error=${encodeURIComponent(errorMessage)}`);
  }
});

module.exports = router;