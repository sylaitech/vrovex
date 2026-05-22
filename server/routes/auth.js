import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../server.js';
import { sendWelcomeEmail } from '../services/notifications.js';
import { auth } from '../middleware/auth.js';
import { isCreatorEmail } from '../utils/creator.js';
import logger from '../utils/logger.js';

const router = express.Router();

function authPayload(user, token) {
  return {
    token,
    user,
    role: user.role,
    planStatus: user.plan_status,
    currentPeriodEnd: user.current_period_end,
    tiktokShopConnected: user.tiktok_shop_connected,
  };
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const creator = isCreatorEmail(email);
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);
    
    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        name,
        role: creator ? 'creator' : 'user',
        plan_status: creator ? 'active' : 'inactive',
        current_period_end: creator ? farFuture.toISOString() : null,
        email_verified: false,
        locale: 'es'
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        role: newUser.role,
        planStatus: newUser.plan_status
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send welcome email
    try {
      await sendWelcomeEmail({ email: newUser.email, name: newUser.name });
    } catch (emailError) {
      logger.warn('Welcome email failed:', emailError.message);
    }
    
    res.status(201).json(authPayload(newUser, token));
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        planStatus: user.plan_status
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json(authPayload(user, token));
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's shops
    const { data: shops } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', req.userId);
    
    res.json({
      ...user,
      shops: shops || [],
      role: user.role,
      planStatus: user.plan_status,
      currentPeriodEnd: user.current_period_end,
      tiktokShopConnected: user.tiktok_shop_connected
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
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
