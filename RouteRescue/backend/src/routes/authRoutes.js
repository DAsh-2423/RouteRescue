import {Router} from 'express';import {register,login} from '../controllers/authController.js';
import {loginLimiter,registerLimiter} from '../middleware/security.js';
const r=Router();r.post('/register',registerLimiter,register);r.post('/login',loginLimiter,login);export default r;
