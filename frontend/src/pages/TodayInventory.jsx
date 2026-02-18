import InventoryTable from "../components/InventoryTable";

export default function TodayInventory() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-primary mb-6">
        Today Inventory
      </h1>

      <InventoryTable
        title="Dry Items"
        items={["Peri Peri", "Burger Sauce", "Oregano", "Salt"]}
      />

      <InventoryTable
        title="Frozen Items"
        items={["French Fries", "Veg Momos", "Chicken Nuggets"]}
      />

      <button className="bg-primary text-black px-6 py-2 rounded font-semibold">
        Save Today
      </button>
    </div>
  );
}