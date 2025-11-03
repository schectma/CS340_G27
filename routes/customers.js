const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.query('SELECT * FROM Customers', (err, results) => {
    if (err) throw err;
    res.render('customers/index', { customers: results });
  });
});

router.post('/', (req, res) => {
  const { customerName, customerEmail, customerPhone } = req.body;
  db.query('INSERT INTO Customers (customerName, customerEmail, customerPhone) VALUES (?, ?, ?)', [customerName, customerEmail, customerPhone], (err) => {
    if (err) throw err;
    res.redirect('/customers');
  });
});

router.get('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM Customers WHERE customerID = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/customers');
  });
});

module.exports = router;