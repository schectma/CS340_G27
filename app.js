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
// app.use('/vehicles', require('./routes/vehicles'));
app.use('/locations', require('./routes/locations'));
// app.use('/rentals', require('./routes/rentals'));

app.get('/', (req, res) => {
  res.redirect('/customers');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});