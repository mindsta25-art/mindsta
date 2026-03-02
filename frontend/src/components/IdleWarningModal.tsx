import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, LogOut } from "lucide-react";

interface IdleWarningModalProps {
  open: boolean;
  countdown: number;
  onContinue: () => void;
  onLogout: () => void;
}

export function IdleWarningModal({ open, countdown, onContinue, onLogout }: IdleWarningModalProps) {
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const countdownDisplay =
    minutes > 0
      ? `${minutes}:${String(seconds).padStart(2, "0")}`
      : `${seconds}s`;

  const urgency = countdown <= 30;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`p-2 rounded-full ${
                urgency ? "bg-red-100 dark:bg-red-950/40" : "bg-yellow-100 dark:bg-yellow-950/40"
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${urgency ? "text-red-500" : "text-yellow-500"}`}
              />
            </div>
            <DialogTitle className="text-xl">Session Timeout Warning</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            You've been inactive for a while. For your security, you'll be automatically
            logged out if no activity is detected.
          </DialogDescription>
        </DialogHeader>

        {/* Countdown display */}
        <div
          className={`flex items-center justify-center gap-3 py-6 rounded-xl border-2 ${
            urgency
              ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
              : "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20"
          }`}
        >
          <Clock
            className={`w-8 h-8 ${urgency ? "text-red-500 animate-pulse" : "text-yellow-500"}`}
          />
          <div className="text-center">
            <div
              className={`text-4xl font-black tabular-nums ${
                urgency ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {countdownDisplay}
            </div>
            <p className={`text-sm font-medium ${urgency ? "text-red-500" : "text-yellow-600 dark:text-yellow-400"}`}>
              until auto-logout
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Logout Now
          </Button>
          <Button
            onClick={onContinue}
            className="gap-2 flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Continue Session →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
