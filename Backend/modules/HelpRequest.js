const mongoose = require("mongoose");

const helpRequestSchema = new mongoose.Schema(
  {
    // Who reported the needy person
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Type of help needed
    helpType: {
      type: String,
      required: true,
      enum: [
        "food",
        "medical",
        "shelter",
        "clothes",
        "education",
        "other"
      ]
    },

    // Optional description
    description: {
      type: String,
      trim: true
    },

    // Optional image of needy person
    imageUrl: {
      type: String
    },

    // 📍 LOCATION (MANDATORY)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },

    // Request status
    status: {
      type: String,
      enum: ["pending", "accepted", "helped"],
      default: "pending"
    },

    // NGO who accepted the request
    acceptedByNGO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO"
    },

    // When NGO accepted
    acceptedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// 📌 Geo index for 25km radius search
helpRequestSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("HelpRequest", helpRequestSchema);
