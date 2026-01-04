const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Expo } = require("expo-server-sdk");
require("dotenv").config();
const authRoutes = require("./Routes/auth.routes.js");

const app = express();
const PORT = process.env.PORT || 8080;
const User = require("./modules/user.js");
const Admin = require("./modules/admin.js");
const Ngo = require("./modules/ngo.js");
const HelpRequest = require("./modules/HelpRequest.js");
const expo = new Expo();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ngo-connect-frontend.onrender.com", // 👈 future frontend URL
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);

const sendPushNotifications = async (tokens, message) => {
  const notifications = [];

  for (let token of tokens) {
    if (!Expo.isExpoPushToken(token)) continue;

    notifications.push({
      to: token,
      sound: "default",
      title: "New Help Request",
      body: message,
      data: { screen: "HelpRequests" },
    });
  }

  let chunks = expo.chunkPushNotifications(notifications);

  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error(error);
    }
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected with Database!");
  } catch (err) {
    console.error("Failed to connect with DB", err.message);
  }
};

connectDB();

//Ngo MARK HELP (patch) route
// ================= MARK HELP REQUEST AS HELPED =================
app.patch("/api/help-requests/:id/helped", async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({
        message: "Help request not found",
      });
    }

    if (helpRequest.status !== "accepted") {
      return res.status(400).json({
        message: "Help request must be accepted before marking as helped",
      });
    }

    helpRequest.status = "helped";
    await helpRequest.save();

    res.status(200).json({
      message: "Help request marked as helped",
      helpRequestId: helpRequest._id,
      status: helpRequest.status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Ngo accept (patch) route
// ================= NGO ACCEPT HELP REQUEST =================
app.patch("/api/help-requests/:id/accept", async (req, res) => {
  try {
    const { ngoId } = req.body;

    if (!ngoId) {
      return res.status(400).json({
        message: "ngoId is required",
      });
    }

    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({
        message: "Help request not found",
      });
    }

    // prevent multiple acceptance
    if (helpRequest.status !== "pending") {
      return res.status(400).json({
        message: "Help request already accepted or completed",
      });
    }

    helpRequest.status = "accepted";
    helpRequest.acceptedByNGO = ngoId;
    helpRequest.acceptedAt = new Date();

    await helpRequest.save();

    res.status(200).json({
      message: "Help request accepted by NGO",
      helpRequestId: helpRequest._id,
      status: helpRequest.status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Ngo near-by-25km (get) route
// ================= GET NEARBY NGOs (25 KM) =================
app.get("/api/ngos/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // validation
    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const ngos = await Ngo.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 25000, // 25 km in meters
        },
      },
    });

    res.status(200).json({
      message: "Nearby NGOs fetched successfully",
      count: ngos.length,
      ngos,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Ngo help-request (get) route
// ================= GET HELP REQUEST BY ID =================
app.get("/api/help-requests/:id", async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id)
      .populate("reportedBy", "name email phone")
      .populate("acceptedByNGO", "name email phone");

    if (!helpRequest) {
      return res.status(404).json({
        message: "Help request not found",
      });
    }

    res.status(200).json(helpRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Ngo help-request (get) route
// ================= GET ALL HELP REQUESTS =================
app.get("/api/help-requests", async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find()
      .populate("reportedBy", "name email phone")
      .populate("acceptedByNGO", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Help requests fetched successfully",
      count: helpRequests.length,
      helpRequests,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Ngo help-request (post) route
// ================= HELP REQUEST CREATE =================
app.post("/api/help-requests", async (req, res) => {
  try {
    const { reportedBy, helpType, description, imageUrl, location } = req.body;

    // basic validation
    if (!reportedBy || !helpType || !location || !location.coordinates) {
      return res.status(400).json({
        message: "reportedBy, helpType and location (coordinates) are required",
      });
    }

    // create help request
    const helpRequest = await HelpRequest.create({
      reportedBy,
      helpType,
      description,
      imageUrl,
      location,
    });

    // find nearby NGOs (25km)
    const nearbyNGOs = await Ngo.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: location.coordinates,
          },
          $maxDistance: 25000,
        },
      },
    });

    // collect push tokens
    const tokens = nearbyNGOs.map((ngo) => ngo.pushToken).filter(Boolean);

    // send notifications (do NOT block response if it fails)
    if (tokens.length > 0) {
      sendPushNotifications(
        tokens,
        "A new help request is available near your location"
      ).catch(console.error);
    }

    // send response LAST
    res.status(201).json({
      message: "Help request created successfully",
      helpRequestId: helpRequest._id,
      notifiedNGOs: tokens.length,
      status: helpRequest.status,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Ngo Detail route(get)
// ================= GET ALL NGOs =================
app.get("/api/ngos", async (req, res) => {
  try {
    const ngos = await Ngo.find({ isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "NGOs fetched successfully",
      count: ngos.length,
      ngos,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Ngo Register (post) route
// ================= NGO REGISTER =================
app.post("/api/ngos/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      description,
      registrationNumber,
      location,
    } = req.body;

    // basic validation
    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !registrationNumber ||
      !location ||
      !location.coordinates
    ) {
      return res.status(400).json({
        message:
          "Name, email, phone, address, registrationNumber and location are required",
      });
    }

    // check if NGO already exists
    const existingNGO = await Ngo.findOne({
      $or: [{ email }, { registrationNumber }],
    });

    if (existingNGO) {
      return res.status(400).json({
        message: "NGO already exists with this email or registration number",
      });
    }

    const ngo = await Ngo.create({
      name,
      email,
      phone,
      address,
      city,
      state,
      description,
      registrationNumber,
      location, // { type: "Point", coordinates: [lng, lat] }
    });

    res.status(201).json({
      message: "NGO registered successfully",
      ngoId: ngo._id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Admin register (post) route
// ================= ADMIN REGISTER =================
app.post("/api/admin/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already exists with this email",
      });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      phone,
    });

    res.status(201).json({
      message: "Admin registered successfully",
      adminId: admin._id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//User register (post) route
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Home page");
});

app.listen(PORT, () => {
  console.log(`Server listening at Port ${PORT}`);
});
