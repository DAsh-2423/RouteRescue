import jwt from 'jsonwebtoken';

const KNOWN_WEAK = new Set([
  'development-secret-change-me',
  'replace_this_with_a_long_random_secret',
  'secret', 'changeme', 'change-me', 'your-secret-here'
]);

// Read lazily: dotenv runs after imports are evaluated, so never read process.env at module load.
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set.');
  return secret;
}

// Called once at startup. Refuses to run with a missing / public / short signing key,
// because anyone who knows the key can forge a token for any user, including admin.
export function assertSecurityConfig() {
  const secret = process.env.JWT_SECRET || '';
  if (!secret || KNOWN_WEAK.has(secret) || secret.length < 32) {
    console.error(
      '\n[SECURITY] JWT_SECRET is missing, too short (<32 chars) or is a well-known placeholder.\n' +
      'Generate a strong one and put it in backend/.env :\n' +
      `  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"\n`
    );
    process.exit(1);
  }
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
}
