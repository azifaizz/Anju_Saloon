import "dotenv/config";
import express from "express";
import cors from "cors";
// import twilio from "twilio"; // Disconnected from cloud Twilio

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("SMS API is running (Disconnected Mode) ✔️");
});

// Twilio client (Mocked for disconnected mode)
// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

app.post("/send-sms", async (req, res) => {
  try {
    console.log("Received POST:", req.body);

    const { to, body } = req.body;

    if (!to || !body) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Mock sending SMS instead of hitting Twilio API
    console.log(`[MOCK SMS API] Would have sent SMS to ${to}: "${body}"`);

    res.json({ success: true, message: { sid: "mocked_sms_sid_for_disconnected_mode" } });
  } catch (err) {
    console.error("SMS Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("🚀 SMS server running on http://localhost:5000 (Disconnected)"));

