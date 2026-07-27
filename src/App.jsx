// src/App.jsx
import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

// Core structural elements
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import ProfileCompleteRoute from '@/components/ProfileCompleteRoute';
import AdminRoute from '@/components/AdminRoute';
import AppLayout from '@/components/layout/AppLayout';
import { ViewModeProvider } from '@/lib/ViewModeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Admin Page Imports
import LessonResources from "@/pages/LessonResources";
import EditLessonResources from "@/pages/EditLessonResources";

// Lazy-loaded public & auth pages
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
const PremiumPage = React.lazy(() => import('@/pages/PremiumPage'));

// Lazy-loaded Student & Learning Pages
const StudentDashboard = React.lazy(() => import('@/pages/StudentDashboard'));
const StudyPage = React.lazy(() => import('@/pages/StudyPage'));
const LessonPage = React.lazy(() => import('@/pages/LessonPage'));
const QuizPage = React.lazy(() => import('@/pages/QuizPage'));
const QuizResult = React.lazy(() => import('@/pages/QuizResult'));
const WalletPage = React.lazy(() => import('@/pages/WalletPage'));
const RewardsPage = React.lazy(() => import('@/pages/RewardsPage'));
const GameHub = React.lazy(() => import('@/pages/GameHub'));
const DiagnosticIntro = React.lazy(() => import('@/pages/DiagnosticIntro'));
const DiagnosticAssessment = React.lazy(() => import('@/pages/DiagnosticAssessment'));
const DiagnosticResult = React.lazy(() => import('@/pages/DiagnosticResult'));

// Lazy-loaded Parent Pages
const ParentDashboard = React.lazy(() => import('@/pages/ParentDashboard'));
const MyChildrenPage = React.lazy(() => import('@/pages/MyChildrenPage'));
const ChildProfilePage = React.lazy(() => import('@/pages/ChildProfilePage'));
const ParentRewards = React.lazy(() => import('@/pages/ParentRewards'));
const ParentApprovals = React.lazy(() => import('@/pages/ParentApprovals'));
const ParentProfilePage = React.lazy(() => import('@/pages/ParentProfilePage'));
const ParentBilling = React.lazy(() => import('@/pages/ParentBilling'));
const ChildSelectionPage = React.lazy(() => import('@/pages/ChildSelectionPage'));

// Lazy-loaded Extra Pages
const Leaderboard = React.lazy(() => import('@/pages/Leaderboard'));
const Achievements = React.lazy(() => import('@/pages/Achievements'));
const ParentTips = React.lazy(() => import('@/pages/ParentTips'));

// Lazy-loaded Admin Pages
const TextbookUpload = React.lazy(() => import('@/pages/TextbookUpload'));
const AdminPremiumAccess = React.lazy(() => import('@/pages/AdminPremiumAccess'));

// ============================================================================
// LOADING SPINNER
// ============================================================================
const LoadingSpinner = ({ message = "Otan sedang bersiap..." }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#FAFAF7] z-50">
    <div className="text-center flex flex-col items-center">
      <div className="text-5xl animate-bounce mb-3 shadow-sm rounded-full bg-white/50 w-20 h-20 flex items-center justify-center border border-emerald-100">
        🦧
      </div>
      <p className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest animate-pulse">
        {message}
      </p>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingSpinner message="Membuka pintu akademi..." />;
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <ViewModeProvider>
    <Suspense fallback={<LoadingSpinner message="Melompat ke dahan baru..." />}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/child-login" element={<ChildLogin />} />

        {/* Authenticated routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          {/* Role setup & Profile completion */}
          <Route path="/role-setup" element={<RoleSetup />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Admin-only routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/textbooks" element={<TextbookUpload />} />
            <Route path="/admin/lesson-resources" element={<LessonResources />} />
            <Route path="/admin/edit-lesson" element={<EditLessonResources />} />
            <Route path="/admin/premium-access" element={<AdminPremiumAccess />} />
          </Route>

          {/* Shared layout routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/premium" element={<PremiumPage />} />

            {/* Student & Learning Routes (Allows parents in Child Mode too) */}
            <Route element={<ProfileCompleteRoute />}>
              <Route element={<RoleRoute allowedRoles={["student", "parent"]} />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                
                {/* Standard Study Routes */}
                <Route path="/study" element={<StudyPage />} />
                <Route path="/study/:subjectId" element={<StudyPage />} />
                <Route path="/study/:subjectId/:topicId" element={<LessonPage />} />

                {/* Lesson Route Aliases */}
                <Route path="/lessons" element={<StudyPage />} />
                <Route path="/lessons/:subjectId" element={<StudyPage />} />
                <Route path="/lesson/:subjectId/:topicId" element={<LessonPage />} />

                <Route path="/quiz/:quizId" element={<QuizPage />} />
                <Route path="/quiz-result/:attemptId" element={<QuizResult />} />
                <Route path="/games/:subjectId/:topicId" element={<GameHub />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/rewards" element={<RewardsPage />} />

                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/achievements" element={<Achievements />} />

                {/* Diagnostic Routes */}
                <Route path="/diagnostic" element={<DiagnosticIntro />} />
                <Route path="/diagnostic/assessment" element={<DiagnosticAssessment />} />
                <Route path="/diagnostic/result/:sessionId" element={<DiagnosticResult />} />
              </Route>
            </Route>

            {/* Parent Portal Routes */}
            <Route element={<ProfileCompleteRoute />}>
              <Route element={<RoleRoute allowedRoles={["parent"]} />}>
                <Route path="/parent" element={<ParentDashboard />} />
                <Route path="/parent/select-child" element={<ChildSelectionPage />} />
                <Route path="/parent/children" element={<MyChildrenPage />} />
                
                {/* Child Profile Management Routes (Both Plural & Singular Aliases) */}
                <Route path="/parent/children/:childId" element={<ChildProfilePage />} />
                <Route path="/parent/child/:childId" element={<ChildProfilePage />} />
                
                <Route path="/parent/rewards" element={<ParentRewards />} />
                <Route path="/parent/approvals" element={<ParentApprovals />} />
                <Route path="/parent/profile" element={<ParentProfilePage />} />
                <Route path="/parent/billing" element={<ParentBilling />} />
                <Route path="/parent-tips" element={<ParentTips />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
        </Routes>
    </Suspense>
    </ViewModeProvider>
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