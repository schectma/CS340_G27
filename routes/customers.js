const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Customers');
    res.render('customers/index', { customers: results });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/', async (req, res) => {
  const { customerName, customerEmail, customerPhone } = req.body;
  try {
    await db.query('INSERT INTO Customers (customerName, customerEmail, customerPhone) VALUES (?, ?, ?)', [customerName, customerEmail, customerPhone]);
    res.redirect('/customers');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Customers WHERE customerID = ?', [id]);
    res.redirect('/customers');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;