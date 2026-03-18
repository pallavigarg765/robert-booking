// models/User.js
import mongoose from "mongoose";

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phonenumber: { type: String, required: true },
    address: [
      {
        fullAddress: { type: String, required: true, trim: true },
        lat: { type: String, required: true },
        lon: { type: String, required: true },
        city: { type: String },
        state: { type: String },
      },
    ],
    // OTP fields
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);