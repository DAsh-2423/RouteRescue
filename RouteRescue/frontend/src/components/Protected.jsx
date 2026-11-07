import {Navigate,Outlet} from 'react-router-dom';import {useAuth} from '../context/AuthContext';
export default function Protected({admin=false}){const {user}=useAuth();if(!user)return <Navigate to="/login" replace/>;if(admin&&user.role!=='admin')return <Navigate to="/dashboard" replace/>;return <Outlet/>;}
