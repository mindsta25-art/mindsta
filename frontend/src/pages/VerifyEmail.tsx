import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { verifyOTP, resendOTP } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Mail, ArrowLeft, RefreshCw } from 'lucide-react';

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    navigate('/signup');
    return null;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter the 6-digit code sent to your email',
        variant: 'destructive',
      });
      return;
    }

    try {
      setVerifying(true);
      const result = await verifyOTP(email, otp);
      
      toast({
        title: '✅ Email Verified',
        description: 'Your email has been successfully verified!',
      });

      // Set user in context
      if (result.user) {
        setUser(result.user);
        localStorage.setItem('authToken', result.user.token);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        
        // Mark this as a new registration session for onboarding tour
        sessionStorage.setItem('isNewRegistration', 'true');
      }

      // Redirect to dashboard
      navigate('/student-home');
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error?.message || 'Invalid or expired code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await resendOTP(email);
      
      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email',
      });
      setOtp('');
    } catch (error: any) {
      toast({
        title: 'Failed to Resend',
        description: error?.message || 'Could not resend code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit code to<br />
            <strong className="text-foreground">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl font-bold tracking-widest"
                disabled={verifying}
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Code expires in 10 minutes
              </p>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={verifying || otp.length !== 6}
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Verify Email
                </>
              )}
            </Button>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Resend Code
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={() => navigate('/signup')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Signup
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-center text-muted-foreground">
              <strong>Didn't receive the email?</strong><br />
              Check your spam folder or click "Resend Code"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyEmail;
