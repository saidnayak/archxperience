import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { useAuthStore } from "./stores";

const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const EditorPage = lazy(() => import("./pages/EditorPage").then((m) => ({ default: m.EditorPage })));
const ViewerPage = lazy(() => import("./pages/ViewerPage").then((m) => ({ default: m.ViewerPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

function RouteFallback() {
  return (
    <div className="min-h-screen w-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
      <span className="text-xs font-mono text-text-secondary">Loading ArchXperience...</span>
    </div>
  );
}

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
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>
        </AuthInitializer>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
