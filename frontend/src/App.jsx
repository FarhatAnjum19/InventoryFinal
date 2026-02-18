import React, { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import TodayInventory from "./pages/TodayInventory";
import AddInventory from "./pages/AddInventory";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Requirements from "./pages/Requirements";
import { getCurrentUser } from "./data/auth";
import { syncCategoriesFromServer } from "./data/inventoryStore";

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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-6">
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
