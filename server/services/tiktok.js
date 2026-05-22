import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const TIKTOK_API_BASE = process.env.TIKTOK_API_BASE_URL;
const APP_KEY = process.env.TIKTOK_APP_KEY;
const APP_SECRET = process.env.TIKTOK_APP_SECRET;

/**
 * Generate TikTok API signature
 */
function generateSignature(path, timestamp, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const signString = `${APP_SECRET}${path}${timestamp}${APP_KEY}${sortedParams}${APP_SECRET}`;
  return crypto.createHmac('sha256', APP_SECRET).update(signString).digest('hex');
}

/**
 * Make authenticated request to TikTok Shop API
 */
async function tiktokRequest(endpoint, accessToken, params = {}, method = 'GET') {
  const timestamp = Math.floor(Date.now() / 1000);
  const path = `/api${endpoint}`;
  
  const signature = generateSignature(path, timestamp, params);
  
  const headers = {
    'Content-Type': 'application/json',
    'x-tts-access-token': accessToken
  };
  
  const url = `${TIKTOK_API_BASE}${path}`;
  const queryParams = {
    app_key: APP_KEY,
    timestamp,
    sign: signature,
    ...params
  };
  
  try {
    const response = await axios({
      method,
      url,
      headers,
      params: method === 'GET' ? queryParams : undefined,
      data: method === 'POST' ? queryParams : undefined
    });
    
    return response.data;
  } catch (error) {
    logger.error('TikTok API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get shop performance metrics
 */
export async function getShopMetrics(accessToken, shopId) {
  try {
    const response = await tiktokRequest('/seller/performance/get', accessToken, {
      shop_id: shopId
    });
    
    return {
      accountHealth: response.data?.account_health_score || 1000,
      lateDispatchRate: response.data?.late_dispatch_rate || 0,
      onTimeDeliveryRate: response.data?.on_time_delivery_rate || 100,
      validTrackingRate: response.data?.valid_tracking_rate || 100
    };
  } catch (error) {
    logger.error(`Failed to fetch metrics for shop ${shopId}:`, error);
    throw error;
  }
}

/**
 * Get order list
 */
export async function getOrders(accessToken, shopId, params = {}) {
  try {
    const response = await tiktokRequest('/orders/search', accessToken, {
      shop_id: shopId,
      page_size: params.pageSize || 50,
      page_number: params.pageNumber || 1,
      ...params
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch orders for shop ${shopId}:`, error);
    throw error;
  }
}

/**
 * Get product list
 */
export async function getProducts(accessToken, shopId, params = {}) {
  try {
    const response = await tiktokRequest('/products/search', accessToken, {
      shop_id: shopId,
      page_size: params.pageSize || 50,
      page_number: params.pageNumber || 1,
      ...params
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch products for shop ${shopId}:`, error);
    throw error;
  }
}

/**
 * Submit appeal to TikTok
 */
export async function submitAppeal(accessToken, shopId, appealData) {
  try {
    const response = await tiktokRequest('/seller/appeal/submit', accessToken, {
      shop_id: shopId,
      appeal_type: appealData.category,
      appeal_content: appealData.content,
      ...appealData
    }, 'POST');
    
    return response.data;
  } catch (error) {
    logger.error(`Failed to submit appeal for shop ${shopId}:`, error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/token/refresh';
    
    const params = {
      app_key: APP_KEY,
      refresh_token: refreshToken
    };
    
    const signature = generateSignature(path, timestamp, params);
    
    const response = await axios.post(`${TIKTOK_API_BASE}${path}`, {
      ...params,
      timestamp,
      sign: signature
    });
    
    return {
      accessToken: response.data.data.access_token,
      refreshToken: response.data.data.refresh_token,
      expiresIn: response.data.data.access_token_expire_in
    };
  } catch (error) {
    logger.error('Failed to refresh token:', error);
    throw error;
  }
}

/**
 * Get authorization URL for OAuth
 */
export function getAuthorizationUrl(state) {
  const params = new URLSearchParams({
    app_key: APP_KEY,
    state,
    redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:5000/api/tiktok/callback'
  });
  
  return `https://services.tiktokshop.com/open/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function getAccessToken(authCode) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/token/get';
    
    const params = {
      app_key: APP_KEY,
      auth_code: authCode,
      grant_type: 'authorized_code'
    };
    
    const signature = generateSignature(path, timestamp, params);
    
    const response = await axios.post(`${TIKTOK_API_BASE}${path}`, {
      ...params,
      timestamp,
      sign: signature
    });
    
    return {
      accessToken: response.data.data.access_token,
      refreshToken: response.data.data.refresh_token,
      expiresIn: response.data.data.access_token_expire_in,
      shopId: response.data.data.seller_id
    };
  } catch (error) {
    logger.error('Failed to get access token:', error);
    throw error;
  }
}
