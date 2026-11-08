import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  const match = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ message: 'Please log in to continue.' });

  let payload;
  try {
    payload = verifyToken(match[1]);
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
  if (typeof payload?.id !== 'string') {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  try {
    // Trust the database, not the token: deleted users lose access, and role changes apply immediately.
    const user = await User.findOne({ id: payload.id }).select('id role').lean();
    if (!user) return res.status(401).json({ message: 'Session expired. Please log in again.' });
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

export const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Administrator access required.' });
