import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BookOpen, Star, Users, Clock } from "lucide-react";
import { getStudentByUserId, initializePayment } from "@/api";
import { getLessonPreviewById, getSubjectsByGrade, type SubjectInfo } from "@/api/lessons";
import { useToast } from "@/hooks/use-toast";
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
  lessonId?: string; // present for lesson-level purchases
  lessonTitle?: string;
  imageUrl?: string;
  commonEntranceId?: string; // present for Common Entrance exam purchases
  itemType?: string; // 'lesson' | 'common-entrance'
}

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { cart, cartCount, loading, removeFromCart } = useCart();
  const [studentName, setStudentName] = useState("");
  const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [agreeToRefundPolicy, setAgreeToRefundPolicy] = useState(false);
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

  // Fetch Lesson details for cart items
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
              // Common Entrance items: no extra enrichment needed
              if ((item as any).itemType === 'common-entrance' || (item as any).commonEntranceId) {
                return { ...item } as EnrichedCartItem;
              }

              if (item.lessonId) {
                const lesson = await getLessonPreviewById(item.lessonId);
                if (lesson) {
                  return {
                    ...item,
                    lessonTitle: lesson.title,
                    price: item.price || lesson.price || 0,
                    lessonCount: 1,
                    rating: lesson.rating || 0,
                    enrolledStudents: lesson.enrolledStudents || 0,
                    duration: lesson.duration || 0,
                    subject: lesson.subject,
                    grade: lesson.grade,
                    term: lesson.term,
                    imageUrl: lesson.imageUrl || '',
                  } as EnrichedCartItem;
                }
              }

              const subjects = await getSubjectsByGrade(item.grade, item.term);
              const subjectInfo = subjects.find(s => s.name === item.subject);
              
              return {
                ...item,
                price: item.price || subjectInfo?.price || 0,
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

  // Use enriched items if available, otherwise fall back to raw cart items
  // so the list is never blank while enrichment is still in progress.
  const displayItems: EnrichedCartItem[] = enrichedItems.length > 0
    ? enrichedItems
    : (cart?.items ?? []) as EnrichedCartItem[];

  // Calculate total from displayed items
  const calculatedTotal = displayItems.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={studentName} />
      <main className="pt-2 sm:pt-6 pb-12 sm:pb-16 container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Checkout</h1>
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
                      {displayItems.map((item) => (
                        <div key={item._id} className="flex gap-4 pb-4 border-b last:border-b-0">
                          <div className="w-24 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.lessonTitle || item.subject}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <BookOpen className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base mb-0.5">{item.lessonTitle || item.subject}</h3>
                            {item.lessonTitle && (
                              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">{item.subject}</p>
                            )}
                            <p className="text-xs text-muted-foreground mb-2">
                              {(item as any).commonEntranceId || (item as any).itemType === 'common-entrance'
                                ? 'Common Entrance Exam'
                                : `Grade ${item.grade}${item.term ? ` • ${item.term}` : ''}`}
                            </p>
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
                            {formatCurrency(item.price)}
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
                        <span className="font-semibold">{formatCurrency(calculatedTotal)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-2xl font-bold text-purple-600">{formatCurrency(calculatedTotal)}</span>
                      </div>
                    </div>

                    {/* Refund Policy Checkbox */}
                    <div className="mb-4 pt-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="agreeToRefundPolicy"
                          checked={agreeToRefundPolicy}
                          onCheckedChange={(checked) => setAgreeToRefundPolicy(!!checked)}
                        />
                        <Label htmlFor="agreeToRefundPolicy" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                          I am a parent/guardian and I understand that there is no refund after payments
                        </Label>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                      onClick={async () => {
                        try {
                          const total = calculatedTotal;
                          if (total <= 0 || displayItems.length === 0) {
                            toast({
                              title: 'Cannot process checkout',
                              description: total <= 0
                                ? 'Course prices could not be loaded. Please refresh and try again.'
                                : 'Your cart appears to be empty.',
                              variant: 'destructive',
                            });
                            return;
                          }
                          
                          const items = displayItems.map(item => ({
                            subject: item.subject,
                            grade: item.grade,
                            term: item.term || undefined,
                            price: item.price,
                            title: item.lessonTitle || item.subject,
                            imageUrl: item.imageUrl || '',
                            lessonId: item.lessonId || undefined,
                            commonEntranceId: (item as any).commonEntranceId || undefined,
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
                          toast({ title: 'Payment Failed', description: e.message || 'Please try again', variant: 'destructive' });
                        }
                      }}
                      disabled={calculatedTotal <= 0 || displayItems.length === 0 || fetchingDetails || !agreeToRefundPolicy}
                    >
                      {fetchingDetails ? 'Loading...' : 'Complete Checkout'}
                    </Button>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-center text-muted-foreground mb-3">
                        Secure payment powered by Paystack
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">

      
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
      <StudentFooter />
      <WhatsAppButton />
    </div>
  );
};

export default Checkout;
