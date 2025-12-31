"use client";

import React, { useState } from "react";
import { AuthProvider, useAuth } from "../components/AuthContext";
import HomePage from "../components/HomePage";
import Login from "../components/Login";
import Dashboard from "../components/Dashboard";
import PracticeEditor from "../components/PracticeEditor";
import { SavedPractice } from "../types/swimSet";

type AppView = "home" | "login" | "dashboard" | "editor" | "demo";

function AppContent() {
  const { user, isLoading, login } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [currentPractice, setCurrentPractice] = useState<SavedPractice | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // If user is logged in, redirect to dashboard unless editing or demo
  if (user && currentView !== "editor" && currentView !== "demo") {
    if (currentView !== "dashboard") {
      setCurrentView("dashboard");
    }
  }

  const handleNavigateToLogin = () => {
    setCurrentView("login");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
  };

  const handleTryDemo = () => {
    setCurrentView("demo");
    setCurrentPractice(null);
  };

  const handleLogin = (user: any, token: string) => {
    login(user, token);
    setCurrentView("dashboard");
  };

  const handleCreateNew = () => {
    setCurrentPractice(null);
    setCurrentView("editor");
  };

  const handleEditPractice = (practice: SavedPractice) => {
    setCurrentPractice(practice);
    setCurrentView("editor");
  };

  const handleBackToDashboard = () => {
    setCurrentPractice(null);
    setCurrentView("dashboard");
  };

  const handleBackToHomeFromDemo = () => {
    setCurrentView("home");
  };

  // Show appropriate view based on current state
  if (currentView === "home") {
    return <HomePage onNavigateToLogin={handleNavigateToLogin} onTryDemo={handleTryDemo} />;
  }

  if (currentView === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onBackToHome={handleBackToHome}
      />
    );
  }

  if (currentView === "demo") {
    return (
      <PracticeEditor
        onBackToDashboard={handleBackToHomeFromDemo}
        existingPractice={null}
      />
    );
  }

  if (currentView === "editor" && user) {
    return (
      <PracticeEditor
        onBackToDashboard={handleBackToDashboard}
        existingPractice={currentPractice}
      />
    );
  }

  // Dashboard view (user is logged in)
  if (user) {
    return (
      <Dashboard
        onCreateNew={handleCreateNew}
        onEditPractice={handleEditPractice}
      />
    );
  }

  // Fallback to home if no user and no specific view
  return <HomePage onNavigateToLogin={handleNavigateToLogin} onTryDemo={handleTryDemo} />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
