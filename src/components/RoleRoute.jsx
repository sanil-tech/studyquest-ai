import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/**
 * Komponen Pelindung Laluan Berasaskan Peranan (Role-Based Route Guard)
 * @param {Array} allowedRoles - Senarai peranan yang dibenarkan masuk (cth: ["student"])
 * @param {React.Component} children - Halaman tujuan yang ingin dilindungi
 */
export default function RoleRoute({ allowedRoles, children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Ambil data sesi pengguna yang sedang log masuk secara nyata dari backend
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 1. Semasa sistem sedang menyemak sesi token, paparkan skrin loading kosong yang selamat
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Jika pengguna belum log masuk langsung, tendang mereka keluar ke halaman utama
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Jika peranan pengguna TIDAK ADA dalam senarai kebenaran (allowedRoles)
  if (!allowedRoles.includes(user.app_role)) {
    // Skenario A: Jika dia Pelajar tapi sesat dekat kawasan Ibu Bapa, hantar ke dashboard pelajar
    if (user.app_role === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }
    // Skenario B: Jika dia Ibu Bapa tapi sesat dekat kawasan Pelajar, hantar ke dashboard parent
    if (user.app_role === "parent") {
      return <Navigate to="/parent/dashboard" replace />;
    }
    
    // Fallback sekiranya akaun belum mempunyai role yang sah
    return <Navigate to="/role-setup" replace />;
  }

  // 4. Jika semua pengesahan lulus, benarkan akses masuk ke halaman children komponen
  return children;
}
