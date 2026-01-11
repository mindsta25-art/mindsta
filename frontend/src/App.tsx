import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// Removed TanStack React Query
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingScreen } from "@/components/ui/loading";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const StudentHome = lazy(() => import("./pages/StudentHome"));
const AllGrades = lazy(() => import("./pages/AllGrades"));
const AllSubjects = lazy(() => import("./pages/AllSubjects"));
const BrowseCourses = lazy(() => import("./pages/BrowseCourses"));
const MyLearning = lazy(() => import("./pages/MyLearning"));
const Profile = lazy(() => import("./pages/Profile"));
const StudentSettings = lazy(() => import("./pages/Settings"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const GradeLearning = lazy(() => import("./pages/GradeLearning"));
const TermSelection = lazy(() => import("./pages/TermSelection"));
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
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const LessonManagement = lazy(() => import("./pages/admin/LessonManagement"));
const SubjectManagement = lazy(() => import("./pages/SubjectManagement"));
const ReferralManagement = lazy(() => import("./pages/admin/ReferralManagement"));
const ReferralPayouts = lazy(() => import("./pages/admin/ReferralPayouts"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const NotificationManagement = lazy(() => import("./pages/admin/NotificationManagement"));

// React Query removed

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                  path="/all-subjects" 
                  element={
                    <ProtectedRoute>
                      <AllSubjects />
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
                
                {/* Legal Pages */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/about" element={<About />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </TooltipProvider>
  </ErrorBoundary>
);

export default App;
