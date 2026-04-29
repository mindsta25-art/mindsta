import { useEffect, useState } from 'react';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Heart, ShoppingCart, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import { getStudentByUserId } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';
import type { WishlistItem } from '@/api/wishlist';

const gradients = [
  'from-violet-500 via-purple-500 to-indigo-600',
  'from-pink-500 via-rose-500 to-red-500',
  'from-cyan-500 via-blue-500 to-indigo-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-fuchsia-500 via-pink-500 to-rose-500',
  'from-lime-500 via-green-500 to-emerald-500',
  'from-sky-500 via-blue-500 to-violet-500',
];

function getGradient(subject: string): string {
  const idx = subject.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const Wishlist = () => {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, wishlistCount, loading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, addCommonEntranceToCart } = useCart();
  const [studentName, setStudentName] = useState('');
  const [movingItem, setMovingItem] = useState<string | null>(null);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try { const s = await getStudentByUserId(user.id); setStudentName(s?.fullName || ''); } catch {}
    };
    load();
  }, [user]);

  const isEmpty = !wishlist || wishlist.items.length === 0;

  const handleMoveToCart = async (item: WishlistItem) => {
    const isCE = item.term?.startsWith('ce:');
    setMovingItem(item._id);
    try {
      if (isCE) {
        const examId = item.term!.replace('ce:', '');
        await addCommonEntranceToCart(examId, item.subject);
      } else {
        await addToCart({ subject: item.subject, grade: item.grade, term: item.term });
      }
      await removeFromWishlist(item._id);
    } finally {
      setMovingItem(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setRemovingItem(itemId);
    try { await removeFromWishlist(itemId); } finally { setRemovingItem(null); }
  };

  const getCachedImg = (subject: string, grade: string, term: string): string => {
    try {
      return localStorage.getItem(`wish_img:${encodeURIComponent(subject)}:${grade}:${encodeURIComponent(term)}`) || '';
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <StudentHeader studentName={studentName} />
      <main className="pt-2 sm:pt-6 pb-12 sm:pb-16">
        <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">

          {/* Page Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/40">
                <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400 fill-rose-600 dark:fill-rose-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
                {!isEmpty && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {wishlistCount} saved {wishlistCount === 1 ? 'item' : 'items'}
                  </p>
                )}
              </div>
            </div>
            {!isEmpty && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 text-xs sm:text-sm"
                onClick={clearWishlist}
                disabled={loading}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </Button>
            )}
          </div>

          {/* Empty State */}
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-20 sm:py-28 text-center"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40 flex items-center justify-center shadow-inner">
                  <Heart className="w-10 h-10 text-rose-400 dark:text-rose-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-950">
                  <BookOpen className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-xs sm:max-w-sm leading-relaxed">
                Tap the heart icon on any lesson or exam to save it here. Come back when you're ready to enroll.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate('/browse')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 shadow-md"
                >
                  <BookOpen className="w-4 h-4" />
                  Browse Lessons
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/common-entrance')}
                  className="gap-2 border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  <GraduationCap className="w-4 h-4" />
                  Common Entrance
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                >
                  {wishlist.items.map((item, index) => {
                    const isCE = item.term?.startsWith('ce:');
                    const gradient = getGradient(item.subject);
                    const initial = item.subject.charAt(0).toUpperCase();
                    const isMoving = movingItem === item._id;
                    const isRemoving = removingItem === item._id;
                    const busy = isMoving || isRemoving;
                    // Use server-stored imageUrl first, fall back to localStorage cache
                    const cachedImg = item.imageUrl || getCachedImg(item.subject, item.grade, item.term || '');

                    return (
                      <motion.div
                        key={item._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.18 } }}
                        transition={{ delay: index * 0.05, duration: 0.25 }}
                      >
                        <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900 h-full flex flex-col">
                          {/* Thumbnail */}
                          <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                            {/* Real image if cached */}
                            {cachedImg ? (
                              <img
                                src={cachedImg}
                                alt={item.subject}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : null}
                            {/* Decorative circles (visible when no image) */}
                            {!cachedImg && <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />}
                            {!cachedImg && <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-black/10 rounded-full" />}

                            {isCE ? (
                              <div className="relative flex flex-col items-center gap-2">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner">
                                  <GraduationCap className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Common Entrance</span>
                              </div>
                            ) : (
                              <div className="relative flex flex-col items-center gap-1.5">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner transform group-hover:scale-110 transition-transform duration-300">
                                  <span className="text-3xl font-extrabold text-white leading-none">{initial}</span>
                                </div>
                                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                                  {item.grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${item.grade}`}
                                </span>
                              </div>
                            )}

                            {/* EXAM badge */}
                            {isCE && (
                              <div className="absolute top-2.5 left-2.5">
                                <Badge className="bg-white/20 text-white border-white/30 text-[10px] font-bold backdrop-blur-sm px-2 py-0.5">
                                  EXAM
                                </Badge>
                              </div>
                            )}

                            {/* Heart remove button */}
                            <button
                              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-colors"
                              onClick={() => handleRemove(item._id)}
                              disabled={busy}
                              title="Remove from wishlist"
                            >
                              <Heart className="w-3.5 h-3.5 text-white fill-white" />
                            </button>
                          </div>

                          <CardContent className="p-4 flex flex-col flex-1">
                            {/* Title */}
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-snug mb-2 line-clamp-2 flex-1">
                              {item.subject}
                            </h3>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              <Badge variant="secondary" className="text-[11px] font-medium">
                                {item.grade === 'Common Entrance' ? 'Common Entrance' : `Grade ${item.grade}`}
                              </Badge>
                              {item.term && !item.term.startsWith('ce:') && (
                                <Badge variant="outline" className="text-[11px]">{item.term}</Badge>
                              )}
                            </div>

                            {/* Saved date */}
                            {item.addedAt && (
                              <p className="text-[11px] text-muted-foreground mb-3">
                                Saved {timeAgo(item.addedAt)}
                              </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-auto">
                              <Button
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-sm text-xs gap-1.5 h-8"
                                onClick={() => handleMoveToCart(item)}
                                disabled={busy}
                              >
                                {isMoving ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ShoppingCart className="w-3 h-3" />
                                )}
                                Move to Cart
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-2.5 h-8 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-colors"
                                onClick={() => handleRemove(item._id)}
                                disabled={busy}
                                title="Remove"
                              >
                                {isRemoving ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {/* Bottom CTA */}
              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Want to explore more content?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/browse')}
                    className="gap-1.5 border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Browse Lessons
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/common-entrance')}
                    className="gap-1.5 border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Common Entrance
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <StudentFooter />
    </div>
  );
};

export default Wishlist;
