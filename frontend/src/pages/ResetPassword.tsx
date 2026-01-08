import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/api";
import mindstaLogo from "../assets/icons/mindsta2.png";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({ title: "Invalid link", description: "Reset token is missing.", variant: "destructive" });
      return;
    }

    if (!password || password.length < 8) {
      toast({ title: "Weak password", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Password mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast({ title: "Password updated", description: "You can now log in with your new password." });
      navigate("/auth?mode=login");
    } catch (err: any) {
      toast({ title: "Reset failed", description: err?.message || "Invalid or expired link.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background dark:via-muted dark:to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white/95 dark:bg-card shadow-2xl border-4 border-purple-300">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-3">
            <img src={mindstaLogo} alt="Mindsta Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent mb-2">Mindsta</h1>
          <p className="text-lg font-semibold">Reset your password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-black py-6">
            {loading ? "Updating..." : "Update Password"}
          </Button>
          <div className="text-center mt-2">
            <button type="button" onClick={() => navigate("/auth?mode=login")} className="text-sm text-purple-600 underline">
              Back to login
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
