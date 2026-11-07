import { readData,writeData } from '../utils/dataStore.js';
export async function getProfile(req,res){const u=(await readData('users')).find(x=>x.id===req.user.id);if(!u)return res.status(404).json({message:'User not found.'});const {passwordHash,...safe}=u;res.json(safe);}
export async function updateProfile(req,res){
 const users=await readData('users'),i=users.findIndex(x=>x.id===req.user.id);if(i<0)return res.status(404).json({message:'User not found.'});
 const {name,phone,email,preferences}=req.body;if(name)users[i].name=name;if(phone)users[i].phone=phone;if(preferences)users[i].preferences={...users[i].preferences,...preferences};
 if(email){const next=String(email).toLowerCase();if(!/^\S+@\S+\.\S+$/.test(next))return res.status(400).json({message:'Enter a valid email address.'});if(users.some(u=>u.email===next&&u.id!==users[i].id))return res.status(409).json({message:'An account with this email already exists.'});users[i].email=next;}
 await writeData('users',users);const {passwordHash,...safe}=users[i];res.json(safe);
}
export async function submitFeedback(req,res){
 const {rating,message,journeyId}=req.body;if(!rating||rating<1||rating>5||!message?.trim())return res.status(400).json({message:'Provide a rating from 1–5 and a message.'});
 const data=await readData('feedback');const item={id:crypto.randomUUID(),userId:req.user.id,rating:Number(rating),message:message.trim(),journeyId:journeyId||null,createdAt:new Date().toISOString()};data.push(item);await writeData('feedback',data);res.status(201).json(item);
}
