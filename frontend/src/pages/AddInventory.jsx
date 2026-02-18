import React, { useEffect, useState } from "react";
import { getCategories, addItemToCategory, addCategory, editItem, deleteItem, deleteCategory, syncCategoriesFromServer } from "../data/inventoryStore";
import { toast } from "react-toastify";
import { confirmToast } from "../utils/confirmToast";

export default function AddInventory() {
  const [categories, setCategories] = useState(() => getCategories());
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState(categories.length ? categories[0].title : "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showEditItems, setShowEditItems] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editedItemName, setEditedItemName] = useState("");

  useEffect(() => {
    const refresh = () => {
      const merged = getCategories();
      setCategories(merged);
      setNewItemCategory((prev) => {
        if (merged.find((c) => c.title === prev)) return prev;
        return merged.length > 0 ? merged[0].title : "";
      });
    };

    refresh();
    void syncCategoriesFromServer();

    window.addEventListener("inventoryCategoriesChanged", refresh);
    return () => {
      window.removeEventListener("inventoryCategoriesChanged", refresh);
    };
  }, []);

  const handleAddItem = async () => {
    const name = newItemName && newItemName.trim();
    const cat = newItemCategory;
    if (!name) return toast.error("Enter item name");
    if (!cat) return toast.error("Select category");

    const res = await addItemToCategory(cat, name);
    if (!res.success) return toast.error(res.message || "Failed to add item");

    const merged = getCategories();
    setCategories(merged);
    setNewItemName("");
    toast.success(`${name} added to ${cat}`);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName && newCategoryName.trim();
    if (!name) return toast.error("Enter category name");

    const res = await addCategory(name);
    if (!res.success) return toast.error(res.message || "Category already exists or failed to add");

    const merged = getCategories();
    setCategories(merged);
    setNewCategoryName("");
    setNewItemCategory(name);
    toast.success(`${name} category added`);
  };

  const handleEditItem = (categoryTitle, oldItemName) => {
    setEditingItem({ category: categoryTitle, oldName: oldItemName });
    setEditedItemName(oldItemName);
  };

  const handleSaveEditItem = async () => {
    if (!editedItemName.trim()) {
      toast.error("Item name cannot be empty");
      return;
    }

    const res = await editItem(editingItem.category, editingItem.oldName, editedItemName.trim());
    if (!res.success) return toast.error(res.message || "Failed to update item");

    const merged = getCategories();
    setCategories(merged);
    setEditingItem(null);
    setEditedItemName("");
    toast.success("Item updated everywhere");
  };

  const handleDeleteItem = async (categoryTitle, itemName) => {
    const ok = await confirmToast(`Delete "${itemName}" from ${categoryTitle}?`);
    if (!ok) return;

    const res = await deleteItem(categoryTitle, itemName);
    if (!res.success) return toast.error(res.message || "Failed to delete item");

    const merged = getCategories();
    setCategories(merged);
    toast.success("Item deleted everywhere");
  };

  const handleDeleteCategory = async (categoryTitle) => {
    const ok = await confirmToast(`Delete category "${categoryTitle}" and all its items?`);
    if (!ok) return;

    const res = await deleteCategory(categoryTitle);
    if (!res.success) return toast.error(res.message || "Failed to delete category");

    const merged = getCategories();
    setCategories(merged);
    if (newItemCategory === categoryTitle && merged.length) {
      setNewItemCategory(merged[0].title);
    }
    toast.success("Category and all items deleted everywhere");
  };

  return (
    <div className="bg-gray-900 rounded p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Add Inventory</h2>
        <div className="text-sm">Date: {new Date().toLocaleDateString("en-GB")}</div>
      </div>

      <div className="mb-6 p-4 bg-gray-800 rounded">
        <h3 className="font-medium mb-2">Add New Category</h3>
        <div className="flex items-center gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="px-2 py-1 rounded bg-transparent border border-gray-700 w-64 text-white"
          />
          <button type="button" onClick={handleAddCategory} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-800 rounded">
        <h3 className="font-medium mb-2">Add New Item</h3>
        <div className="flex items-center gap-2">
          <input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Item name" className="px-2 py-1 rounded bg-transparent border border-gray-700 w-64 text-white" />
          <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="px-2 py-1 rounded bg-black text-white border border-gray-700">
            {categories.map((c) => (
              <option key={c.title} value={c.title}>
                {c.title}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleAddItem} className="px-3 py-1 bg-green-600 rounded hover:bg-green-700">
            Add
          </button>
        </div>
      </div>

      <div className="mb-6">
        <button onClick={() => setShowEditItems(!showEditItems)} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 font-medium">
          {showEditItems ? "Hide Edit Items" : "Edit Item Names"}
        </button>
      </div>

      {showEditItems && (
        <div className="p-4 bg-gray-800 rounded space-y-4">
          <h3 className="font-semibold text-lg mb-4">Manage Items & Categories</h3>

          {categories.map((category) => (
            <div key={category.title} className="border border-gray-700 rounded p-3 bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-red-400">{category.title}</h4>
                <button onClick={() => handleDeleteCategory(category.title)} className="px-2 py-1 text-sm bg-red-600 rounded hover:bg-red-700">
                  Delete Category
                </button>
              </div>

              <div className="space-y-2 ml-4">
                {category.items.map((item) => (
                  <div key={item} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                    {editingItem?.oldName === item && editingItem?.category === category.title ? (
                      <>
                        <input
                          type="text"
                          value={editedItemName}
                          onChange={(e) => setEditedItemName(e.target.value)}
                          className="flex-1 px-2 py-1 rounded bg-black border border-gray-600 text-white"
                        />
                        <button onClick={handleSaveEditItem} className="ml-2 px-2 py-1 text-sm bg-green-600 rounded hover:bg-green-700">
                          Save
                        </button>
                        <button onClick={() => setEditingItem(null)} className="ml-1 px-2 py-1 text-sm border border-gray-700 rounded hover:bg-gray-700">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-300">{item}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditItem(category.title, item)} className="px-2 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteItem(category.title, item)} className="px-2 py-1 text-sm bg-red-600 rounded hover:bg-red-700">
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
