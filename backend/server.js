require('dotenv').config()
const express = require('express');
const cors = require('cors');

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


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/',(req,res) => {
    res.send("Auth demo backend is running");
});

app.post('/signup',async (req,res) => {
    const {email,password} = req.body;
  
if(!email || !password) {
    return res.status(400).json({message:"Email and password are required"})
}

try{
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1',[email]);
    if (existingUser.rows.length > 0 ) {
        return res.status(400).json({message:"User already exists"});
    }

    const newUser = await pool.query('INSERT INTO users (email,password) VALUES ($1,$2) RETURNING id,email',[email,password]);

    res.status(201).json({message:"User created successfully",user:newUser.rows[0]});

    
}

catch (error){
    console.error('Error during signup:',error);
    res.status(500).json({message:"Internal server error during signup"});
}
});

app.post('/login', async (req,res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    try {
        const user = await pool.query('SELECT id, email FROM users WHERE email = $1 AND password = $2', [email,password]);

        if(user.rows.length > 0){
            res.status(200).json({
                message:'Login successfull',
                user: user.rows[0]
            });
        } else{
            res.status(401).json({message: 'Invalid credentials'});
        }
    } catch (error){
        console.error('Error during login:',error);
        res.status(500).json({ message: 'Internal server error during login'});
    }
});

app.listen(port, () => {
    console.log (`Server running on port ${port}`);
});