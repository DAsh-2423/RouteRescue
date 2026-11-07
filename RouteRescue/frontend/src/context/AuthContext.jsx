import {createContext,useContext,useEffect,useState} from 'react';import api from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('rr_user'))}catch{return null}});
 const [loading,setLoading]=useState(false);
 const accept=data=>{localStorage.setItem('rr_token',data.token);localStorage.setItem('rr_user',JSON.stringify(data.user));setUser(data.user);};
 const login=async credentials=>{const {data}=await api.post('/auth/login',credentials);accept(data);return data.user;};
 const register=async payload=>{const {data}=await api.post('/auth/register',payload);accept(data);return data.user;};


 const logout = () => {
  localStorage.removeItem('rr_token');
  localStorage.removeItem('rr_user');

  // Clear previous user's searched journeys.
  sessionStorage.removeItem('rr_planner_state');

  setUser(null);
};


 useEffect(()=>{if(!localStorage.getItem('rr_token'))setLoading(false)},[]);
 return <AuthContext.Provider value={{user,loading,login,register,logout,setUser}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
