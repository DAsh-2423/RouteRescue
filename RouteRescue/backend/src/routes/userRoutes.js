import {Router} from 'express';import {authenticate} from '../middleware/auth.js';import {getProfile,updateProfile} from '../controllers/generalController.js';import {readData} from '../utils/dataStore.js';
const r=Router();r.use(authenticate);r.get('/me',getProfile);r.put('/me',updateProfile);r.get('/cities',async(_q,s)=>s.json(await readData('cities')));export default r;
