import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { getWishlist, addToWishlist as addAPI, removeFromWishlist as removeAPI, clearWishlist as clearAPI, type Wishlist } from '@/api/wishlist';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WishlistContextType {
  wishlist: Wishlist | null;
  wishlistCount: number;
  loading: boolean;
  addToWishlist: (item: { subject: string; grade: string; term?: string }) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  isInWishlist: (subject: string, grade: string, term?: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = (): WishlistContextType => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const w = await getWishlist();
      setWishlist(w);
      setWishlistCount(w.items.length);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (user) refreshWishlist(); else { setWishlist(null); setWishlistCount(0); }
  }, [user, refreshWishlist]);

  const addToWishlist = useCallback(async (item: { subject: string; grade: string; term?: string }) => {
    if (!user) {
      toast({ title: 'Please log in', description: 'Log in to save items to your wishlist', variant: 'destructive' });
      return;
    }
    try {
      console.log('[WishlistContext] Adding to wishlist:', item);
      setLoading(true);
      const w = await addAPI(item);
      console.log('[WishlistContext] Wishlist updated:', w);
      setWishlist(w);
      setWishlistCount(w.items.length);
      toast({ title: 'Saved', description: `${item.subject} added to your wishlist` });
    } catch (e: any) {
      console.error('[WishlistContext] Error adding to wishlist:', e);
      console.error('[WishlistContext] Error details:', e.response);
      toast({ title: 'Error', description: e?.response?.data?.message || e.message || 'Failed to add to wishlist', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [user, toast]);

  const removeFromWishlist = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      setLoading(true);
      const w = await removeAPI(itemId);
      setWishlist(w);
      setWishlistCount(w.items.length);
      toast({ title: 'Removed', description: 'Removed from wishlist' });
    } finally { setLoading(false); }
  }, [user, toast]);

  const clearWishlist = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const w = await clearAPI();
      setWishlist(w);
      setWishlistCount(0);
      toast({ title: 'Cleared', description: 'Wishlist cleared' });
    } finally { setLoading(false); }
  }, [user, toast]);

  const isInWishlist = useCallback((subject: string, grade: string, term?: string): boolean => {
    if (!wishlist) return false;
    return wishlist.items.some(i => i.subject === subject && i.grade === grade && i.term === term);
  }, [wishlist]);

  const value = useMemo(
    () => ({ wishlist, wishlistCount, loading, addToWishlist, removeFromWishlist, clearWishlist, refreshWishlist, isInWishlist }),
    [wishlist, wishlistCount, loading, addToWishlist, removeFromWishlist, clearWishlist, refreshWishlist, isInWishlist]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
