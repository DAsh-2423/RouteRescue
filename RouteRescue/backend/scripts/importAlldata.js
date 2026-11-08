import dotenv from "dotenv";
import mongoose from "mongoose";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import Hotel from "../src/models/Hotel.js";
import Transport from "../src/models/Transport.js";
import Journey from "../src/models/Journey.js";
import Feedback from "../src/models/Feedback.js";
import JourneyRequest from "../src/models/JourneyRequest.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const imports = [
  {
    file: "hotels.json",
    model: Hotel,
    name: "Hotels"
  },
  {
    file: "transport.json",
    model: Transport,
    name: "Transport"
  },
  {
    file: "journeys.json",
    model: Journey,
    name: "Journeys"
  },
  {
    file: "feedback.json",
    model: Feedback,
    name: "Feedback"
  },
  {
    file: "requests.json",
    model: JourneyRequest,
    name: "Journey Requests"
  }
];

async function importData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected Successfully\n");

    for (const item of imports) {
      const filePath = path.join(
        __dirname,
        "../src/data",
        item.file
      );

      const data = JSON.parse(
        await readFile(filePath, "utf-8")
      );

      if (!Array.isArray(data)) {
        throw new Error(`${item.file} must contain an array`);
      }

      const operations = data.map(record => ({
        updateOne: {
          filter: { id: record.id },
          update: { $set: record },
          upsert: true
        }
      }));

      const result = await item.model.bulkWrite(operations);

      console.log(`--- ${item.name} ---`);
      console.log("Total records:", data.length);
      console.log("Inserted:", result.upsertedCount);
      console.log("Updated:", result.modifiedCount);
      console.log(
        "Unchanged:",
        data.length - result.upsertedCount - result.modifiedCount
      );
      console.log("");
    }

    console.log("All JSON imports completed successfully!");

  } catch (error) {
    console.error("Import failed:", error);

    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
  }
}

importData();