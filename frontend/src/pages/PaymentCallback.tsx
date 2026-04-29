import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPayment, getPaymentStatus } from '@/api/payments';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, BookOpen, ArrowRight, GraduationCap } from 'lucide-react';

interface PurchasedCourse {
  subject: string;
  grade: string;
  term?: string;
  title?: string;
  lessonId?: string | null;
  commonEntranceId?: string | null;
}

const PaymentCallback = () => {
  const [search] = useSearchParams();
  const reference = search.get('reference');
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [status, setStatus] = useState<'verifying'|'success'|'failed'>('verifying');
  const [message, setMessage] = useState<string>('Verifying payment...');
  const [purchasedlessons, setPurchasedlessons] = useState<PurchasedCourse[]>([]);

  const isCommonEntrancePurchase = (course: PurchasedCourse) =>
    Boolean(course.commonEntranceId) || String(course.grade).toLowerCase() === 'common entrance';

  const goToPurchasedItem = (course: PurchasedCourse) => {
    if (isCommonEntrancePurchase(course)) {
      const params = new URLSearchParams();
      if (course.commonEntranceId) params.set('examId', course.commonEntranceId);
      navigate(`/my-common-entrance${params.toString() ? `?${params.toString()}` : ''}`);
      return;
    }

    const params = new URLSearchParams();
    if (course.term) params.set('term', course.term);
    if (course.lessonId) params.set('lessonId', course.lessonId);

    const grade = encodeURIComponent(course.grade);
    const subject = encodeURIComponent(course.subject);
    navigate(`/subjects/${grade}/${subject}${params.toString() ? `?${params.toString()}` : ''}`);
  };

  useEffect(() => {
    const run = async () => {
      if (!reference) {
        setStatus('failed');
        setMessage('Missing payment reference');
        return;
      }
      try {
        const res = await verifyPayment(reference);
        if (res.status === 'success') {
          setStatus('success');
          setMessage('Payment verified successfully! Your lessons are now accessible.');
          
          // Get the purchased lessons from the payment response
          if (res.enrollments && res.enrollments.length > 0) {
            setPurchasedlessons(res.enrollments.map((e: any) => ({
              subject: e.subject,
              grade: e.grade,
              term: e.term,
              title: e.title || '',
              lessonId: e.lessonId || null,
              commonEntranceId: e.commonEntranceId || null,
            })));
          }
          
          // Refresh cart to clear purchased items
          await refreshCart();
        } else {
          setStatus(res.status === 'success' ? 'success' : 'failed');
          setMessage('Payment status: ' + res.status);
        }
        // Refresh payment status cache
        await getPaymentStatus();
      } catch (e: any) {
        setStatus('failed');
        setMessage(e.message || 'Verification failed');
      }
    };
    run();
  }, [reference, refreshCart]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background dark:via-muted dark:to-background p-4 sm:p-6">
      <div className="max-w-2xl w-full">
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              {status === 'verifying' && (
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
                </div>
              )}
              {status === 'failed' && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600" />
                </div>
              )}
            </div>

            {/* Message */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                {status === 'verifying' && 'Verifying Payment'}
                {status === 'success' && 'Payment Successful!'}
                {status === 'failed' && 'Payment Failed'}
              </h1>
              <p className={`text-sm sm:text-base ${
                status === 'failed' ? 'text-red-600' : 
                status === 'success' ? 'text-green-600' : 
                'text-purple-600'
              }`}>
                {message}
              </p>
            </div>

            {/* Enrolled lessons */}
            {status === 'success' && purchasedlessons.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">lessons Purchased:</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {purchasedlessons.map((course, index) => (
                    <div
                      key={`${course.subject}-${course.grade}-${index}`}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                        {isCommonEntrancePurchase(course) ? (
                          <GraduationCap className="w-5 h-5 text-purple-600" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{course.title || course.subject}</p>
                        {course.title && course.title !== course.subject && (
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400">{course.subject}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {isCommonEntrancePurchase(course) ? 'Common Entrance' : `Grade ${course.grade}`}
                          {course.term && ` • ${course.term}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => goToPurchasedItem(course)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs flex-shrink-0"
                      >
                        {isCommonEntrancePurchase(course) ? 'Start Exam' : 'Start'}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {status !== 'verifying' && (
                <>
                  {status === 'success' ? (
                    <>
                      <Button 
                        onClick={() => {
                          if (purchasedlessons.length === 1) {
                            goToPurchasedItem(purchasedlessons[0]);
                          } else {
                            navigate('/my-learning');
                          }
                        }}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        size="lg"
                      >
                        {purchasedlessons.length === 1 && isCommonEntrancePurchase(purchasedlessons[0]) ? 'Start Exam' : 'Start Learning'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        onClick={() => navigate('/browse')} 
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        Browse More lessons
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => navigate('/cart')} 
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      Back to Cart
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCallback;
