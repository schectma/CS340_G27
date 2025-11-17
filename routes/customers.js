const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper function to get user-friendly error messages
function getErrorMessage(err) {
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return 'Cannot delete this customer because they have active rentals. Please complete or cancel all their rentals first.';
  }
  if (err.code === 'ER_DUP_ENTRY') {
    if (err.message.includes('customerEmail')) {
      return 'A customer with this email address already exists.';
    }
    if (err.message.includes('customerPhone')) {
      return 'A customer with this phone number already exists.';
    }
    return 'A customer with this information already exists.';
  }
  return 'An unexpected database error occurred.';
}

router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Customers');
    res.render('customers/index', { customers: results, message: req.query.message, error: req.query.error });
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
    const errorMessage = getErrorMessage(err);
    res.redirect(`/customers?error=${encodeURIComponent(errorMessage)}`);
  }
});

router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Customers WHERE customerID = ?', [id]);
    res.redirect('/customers');
  } catch (err) {
    console.error(err);
    const errorMessage = getErrorMessage(err);
    res.redirect(`/customers?error=${encodeURIComponent(errorMessage)}`);
  }
});

module.exports = router;