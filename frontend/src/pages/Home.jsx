import React, { useEffect, useState } from "react";
import { getCategories, syncCategoriesFromServer } from "../data/inventoryStore";

const Home = () => {
  const [totalItems, setTotalItems] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const today = new Date();

  useEffect(() => {
    const refresh = () => {
      const categories = getCategories();
      const total = categories.flatMap((c) => c.items).length;
      setTotalItems(total);
      setTotalCategories(categories.length);
    };

    refresh();
    void syncCategoriesFromServer();

    window.addEventListener("inventoryCategoriesChanged", refresh);
    return () => window.removeEventListener("inventoryCategoriesChanged", refresh);
  }, []);

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-red-500 mb-4">Chicken Hut Daily Stock Register</h1>

      <p className="text-gray-300 text-lg mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-400" aria-hidden="true">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v13a3 3 0 003 3h12a3 3 0 003-3V6a2 2 0 00-2-2zm0 15a1 1 0 01-1 1H6a1 1 0 01-1-1V10h14v9z" />
        </svg>
        <span>{formattedDate}</span>
      </p>

      <div className="flex gap-4 mt-8">
        <div className="bg-gray-900 rounded p-4 border border-red-600 w-48">
          <h2 className="text-gray-400 text-xs font-medium mb-2">Total Items</h2>
          <p className="text-3xl font-bold text-red-500">{totalItems}</p>
        </div>
        <div className="bg-gray-900 rounded p-4 border border-red-600 w-48">
          <h2 className="text-gray-400 text-xs font-medium mb-2">Total Category</h2>
          <p className="text-3xl font-bold text-red-500">{totalCategories}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
