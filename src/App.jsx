import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

// ==========================================
// IMPORT HALAMAN UTAMA (PAGES)
// ==========================================
import Login from "@/pages/Login";
import ChildLogin from "@/pages/ChildLogin";
import ParentDashboard from "@/pages/ParentDashboard";
import MyChildrenPage from "@/pages/MyChildrenPage";
import StudentDashboard from "@/pages/StudentDashboard";
import ProfilePage from "@/pages/ProfilePage";

// ==========================================
// IMPORT KAWALAN LALUAN PELINDUNG (ROUTE GUARD)
// ==========================================
import RoleRoute from "@/components/RoleRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🚪 Laluan Utama Pelancar Portal */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 🔑 Pintu Masuk Bebas (Public Routes) */}
        <Route path="/login" element={<Login />} />
        <Route path="/child-login" element={<ChildLogin />} />

        {/* 🛡️ Laluan Kawalan Ibu Bapa (Hanya peranan "parent" dibenarkan) */}
        <Route 
          path="/parent/dashboard" 
          element={
            <RoleRoute allowedRoles={["parent"]}>
              <ParentDashboard />
            </RoleRoute>
          } 
        />
        <Route 
          path="/parent/children" 
          element={
            <RoleRoute allowedRoles={["parent"]}>
              <MyChildrenPage />
            </RoleRoute>
          } 
        />
        <Route 
          path="/parent/profile" 
          element={
            <RoleRoute allowedRoles={["parent", "admin"]}>
              <ProfilePage />
            </RoleRoute>
          } 
        />

        {/* 🦖 Laluan Portal Pelajar (Hanya peranan "student" dibenarkan) */}
        <Route 
          path="/student/dashboard" 
          element={
            <RoleRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </RoleRoute>
          } 
        />
        <Route 
          path="/student/profile" 
          element={
            <RoleRoute allowedRoles={["student"]}>
              <ProfilePage />
            </RoleRoute>
          } 
        />

        {/* 🔍 Pengendali jika Pengguna Menaip URL yang Salah */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      
      {/* ⚡ Komponen Pemberitahuan Makluman Global (Shadcn UI Toast) */}
      <Toaster />
    </BrowserRouter>
  );
}
