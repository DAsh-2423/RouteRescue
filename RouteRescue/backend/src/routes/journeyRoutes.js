    import {Router} from 'express';import {authenticate} from '../middleware/auth.js';import {plan,save,history,remove} from '../controllers/journeyController.js';
    const r=Router();r.use(authenticate);r.post('/plan',plan);r.post('/save',save);r.get('/history',history);r.delete('/:id',remove);export default r;
