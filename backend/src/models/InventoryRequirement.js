const mongoose = require("mongoose");

const requirementItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    requirement: { type: String, default: "" },
  },
  { _id: false }
);

const inventoryRequirementSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    dateOnly: { type: String, required: true },
    timestamp: { type: Number, required: true, index: true },
    items: { type: [requirementItemSchema], default: [] },
  },
  { timestamps: true }
);

inventoryRequirementSchema.index({ dateOnly: 1 }, { unique: true });
// Auto-delete requirement documents 4 days after creation.
inventoryRequirementSchema.index({ createdAt: 1 }, { expireAfterSeconds: 4 * 24 * 60 * 60 });

module.exports = mongoose.model("InventoryRequirement", inventoryRequirementSchema);
