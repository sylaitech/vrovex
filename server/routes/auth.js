import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase } from '../server.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/notifications.js';
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

async function normalizeExpiredSubscription(user) {
  if (!user || user.plan_status !== 'active' || !user.current_period_end) {
    return user;
  }

  const expiresAt = new Date(user.current_period_end);
  if (expiresAt <= new Date()) {
    await supabase
      .from('users')
      .update({ plan_status: 'inactive' })
      .eq('id', user.id);

    return {
      ...user,
      plan_status: 'inactive'
    };
  }

  return user;
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

    const normalizedUser = await normalizeExpiredSubscription(user);
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: normalizedUser.id,
        email: normalizedUser.email,
        role: normalizedUser.role,
        planStatus: normalizedUser.plan_status
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json(authPayload(normalizedUser, token));
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

    const normalizedUser = await normalizeExpiredSubscription(user);
    
    // Get user's shops
    const { data: shops } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', req.userId);
    
    res.json({
      ...normalizedUser,
      shops: shops || [],
      role: normalizedUser.role,
      planStatus: normalizedUser.plan_status,
      currentPeriodEnd: normalizedUser.current_period_end,
      tiktokShopConnected: normalizedUser.tiktok_shop_connected
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/preferences', auth, async (req, res) => {
  try {
    const updates = {};
    if (req.body.locale && ['es', 'en'].includes(req.body.locale)) {
      updates.locale = req.body.locale;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid preference fields provided' });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select()
      .single();

    if (updateError || !updatedUser) {
      throw updateError || new Error('Failed to update preferences');
    }

    res.json({
      ...updatedUser,
      role: updatedUser.role,
      planStatus: updatedUser.plan_status,
      currentPeriodEnd: updatedUser.current_period_end,
      tiktokShopConnected: updatedUser.tiktok_shop_connected
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!user) {
      return res.json({ message: 'If that email is registered, you will receive a reset link.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase
      .from('users')
      .update({ reset_password_token: token, reset_password_expires: expires })
      .eq('id', user.id);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/?reset=${token}`;
    await sendPasswordResetEmail(user, resetUrl).catch(() => {});

    res.json({ message: 'If that email is registered, you will receive a reset link.' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });

    const { data: user } = await supabase
      .from('users')
      .select('id, reset_password_expires')
      .eq('reset_password_token', token)
      .single();

    if (!user || new Date(user.reset_password_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await supabase
      .from('users')
      .update({ password_hash: hashedPassword, reset_password_token: null, reset_password_expires: null })
      .eq('id', user.id);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
