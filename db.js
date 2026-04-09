require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection with retry logic for Railway deployment
async function testConnection(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('Connected to MySQL database');
      
      // Check if tables exist, call ResetDatabase() if not (Railway auto-init)
      const [tables] = await connection.query("SHOW TABLES LIKE 'Customers'");
      if (tables.length === 0) {
        console.log('No tables found. Calling ResetDatabase()...');
        await connection.query('CALL ResetDatabase()');
        console.log('Database initialized via ResetDatabase() stored procedure');
      } else {
        console.log('Tables already exist');
      }
      
      connection.release();
      return;
    } catch (error) {
      console.log(`Database connection attempt ${i + 1}/${retries} failed. Retrying in 3s...`);
      if (i === retries - 1) {
        console.error('Error connecting to MySQL:', error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Store the connection promise so app.js can await it
const connectionPromise = testConnection();

module.exports = pool;
module.exports.ready = connectionPromise;