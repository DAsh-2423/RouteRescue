import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { readData,writeData } from '../utils/dataStore.js';
const safe=u=>({id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,preferences:u.preferences||{}});
export async function register(req,res) {
 const {name,email,phone,password,confirmPassword}=req.body;
 if(!name||!email||!phone||!password) return res.status(400).json({message:'Please complete all required fields.'});
 if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({message:'Enter a valid email address.'});
 if(password.length<8) return res.status(400).json({message:'Password must contain at least 8 characters.'});
 if(confirmPassword!==undefined&&password!==confirmPassword) return res.status(400).json({message:'Passwords do not match.'});
 const users=await readData('users');
 if(users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return res.status(409).json({message:'An account with this email already exists.'});
 const user={id:uuid(),name,email:email.toLowerCase(),phone,passwordHash:await bcrypt.hash(password,10),role:'user',preferences:{}};
 users.push(user); await writeData('users',users);
 const token=jwt.sign({id:user.id,role:user.role},process.env.JWT_SECRET||'development-secret-change-me',{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});
 res.status(201).json({token,user:safe(user)});
}
export async function login(req,res) {
 const {email,password}=req.body; const users=await readData('users');
 const user=users.find(u=>u.email.toLowerCase()===String(email||'').toLowerCase());
 if(!user||!await bcrypt.compare(password||'',user.passwordHash)) return res.status(401).json({message:'Invalid email or password.'});
 const token=jwt.sign({id:user.id,role:user.role},process.env.JWT_SECRET||'development-secret-change-me',{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});
 res.json({token,user:safe(user)});
}
