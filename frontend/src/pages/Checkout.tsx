import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StudentHeader } from "@/components/StudentHeader";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, Star, Users, Clock } from "lucide-react";
import { getStudentByUserId, initializePayment } from "@/api";
import { getSubjectsByGrade, type SubjectInfo } from "@/api/lessons";

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

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const { cart, cartCount, loading, removeFromCart } = useCart();
  const [studentName, setStudentName] = useState("");
  const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchStudentName = async () => {
      if (user) {
        try {
          const data = await getStudentByUserId(user.id);
          if (data) setStudentName(data.fullName);
        } catch (e) {
          console.error("Error loading student name", e);
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

  const isEmpty = !cart || cart.items.length === 0;

  // Calculate total from enriched items (with current database prices)
  const calculatedTotal = enrichedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={studentName} />
      <main className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold">Checkout</h1>
            <div />
          </div>

          {isEmpty ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Your cart is empty.</p>
              <Button onClick={() => navigate("/dashboard")}>Continue Shopping</Button>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left: Order Details */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-6">Order Details</h2>
                    <div className="space-y-4">
                      {enrichedItems.map((item) => (
                        <div key={item._id} className="flex gap-4 pb-4 border-b last:border-b-0">
                          <div className="w-24 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded flex-shrink-0 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base mb-1">{item.subject}</h3>
                            <p className="text-xs text-muted-foreground mb-2">Grade {item.grade}{item.term && ` • ${item.term}`}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {item.rating > 0 && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                  {item.rating.toFixed(1)}
                                </span>
                              )}
                              {item.lessonCount > 0 && <span>• {item.lessonCount} lessons</span>}
                              {item.duration > 0 && <span>• {Math.ceil(item.duration / 60)}h</span>}
                            </div>
                          </div>
                          <div className="font-bold text-base text-purple-600">
                            ₦{item.price.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Payment Summary */}
              <div className="lg:col-span-1">
                <Card className="lg:sticky lg:top-24">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-6">Summary</h2>
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Original Price:</span>
                        <span className="font-semibold">₦{calculatedTotal.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-2xl font-bold text-purple-600">₦{calculatedTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                      onClick={async () => {
                        try {
                          const total = calculatedTotal;
                          if (total <= 0 || enrichedItems.length === 0) {
                            console.error('Invalid state: total=', total, 'items=', enrichedItems.length);
                            return;
                          }
                          
                          const items = enrichedItems.map(item => ({
                            subject: item.subject,
                            grade: item.grade,
                            term: item.term || undefined,
                            price: item.price
                          }));
                          
                          console.log('Initializing payment with:', { total, items });
                          
                          const { authorizationUrl } = await initializePayment(
                            total, 
                            items,
                            `${window.location.origin}/payment/callback`
                          );
                          window.location.href = authorizationUrl;
                        } catch (e: any) {
                          console.error('Failed to start payment:', e);
                          alert(`Payment initialization failed: ${e.message || 'Please try again'}`);
                        }
                      }}
                      disabled={calculatedTotal <= 0 || enrichedItems.length === 0 || fetchingDetails}
                    >
                      {fetchingDetails ? 'Loading...' : 'Complete Checkout'}
                    </Button>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-center text-muted-foreground mb-3">
                        Secure payment powered by Paystack
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>30-Day Money-Back Guarantee</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Lifetime Access</span>
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

export default Checkout;
