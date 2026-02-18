export default function InventoryTable({ title, items }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-primary mb-3">
        {title}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-700">
          <thead className="bg-black text-primary">
            <tr>
              <th className="border p-2">Item</th>
              <th className="border p-2">Opening</th>
              <th className="border p-2">Purchase</th>
              <th className="border p-2">Closing</th>
              <th className="border p-2">Required</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="text-center">
                <td className="border p-2">{item}</td>
                <td className="border p-2">
                  <input type="number" className="input" />
                </td>
                <td className="border p-2">
                  <input type="number" className="input" />
                </td>
                <td className="border p-2">
                  <input type="number" className="input" />
                </td>
                <td className="border p-2">
                  <input type="number" className="input" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}