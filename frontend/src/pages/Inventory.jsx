import { useEffect, useMemo, useState } from "react";
import { fetchHistoryRecords, getCategories, saveHistoryRecord, syncCategoriesFromServer } from "../data/inventoryStore";
import { toast } from "react-toastify";

function parseDateOnly(dateOnly) {
  const [day, month, year] = String(dateOnly || "").split("/").map(Number);
  if (!day || !month || !year) return Number.NaN;
  const dt = new Date(year, month - 1, day);
  return Number.isNaN(dt.getTime()) ? Number.NaN : dt.getTime();
}

function buildCarryForwardMap(history, todayDateOnly) {
  const todayTs = parseDateOnly(todayDateOnly);
  if (!Array.isArray(history) || !Number.isFinite(todayTs)) return new Map();

  let latestPrev = null;
  for (const rec of history) {
    const recTs = parseDateOnly(rec?.dateOnly);
    if (!Number.isFinite(recTs) || recTs >= todayTs) continue;
    if (!latestPrev || recTs > parseDateOnly(latestPrev.dateOnly) || (recTs === parseDateOnly(latestPrev.dateOnly) && (rec.timestamp || 0) > (latestPrev.timestamp || 0))) {
      latestPrev = rec;
    }
  }

  if (!latestPrev || !Array.isArray(latestPrev.items)) return new Map();

  const carryMap = new Map();
  for (const item of latestPrev.items) {
    const name = String(item?.name || "").trim();
    if (!name) continue;
    carryMap.set(name, {
      opening: item?.closing ? String(item.closing) : "",
      purchase: item?.requirement ? String(item.requirement) : "",
    });
  }

  return carryMap;
}

const Inventory = () => {
  const [categories, setCategories] = useState(() => getCategories());
  const [items, setItems] = useState([]);
  const [apiError, setApiError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const buildRows = (cats, carryMap = new Map()) =>
      cats.flatMap((c) => c.items).map((name, index) => ({
        id: index,
        name,
        purchase: carryMap.get(name)?.purchase || "",
        opening: carryMap.get(name)?.opening || "",
        closing: "",
        requirement: "",
      }));

    const refresh = async () => {
      const merged = getCategories();
      const todayDateOnly = new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      let carryMap = new Map();
      const historyRes = await fetchHistoryRecords();
      if (historyRes.success) {
        carryMap = buildCarryForwardMap(historyRes.data, todayDateOnly);
      }

      setCategories(merged);
      setItems(buildRows(merged, carryMap));
    };

    void refresh();
    void syncCategoriesFromServer();

    const onCategoriesChanged = () => {
      void refresh();
    };

    window.addEventListener("inventoryCategoriesChanged", onCategoriesChanged);
    return () => {
      window.removeEventListener("inventoryCategoriesChanged", onCategoriesChanged);
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
