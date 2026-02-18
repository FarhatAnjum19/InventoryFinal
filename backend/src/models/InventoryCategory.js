const mongoose = require("mongoose");

const inventoryCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

inventoryCategorySchema.index({ title: 1 }, { unique: true });

module.exports = mongoose.model("InventoryCategory", inventoryCategorySchema);
