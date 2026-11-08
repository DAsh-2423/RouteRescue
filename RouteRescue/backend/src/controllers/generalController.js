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

  // Only plain strings / plain objects, with sane sizes.
  const bad = msg => res.status(400).json({ message: msg });
  if (name !== undefined && (typeof name !== 'string' || name.length > 100)) return bad('Enter a valid name.');
  if (phone !== undefined && (typeof phone !== 'string' || phone.length > 20)) return bad('Enter a valid phone number.');
  if (email !== undefined && typeof email !== 'string') return bad('Enter a valid email address.');
  if (preferences !== undefined && (
    typeof preferences !== 'object' || preferences === null || Array.isArray(preferences) ||
    JSON.stringify(preferences).length > 2000
  )) return bad('Invalid preferences.');

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();

  if (preferences) {
    user.preferences = {
      ...user.preferences,
      ...preferences
    };
  }

  if (email) {
    const next = email.toLowerCase().trim();

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
    !Number.isInteger(Number(rating)) ||
    Number(rating) < 1 ||
    Number(rating) > 5 ||
    typeof message !== 'string' ||
    !message.trim() ||
    message.length > 2000 ||
    (journeyId !== undefined && journeyId !== null && (typeof journeyId !== 'string' || journeyId.length > 64))
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
