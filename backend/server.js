require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Import bcrypt
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

// Import the db module that handles database connections
const db = require('./utils/db');

const JWT_SECRET = process.env.JWT_SECRET || 'w+r8fKxcxkfOHYfSZb2olsx8q6DAQqhcjU0SgVIIUxA='; // Add a JWT secret (move to .env)

const app = express();
const port = process.env.PORT || 5000;

// Import route handlers
const adminRoutes = require('./routes/admin');
const internRoutes = require('./routes/intern');

// Configure CORS to allow requests from frontend domain
// This is a critical security configuration
const allowedOrigins = [
  'https://uruti-hub-frontend.netlify.app',  // Production frontend URL
  'http://localhost:5173',                    // Development frontend URL
  'http://localhost:3000'                     // Another common dev port
];

const corsOptions = {
  origin: function(origin, callback) {
    // Enhanced CORS debugging logs
    console.log('CORS check: Request Origin received:', origin);
    console.log('CORS check: Allowed Origins list:', allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    // OR requests from the allowed origins list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS check: Origin ALLOWED:', origin || 'No Origin');
      callback(null, true);
    } else {
      console.error('CORS check: Origin BLOCKED:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Our custom middleware is now applied directly in the route files
// No need for a global extractUserFromToken middleware anymore

app.get('/',(req,res) => {
    res.send("Uruti Hub Internship Dashboard Backend is running");
});

// Explicit OPTIONS handler for /login BEFORE the POST /login route
app.options('/login', cors(corsOptions), (req, res) => {
    console.log('Received OPTIONS request for /login. Sending CORS headers.');
    res.sendStatus(204); // Respond with 204 No Content for preflight
});

// Auth route - Only /login endpoint is kept
// NOTE: Public /signup endpoint has been removed as per PRD requirements
// Interns are now created by admins via POST /api/interns which creates both user and intern records
app.post('/login', async (req, res) => {
    console.log('POST /login route hit. Processing login attempt.');
    const { email, password } = req.body;

    if (!email || !password) {
        console.log('Login failed: Missing email or password');
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Fetch user including password hash and role - Using db.query from the db module
        const result = await db.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);

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
        }    } catch (error) {
        console.error('Error during login:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Internal server error during login' });
    }
});

// Apply admin and intern routes
app.use('/api', adminRoutes);
app.use('/api', internRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});