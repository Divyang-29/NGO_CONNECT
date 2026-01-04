const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
    },

    state: {
      type: String,
    },

    description: {
      type: String,
    },

    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 REQUIRED FOR 25km radius search
ngoSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("NGO", ngoSchema);
