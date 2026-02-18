import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { fetchHistoryRecords, getCategories, syncCategoriesFromServer } from "../data/inventoryStore";

const Reports = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [pieMode, setPieMode] = useState("count");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    const computeReports = async () => {
      setError("");
      setLoading(true);

      const historyRes = await fetchHistoryRecords();
      if (!historyRes.success) {
        setError(historyRes.message || "Failed to load reports");
        setMonthlyData([]);
        setCategoryDistribution([]);
        setLoading(false);
        return;
      }

      const history = historyRes.data || [];
      const months = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: label, usage: 0 });
      }

      const hasAnyValue = (item) =>
        (item?.purchase && item.purchase.toString().trim()) ||
        (item?.opening && item.opening.toString().trim()) ||
        (item?.closing && item.closing.toString().trim()) ||
        (item?.requirement && item.requirement.toString().trim());

      history.forEach((record) => {
        const rawTs = record.timestamp;
        const ts = typeof rawTs === "number" ? rawTs : Number(rawTs || 0);
        if (!Number.isFinite(ts) || ts <= 0) return;

        const d = new Date(ts);
        if (Number.isNaN(d.getTime())) return;

        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const idx = months.findIndex((m) => m.key === key);
        if (idx === -1) return;

        const count = (record.items || []).filter((item) => {
          const itemName = (item?.name || "").toString().trim();
          if (!itemName) return false;
          return !!hasAnyValue(item);
        }).length;
        months[idx].usage += count;
      });

      setMonthlyData(months.map((m) => ({ month: m.month, usage: m.usage })));

      const categories = getCategories();
      const catMap = categories.reduce((acc, c) => ({ ...acc, [c.title]: 0 }), {});

      const latestRecord = [...history]
        .map((record) => ({
          ...record,
          parsedTs:
            typeof record.timestamp === "number"
              ? record.timestamp
              : Number(record.timestamp || 0),
        }))
        .filter((record) => Number.isFinite(record.parsedTs) && record.parsedTs > 0)
        .sort((a, b) => a.parsedTs - b.parsedTs)
        .pop();

      const latestDay = latestRecord?.dateOnly || "";
      const latestDayRecords = latestDay
        ? history.filter((record) => record.dateOnly === latestDay)
        : [];

      latestDayRecords.forEach((record) => {
        (record.items || []).forEach((item) => {
          const itemName = (item?.name || "").toString().trim();
          if (!itemName) return;
          if (!hasAnyValue(item)) return;

          const cat = categories.find((c) => c.items.includes(itemName));
          if (cat) catMap[cat.title] = (catMap[cat.title] || 0) + 1;
          else catMap.Other = (catMap.Other || 0) + 1;
        });
      });

      let distribution = Object.keys(catMap)
        .map((k) => ({ name: k, value: catMap[k] }))
        .filter((entry) => (entry.value || 0) > 0);

      setCategoryDistribution(distribution);
      setLoading(false);
    };

    const initialize = async () => {
      // Sync once on mount only (avoid event loop with inventoryCategoriesChanged).
      await syncCategoriesFromServer();
      await computeReports();
    };

    void initialize();

    const onHistoryChanged = () => {
      void computeReports();
    };

    const onCategoriesChanged = () => {
      void computeReports();
    };

    window.addEventListener("inventoryHistoryChanged", onHistoryChanged);
    window.addEventListener("inventoryCategoriesChanged", onCategoriesChanged);

    return () => {
      window.removeEventListener("inventoryHistoryChanged", onHistoryChanged);
      window.removeEventListener("inventoryCategoriesChanged", onCategoriesChanged);
    };
  }, []);

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
  const RADIAN = Math.PI / 180;
  const [selectedIndex, setSelectedIndex] = useState(null);

  const pieTotal = useMemo(
    () => (categoryDistribution || []).reduce((s, c) => s + (c.value || 0), 0),
    [categoryDistribution]
  );

  const pieData = categoryDistribution;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const total = pieTotal || 1;
    const pct = Math.round(((value || 0) / total) * 1000) / 10;
    const display = pieMode === "percent" ? `${pct}%` : `${value}`;
    return (
      <text x={x} y={y} fill="#fff" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12}>
        {name}
        <tspan x={x} dy="1.2em" fontSize={11} fill="#ddd">
          {display}
        </tspan>
      </text>
    );
  };

  const handlePieClick = (_data, index) => {
    if (index === selectedIndex) setSelectedIndex(null);
    else setSelectedIndex(index);
  };

  const hasAnyData = monthlyData.some((m) => (m.usage || 0) > 0) || categoryDistribution.length > 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-red-500 mb-8">Reports & Analytics</h1>
      {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
      {loading && <div className="mb-4 text-gray-300 text-sm">Loading reports...</div>}
      {!loading && !error && !hasAnyData && (
        <div className="mb-4 text-yellow-300 text-sm">No report data yet. Save inventory from Inventory page to see graphs.</div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-gray-900 rounded p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Stock Distribution by Category</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setPieMode("count")} className={`px-2 py-1 rounded ${pieMode === "count" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300"}`}>Count</button>
              <button onClick={() => setPieMode("percent")} className={`px-2 py-1 rounded ${pieMode === "percent" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300"}`}>Percent</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
                onClick={handlePieClick}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0b1220" cursor="pointer" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const total = pieTotal || 1;
                  if (pieMode === "percent") {
                    const pct = Math.round(((value || 0) / total) * 1000) / 10;
                    return [`${pct}% (${value})`, name];
                  }
                  return [value, name];
                }}
                contentStyle={{ backgroundColor: "#0f1724", border: "1px solid #374151", color: "#fff", padding: 8, borderRadius: 6 }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#9ca3af" }}
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
              />
              <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ color: "#fff", marginTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>

          {selectedIndex !== null && categoryDistribution[selectedIndex] && (
            (() => {
              const total = pieTotal || 1;
              const entry = categoryDistribution[selectedIndex];
              const pct = Math.round(((entry.value || 0) / total) * 1000) / 10;
              return (
                <div className="mt-4 bg-gray-800 p-3 rounded border border-gray-700 flex items-center gap-6 justify-center">
                  <div style={{ width: 12, height: 12, backgroundColor: COLORS[selectedIndex % COLORS.length], borderRadius: 3 }} />
                  <div className="text-gray-300">Count: <span style={{ color: COLORS[selectedIndex % COLORS.length], fontWeight: 700 }}>{entry.value}</span></div>
                  <div className="text-gray-300">Percent: <span style={{ color: COLORS[selectedIndex % COLORS.length], fontWeight: 700 }}>{pct}%</span></div>
                </div>
              );
            })()
          )}
        </div>

        <div className="bg-gray-900 rounded p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">Monthly Stock Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #ef4444" }} labelStyle={{ color: "#fff" }} />
              <Legend />
              <Line type="monotone" dataKey="usage" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-gray-900 rounded p-4 border border-red-600">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Total Monthly Usage</h3>
          <p className="text-3xl font-bold text-red-500">{(monthlyData || []).reduce((s, m) => s + (m.usage || 0), 0)}</p>
        </div>
        <div className="bg-gray-900 rounded p-4 border border-red-600">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Average Monthly</h3>
          <p className="text-3xl font-bold text-red-500">{(() => {
            const total = (monthlyData || []).reduce((s, m) => s + (m.usage || 0), 0);
            const avg = total / ((monthlyData && monthlyData.length) || 12);
            return avg ? Math.round(avg * 10) / 10 : 0;
          })()}</p>
        </div>
        <div className="bg-gray-900 rounded p-4 border border-red-600">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Peak Month</h3>
          <p className="text-3xl font-bold text-red-500">{(() => {
            if (!monthlyData || monthlyData.length === 0) return "-";
            const max = monthlyData.reduce((best, m) => (m.usage > (best.usage || 0) ? m : best), { usage: 0, month: "-" });
            return `${max.month} (${max.usage})`;
          })()}</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;

