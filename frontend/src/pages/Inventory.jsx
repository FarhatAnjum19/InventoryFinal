import { useEffect, useMemo, useState } from "react";
import { getCategories, saveHistoryRecord, syncCategoriesFromServer } from "../data/inventoryStore";
import { toast } from "react-toastify";

const Inventory = () => {
  const [categories, setCategories] = useState(() => getCategories());
  const [items, setItems] = useState([]);
  const [apiError, setApiError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const buildRows = (cats) =>
      cats.flatMap((c) => c.items).map((name, index) => ({
        id: index,
        name,
        purchase: "",
        opening: "",
        closing: "",
        requirement: "",
      }));

    const refresh = () => {
      const merged = getCategories();
      setCategories(merged);
      setItems(buildRows(merged));
    };

    refresh();
    void syncCategoriesFromServer();

    window.addEventListener("inventoryCategoriesChanged", refresh);
    return () => {
      window.removeEventListener("inventoryCategoriesChanged", refresh);
    };
  }, []);

  const handleChange = (name, field, value) => {
    setItems((prev) => prev.map((it) => (it.name === name ? { ...it, [field]: value } : it)));
  };

  const clearCurrentInputs = () =>
    setItems((prev) => prev.map((it) => ({ ...it, purchase: "", opening: "", closing: "", requirement: "" })));

  const handleSave = async () => {
    setApiError("");
    setIsSaving(true);

    const now = new Date();
    const dateOnly = now.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timestampLabel = now.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const payload = {
      date: timestampLabel,
      dateOnly,
      timestamp: now.getTime(),
      items: items.map((it) => ({ ...it })),
    };

    const res = await saveHistoryRecord(payload);
    setIsSaving(false);

    if (!res.success) {
      setApiError(res.message || "Failed to save inventory");
      return;
    }

    clearCurrentInputs();
    toast.success(`Inventory saved to History for ${dateOnly}`);
  };

  const handleReset = () => {
    setApiError("");
    clearCurrentInputs();
  };

  const emptyRow = useMemo(
    () => ({ name: "", purchase: "", opening: "", closing: "", requirement: "" }),
    []
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-red-500 mb-6">Chicken Hut Daily Stock Register</h1>

      {apiError && <div className="mb-4 text-sm text-red-400">{apiError}</div>}

      {categories.map((cat) => (
        <div key={cat.title} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">{cat.title}</h2>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-700 text-sm">
              <thead className="bg-gray-900 text-red-400">
                <tr>
                  <th className="border border-gray-700 p-2 text-left">Particulars</th>
                  <th className="border border-gray-700 p-2">Purchase</th>
                  <th className="border border-gray-700 p-2">Opening Stock</th>
                  <th className="border border-gray-700 p-2">Closing Stock</th>
                  <th className="border border-gray-700 p-2">Requirement</th>
                </tr>
              </thead>

              <tbody>
                {cat.items.map((name) => {
                  const row = items.find((i) => i.name === name) || emptyRow;
                  return (
                    <tr key={name} className="text-center">
                      <td className="border border-gray-700 p-2 text-left pl-4">{name}</td>
                      <td className="border border-gray-700 p-2">
                        <input
                          type="text"
                          className="bg-black border border-gray-600 p-1 w-full"
                          value={row.purchase}
                          onChange={(e) => handleChange(name, "purchase", e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-700 p-2">
                        <input
                          type="text"
                          className="bg-black border border-gray-600 p-1 w-full"
                          value={row.opening}
                          onChange={(e) => handleChange(name, "opening", e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-700 p-2">
                        <input
                          type="text"
                          className="bg-black border border-gray-600 p-1 w-full"
                          value={row.closing}
                          onChange={(e) => handleChange(name, "closing", e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-700 p-2">
                        <input
                          type="text"
                          className="bg-black border border-gray-600 p-1 w-full"
                          value={row.requirement}
                          onChange={(e) => handleChange(name, "requirement", e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="mt-6 flex gap-3">
        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 disabled:opacity-60">
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button onClick={handleReset} className="px-4 py-2 border border-gray-700 rounded">
          Reset
        </button>
      </div>
    </div>
  );
};

export default Inventory;
