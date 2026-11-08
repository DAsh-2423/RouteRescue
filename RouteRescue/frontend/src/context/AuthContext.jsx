import {createContext,useContext,useEffect,useState} from 'react';import api from '../services/api';
const AuthContext=createContext(null);

// SECURITY: the session now lives in sessionStorage, which is private to ONE browser tab.
// A login in one tab is never visible to another tab, and closing the tab ends the session.
// Remove anything the old version left in localStorage (that storage was shared by all tabs).
try{localStorage.removeItem('rr_token');localStorage.removeItem('rr_user')}catch{}

export function AuthProvider({children}){const [user,setUser]=useState(()=>{try{if(!sessionStorage.getItem('rr_token'))return null;return JSON.parse(sessionStorage.getItem('rr_user'))}catch{return null}});
 const [loading,setLoading]=useState(false);
 const accept=data=>{sessionStorage.setItem('rr_token',data.token);sessionStorage.setItem('rr_user',JSON.stringify(data.user));setUser(data.user);};
 const login=async credentials=>{const {data}=await api.post('/auth/login',credentials);accept(data);return data.user;};
 const register=async payload=>{const {data}=await api.post('/auth/register',payload);accept(data);return data.user;};


 const logout = () => {
  sessionStorage.removeItem('rr_token');
  sessionStorage.removeItem('rr_user');

  // Clear previous user's searched journeys.
  sessionStorage.removeItem('rr_planner_state');

  setUser(null);
};


 useEffect(()=>{if(!sessionStorage.getItem('rr_token'))setLoading(false)},[]);
 return <AuthContext.Provider value={{user,loading,login,register,logout,setUser}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
