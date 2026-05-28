import mongoose, { Schema } from "mongoose";

const HiddenProviderSchema = new Schema(
  {
    providerId: {
      type: String,
      required: true,
    },

    zip: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const BlacklistSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    hiddenProviders: {
      type: [HiddenProviderSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Blacklist ||
  mongoose.model("Blacklist", BlacklistSchema);