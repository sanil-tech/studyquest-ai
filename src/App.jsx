import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import RoleSetup from '@/pages/RoleSetup';
import Home from '@/pages/Home';
import StudentDashboard from '@/pages/StudentDashboard';
import StudyPage from '@/pages/StudyPage';
import LessonPage from '@/pages/LessonPage';
import QuizPage from '@/pages/QuizPage';
import QuizResult from '@/pages/QuizResult';
import WalletPage from '@/pages/WalletPage';
import RewardsPage from '@/pages/RewardsPage';
import ParentDashboard from '@/pages/ParentDashboard';
import ParentRewards from '@/pages/ParentRewards';
import ParentApprovals from '@/pages/ParentApprovals';
import NotificationsPage from '@/pages/NotificationsPage';
import ProfilePage from '@/pages/ProfilePage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading StudyQuest...</p>
        </div>
      </div>
    );
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Role setup (no role yet) */}
        <Route path="/role-setup" element={<RoleSetup />} />

        {/* Shared layout — notifications & profile available to both roles */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Student-only routes */}
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

          {/* Parent-only routes */}
          <Route element={<RoleRoute allowedRoles={["parent"]} />}>
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/rewards" element={<ParentRewards />} />
            <Route path="/parent/approvals" element={<ParentApprovals />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
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
  )
}

export default App