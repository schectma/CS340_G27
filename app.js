const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const app = express();
const db = require('./db');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use('/customers', require('./routes/customers'));
app.use('/vehicles', require('./routes/vehicles'));
app.use('/locations', require('./routes/locations'));
app.use('/rentals', require('./routes/rentals'));
app.use('/vehicles_locations', require('./routes/vehicles_locations'));

// Reset database route
app.post('/reset', async (req, res) => {
  try {
    await db.query('CALL ResetDatabase()');
    res.redirect('/customers?message=Database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    const errorMessage = 'Failed to reset database. Please ensure the ResetDatabase stored procedure exists and try again.';
    res.redirect(`/customers?error=${encodeURIComponent(errorMessage)}`);
  }
});

app.get('/', (req, res) => {
  res.redirect('/customers');
});


// Error handling middleware (should be after all routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
