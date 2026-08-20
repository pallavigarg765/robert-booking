    import mongoose from "mongoose";

    const PendingRegistrationSchema = new mongoose.Schema(
        {
            name: {
                type: String,
                default: "",
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
                default: "",
            },

            city: {
                type: String,
                default: "",
            },

            state: {
                type: String,
                default: "",
            },

            zip: {
                type: String,
                default: "",
            },

            otp: {
                type: String,
                required: true,
            },

            otpExpires: {
                type: Date,
                required: true,
            },

            otpVerified: {
                type: Boolean,
                default: false,
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