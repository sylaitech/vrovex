import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/requireActivePlan.js';
import { generateAppealContent } from '../utils/appealGenerator.js';
import { submitAppeal } from '../services/tiktok.js';
import { supabase } from '../server.js';

const router = express.Router();

router.use(auth, requireActivePlan);

async function getShopForUser(shopId, userId) {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }
  return data;
}

router.get('/', auth, async (req, res) => {
  try {
    const { shopId, status } = req.query;
    const userShops = await supabase
      .from('shops')
      .select('id')
      .eq('user_id', req.userId);

    if (userShops.error) throw userShops.error;

    let query = supabase.from('appeals').select('*');
    if (shopId) {
      query = query.eq('shop_id', shopId);
    } else {
      const shopIds = (userShops.data || []).map((shop) => shop.id);
      if (shopIds.length === 0) {
        return res.json([]);
      }
      query = query.in('shop_id', shopIds);
    }
    if (status) query = query.eq('status', status);

    const { data: appeals, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    res.json(appeals || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate', auth, async (req, res) => {
  try {
    const { shopId, category, customData } = req.body;
    const shop = await getShopForUser(shopId, req.userId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const content = generateAppealContent(category, shop, customData);
    const { data, error } = await supabase
      .from('appeals')
      .insert({
        shop_id: shop.id,
        status: 'draft',
        reason: content,
        evidence: customData || {},
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({
      ...data,
      generatedContent: data.reason,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:appealId/submit', auth, async (req, res) => {
  try {
    const { data: appeal, error: appealError } = await supabase
      .from('appeals')
      .select('*')
      .eq('id', req.params.appealId)
      .single();

    if (appealError || !appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    const shop = await getShopForUser(appeal.shop_id, req.userId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    if (appeal.status !== 'draft') {
      return res.status(400).json({ error: 'Appeal already submitted' });
    }

    const result = await submitAppeal(shop.tiktok_access_token, shop.shop_id, {
      category: appeal.evidence?.category || 'general',
      content: appeal.reason,
    });

    const { data: updated, error: updateError } = await supabase
      .from('appeals')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        response: result.case_id ? `case:${result.case_id}` : null,
      })
      .eq('id', appeal.id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:appealId', auth, async (req, res) => {
  try {
    const { generatedContent, notes, status } = req.body;
    const updates = {};
    if (generatedContent) updates.reason = generatedContent;
    if (notes) updates.evidence = notes;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('appeals')
      .update(updates)
      .eq('id', req.params.appealId)
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to update appeal');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:appealId', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('appeals')
      .delete()
      .eq('id', req.params.appealId);

    if (error) throw error;
    res.json({ message: 'Appeal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
