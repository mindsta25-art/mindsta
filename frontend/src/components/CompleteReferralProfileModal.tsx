/**
 * CompleteReferralProfileModal
 *
 * Shown to referral users who signed up via Google OAuth.
 * Because Google only provides name + email, the phone number is missing.
 * This modal collects the phone number before the user can use the dashboard.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, User } from 'lucide-react';

interface Props {
  open: boolean;
  onComplete: () => void;
}

export function CompleteReferralProfileModal({ open, onComplete }: Props) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!phoneNumber.trim()) {
      toast({ title: 'Phone number required', description: 'Please enter your phone number.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);

      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('authToken');

      const res = await fetch(`${apiURL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          ...(fullName.trim() && fullName.trim() !== user.fullName ? { fullName: fullName.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to save profile');
      }

      // Patch localStorage so the header/context updates immediately
      if (fullName.trim() && fullName.trim() !== user.fullName) {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.fullName = fullName.trim();
            localStorage.setItem('currentUser', JSON.stringify(parsed));
          } catch { /* ignore */ }
        }
        refreshUser();
      }

      // Clear the flag so the modal never shows again
      localStorage.removeItem('needsReferralProfileSetup');

      toast({
        title: 'Profile complete! 🎉',
        description: 'Your profile has been set up. Start sharing and earning!',
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'Could not save profile',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Complete your profile</DialogTitle>
              <DialogDescription className="mt-0.5">
                Just one more step before you start earning!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="r-fullname" className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              Full Name
            </Label>
            <Input
              id="r-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="r-phone" className="flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              Phone Number <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="r-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              required
            />
            <p className="text-xs text-muted-foreground">
              Needed for payout verification and account security.
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 font-semibold"
          >
            {saving ? 'Saving…' : 'Save & Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
