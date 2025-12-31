import { api } from '@/lib/apiClient';

export interface WishlistItem {
  _id: string;
  subject: string;
  grade: string;
  term?: string;
  addedAt: string;
}

export interface Wishlist {
  _id: string;
  userId: string;
  items: WishlistItem[];
  updatedAt: string;
}

export const getWishlist = async (): Promise<Wishlist> => {
  const res = await api.get('/wishlist');
  return res;
};

export const addToWishlist = async (item: { subject: string; grade: string; term?: string; }): Promise<Wishlist> => {
  try {
    console.log('[Wishlist API] Adding to wishlist:', item);
    const res = await api.post('/wishlist/add', item);
    console.log('[Wishlist API] Add response:', res);
    
    // Backend returns { message, wishlist }
    if (res.wishlist) {
      return res.wishlist;
    }
    // If backend returns the wishlist directly
    if (res._id && res.items) {
      return res;
    }
    
    console.error('[Wishlist API] Unexpected response shape:', res);
    throw new Error('Invalid response from server');
  } catch (error: any) {
    console.error('[Wishlist API] Error adding:', error);
    console.error('[Wishlist API] Error response:', error.response?.data);
    throw error;
  }
};

export const removeFromWishlist = async (itemId: string): Promise<Wishlist> => {
  const res = await api.delete(`/wishlist/remove/${itemId}`);
  return res.wishlist || res;
};

export const clearWishlist = async (): Promise<Wishlist> => {
  const res = await api.delete('/wishlist/clear');
  return res.wishlist || res;
};

export const getWishlistCount = async (): Promise<number> => {
  const res = await api.get('/wishlist/count');
  return res.count ?? 0;
};
