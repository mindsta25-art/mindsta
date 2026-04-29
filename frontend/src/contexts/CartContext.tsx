import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { getCart, addToCart as addToCartAPI, addCommonEntranceToCart as addCEToCartAPI, removeFromCart as removeFromCartAPI, clearCart as clearCartAPI, getCartCount, type Cart, type CartItem } from '@/api/cart';
import { api } from '@/lib/apiClient';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  loading: boolean;
  addToCart: (item: { subject: string; grade: string; term?: string; price?: number; lessonId?: string; title?: string }) => Promise<void>;
  addCommonEntranceToCart: (examId: string, examTitle: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isInCart: (subject: string, grade: string, term?: string, lessonId?: string) => boolean;
  isCommonEntranceInCart: (examId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Bypass the 30-second GET cache so post-payment cart state is always fresh
      const cartData = await api.get('/cart', undefined, 0) as Cart;
      setCart(cartData);
      setCartCount(cartData.items.length);
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch cart when user logs in
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart(null);
      setCartCount(0);
    }
  }, [user, refreshCart]);

  const addToCart = async (item: { subject: string; grade: string; term?: string; price?: number; lessonId?: string; title?: string }) => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to add items to cart',
        variant: 'destructive',
      });
      return;
    }

    if (loading) {
      // Prevent multiple simultaneous add operations
      return;
    }

    try {
      console.log('[CartContext] Adding to cart:', item);
      setLoading(true);
      const updatedCart = await addToCartAPI(item);
      console.log('[CartContext] Cart updated:', updatedCart);
      setCart(updatedCart);
      setCartCount(updatedCart.items.length);
      toast({
        title: 'Added to cart',
        description: `${item.subject} has been added to your cart`,
      });
    } catch (error: any) {
      console.error('[CartContext] Error adding to cart:', error);
      console.error('[CartContext] Error details:', error.response);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error.message || 'Failed to add item to cart',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const updatedCart = await removeFromCartAPI(itemId);
      setCart(updatedCart);
      setCartCount(updatedCart.items.length);
      toast({
        title: 'Removed from cart',
        description: 'Item has been removed from your cart',
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from cart',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const updatedCart = await clearCartAPI();
      setCart(updatedCart);
      setCartCount(0);
      toast({
        title: 'Cart cleared',
        description: 'All items have been removed from your cart',
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isInCart = (subject: string, grade: string, term?: string, lessonId?: string): boolean => {
    if (!cart) return false;
    if (lessonId) {
      return cart.items.some(item => {
        // item.lessonId may be a plain string ID or a populated lesson object (from older API responses)
        const itemId = (item.lessonId as any)?._id?.toString() ?? item.lessonId?.toString();
        return itemId === lessonId;
      });
    }
    return cart.items.some(item => item.subject === subject && item.grade === grade && item.term === term && !item.lessonId);
  };

  const isCommonEntranceInCart = (examId: string): boolean => {
    if (!cart) return false;
    return cart.items.some((item: any) => item.commonEntranceId?.toString() === examId || item.commonEntranceId === examId);
  };

  const addCommonEntranceToCart = async (examId: string, examTitle: string) => {
    if (!user) {
      toast({ title: 'Please log in', description: 'You need to be logged in to add items to cart', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const updatedCart = await addCEToCartAPI(examId);
      setCart(updatedCart);
      setCartCount(updatedCart.items.length);
      toast({ title: 'Added to cart', description: `${examTitle} has been added to your cart` });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to add to cart', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        addToCart,
        addCommonEntranceToCart,
        removeFromCart,
        clearCart,
        refreshCart,
        isInCart,
        isCommonEntranceInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
