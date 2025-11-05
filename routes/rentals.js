const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.query('SELECT * FROM Rentals', (err, results) => {
    if (err) throw err;
    res.render('rentals/index', { rentals: results });
  });
});

module.exports = router;