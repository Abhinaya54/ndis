const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

const buildSafeAuthMeta = (body = {}) => ({
  email: body.email,
  role: body.role,
  password: body.password ? '***masked***' : undefined
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      request: buildSafeAuthMeta(req.body)
    });
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      request: buildSafeAuthMeta(req.body)
    });
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/verify-password - verify current user's password (for supervisor gated access)
router.post('/verify-password', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    res.json({ success: true, message: 'Password verified' });
  } catch (error) {
    console.error('Verify password error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      userId: req.user?._id,
      request: buildSafeAuthMeta(req.body)
    });
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;
