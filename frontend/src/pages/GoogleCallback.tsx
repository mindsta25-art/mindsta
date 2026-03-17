import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/ui/loading";
import { getStudentByUserId } from "@/api/students";

/**
 * Google OAuth Callback Handler
 * Processes the OAuth response and logs the user in.
 *
 * The backend redirects here using a hash fragment (#) so the token
 * never appears in server access logs or referrer headers.
 */
const GoogleCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse the hash fragment — backend sends data as #key=value&...
        // Hash fragments are not sent over HTTP so the JWT stays client-side only.
        const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
        const params = new URLSearchParams(hash);

        const token = params.get('token');
        const email = params.get('email');
        const fullName = params.get('fullName');
        const userType = params.get('userType');
        const id = params.get('id');
        const error = params.get('error');

        // Handle error from OAuth
        if (error) {
          toast({
            title: "Authentication Failed",
            description: error === 'google_auth_failed' 
              ? "Google authentication failed. Please try again."
              : error === 'authentication_failed'
              ? "Unable to complete authentication. Please try again."
              : "An error occurred during authentication.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        // Validate required parameters
        if (!token || !email || !fullName || !userType || !id) {
          toast({
            title: "Authentication Error",
            description: "Missing authentication data. Please try again.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        // Store authentication data
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify({
          id,
          email,
          fullName,
          userType,
          token,
          isVerified: true, // Google accounts are pre-verified
        }));

        // Refresh auth context
        refreshUser();

        // Show success message
        toast({
          title: "Welcome!",
          description: `Logged in successfully with Google as ${fullName}`,
        });

        // Redirect based on user type; for students check if a Student profile record
        // exists yet — Google OAuth users skip the signup form so grade/age/school are
        // never captured. Flag them so the dashboard can prompt for completion.
        if (userType === 'admin') {
          navigate('/admin');
        } else if (userType === 'referral') {
          // Google OAuth referral users skip the signup form, so they may not have
          // a phone number yet. Flag it so the dashboard shows the completion modal.
          localStorage.setItem('needsReferralProfileSetup', 'true');
          navigate('/referral-dashboard');
        } else {
          // Check if student profile exists (best-effort; don't block navigation on failure)
          try {
            const studentProfile = await getStudentByUserId(id);
            if (!studentProfile) {
              localStorage.setItem('needsProfileSetup', 'true');
            }
          } catch {
            localStorage.setItem('needsProfileSetup', 'true');
          }
          navigate('/student-home');
        }
      } catch (error) {
        console.error('Error processing Google callback:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to complete login. Please try again.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleCallback();
  }, [location.hash, navigate, toast, refreshUser]);

  return (
    <LoadingScreen message="Completing sign-in with Google..." />
  );
};

export default GoogleCallback;
