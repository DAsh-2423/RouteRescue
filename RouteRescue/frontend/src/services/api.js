import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api'});

// SECURITY: token is read from sessionStorage (per-tab), not localStorage (shared by all tabs).
api.interceptors.request.use(config=>{const token=sessionStorage.getItem('rr_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});

// SECURITY: if the server rejects the token (expired / account removed / tampered), end the session.
api.interceptors.response.use(res=>res,error=>{
  const url=error.config?.url||'';
  if(error.response?.status===401&&!url.startsWith('/auth/')&&sessionStorage.getItem('rr_token')){
    sessionStorage.removeItem('rr_token');sessionStorage.removeItem('rr_user');sessionStorage.removeItem('rr_planner_state');
    window.location.replace('/login');
  }
  return Promise.reject(error);
});
export default api;
