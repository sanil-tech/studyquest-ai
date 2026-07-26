// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import your pages
import ParentDashboard from "@/pages/ParentDashboard";
import MyChildrenPage from "@/pages/MyChildrenPage";
import ChildProfilePage from "@/pages/ChildProfilePage"; // 👈 1. Import ChildProfilePage
import StudyPage from "@/pages/StudyPage";
import ProfilePage from "@/pages/ProfilePage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Parent Portal Routes */}
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/parent/children" element={<MyChildrenPage />} />
        
        {/* 👈 2. Add this route for individual Child Profiles */}
        <Route path="/parent/child/:childId" element={<ChildProfilePage />} />
        
        {/* Other Routes */}
        <Route path="/study" element={<StudyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Fallback 404 catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
