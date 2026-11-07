import jwt from 'jsonwebtoken';
export function authenticate(req,res,next) {
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if (!token) return res.status(401).json({message:'Please log in to continue.'});
  try { req.user=jwt.verify(token,process.env.JWT_SECRET||'development-secret-change-me'); next(); }
  catch { return res.status(401).json({message:'Session expired. Please log in again.'}); }
}
export const adminOnly=(req,res,next)=>req.user?.role==='admin'?next():res.status(403).json({message:'Administrator access required.'});
