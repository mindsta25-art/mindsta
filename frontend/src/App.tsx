import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// Removed TanStack React Query
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ContactSettingsProvider } from "@/contexts/ContactSettingsContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingScreen } from "@/components/ui/loading";
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { IdleWarningModal } from "@/components/IdleWarningModal";
import { signOut } from "@/api";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const VerifySuccess = lazy(() => import("./pages/VerifySuccess"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const StudentHome = lazy(() => import("./pages/StudentHome"));
const AllGrades = lazy(() => import("./pages/AllGrades"));
const BrowseTopics = lazy(() => import("./pages/BrowseTopics"));
const BrowseCourses = lazy(() => import("./pages/BrowseCourses"));
const MyLearning = lazy(() => import("./pages/MyLearning"));
const LeaderboardPage = lazy(() => import("./pages/Leaderboard"));
const Profile = lazy(() => import("./pages/Profile"));
const StudentSettings = lazy(() => import("./pages/Settings"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const GradeLearning = lazy(() => import("./pages/GradeLearning"));
const TermSelection = lazy(() => import("./pages/TermSelection"));
const TopicDetail = lazy(() => import("./pages/TopicDetail"));
const SubjectLessons = lazy(() => import("./pages/SubjectLessons"));
const LessonDetail = lazy(() => import("./pages/LessonDetail"));
const Referral = lazy(() => import("./pages/ReferralDashboard"));
const ReferralAuth = lazy(() => import("./pages/ReferralAuth"));
const ReferralSettings = lazy(() => import("./pages/ReferralSettings"));
const GradeAssessment = lazy(() => import("./pages/GradeAssessment"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const About = lazy(() => import("./pages/About"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Student Support Pages
const Progress = lazy(() => import('./pages/Progress'));
const Achievements = lazy(() => import('./pages/Achievements'));
const QuickQuiz = lazy(() => import('./pages/QuickQuiz'));
const FAQ = lazy(() => import("./pages/FAQ"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const Support = lazy(() => import("./pages/Support"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const LessonManagement = lazy(() => import("./pages/admin/LessonManagement"));
const SubjectManagement = lazy(() => import("./pages/admin/SubjectManagement"));
const TopicManagement = lazy(() => import("./pages/admin/TopicManagement"));
const ReferralManagement = lazy(() => import("./pages/admin/ReferralManagement"));
const ReferralPayouts = lazy(() => import("./pages/admin/ReferralPayouts"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const FinancialReport = lazy(() => import("./pages/admin/FinancialReport"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const NotificationManagement = lazy(() => import("./pages/admin/NotificationManagement"));
const SuggestionManagement = lazy(() => import("./pages/admin/SuggestionManagement"));
const QuestionManagement = lazy(() => import("./pages/admin/QuestionManagement"));
const NewsletterSubscribers = lazy(() => import("./pages/admin/NewsletterSubscribers"));
const TicketManagement = lazy(() => import("./pages/admin/TicketManagement"));
const LeaderboardManagement = lazy(() => import("./pages/admin/LeaderboardManagement"));

// React Query removed

// Idle timer wrapper - must be inside AuthProvider and BrowserRouter
function IdleTimerWrapper({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    refreshUser();
    navigate("/auth");
  };

  const { showWarning, countdown, continueSession } = useIdleTimer({
    idleMinutes: 10,
    warningMinutes: 2,
    onLogout: handleLogout,
    enabled: !!user,
  });

  return (
    <>
      {children}
      <IdleWarningModal
        open={showWarning}
        countdown={countdown}
        onContinue={continueSession}
        onLogout={handleLogout}
      />
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <AuthProvider>
        <ContactSettingsProvider>
          <ThemeProvider>
            <CartProvider>
              <WishlistProvider>
                <Toaster />
                <Sonner />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
              <ScrollToTop />
              <IdleTimerWrapper>
              <Suspense fallback={<LoadingScreen message="Loading page..." />}>
                <Routes>
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/auth" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Auth />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/auth/google/callback" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <GoogleCallback />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/verify-email" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <VerifyEmail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/verify-success" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <VerifySuccess />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reset-password" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <ResetPassword />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/home" 
                  element={
                    <ProtectedRoute>
                      <StudentHome />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/all-grades" 
                  element={
                    <ProtectedRoute>
                      <AllGrades />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/browse-topics/:grade" 
                  element={
                    <ProtectedRoute>
                      <BrowseTopics />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/my-learning" 
                  element={
                    <ProtectedRoute>
                      <MyLearning />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/leaderboard" 
                  element={
                    <ProtectedRoute>
                      <LeaderboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/browse" 
                  element={
                    <ProtectedRoute>
                      <BrowseCourses />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/search" 
                  element={
                    <ProtectedRoute>
                      <SearchResults />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/grade-assessment" 
                  element={
                    <ProtectedRoute>
                      <GradeAssessment />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <StudentSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cart" 
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wishlist" 
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/progress" 
                  element={
                    <ProtectedRoute>
                      <Progress />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/achievements" 
                  element={
                    <ProtectedRoute>
                      <Achievements />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/quick-quiz" 
                  element={
                    <ProtectedRoute>
                      <QuickQuiz />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/report" 
                  element={
                    <ProtectedRoute>
                      <ReportIssue />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/payment/callback" 
                  element={
                    <ProtectedRoute>
                      <PaymentCallback />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/grade/:grade" 
                  element={
                    <ProtectedRoute>
                      <GradeLearning />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/grade/:grade/term/:term" 
                  element={
                    <ProtectedRoute>
                      <TermSelection />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/topic/:topicId" 
                  element={
                    <ProtectedRoute>
                      <TopicDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/subject/:subject" 
                  element={
                    <ProtectedRoute>
                      <SubjectLessons />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/grade/:grade/:subject" 
                  element={
                    <ProtectedRoute>
                      <SubjectLessons />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/subjects/:grade/:subject" 
                  element={
                    <ProtectedRoute>
                      <SubjectLessons />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/grade/:grade/:subject/lesson/:lessonId" 
                  element={
                    <ProtectedRoute>
                      <LessonDetail />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/referral" 
                  element={
                    <ProtectedRoute requireReferral>
                      <Referral />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/referral/dashboard" 
                  element={
                    <ProtectedRoute requireReferral>
                      <Referral />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/referral/settings" 
                  element={
                    <ProtectedRoute requireReferral>
                      <ReferralSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/referral-auth" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <ReferralAuth />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin Authentication Route */}
                <Route 
                  path="/admin-auth" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <AdminAuth />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <UserManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/newsletter" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <NewsletterSubscribers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/content" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <ContentManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/lessons" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <LessonManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/subjects" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <SubjectManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/topics" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <TopicManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/referrals" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <ReferralManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/referral-payouts" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <ReferralPayouts />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/analytics" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <Analytics />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/reports" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/financial-report" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <FinancialReport />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/notifications" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <NotificationManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/suggestions" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <SuggestionManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/questions" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <QuestionManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/tickets" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <TicketManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/leaderboard" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <LeaderboardManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Public Info Pages */}
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/support" element={<Support />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </IdleTimerWrapper>
          </BrowserRouter>
              </WishlistProvider>
            </CartProvider>
          </ThemeProvider>
        </ContactSettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
