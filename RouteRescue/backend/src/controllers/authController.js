import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

import User from '../models/User.js';
import { signToken } from '../utils/token.js';

// Used so a login for an unknown email takes as long as a real one (prevents email enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const isStr = v => typeof v === 'string';


const safe=u=>({id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,preferences:u.preferences||{}});

export async function register(req, res) {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password)
      return res.status(400).json({ message: 'Please complete all required fields.' });

    // Only plain strings are accepted (blocks object / array injection such as {"$ne": ""}).
    if (![name, email, phone, password].every(isStr) || (confirmPassword !== undefined && !isStr(confirmPassword)))
      return res.status(400).json({ message: 'Invalid input.' });

    if (name.length > 100 || phone.length > 20 || email.length > 254)
      return res.status(400).json({ message: 'One of the fields is too long.' });

    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: 'Enter a valid email address.' });

    if (password.length < 8)
      return res.status(400).json({ message: 'Password must contain at least 8 characters.' });

    if (password.length > 72)
      return res.status(400).json({ message: 'Password must be 72 characters or fewer.' });

    if (confirmPassword !== undefined && password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match.' });

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const user = await User.create({
      id: uuid(),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash: await bcrypt.hash(password, 12),
      role: 'user',
      preferences: {}
    });

    const token = signToken(user);

    res.status(201).json({ token, user: safe(user) });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!isStr(email) || !isStr(password) || password.length > 128)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    // Always run one bcrypt comparison, whether or not the account exists.
    const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

    if (!user || !passwordOk)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const token = signToken(user);

    res.json({ token, user: safe(user) });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.' });
  }
}
