import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { useAuthStore } from "./stores";
import {
  LandingPage,
  AuthPage,
  DashboardPage,
  EditorPage,
  ViewerPage,
  NotFoundPage,
} from "./pages";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore();
  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            {/* Marketing & Showcase Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication & Studio Access */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Workspace Dashboard (Protected) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Presentation Studio Editor (Protected) */}
            <Route
              path="/editor/:projectId"
              element={
                <ProtectedRoute>
                  <EditorPage />
                </ProtectedRoute>
              }
            />

            {/* Client Presentation Experience Mode (Public link - No login required) */}
            <Route path="/view/:shareSlug" element={<ViewerPage />} />

            {/* In-app Preview Mode */}
            <Route path="/preview/:projectId" element={<ViewerPage />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
