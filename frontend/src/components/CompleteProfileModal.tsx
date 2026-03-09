/**
 * CompleteProfileModal
 *
 * Shown to users who signed up via Google OAuth. Because Google only provides
 * name + email, the Student record (grade, age, school) is never created
 * during the OAuth flow. This modal collects those missing fields.
 *
 * It is NOT shown to users who registered through the normal sign-up form,
 * because those fields are already captured at registration time.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createStudentProfile } from '@/api/students';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, School, User, Calendar } from 'lucide-react';

const GRADES = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
  'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

interface Props {
  open: boolean;
  onComplete: () => void;
}

export function CompleteProfileModal({ open, onComplete }: Props) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [grade, setGrade] = useState('');
  const [age, setAge] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!grade) {
      toast({ title: 'Grade required', description: 'Please select your grade.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      await createStudentProfile(user.id, {
        fullName: fullName.trim() || user.fullName,
        grade,
        age: age ? parseInt(age) : undefined,
        schoolName: schoolName.trim(),
      });

      // If the name changed, patch localStorage so the header updates immediately
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
      localStorage.removeItem('needsProfileSetup');

      toast({
        title: 'Profile complete! 🎉',
        description: 'Your profile has been set up. Enjoy learning on Mindsta!',
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
        // Prevent closing by clicking outside — we want them to complete this
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Complete Your Profile</DialogTitle>
              <DialogDescription className="text-sm">
                Just a few more details to personalise your experience.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-name" className="flex items-center gap-1.5 text-sm font-medium">
              <User className="w-3.5 h-3.5" /> Full Name
            </Label>
            <Input
              id="cp-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {/* Grade — required */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-grade" className="flex items-center gap-1.5 text-sm font-medium">
              <GraduationCap className="w-3.5 h-3.5" /> Grade <span className="text-destructive">*</span>
            </Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger id="cp-grade">
                <SelectValue placeholder="Select your grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-age" className="flex items-center gap-1.5 text-sm font-medium">
              <Calendar className="w-3.5 h-3.5" /> Age
            </Label>
            <Input
              id="cp-age"
              type="number"
              min={5}
              max={25}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Your age"
            />
          </div>

          {/* School */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-school" className="flex items-center gap-1.5 text-sm font-medium">
              <School className="w-3.5 h-3.5" /> School Name
            </Label>
            <Input
              id="cp-school"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Your school name"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                'Save & Continue'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
