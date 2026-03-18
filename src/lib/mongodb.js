import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  console.log("process.env.MONGO_URI: ", process.env.MONGO_URI)

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      dbName: "booking",
      bufferCommands: false,
    }).then((mongoose) => {
      console.log("✅ MongoDB connected:", mongoose.connection.host);
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
