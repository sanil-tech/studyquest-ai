import { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      // 👶 CHECK STUDENT SESSION FIRST
      const student = JSON.parse(localStorage.getItem("student"));

      if (student) {
        setUser(student);
        setRole("student");
        setLoading(false);
        return;
      }

      // 👨 CHECK PARENT SESSION (Base44)
      const parent = await base44.auth.me();

      if (parent) {
        setUser(parent);
        setRole("parent");
      }

    } catch (err) {
      console.log("Auth error:", err);
    }

    setLoading(false);
  };

  const loginStudent = (studentData) => {
    localStorage.setItem("student", JSON.stringify(studentData));
    setUser(studentData);
    setRole("student");
  };

  const logout = async () => {
    localStorage.removeItem("student");

    try {
      await base44.auth.logout();
    } catch {}

    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        loginStudent,
        logout,
        isStudent: role === "student",
        isParent: role === "parent"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);