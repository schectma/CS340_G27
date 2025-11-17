const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper function to get user-friendly error messages
function getErrorMessage(err) {
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return 'Cannot delete this location because it is used in active rentals. Please complete or update all rentals using this location first.';
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return 'A location with this name already exists.';
  }
  return 'An unexpected database error occurred.';
}

router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Locations');
    res.render('locations/index', { locations: results, error: req.query.error });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/', async (req, res) => {
  const { locationName } = req.body;
  try {
    await db.query('INSERT INTO Locations (locationName) VALUES (?)', [locationName]);
    res.redirect('/locations');
  } catch (err) {
    console.error(err);
    const errorMessage = getErrorMessage(err);
    res.redirect(`/locations?error=${encodeURIComponent(errorMessage)}`);
  }
});

router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Locations WHERE locationID = ?', [id]);
    res.redirect('/locations');
  } catch (err) {
    console.error(err);
    const errorMessage = getErrorMessage(err);
    res.redirect(`/locations?error=${encodeURIComponent(errorMessage)}`);
  }
});

module.exports = router;