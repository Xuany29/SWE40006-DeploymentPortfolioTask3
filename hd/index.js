const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render/Managed DBs
});

// Initialize Database Table
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
initDb();

// Routes
// Fetch all tasks and display in a simple HTML layout
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    let rows = result.rows.map(t => `<li>${t.content} <small>(${t.created_at.toLocaleString()})</small></li>`).join('');
    
    res.send(`
      <h1>Task Manager</h1>
      <form action="/add" method="POST">
        <input type="text" name="task" placeholder="Enter a new task" required>
        <button type="submit">Add to Database</button>
      </form>
      <ul>${rows}</ul>
    `);
  } catch (err) {
    res.status(500).send("Database Error: " + err.message);
  }
});

// Save a new task to the database
app.post('/add', async (req, res) => {
  const { task } = req.body;
  try {
    await pool.query('INSERT INTO tasks (content) VALUES ($1)', [task]);
    res.redirect('/');
  } catch (err) {
    res.status(500).send("Error saving to DB");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));