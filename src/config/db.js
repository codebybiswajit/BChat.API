import mongoose from 'mongoose';

// ─── MongoDB connection ───────────────────────────────────────────────────────

const startServer = async () => {
  const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}${process.env.MONGO_REST}` || "";
  console.log(MONGO_URI)
  if (!MONGO_URI) {
    console.warn(
      "⚠️  WARNING: MONGO_URI is not set in .env. " +
        "The server will start, but database operations will fail. " +
        "Set MONGO_URI to a valid MongoDB connection string."
    );
    return;
  }
  try {
    console.log("🔌 Connecting to MongoDB...");
    const conn = await mongoose.connect(MONGO_URI, {
      dbName: "WebsocDb",
    });
    console.log(`✅ MongoDB connected successfully to ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error(
      "   Check your MONGO_URI in .env and ensure MongoDB is accessible."
    );
    process.exit(1);
  }
};

// ─── Handle mongoose connection events ───────────────────────────────────────

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected.");
});

// ─── Handle unhandled rejections & uncaught exceptions ────────────────────────

process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err.message);
  process.exit(1);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

process.on("SIGINT", async () => {
  console.log("\n🛑 SIGINT received. Closing MongoDB connection...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed. Exiting.");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 SIGTERM received. Closing MongoDB connection...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed. Exiting.");
  process.exit(0);
});

// Export the function so server.js can call it
export default startServer;
