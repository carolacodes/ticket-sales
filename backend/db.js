import mongoose from "mongoose";

export const connectDB = async () => {
    const uri = process.env.DB_CONNECTION;
    if (!uri) throw new Error("Missing DB_CONNECTION in .env");

    try {
        await mongoose.connect(uri);
        console.log(">>>>> DB connected <<<<<");
    } catch (error) {
        console.error("DB connection error:", error.message);
        process.exit(1);
    }
};
