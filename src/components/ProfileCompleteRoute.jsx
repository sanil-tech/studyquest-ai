import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function ProfileCompleteRoute() {
  const { user, isLoadingAuth } = useAuth();

  // 1. Semasa sistem sedang menyemak status pengesahan sesi
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-bold tracking-wide uppercase">Memuatkan Sesi...</p>
        </div>
      </div>
    );
  }

  // 2. 🚨 ZON SEKATAN: Jika data profil dikesan belum lengkap, tendang terus ke /complete-profile
  if (!user?.profile_completed) {
    return <Navigate to="/complete-profile" replace />;
  }

  // 3. Jika profil sudah lengkap, benarkan akses ke sub-laluan (dashboard murid/parent)
  return <Outlet />;
}
