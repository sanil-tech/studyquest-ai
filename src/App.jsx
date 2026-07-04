import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

// Core structural elements loaded instantly
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import ProfileCompleteRoute from '@/components/ProfileCompleteRoute';
import AdminRoute from '@/components/AdminRoute';
import AppLayout from '@/components/layout/AppLayout';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Lazy-loaded pages for better bundle size and performance
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const ForgotPassword = React.lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/ResetPassword'));
const ChildLogin = React.lazy(() => import('@/pages/ChildLogin'));
const RoleSetup = React.lazy(() => import('@/pages/RoleSetup'));
const CompleteProfile = React.lazy(() => import('@/pages/CompleteProfile'));
const Home = React.lazy(() => import('@/pages/Home'));
const NotificationsPage = React.lazy(() => import('@/pages/NotificationsPage'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));

// Student Pages
const StudentDashboard = React.lazy(() => import('@/pages/StudentDashboard'));
const StudyPage = React.lazy(() => import('@/pages/StudyPage'));
const LessonPage = React.lazy(() => import('@/pages/LessonPage'));
const QuizPage = React.lazy(() => import('@/pages/QuizPage'));
const QuizResult = React.lazy(() => import('@/pages/QuizResult'));
const WalletPage = React.lazy(() => import('@/pages/WalletPage'));
const RewardsPage = React.lazy(() => import('@/pages/RewardsPage'));

// Parent Pages
const ParentDashboard = React.lazy(() => import('@/pages/ParentDashboard'));
const MyChildrenPage = React.lazy(() => import('@/pages/MyChildrenPage'));
const ChildProfilePage = React.lazy(() => import('@/pages/ChildProfilePage'));
const ParentRewards = React.lazy(() => import('@/pages/ParentRewards'));
const ParentApprovals = React.lazy(() => import('@/pages/ParentApprovals'));

// Admin Pages
const TextbookUpload = React.lazy(() => import('@/pages/TextbookUpload'));

// Common Loading Fallback Component
const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingSpinner message="Loading StudyQuest..." />;
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/child-login" element={<ChildLogin />} />

        {/* Authenticated routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          {/* Role setup & Profile completion (no shared AppLayout here) */}
          <Route path="/role-setup" element={<RoleSetup />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Admin-only routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/textbooks" element={<TextbookUpload />} />
          </Route>

          {/* Shared layout routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Student-only routes */}
            <Route element={<ProfileCompleteRoute />}>
              <Route element={<RoleRoute allowedRoles={["student"]} />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/study" element={<StudyPage />} />
                <Route path="/study/:subjectId" element={<StudyPage />} />
                <Route path="/study/:subjectId/:topicId" element={<LessonPage />} />
                <Route path="/quiz/:quizId" element={<QuizPage />} />
                <Route path="/quiz-result/:attemptId" element={<QuizResult />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/rewards" element={<RewardsPage />} />
              </Route>
            </Route>

            {/* Parent-only routes */}
            <Route element={<ProfileCompleteRoute />}>
              <Route element={<RoleRoute allowedRoles={["parent"]} />}>
                <Route path="/parent" element={<ParentDashboard />} />
                <Route path="/parent/children" element={<MyChildrenPage />} />
                <Route path="/parent/children/:childId" element={<ChildProfilePage />} />
                <Route path="/parent/rewards" element={<ParentRewards />} />
                <Route path="/parent/approvals" element={<ParentApprovals />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;