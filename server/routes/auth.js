import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendWelcomeEmail } from '../services/notifications.js';
import { auth } from '../middleware/auth.js';
import { isCreatorEmail } from '../utils/creator.js';

const router = express.Router();

function authPayload(user, token) {
  return {
    token,
    user: user.toJSON(),
    role: user.role,
    planStatus: user.planStatus,
    currentPeriodEnd: user.currentPeriodEnd,
    tiktokShopConnected: user.tiktokShopConnected,
  };
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const creator = isCreatorEmail(email);
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);

    const user = new User({
      email,
      password,
      name,
      role: creator ? 'creator' : 'user',
      planStatus: creator ? 'active' : 'inactive',
      currentPeriodEnd: creator ? farFuture : null,
    });
    await user.save();
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    // Send welcome email
    await sendWelcomeEmail(user);
    
    res.status(201).json(authPayload(user, token));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.json(authPayload(user, token));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('shops');
    const json = user.toJSON();
    res.json({
      ...json,
      role: user.role,
      planStatus: user.planStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      tiktokShopConnected: user.tiktokShopConnected,
      locale: user.locale,
      isStaff: user.role === 'admin' || user.role === 'creator',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user preferences
router.patch('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (req.body.alertPreferences) {
      user.alertPreferences = { ...user.alertPreferences, ...req.body.alertPreferences };
    }
    if (req.body.locale && ['es', 'en'].includes(req.body.locale)) {
      user.locale = req.body.locale;
    }
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
