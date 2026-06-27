import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Home, BookOpen, Trophy, Wallet, Bell, User, Users, Gift, CheckSquare } from "lucide-react";

const studentNav = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/study", icon: BookOpen, label: "Study" },
  { path: "/wallet", icon: Wallet, label: "Wallet" },
  { path: "/rewards", icon: Trophy, label: "Rewards" },
];

const parentNav = [
  { path: "/parent", icon: Home, label: "Home" },
  { path: "/parent/rewards", icon: Gift, label: "Rewards" },
  { path: "/parent/approvals", icon: CheckSquare, label: "Approvals" },
  { path: "/notifications", icon: Bell, label: "Alerts" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    base44.entities.Notification.filter({ user_id: user.id, read: false })
      .then(n => setUnreadCount(n.length))
      .catch(() => {});
  }, [user, location]);

  const isParent = user?.role === "parent";
  const nav = isParent ? parentNav : studentNav;

  // Redirect: parent on a student route, or student on a parent route
  useEffect(() => {
    if (!user) return;
    const studentPaths = ["/dashboard", "/study", "/quiz", "/wallet", "/rewards"];
    const parentPaths = ["/parent"];

    const onStudentPath = studentPaths.some(p => location.pathname.startsWith(p));
    const onParentPath = parentPaths.some(p => location.pathname.startsWith(p));

    if (isParent && onStudentPath) {
      navigate("/parent", { replace: true });
    } else if (!isParent && onParentPath) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isParent, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to={isParent ? "/parent" : "/dashboard"} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              StudyQuest
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {!isParent && (
              <Link to="/notifications" className="relative p-2 rounded-full hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link to="/profile" className="p-2 rounded-full hover:bg-muted transition-colors">
              <User className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 pb-24 pt-4">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-border/50">
        <div className="max-w-5xl mx-auto flex items-center justify-around py-2">
          {nav.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/dashboard" && item.path !== "/parent" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.path === "/notifications" && unreadCount > 0 && (
                  <span className="absolute top-0 right-2 w-2 h-2 bg-accent rounded-full" />
                )}
                {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}