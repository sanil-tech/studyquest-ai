import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNav({ nav }) {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-orange-100 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-1">
        {nav.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/dashboard" && item.path !== "/parent" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[52px] transition-all ${
                isActive ? "text-orange-600 bg-orange-50" : "text-slate-400"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-orange-600" : "text-slate-400"}`} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}