const mongoose = require("mongoose");

const historyItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    purchase: { type: String, default: "" },
    opening: { type: String, default: "" },
    closing: { type: String, default: "" },
    requirement: { type: String, default: "" },
  },
  { _id: false }
);

const inventoryHistorySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    dateOnly: { type: String, required: true },
    timestamp: { type: Number, required: true, index: true },
    items: { type: [historyItemSchema], default: [] },
  },
  { timestamps: true }
);

inventoryHistorySchema.index({ timestamp: -1 });
inventoryHistorySchema.index({ dateOnly: 1, timestamp: -1 });
inventoryHistorySchema.index({ "items.name": 1 });
// Auto-delete history documents 4 days after creation.
inventoryHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 4 * 24 * 60 * 60 });

module.exports = mongoose.model("InventoryHistory", inventoryHistorySchema);
