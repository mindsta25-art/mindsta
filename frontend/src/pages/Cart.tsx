import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { StudentHeader } from "@/components/StudentHeader";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Trash2, 
  ArrowRight, 
  BookOpen,
  ShoppingBag,
  Star,
  Users
} from "lucide-react";
import { getStudentByUserId } from "@/api";
import { getSubjectsByGrade, type SubjectInfo } from "@/api/lessons";
import { formatCurrency } from "@/config/siteConfig";

interface EnrichedCartItem {
  _id: string;
  subject: string;
  grade: string;
  term?: string;
  price: number;
  addedAt?: string;
  lessonCount?: number;
  rating?: number;
  enrolledStudents?: number;
  duration?: number;
}

const Cart = () => {
  const { user, loading: authLoading } = useAuth();
  const { cart, cartCount, loading, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState<string>("");
  const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchStudentName = async () => {
      if (user) {
        try {
          const studentData = await getStudentByUserId(user.id);
          if (studentData) {
            setStudentName(studentData.fullName);
          }
        } catch (error) {
          console.error("Error fetching student name:", error);
        }
      }
    };
    fetchStudentName();
  }, [user]);

  // Fetch course details for cart items
  useEffect(() => {
    const enrichCartItems = async () => {
      if (!cart?.items || cart.items.length === 0) {
        setEnrichedItems([]);
        return;
      }

      setFetchingDetails(true);
      try {
        const enriched = await Promise.all(
          cart.items.map(async (item) => {
            try {
              const subjects = await getSubjectsByGrade(item.grade, item.term);
              const subjectInfo = subjects.find(s => s.name === item.subject);
              
              return {
                ...item,
                price: subjectInfo?.price || 0, // Use current price from database
                lessonCount: subjectInfo?.lessonCount || 0,
                rating: subjectInfo?.rating || 0,
                enrolledStudents: subjectInfo?.enrolledStudents || 0,
                duration: subjectInfo?.duration || 0
              } as EnrichedCartItem;
            } catch (error) {
              console.error(`Error fetching details for ${item.subject}:`, error);
              return item as EnrichedCartItem;
            }
          })
        );
        
        setEnrichedItems(enriched);
      } catch (error) {
        console.error("Error enriching cart items:", error);
        setEnrichedItems(cart.items as EnrichedCartItem[]);
      } finally {
        setFetchingDetails(false);
      }
    };

    enrichCartItems();
  }, [cart?.items]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentHeader studentName={studentName} />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  // Calculate total from enriched items (with current database prices)
  const calculatedTotal = enrichedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={studentName} />

      <main className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isEmpty ? "Your cart is empty" : `${cartCount} ${cartCount === 1 ? 'item' : 'items'} in your cart`}
            </p>
          </div>

          {isEmpty ? (
            // Empty Cart State
            <Card className="p-8 sm:p-16">
              <div className="text-center">
                <div className="inline-block p-4 sm:p-6 bg-muted rounded-full mb-4 sm:mb-6">
                  <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  Start adding courses to your cart and checkout when you're ready
                </p>
                <Button onClick={() => navigate("/browse")} size="lg" className="gap-2 w-full sm:w-auto">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  Browse Courses
                </Button>
              </div>
            </Card>
          ) : (
            // Cart with Items
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {enrichedItems.map((item) => (
                  <Card key={item._id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Course Thumbnail - Udemy style */}
                        <div className="relative w-28 h-16 sm:w-32 sm:h-18 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded flex-shrink-0 overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-white opacity-90" />
                          </div>
                        </div>

                        {/* Course Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2">{item.subject}</h3>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Grade {item.grade}</span>
                            {item.term && <span className="text-xs text-muted-foreground">• {item.term}</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            {item.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-orange-600">{item.rating.toFixed(1)}</span>
                                <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                              </div>
                            )}
                            {item.lessonCount > 0 && <span>• {item.lessonCount} lessons</span>}
                            {item.duration > 0 && <span>• {Math.ceil(item.duration / 60)} total hours</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => removeFromCart(item._id)}
                              className="text-purple-600 hover:text-purple-700 p-0 h-auto font-semibold text-xs"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>

                        {/* Price - Udemy style on right */}
                        <div className="flex flex-col items-end justify-start">
                          <div className="text-lg sm:text-xl font-bold text-purple-600">
                            ₦{item.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Clear Cart Button */}
                {cartCount > 1 && (
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="w-full text-sm sm:text-base"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Clear Cart
                  </Button>
                )}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="lg:sticky lg:top-24">
                  <CardContent className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Order Summary</h2>

                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                        <span className="font-semibold">
                          {formatCurrency(calculatedTotal)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-bold text-sm sm:text-base">Total</span>
                        <span className="text-xl sm:text-2xl font-bold">
                          {formatCurrency(calculatedTotal)}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full mb-3 gap-2 text-sm sm:text-base"
                      onClick={() => {
                        // Navigate to checkout
                        navigate("/checkout");
                      }}
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full gap-2 text-sm sm:text-base"
                      onClick={() => navigate("/dashboard")}
                    >
                      <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                      Continue Shopping
                    </Button>

                    {/* Features */}
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t space-y-2 sm:space-y-3">
                      <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-muted-foreground">
                          Lifetime access to course materials
                        </span>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-muted-foreground">
                          All quizzes and assessments included
                        </span>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-muted-foreground">
                          Progress tracking and certificates
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
};

export default Cart;
