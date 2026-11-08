import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const filePath = path.join(
      __dirname,
      '../src/data/users.json'
    );

    const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const user of users) {
      await User.updateOne(
        { id: user.id },
        { $setOnInsert: user },
        { upsert: true }
      );
    }

    console.log(`${users.length} users processed successfully.`);
  } catch (error) {
    console.error('User import failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

importUsers();