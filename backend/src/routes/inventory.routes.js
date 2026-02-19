const router = require("express").Router();
const InventoryCategory = require("../models/InventoryCategory");
const InventoryHistory = require("../models/InventoryHistory");
const InventoryRequirement = require("../models/InventoryRequirement");
const { requireAuth } = require("../middleware/auth.middleware");

router.use(requireAuth);

function normalizeText(value) {
  return String(value || "").trim();
}

function uniqueTrimmed(items) {
  const set = new Set();
  for (const raw of items || []) {
    const item = normalizeText(raw);
    if (!item) continue;
    set.add(item);
  }
  return Array.from(set);
}

router.get("/categories", async (req, res) => {
  try {
    const categories = await InventoryCategory.find({}, { _id: 0, title: 1, items: 1 }).sort({ title: 1 });
    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch categories", error: error.message });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const title = normalizeText(req.body?.title);
    if (!title) {
      return res.status(400).json({ success: false, message: "title is required" });
    }

    const existing = await InventoryCategory.findOne({ title });
    if (existing) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    const created = await InventoryCategory.create({ title, items: [] });
    return res.status(201).json({ success: true, data: { title: created.title, items: created.items } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create category", error: error.message });
  }
});

router.post("/items", async (req, res) => {
  try {
    const categoryTitle = normalizeText(req.body?.categoryTitle);
    const itemName = normalizeText(req.body?.itemName);

    if (!categoryTitle || !itemName) {
      return res.status(400).json({ success: false, message: "categoryTitle and itemName are required" });
    }

    let category = await InventoryCategory.findOne({ title: categoryTitle });
    if (!category) {
      category = await InventoryCategory.create({ title: categoryTitle, items: [itemName] });
      return res.status(201).json({ success: true, data: { title: category.title, items: category.items } });
    }

    category.items = uniqueTrimmed([...(category.items || []), itemName]);
    await category.save();

    return res.json({ success: true, data: { title: category.title, items: category.items } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to add item", error: error.message });
  }
});

router.patch("/items", async (req, res) => {
  try {
    const categoryTitle = normalizeText(req.body?.categoryTitle);
    const oldItemName = normalizeText(req.body?.oldItemName);
    const newItemName = normalizeText(req.body?.newItemName);

    if (!categoryTitle || !oldItemName || !newItemName) {
      return res.status(400).json({ success: false, message: "categoryTitle, oldItemName and newItemName are required" });
    }

    const category = await InventoryCategory.findOne({ title: categoryTitle });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const items = uniqueTrimmed(category.items || []);
    const idx = items.indexOf(oldItemName);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Item not found in category" });
    }

    items[idx] = newItemName;
    category.items = uniqueTrimmed(items);
    await category.save();

    await InventoryHistory.updateMany(
      { "items.name": oldItemName },
      { $set: { "items.$[elem].name": newItemName } },
      { arrayFilters: [{ "elem.name": oldItemName }] }
    );

    return res.json({ success: true, data: { title: category.title, items: category.items } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to edit item", error: error.message });
  }
});

router.delete("/items", async (req, res) => {
  try {
    const categoryTitle = normalizeText(req.query?.categoryTitle);
    const itemName = normalizeText(req.query?.itemName);

    if (!categoryTitle || !itemName) {
      return res.status(400).json({ success: false, message: "categoryTitle and itemName are required" });
    }

    const category = await InventoryCategory.findOne({ title: categoryTitle });
    if (!category) {
      return res.json({ success: true, message: "Category not found, nothing to delete" });
    }

    category.items = uniqueTrimmed((category.items || []).filter((item) => item !== itemName));

    if (category.items.length === 0) {
      await InventoryCategory.deleteOne({ _id: category._id });
    } else {
      await category.save();
    }

    await InventoryHistory.updateMany({}, { $pull: { items: { name: itemName } } });

    return res.json({ success: true, data: { title: category.title, items: category.items } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete item", error: error.message });
  }
});

router.delete("/categories", async (req, res) => {
  try {
    const title = normalizeText(req.query?.title);
    if (!title) {
      return res.status(400).json({ success: false, message: "title is required" });
    }

    const category = await InventoryCategory.findOne({ title });
    const itemsToDelete = category?.items || [];

    await InventoryCategory.deleteOne({ title });

    if (itemsToDelete.length > 0) {
      await InventoryHistory.updateMany({}, { $pull: { items: { name: { $in: itemsToDelete } } } });
    }

    return res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete category", error: error.message });
  }
});

router.get("/history", async (req, res) => {
  try {
    const history = await InventoryHistory.find({})
      .sort({ timestamp: 1 })
      .lean();

    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch history", error: error.message });
  }
});

router.post("/history", async (req, res) => {
  try {
    const { items, date, dateOnly, timestamp } = req.body || {};

    if (!Array.isArray(items) || !date || !dateOnly || !timestamp) {
      return res.status(400).json({ success: false, message: "items, date, dateOnly and timestamp are required" });
    }

    const cleanedItems = items.map((item) => ({
      name: normalizeText(item?.name),
      purchase: item?.purchase ? String(item.purchase) : "",
      opening: item?.opening ? String(item.opening) : "",
      closing: item?.closing ? String(item.closing) : "",
      requirement: item?.requirement ? String(item.requirement) : "",
    })).filter((item) => item.name);

    const created = await InventoryHistory.create({ date, dateOnly, timestamp, items: cleanedItems });

    try {
      const requirementItems = cleanedItems
        .filter((it) => {
          const num = parseFloat(it.requirement);
          return Number.isFinite(num) && num < 5;
        })
        .map((it) => ({ name: it.name, requirement: it.requirement ? String(it.requirement) : "" }));

      if (requirementItems.length > 0) {
        await InventoryRequirement.findOneAndUpdate(
          { dateOnly },
          {
            $set: { date, dateOnly, timestamp, items: requirementItems },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      // Don't fail the whole request if requirement bookkeeping fails
      console.warn("Failed to create requirement record:", err.message || err);
    }

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save history", error: error.message });
  }
});

router.put("/history/:id", async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "items must be an array" });
    }

    const cleanedItems = items.map((item) => ({
      name: normalizeText(item?.name),
      purchase: item?.purchase ? String(item.purchase) : "",
      opening: item?.opening ? String(item.opening) : "",
      closing: item?.closing ? String(item.closing) : "",
      requirement: item?.requirement ? String(item.requirement) : "",
    })).filter((item) => item.name);

    const updated = await InventoryHistory.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          items: cleanedItems,
          timestamp: Date.now(),
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "History record not found" });
    }

    try {
      const reqItems = (updated.items || [])
        .filter((it) => {
          const num = parseFloat(it.requirement);
          return Number.isFinite(num) && num < 5;
        })
        .map((it) => ({ name: it.name, requirement: it.requirement ? String(it.requirement) : "" }));

      if (reqItems.length > 0) {
        await InventoryRequirement.findOneAndUpdate(
          { dateOnly: updated.dateOnly },
          {
            $set: { date: updated.date, dateOnly: updated.dateOnly, timestamp: updated.timestamp || Date.now(), items: reqItems },
          },
          { upsert: true }
        );
      } else {
        // remove requirement record for the date if no items need requirement
        await InventoryRequirement.deleteOne({ dateOnly: updated.dateOnly });
      }
    } catch (err) {
      console.warn("Failed to update requirement record:", err.message || err);
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update history", error: error.message });
  }
});

router.delete("/history/:id", async (req, res) => {
  try {
    const deleted = await InventoryHistory.findOneAndDelete({ _id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "History record not found" });
    }

    return res.json({ success: true, message: "History record deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete history", error: error.message });
  }
});

// Get requirements for a specific dateOnly or all requirements
router.get("/requirements", async (req, res) => {
  try {
    const dateOnly = req.query?.dateOnly;
    const query = dateOnly ? { dateOnly } : {};
    const reqs = await InventoryRequirement.find(query).sort({ timestamp: -1 }).lean();
    return res.json({ success: true, data: reqs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch requirements", error: error.message });
  }
});

router.delete("/requirements/:id", async (req, res) => {
  try {
    const deleted = await InventoryRequirement.findOneAndDelete({ _id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: "Requirement record not found" });
    return res.json({ success: true, message: "Requirement record deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete requirement", error: error.message });
  }
});

module.exports = router;
