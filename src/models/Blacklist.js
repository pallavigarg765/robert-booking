/* import mongoose from "mongoose";

// 🧹 Avoid model overwrite errors in dev (Hot Reload)
if (mongoose.models.Blacklist) {
  delete mongoose.models.Blacklist;
}

// 🧩 Define schema
const BlacklistSchema = new mongoose.Schema(
  {
    // Unique client identifier
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Array of provider IDs that client has hidden
    providerIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// ✅ Export model
export default mongoose.model("Blacklist", BlacklistSchema);
 */



import mongoose, { Schema } from "mongoose";

const BlacklistSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    providerIds: [{ type: String, required: true }],
  },
  { timestamps: true }
);

export default mongoose.models.Blacklist ||
  mongoose.model("Blacklist", BlacklistSchema);
