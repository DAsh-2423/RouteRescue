import {Router} from 'express';import {authenticate} from '../middleware/auth.js';import {submitFeedback} from '../controllers/generalController.js';
const r=Router();r.post('/',authenticate,submitFeedback);export default r;
