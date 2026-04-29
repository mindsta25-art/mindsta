/**
 * Cart API (MongoDB via Node.js Backend)
 * Handles shopping cart operations
 */

import { api } from '@/lib/apiClient';

export interface CartItem {
  _id: string;
  subject: string;
  grade: string;
  term?: string;
  price: number;
  addedAt: string;
  lessonId?: string; // set when item is a specific lesson purchase
  commonEntranceId?: string; // set when item is a Common Entrance exam
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  updatedAt: string;
}

/**
 * Get user's cart
 */
export const getCart = async (): Promise<Cart> => {
  try {
    const result = await api.get('/cart');
    return result;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (item: {
  subject: string;
  grade: string;
  term?: string;
  price?: number;
  lessonId?: string;
  title?: string;
}): Promise<Cart> => {
  try {
    console.log('[Cart API] Adding to cart:', item);
    const endpoint = item.lessonId ? '/cart/add-lesson' : '/cart/add';
    const payload = item.lessonId
      ? { lessonId: item.lessonId }
      : { subject: item.subject, grade: item.grade, term: item.term, price: item.price, title: item.title };

    const result = await api.post(endpoint, payload);
    console.log('[Cart API] Add response:', result);
    
    // Backend returns { message, cart }
    if (result.cart) {
      return result.cart;
    }
    // If backend returns the cart directly
    if (result._id && result.items) {
      return result;
    }
    
    console.error('[Cart API] Unexpected response shape:', result);
    throw new Error('Invalid response from server');
  } catch (error: any) {
    console.error('[Cart API] Error adding to cart:', error);
    console.error('[Cart API] Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Add Common Entrance exam to cart
 */
export const addCommonEntranceToCart = async (commonEntranceId: string): Promise<Cart> => {
  const result = await api.post('/cart/add-common-entrance', { commonEntranceId });
  return result.cart ?? result;
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId: string): Promise<Cart> => {
  try {
    const result = await api.delete(`/cart/remove/${itemId}`);
    return result.cart;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

/**
 * Clear cart
 */
export const clearCart = async (): Promise<Cart> => {
  try {
    const result = await api.delete('/cart/clear');
    return result.cart;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

/**
 * Get cart item count
 */
export const getCartCount = async (): Promise<number> => {
  try {
    const result = await api.get('/cart/count');
    return result.count;
  } catch (error) {
    console.error('Error fetching cart count:', error);
    return 0;
  }
};
