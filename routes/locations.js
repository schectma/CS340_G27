const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Locations');
    res.render('locations/index', { locations: results });
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
    res.status(500).send('Database error');
  }
});

router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Locations WHERE locationID = ?', [id]);
    res.redirect('/locations');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;