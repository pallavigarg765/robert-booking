import mongoose from "mongoose";
 
// Prevent OverwriteModelError during hot reload in Next.js
if (mongoose.models.Enquiry) {
  delete mongoose.models.Enquiry;
}
 
const EnquirySchema = new mongoose.Schema(
  {
    enquiredBy: {
      type: String,
      trim: true,
   
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    fullAddress: {
      type: String,
      trim: true,
      default: "",
    },
    lat: {
      type: String,
      trim: true,
      default: "",
    },
    lon: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\d{10,15}$/, "Invalid phone number"],
      default: "",
    },
    category:{
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);
 
export default mongoose.model("Enquiry", EnquirySchema);