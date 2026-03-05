import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { verifyOTP, resendOTP } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Shield, ArrowLeft, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();

  const email = location.state?.email || '';
  const isResent = location.state?.resent || false;
  const emailSent = location.state?.emailSent !== false; // defaults true
  const [stage, setStage] = useState<'check-email' | 'enter-otp'>(
    (isResent || !emailSent) ? 'enter-otp' : 'check-email'
  );
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!email) {
    navigate('/auth');
    return null;
  }

  // Countdown for OTP expiry
  useEffect(() => {
    if (stage !== 'enter-otp') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const otp = digits.join('');
  const maskedEmail = email.replace(/^(.{2})(.+)(@.+)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    try {
      setVerifying(true);
      const result = await verifyOTP(email, otp);
      if (result.user) {
        setUser(result.user);
        localStorage.setItem('authToken', result.user.token);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        sessionStorage.setItem('isNewRegistration', 'true');
      }
      navigate('/verify-success', { state: { user: result.user } });
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error?.message || 'Invalid or expired code. Please try again.',
        variant: 'destructive',
      });
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      setResending(true);
      await resendOTP(email);
      setCountdown(600);
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      toast({ title: 'Code Resent ✉️', description: 'A new 6-digit code has been sent to your email.' });
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      toast({ title: 'Failed to Resend', description: error?.message || 'Could not resend. Please try again.', variant: 'destructive' });
    } finally {
      setResending(false);
    }
  };

  // ── Stage 1: Check Email ──────────────────────────────────────────────
  if (stage === 'check-email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
        <div className="w-full max-w-lg">
          {/* Animated envelope card */}
          <div className="bg-white dark:bg-card rounded-3xl shadow-2xl overflow-hidden">
            {/* Top gradient banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 text-center">
              <div className="relative inline-flex">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
                    <Mail className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <h1 className="mt-4 text-2xl font-bold text-white">Check Your Email!</h1>
              <p className="mt-1 text-blue-100 text-sm">Your account has been created successfully</p>
            </div>

            {/* Body */}
            <div className="px-8 py-8 space-y-6">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground text-sm">We sent a 6-digit verification code to</p>
                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{maskedEmail}</span>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Open your email inbox' },
                  { step: '2', text: 'Find the email from Mindsta' },
                  { step: '3', text: 'Copy the 6-digit code' },
                  { step: '4', text: 'Come back and enter it below' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</div>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>

              {/* Spam notice */}
              {!emailSent && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-800 rounded-xl p-4 flex gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Email delivery failed.</strong> Tap <strong>Resend Code</strong> below to try again.
                  </p>
                </div>
              )}
              {/* Spam notice */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
                <span className="text-xl">📂</span>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Can't find it?</strong> Check your <strong>spam</strong> or <strong>junk</strong> folder — it may have landed there.
                </p>
              </div>

              {/* CTA buttons */}
              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setStage('enter-otp')}
              >
                <Shield className="w-5 h-5 mr-2" />
                I Have the Code — Enter It
              </Button>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={handleResend} disabled={resending}>
                  {resending ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Resend Code
                </Button>
                <Button variant="ghost" className="flex-1 gap-2" onClick={() => window.open('https://mail.google.com', '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                  Open Gmail
                </Button>
              </div>

              <button onClick={() => navigate('/auth?mode=login')} className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 2: Enter OTP ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-card rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-white">Enter Verification Code</h1>
            <p className="mt-1 text-blue-100 text-sm">Sent to <strong>{maskedEmail}</strong></p>
          </div>

          <div className="px-8 py-8 space-y-6">
            {/* Email-failed warning */}
            {!emailSent && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-xl p-3 flex gap-2 text-sm text-amber-800 dark:text-amber-300">
                <span>⚠️</span>
                <span><strong>Email not received?</strong> Tap <strong>Resend Code</strong> below — your account was created successfully.</span>
              </div>
            )}
            <form onSubmit={handleVerify} className="space-y-6">
              {/* Digit boxes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block">6-Digit Code</label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className={`w-11 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all outline-none
                        ${ d ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}
                        focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800`}
                      disabled={verifying}
                    />
                  ))}
                </div>
                {/* Countdown */}
                <p className={`text-xs text-center ${ countdown < 60 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                  {countdown > 0 ? `⏱ Code expires in ${formatTime(countdown)}` : '⚠️ Code has expired. Please request a new one.'}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={verifying || otp.length !== 6 || countdown === 0}
              >
                {verifying ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Verifying...</>
                ) : (
                  <><Shield className="w-5 h-5 mr-2" />Verify & Activate Account</>
                )}
              </Button>
            </form>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleResend} disabled={resending || resendCooldown > 0}>
                {resending
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <RefreshCw className="w-4 h-4" />}
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </Button>
              <Button variant="ghost" className="flex-1 gap-2" onClick={() => setStage('check-email')}>
                <Mail className="w-4 h-4" /> Check Email
              </Button>
            </div>

            <button onClick={() => navigate('/auth?mode=login')} className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
