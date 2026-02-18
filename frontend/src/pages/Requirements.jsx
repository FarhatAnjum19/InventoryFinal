import React, { useEffect, useState } from "react";
import { fetchRequirements, deleteRequirement } from "../data/inventoryStore";
import { toast } from "react-toastify";
import { confirmToast } from "../utils/confirmToast";

const Requirements = () => {
  const [requirements, setRequirements] = useState([]);
  const [expandedDate, setExpandedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    const res = await fetchRequirements();
    setLoading(false);
    if (!res.success) {
      setError(res.message || "Failed to load requirements");
      setRequirements([]);
      return;
    }
    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const recent = (res.data || []).filter((r) => now - (r.timestamp || 0) < sevenDaysInMs);
    setRequirements(recent);
  };

  useEffect(() => {
    void load();
    const onReqChange = () => void load();
    window.addEventListener("inventoryRequirementsChanged", onReqChange);
    return () => window.removeEventListener("inventoryRequirementsChanged", onReqChange);
  }, []);

  const grouped = requirements.reduce((acc, rec) => {
    const key = rec.dateOnly || String(rec.date || "").split(",")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(rec);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const toggle = (date) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const handleDelete = async (id) => {
    const ok = await confirmToast("Are you sure you want to delete this requirement record?");
    if (!ok) return;
    const res = await deleteRequirement(id);
    if (!res.success) return toast.error(res.message || "Failed to delete requirement");
    toast.success("Requirement deleted");
    await load();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-red-500 mb-6">Requirements</h1>

      {loading && <div className="text-gray-300">Loading requirements...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && sortedDates.length === 0 && (
        <div className="text-gray-400">No requirement items found.</div>
      )}

      <div className="space-y-3">
        {sortedDates.map((dateKey) => (
          <div key={dateKey}>
            <button
              onClick={() => toggle(dateKey)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-4 text-left hover:bg-gray-800 transition flex justify-between items-center"
            >
              <span className="text-lg font-semibold text-red-400">{dateKey}</span>
              <span className="text-red-600">{expandedDate === dateKey ? "▼" : "▶"}</span>
            </button>

            {expandedDate === dateKey && (
              <div className="bg-gray-950 border border-gray-700 border-t-0 rounded-b p-6 space-y-4">
                {grouped[dateKey].map((rec, idx) => (
                  <div key={rec._id} className="border border-gray-700 rounded p-4 bg-gray-900">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-400">Save #{idx + 1} - {String(rec.date || "").split(",")[1]?.trim() || rec.date}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(rec._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800 text-red-400">
                          <tr>
                            <th className="p-2 text-left">Item</th>
                            <th className="p-2">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(rec.items || []).map((it, i) => (
                            <tr key={`${rec._id}-${i}`} className="border-t border-gray-800">
                              <td className="p-2">{it.name}</td>
                              <td className="p-2">{it.requirement || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => toggle(dateKey)}
                  className="w-full px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 transition text-center"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Requirements;
