import React, { Suspense, lazy, useEffect } from "react";
import { HashRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import { getCurrentUser } from "./data/auth";
import { syncCategoriesFromServer } from "./data/inventoryStore";

const Home = lazy(() => import("./pages/Home"));
const Inventory = lazy(() => import("./pages/Inventory"));
const TodayInventory = lazy(() => import("./pages/TodayInventory"));
const AddInventory = lazy(() => import("./pages/AddInventory"));
const History = lazy(() => import("./pages/History"));
const Reports = lazy(() => import("./pages/Reports"));
const Login = lazy(() => import("./pages/Login"));
const Requirements = lazy(() => import("./pages/Requirements"));

function PageLoader() {
  return <div className="text-sm text-gray-300">Loading...</div>;
}

function AppRoutes() {
  const location = useLocation();
  const user = getCurrentUser();
  const isAuthPage = location.pathname === "/login";

  useEffect(() => {
    if (user) {
      void syncCategoriesFromServer();
    }
  }, [user]);

  if (isAuthPage) {
    if (user) return <Navigate to="/" replace />;

    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-6">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/add" element={<AddInventory />} />
              <Route path="/requirements" element={<Requirements />} />
              <Route path="/today" element={<TodayInventory />} />
              <Route path="/history" element={<History />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
