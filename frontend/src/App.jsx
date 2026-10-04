import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Admin from './pages/Admin.jsx';
import Trainee from './pages/Trainee.jsx';
import Employer from './pages/Employer.jsx';
import { useAuth } from './context/AuthContext.jsx';

function Guard({ role, children }) {
  const { user } = useAuth(); const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace state={{ denied: true }} />;
  return children;
}
const Public = ({ children }) => { const { user } = useAuth(); return user ? <Navigate to={`/${user.role}/dashboard`} replace /> : children; };

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Public><Login /></Public>} />
      <Route path="/signup" element={<Public><Signup /></Public>} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/:section" element={<Guard role="admin"><Admin /></Guard>} />
      <Route path="/trainee" element={<Navigate to="/trainee/dashboard" replace />} />
      <Route path="/trainee/dashboard" element={<Guard role="trainee"><Trainee /></Guard>} />
      <Route path="/employer" element={<Navigate to="/employer/dashboard" replace />} />
      <Route path="/employer/dashboard" element={<Guard role="employer"><Employer /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
