import { useEffect, useState } from 'react';
import { StudentHeader } from '@/components/StudentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, HeartCrack, ArrowLeft } from 'lucide-react';
import { getStudentByUserId } from '@/api';

const Wishlist = () => {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, wishlistCount, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [studentName, setStudentName] = useState('');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={studentName} />
      <main className="pt-24 pb-16 container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-sm sm:text-base"><ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4"/>Back</Button>
          <h1 className="text-xl sm:text-2xl font-bold">Wishlist</h1>
          <div />
        </div>
        {isEmpty ? (
          <Card className="p-8 sm:p-16 text-center">
            <div className="inline-block p-4 sm:p-6 bg-muted rounded-full mb-4 sm:mb-6"><HeartCrack className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground"/></div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">No saved courses</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Save courses you're interested in and move them to cart when ready</p>
            <Button onClick={() => navigate('/browse')} className="w-full sm:w-auto">Browse Courses</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {wishlist?.items.map(item => (
              <Card key={item._id}>
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-full sm:w-24 h-16 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">{item.subject}</h3>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="secondary" className="text-xs">Grade {item.grade}</Badge>
                      {item.term && <Badge variant="outline" className="text-xs">{item.term}</Badge>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={async () => {
                        await addToCart({ subject: item.subject, grade: item.grade, term: item.term, price: 99.99 });
                        await removeFromWishlist(item._id);
                      }}>Move to Cart</Button>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => removeFromWishlist(item._id)}>Remove</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
