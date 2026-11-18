'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const { USERS } = require('../data/store');
const User = require('../model/User');
const { isDatabaseConnected } = require('../config/db');
const { requireRole } = require('../middelwares/authenticate');
const JWT_SECRET = process.env.JWT_SECRET || 'dragcare_super_secret_jwt_key_2026';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const getMailTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
};

// ==================== AUTH ROUTES ====================

// Register
router.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = isDatabaseConnected()
      ? await User.findOne({ email: normalizedEmail })
      : USERS.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const userData = {
      id: 'usr-' + Date.now(),
      name,
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      role: 'user',
      phone: phone || '',
      createdAt: new Date()
    };

    const newUser = isDatabaseConnected()
      ? await User.create(userData)
      : (USERS.push(userData), userData);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = isDatabaseConnected()
      ? await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
      : USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const transporter = getMailTransporter();
    if (!transporter) {
      return res.status(503).json({ error: 'Password recovery email is not configured. Please contact the administrator.' });
    }

    const user = isDatabaseConnected()
      ? await User.findOne({ email })
      : USERS.find((entry) => entry.email.toLowerCase() === email);
    if (!user) {
      return res.json({ success: true, message: 'If an account exists for this email, password reset instructions will be sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    if (isDatabaseConnected()) {
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = expiresAt;
      await user.save();
    } else {
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = expiresAt;
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;
    const safeName = String(user.name).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Reset your Drag Care password',
        text: `Hello ${user.name},\n\nUse this link to reset your Drag Care password. It expires in one hour:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hello ${safeName},</p><p>Use the link below to reset your Drag Care password. It expires in one hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`
      });
    } catch (mailError) {
      if (isDatabaseConnected()) {
        await User.updateOne(
          { id: user.id, passwordResetTokenHash: tokenHash },
          { $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } }
        );
      } else {
        delete user.passwordResetTokenHash;
        delete user.passwordResetExpiresAt;
      }
      console.error(`Password recovery email could not be sent: ${mailError.message}`);
      return res.status(502).json({ error: 'Unable to send the recovery email right now. Please try again later.' });
    }

    return res.json({ success: true, message: 'If an account exists for this email, password reset instructions will be sent.' });
  } catch (error) {
    console.error(`Password recovery request failed: ${error.message}`);
    return res.status(500).json({ error: 'Unable to process the password recovery request.' });
  }
});

router.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== 'string' || !token || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'A valid reset link and a password of at least 8 characters are required.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const user = isDatabaseConnected()
      ? await User.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: now }
      }).select('+passwordHash +passwordResetTokenHash +passwordResetExpiresAt')
      : USERS.find((entry) => entry.passwordResetTokenHash === tokenHash
        && entry.passwordResetExpiresAt
        && entry.passwordResetExpiresAt > now);
    if (!user) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired. Please request a new one.' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    if (isDatabaseConnected()) await user.save();

    return res.json({ success: true, message: 'Your password has been reset. You can now sign in.' });
  } catch (error) {
    console.error(`Password reset failed: ${error.message}`);
    return res.status(500).json({ error: 'Unable to reset the password right now.' });
  }
});

router.get('/api/auth/me', (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ user: { id, name, email, role } });
});

// Get All Users (Super Admin Only)
router.get('/api/auth/users', requireRole('super-admin'), async (req, res) => {
  const users = isDatabaseConnected()
    ? await User.find().sort({ createdAt: 1 })
    : USERS;
  const safeUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    createdAt: u.createdAt
  }));
  res.json(safeUsers);
});

// Update User Role (Super Admin Only)
router.put('/api/auth/users/:id/role', requireRole('super-admin'), async (req, res) => {
  const { role } = req.body;
  const user = isDatabaseConnected()
    ? await User.findOne({ id: req.params.id })
    : USERS.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (!['user', 'admin', 'super-admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  user.role = role;
  if (isDatabaseConnected()) await user.save();
  res.json({ success: true, message: `Role updated to ${role} for ${user.name}`, user });
});

// Delete User (Super Admin Only)
router.delete('/api/auth/users/:id', requireRole('super-admin'), async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  const targetUser = isDatabaseConnected()
    ? await User.findOne({ id: req.params.id })
    : USERS.find((u) => u.id === req.params.id);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetUser.role === 'super-admin') {
    const superAdmins = isDatabaseConnected()
      ? await User.find({ role: 'super-admin' }).select('id')
      : USERS.filter((u) => u.role === 'super-admin');

    if (superAdmins.length <= 1) {
      return res.status(400).json({ error: 'At least one super admin must remain in the system.' });
    }
  }

  let deleted;
  if (isDatabaseConnected()) {
    deleted = await User.findOneAndDelete({ id: req.params.id });
  } else {
    const index = USERS.findIndex(u => u.id === req.params.id);
    if (index !== -1) deleted = USERS.splice(index, 1)[0];
  }

  if (!deleted) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ success: true, message: `User ${deleted.name} removed successfully` });
});

module.exports = router;
