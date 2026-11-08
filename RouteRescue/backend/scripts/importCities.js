import dotenv from "dotenv";
import mongoose from "mongoose";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import City from "../src/models/City.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function importCities() {
  try {
    // Read existing JSON file
    const filePath = path.join(__dirname, "../src/data/cities.json");
    const cities = JSON.parse(await readFile(filePath, "utf-8"));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    // Insert or update cities using their existing IDs
    const operations = cities.map(city => ({
      updateOne: {
        filter: { id: city.id },
        update: { $set: city },
        upsert: true
      }
    }));

    const result = await City.bulkWrite(operations);

    console.log("City import completed!");
    console.log("Total records in JSON:", cities.length);
    console.log("Inserted:", result.upsertedCount);
    console.log("Updated:", result.modifiedCount);
    console.log("Already unchanged:", cities.length - result.upsertedCount - result.modifiedCount);

  } catch (error) {
    console.error("City import failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

importCities();