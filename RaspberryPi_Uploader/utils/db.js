
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const maxRetries = Number(process.env.DB_CONNECT_MAX_RETRIES || 30);
  const retryDelayMs = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 5000);

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await mongoose.connect(mongoUri);
      console.log("MongoDB connected");
      return;
    } catch (err) {
      const message = err?.message || String(err);
      console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed: ${message}`);

      if (attempt === maxRetries) {
        throw new Error(`MongoDB connection failed after ${maxRetries} attempts`);
      }

      await sleep(retryDelayMs);
    }
  }
};

export default connectDB;