import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../data/auth";

const Header = () => {
  const [dateTime, setDateTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const user = getCurrentUser();

  const userName = useMemo(() => {
    if (!user) return "Guest";
    if (user.name?.trim()) return user.name.trim();
    return "Guest";
  }, [user]);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateTime(formatted);
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="flex justify-between items-center px-8 py-4 border-b border-gray-800 bg-black">
      <h1 className="text-2xl font-semibold text-red-500">Chicken Hut Inventory</h1>

      <div className="flex items-center gap-4">
        <div className="text-gray-300 text-sm bg-gray-900 px-4 py-2 rounded-md border border-gray-700">
          Date/Time: {dateTime}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-700 bg-gray-900 hover:bg-gray-800 text-sm text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.485 0 4.5-2.015 4.5-4.5S14.485 3 12 3 7.5 5.015 7.5 7.5 9.515 12 12 12z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.5" />
            </svg>
            <span className="max-w-28 truncate">{userName}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border border-gray-700 bg-gray-900 shadow-lg p-3 z-20">
              <div className="text-sm text-white font-medium truncate">{userName}</div>
              {user && (
                <div className="text-xs text-gray-400 mt-1 space-y-1">
                  <div className="truncate">Username: {user.name?.trim() || "Not set"}</div>
                </div>
              )}
              {!user && <div className="text-xs text-gray-400 mt-1 truncate">Not logged in</div>}

              <div className="mt-3 border-t border-gray-700 pt-3">
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15l3-3-3-3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h12" />
                    </svg>
                    Logout
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full text-left text-sm text-blue-400 hover:text-blue-300"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
