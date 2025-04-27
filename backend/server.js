require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Import bcrypt
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
      return console.error('Error acquiring client', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
      release(); 
      if (err) {
        return console.error('Error executing query', err.stack);
      }
      console.log('Database connected successfully:', result.rows[0].now);
    });
  });

const JWT_SECRET = process.env.JWT_SECRET || 'w+r8fKxcxkfOHYfSZb2olsx8q6DAQqhcjU0SgVIIUxA='; // Add a JWT secret (move to .env)

const app = express();
const port = process.env.PORT || 5000;

// Import route handlers
const adminRoutes = require('./routes/admin');
const internRoutes = require('./routes/intern');

app.use(cors());
app.use(express.json());

// Our custom middleware is now applied directly in the route files
// No need for a global extractUserFromToken middleware anymore

app.get('/',(req,res) => {
    res.send("Uruti Hub Internship Dashboard Backend is running");
});

// Auth routes
app.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;
    const userRole = role || 'intern'; // Default role for signup if not specified
    
    // Validate role to ensure only allowed values
    if (userRole !== 'intern' && userRole !== 'admin') {
        return res.status(400).json({ message: "Invalid role. Must be 'intern' or 'admin'" });
    }

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert user with hashed password and role
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, password_hash, userRole]
        );

        res.status(201).json({ message: "User created successfully", user: newUser.rows[0] });

    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: "Internal server error during signup" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Fetch user including password hash and role
        const result = await pool.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' }); // User not found
        }

        const user = result.rows[0];

        // Compare provided password with stored hash
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            // Passwords match - Generate JWT
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role
            };
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

            res.status(200).json({
                message: 'Login successful',
                token: token,
                user: { // Return non-sensitive user info
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            // Passwords don't match
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
});

// Apply admin and intern routes
app.use('/api', adminRoutes);
app.use('/api', internRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});