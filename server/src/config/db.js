import mongoose from "mongoose";

function isPlaceholderUri(uri) {
  if (!uri) return true;

  const normalizedUri = uri.trim();
  if (!/^mongodb(?:\+srv)?:\/\//i.test(normalizedUri)) {
    return true;
  }

  const placeholderPatterns = [
    /<[^>]+>/,
    /your[-_ ]?(username|password|mongo|uri)/i,
    /changeme/i,
    /example\.com/i,
    /mongodb:\/\/(?:user|username):(?:pass|password)@/i,
  ];

  return placeholderPatterns.some((pattern) => pattern.test(normalizedUri));
}

let memoryServer = null;

export async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (isPlaceholderUri(uri)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "MONGODB_URI must be your real Atlas connection string in production. Get it from Atlas → Connect → Drivers.",
      );
    }

    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri("centerdesk");
    console.warn(
      "[dev] Placeholder MONGODB_URI detected — using in-memory MongoDB (data resets on restart).\n" +
        "      Set a real Atlas URI in server/.env when ready.",
    );
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    if (err.code === "ENOTFOUND" && String(uri).includes("mongodb.net")) {
      throw new Error(
        "Could not reach MongoDB Atlas (ENOTFOUND). Open server/.env and replace MONGODB_URI with your real connection string from Atlas → Database → Connect → Drivers.",
      );
    }
    throw err;
  }
}
