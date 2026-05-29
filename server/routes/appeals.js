import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/requireActivePlan.js';
import { generateAppealContent } from '../utils/appealGenerator.js';
import { submitAppeal } from '../services/tiktok.js';
import { supabase } from '../server.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(auth, requireActivePlan);

async function getShopForUser(shopId, userId) {
  const { data } = await supabase
    .from('shops').select('*').eq('id', shopId).eq('user_id', userId).single();
  return data || null;
}

// Verify appeal belongs to the authenticated user via shop ownership
async function getAppealForUser(appealId, userId) {
  const { data: appeal } = await supabase
    .from('appeals').select('*').eq('id', appealId).single();
  if (!appeal) return null;
  const shop = await getShopForUser(appeal.shop_id, userId);
  if (!shop) return null;
  return appeal;
}

router.get('/', async (req, res) => {
  try {
    const { shopId, status } = req.query;

    // Always fetch owned shops — never trust client-provided shopId directly
    const { data: userShops, error: shopsError } = await supabase
      .from('shops').select('id').eq('user_id', req.userId);
    if (shopsError) throw shopsError;

    const ownedIds = (userShops || []).map((s) => s.id);

    // If shopId provided, verify ownership before using it
    const filteredIds = shopId
      ? (ownedIds.includes(shopId) ? [shopId] : [])
      : ownedIds;

    if (!filteredIds.length) return res.json([]);

    let query = supabase.from('appeals').select('*').in('shop_id', filteredIds);
    if (status) query = query.eq('status', status);

    const { data: appeals, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(appeals || []);
  } catch (error) {
    logger.error('Get appeals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { shopId, category, customData } = req.body;
    const shop = await getShopForUser(shopId, req.userId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const content = generateAppealContent(category, shop, customData);
    const { data, error } = await supabase
      .from('appeals')
      .insert({ shop_id: shop.id, status: 'draft', reason: content, evidence: customData || {} })
      .select().single();

    if (error) throw error;
    res.status(201).json({ ...data, generatedContent: data.reason });
  } catch (error) {
    logger.error('Generate appeal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:appealId/submit', async (req, res) => {
  try {
    const appeal = await getAppealForUser(req.params.appealId, req.userId);
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

    const shop = await getShopForUser(appeal.shop_id, req.userId);
    if (appeal.status !== 'draft') return res.status(400).json({ error: 'Appeal already submitted' });

    const result = await submitAppeal(shop.tiktok_access_token, shop.shop_id, {
      category: appeal.evidence?.category || 'general',
      content: appeal.reason,
    });

    const { data: updated, error: updateError } = await supabase
      .from('appeals')
      .update({ status: 'submitted', submitted_at: new Date().toISOString(), response: result.case_id ? `case:${result.case_id}` : null })
      .eq('id', appeal.id).select().single();

    if (updateError) throw updateError;
    res.json(updated);
  } catch (error) {
    logger.error('Submit appeal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:appealId', async (req, res) => {
  try {
    // Verify ownership before any mutation
    const appeal = await getAppealForUser(req.params.appealId, req.userId);
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

    const { generatedContent, notes, status } = req.body;
    const updates = {};
    if (generatedContent) updates.reason = generatedContent;
    if (notes) updates.evidence = notes;
    if (status) updates.status = status;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });

    const { data, error } = await supabase
      .from('appeals').update(updates).eq('id', appeal.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Update appeal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:appealId', async (req, res) => {
  try {
    // Verify ownership before deletion
    const appeal = await getAppealForUser(req.params.appealId, req.userId);
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

    const { error } = await supabase.from('appeals').delete().eq('id', appeal.id);
    if (error) throw error;
    res.json({ message: 'Appeal deleted successfully' });
  } catch (error) {
    logger.error('Delete appeal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
