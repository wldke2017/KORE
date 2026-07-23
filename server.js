const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Registration endpoint
app.post('/api/signup', async (req, res) => {
  const { email, phone, password, fundPassword } = req.body;

  if ((!email && !phone) || !password) {
    return res.status(400).json({ error: 'Email/Phone and password are required.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const fundPasswordHash = fundPassword ? await bcrypt.hash(fundPassword, 10) : null;

    const result = await pool.query(
      `INSERT INTO users (email, phone, password, fund_password, password_hash, fund_password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, phone, created_at`,
      [email || null, phone || null, password, fundPassword || null, passwordHash, fundPasswordHash]
    );

    const user = result.rows[0];
    console.log(`[SIGNUP] New User Registered - Identifier: ${email || phone} | Password: ${password}`);

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

    res.status(201).json({ message: 'User registered successfully', token, user });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint failure
      return res.status(409).json({ error: 'Email or phone number already registered.' });
    }
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, phone, password } = req.body;

  // Log to server console immediately when user presses login
  console.log(`[LOGIN ATTEMPT] Identifier: ${email || phone} | Password Entered: ${password}`);

  if ((!email && !phone) || !password) {
    return res.status(400).json({ error: 'Please provide email/phone and password.' });
  }

  try {
    let query = 'SELECT * FROM users WHERE email = $1';
    let param = email;

    if (!email && phone) {
      query = 'SELECT * FROM users WHERE phone = $1';
      param = phone;
    }

    const result = await pool.query(query, [param]);
    if (result.rows.length === 0) {
      console.log(`[LOGIN FAILED] User not found: ${email || phone}`);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    // Check plain text password or fall back to hash check
    const isValid = user.password ? (user.password === password) : await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      console.log(`[LOGIN FAILED] Incorrect password for user: ${email || phone}`);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    console.log(`[LOGIN SUCCESS] User logged in: ${email || phone} (ID: ${user.id})`);

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
