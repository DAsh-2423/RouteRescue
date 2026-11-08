import {BrowserRouter,Routes,Route as R} from 'react-router-dom';
import {AuthProvider} from './context/AuthContext';
import {AppLayout} from './components/Shell';
import Protected from './components/Protected';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import {Login,Register} from './pages/Auth';
import Planner from './pages/Planner';
import {Dashboard,History,ItineraryDetail,Profile,Feedback} from './pages/Pages';
import Admin from './pages/Admin';



export default function App(){
    return <BrowserRouter><ScrollToTop/><AuthProvider><AppLayout><Routes><R path="/" element={<Home/>}/>
    <R path="/login" element={<Login/>}/><R path="/register" element={<Register/>}/>
    <R element={<Protected/>}><R path="/dashboard" element={<Dashboard/>}/>
    <R path="/planner" element={<Planner/>}/>
    <R path="/itinerary" element={<ItineraryDetail/>}/>
    <R path="/history" element={<History/>}/>
    <R path="/profile" element={<Profile/>}/>
    <R path="/feedback" element={<Feedback/>}/></R>
    <R element={<Protected admin/>}>
    <R path="/admin" element={<Admin/>}/>
    </R><R path="*" element={<Home/>}/></Routes></AppLayout></AuthProvider></BrowserRouter>}
