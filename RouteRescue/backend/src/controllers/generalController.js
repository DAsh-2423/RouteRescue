import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import { randomUUID } from 'node:crypto';


export async function getProfile(req, res) {
  const user = await User.findOne({ id: req.user.id }).lean();

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const { passwordHash, ...safe } = user;
  res.json(safe);
}


export async function updateProfile(req, res) {
  const user = await User.findOne({ id: req.user.id });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const { name, phone, email, preferences } = req.body;

  if (name) user.name = name;
  if (phone) user.phone = phone;

  if (preferences) {
    user.preferences = {
      ...user.preferences,
      ...preferences
    };
  }

  if (email) {
    const next = String(email).toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(next)) {
      return res.status(400).json({
        message: 'Enter a valid email address.'
      });
    }

    const existing = await User.findOne({
      email: next,
      id: { $ne: user.id }
    });

    if (existing) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    user.email = next;
  }

  await user.save();

  const safe = user.toObject();
  delete safe.passwordHash;

  res.json(safe);
}


export async function submitFeedback(req, res) {
  const { rating, message, journeyId } = req.body;

  if (
    !rating ||
    rating < 1 ||
    rating > 5 ||
    !message?.trim()
  ) {
    return res.status(400).json({
      message: 'Provide a rating from 1–5 and a message.'
    });
  }

  const item = await Feedback.create({
    id: randomUUID(),
    userId: req.user.id,
    rating: Number(rating),
    message: message.trim(),
    journeyId: journeyId || null,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(item);
}
