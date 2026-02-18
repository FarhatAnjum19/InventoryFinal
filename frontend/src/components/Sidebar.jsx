import React from "react";
import { NavLink } from "react-router-dom";


const DashboardIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
  </svg>
);

const InventoryIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9.75A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V7.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 11.25h9" />
  </svg>
);

const AddIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" />
  </svg>
);

const RequirementIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
  </svg>
);

const HistoryIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9m4.06-4.06l-6.36 6.36" />
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ReportsIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 16h6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.75h7.5L21 9v9.75A2.25 2.25 0 0118.75 21H6.75A2.25 2.25 0 014.5 18.75V6.75A3 3 0 017.5 3.75z" />
  </svg>
);

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-black text-white p-6 flex flex-col">

      {/* Logo Section */}
      <div className="flex items-center gap-3 mb-10">
        <img
          src="/logo.png"
          alt="Chicken Hut Logo"
          className="w-12 h-12 object-contain rounded-full"
        />
        <h1 className="text-xl font-bold text-red-500">
          Chicken Hut
        </h1>
      </div>

      {/* Date Section */}
      <div className="mb-6 text-sm text-gray-400">
        Date: {new Date().toLocaleDateString('en-GB')}
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-4">

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `px-4 py-2 rounded-md transition ${
              isActive
                ? "bg-red-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`
          }
        >
          <div className="flex items-center gap-3">
            <DashboardIcon className="w-5 h-5 text-gray-300" />
            <span>Dashboard</span>
          </div>
        </NavLink>

        <NavLink
          to="/inventory"
          end
          className={({ isActive }) =>
            `px-4 py-2 rounded-md transition ${
              isActive
                ? "bg-red-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`
          }
        >
          <div className="flex items-center gap-3">
            <InventoryIcon className="w-5 h-5 text-gray-300" />
            <span>Inventory</span>
          </div>
        </NavLink>

        <NavLink
          to="/inventory/add"
          className={({ isActive }) =>
            `px-4 py-2 rounded-md transition ${
              isActive
                ? "bg-red-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`
          }
        >
          <div className="flex items-center gap-3">
            <AddIcon className="w-5 h-5 text-gray-300" />
            <span>Add Items</span>
          </div>
        </NavLink>

        <NavLink
          to="/requirements"
          className={({ isActive }) =>
            `px-4 py-2 rounded-md transition ${
              isActive
                ? "bg-red-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`
          }
        >
          <div className="flex items-center gap-3">
            <RequirementIcon className="w-5 h-5 text-gray-300" />
            <span>Requirements</span>
          </div>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `px-4 py-2 rounded-md transition ${
              isActive
                ? "bg-red-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`
          }
        >
          <div className="flex items-center gap-3">
            <HistoryIcon className="w-5 h-5 text-gray-300" />
            <span>History</span>
          </div>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `px-4 py-2 rounded-md transition ${
              isActive
                ? "bg-red-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`
          }
        >
          <div className="flex items-center gap-3">
            <ReportsIcon className="w-5 h-5 text-gray-300" />
            <span>Reports</span>
          </div>
        </NavLink>

      </nav>

    </div>
  );
};

export default Sidebar;