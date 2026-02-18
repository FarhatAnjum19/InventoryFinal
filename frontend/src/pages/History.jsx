import React, { useEffect, useState } from "react";
import { deleteHistoryRecord, fetchHistoryRecords, updateHistoryRecord } from "../data/inventoryStore";
import { toast } from "react-toastify";
import { confirmToast } from "../utils/confirmToast";

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [expandedDate, setExpandedDate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedItems, setEditedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setError("");
    setLoading(true);
    const res = await fetchHistoryRecords();
    setLoading(false);

    if (!res.success) {
      setError(res.message || "Failed to load history");
      return;
    }

    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const recent = (res.data || []).filter((record) => now - (record.timestamp || 0) < sevenDaysInMs);
    setHistoryData(recent);
  };

  useEffect(() => {
    void loadHistory();

    const onHistoryChange = () => {
      void loadHistory();
    };
    window.addEventListener("inventoryHistoryChanged", onHistoryChange);
    return () => window.removeEventListener("inventoryHistoryChanged", onHistoryChange);
  }, []);

  const groupedByDate = historyData.reduce((acc, record) => {
    const dateKey = record.dateOnly || String(record.date || "").split(",")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(record);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  const toggleExpandDate = (date) => {
    setExpandedDate(expandedDate === date ? null : date);
    setEditingId(null);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setEditedItems((record.items || []).map((it) => ({ ...it })));
  };

  const handleEditChange = (itemIndex, field, value) => {
    setEditedItems((prev) => prev.map((item, idx) => (idx === itemIndex ? { ...item, [field]: value } : item)));
  };

  const handleSave = async (recordId) => {
    const res = await updateHistoryRecord(recordId, editedItems);
    if (!res.success) return toast.error(res.message || "Failed to update record");

    setEditingId(null);
    await loadHistory();
    toast.success("Record updated successfully");
  };

  const handleDelete = async (recordId) => {
    const ok = await confirmToast("Are you sure you want to delete this record?");
    if (!ok) return;

    const res = await deleteHistoryRecord(recordId);
    if (!res.success) return toast.error(res.message || "Failed to delete record");

    await loadHistory();
    toast.success("Record deleted successfully");
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-red-500 mb-8">Inventory History</h1>

      {loading && <div className="text-gray-300">Loading history...</div>}
      {error && <div className="text-red-400 mb-4">{error}</div>}

      {!loading && historyData.length === 0 ? (
        <div className="bg-gray-900 rounded p-8 border border-gray-700 text-center">
          <p className="text-gray-400 text-lg">No history records found. Save inventory entries to view them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <button
                onClick={() => toggleExpandDate(dateKey)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-4 text-left hover:bg-gray-800 transition flex justify-between items-center"
              >
                <span className="text-lg font-semibold text-red-400">{dateKey}</span>
                <span className="text-red-600" aria-hidden="true">{expandedDate === dateKey ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="m9 6 6 6-6 6-1.41-1.41L12.17 12 7.59 7.41 9 6z" /></svg>)}</span>
              </button>

              {expandedDate === dateKey && (
                <div className="bg-gray-950 border border-gray-700 border-t-0 rounded-b p-6 space-y-6">
                  {groupedByDate[dateKey].map((record, saveIndex) => (
                    <div key={record._id} className="border border-gray-700 rounded p-4 bg-gray-900">
                      <h3 className="text-sm text-gray-400 mb-3">Save #{saveIndex + 1} - {String(record.date || "").split(",")[1]?.trim() || record.date}</h3>

                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-700 text-sm">
                          <thead className="bg-gray-800 text-red-400">
                            <tr>
                              <th className="border border-gray-700 p-2 text-left">Item Name</th>
                              <th className="border border-gray-700 p-2">Purchase</th>
                              <th className="border border-gray-700 p-2">Opening Stock</th>
                              <th className="border border-gray-700 p-2">Closing Stock</th>
                              <th className="border border-gray-700 p-2">Requirement</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(editingId === record._id ? editedItems : record.items || []).map((item, itemIndex) => (
                              <tr key={`${record._id}-${itemIndex}`} className="text-center">
                                <td className="border border-gray-700 p-2 text-left pl-4">{item.name}</td>
                                {["purchase", "opening", "closing", "requirement"].map((field) => (
                                  <td key={field} className="border border-gray-700 p-2">
                                    {editingId === record._id ? (
                                      <input
                                        type="text"
                                        className="bg-black border border-gray-600 p-1 w-full"
                                        value={item[field] || ""}
                                        onChange={(e) => handleEditChange(itemIndex, field, e.target.value)}
                                      />
                                    ) : (
                                      item[field] || "-"
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex gap-2">
                        {editingId === record._id ? (
                          <>
                            <button
                              onClick={() => handleSave(record._id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 border border-gray-700 rounded text-sm hover:bg-gray-800 transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(record)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => toggleExpandDate(dateKey)}
                    className="w-full px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 transition text-center"
                  >
                    Back to History
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;


