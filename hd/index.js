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
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    
    // Create list items with a "Delete" button for each task
    let rows = result.rows.map(t => `
      <li>
        ${t.content} 
        <form action="/delete/${t.id}" method="POST" style="display:inline;">
          <button type="submit" style="color:red; margin-left:10px;">Delete</button>
        </form>
      </li>
    `).join('');
    
    res.send(`
      <h1>Data-Driven Task App</h1>
      <form action="/add" method="POST">
        <input type="text" name="task" placeholder="Enter a new task" required>
        <button type="submit">Add to Database</button>
      </form>
      <ul>${rows}</ul>
    `);
  } catch (err) {
    res.status(500).send("Database Error");
  }
});

// Save a new task to the database
app.post('/add', async (req, res) => {
  const { task } = req.body;
  const result = await pool.query('INSERT INTO tasks (content) VALUES ($1) RETURNING *', [task]);
  console.log("DATABASE LOG: New entry added ->", result.rows[0]); 
  res.redirect('/');
});

app.post('/delete/:id', async (req, res) => {
  const taskId = req.params.id; // Get the ID from the URL
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    console.log(`Deleted task with ID: ${taskId}`);
    res.redirect('/'); // Refresh the page to show the updated list
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting from DB");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));