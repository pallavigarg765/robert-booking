import mongoose from "mongoose";

const PendingRegistrationSchema =
    new mongoose.Schema(
        {
            name: {
                type: String,
                required: true,
            },

            email: {
                type: String,
                required: true,
                lowercase: true,
                index: true,
            },

            phonenumber: {
                type: String,
                required: true,
            },

            fullAddress: {
                type: String,
                required: true,
            },

            city: {
                type: String,
                required: true,
            },

            state: {
                type: String,
                required: true,
            },

            zip: {
                type: String,
                required: true,
            },

            otp: {
                type: String,
                required: true,
            },

            otpExpires: {
                type: Date,
                required: true,
            },
        },
        {
            timestamps: true,
        }
    );

export default mongoose.models.PendingRegistration ||
    mongoose.model(
        "PendingRegistration",
        PendingRegistrationSchema
    );