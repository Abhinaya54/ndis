import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { RecordingProvider } from './context/RecordingContext';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Staff pages
import Staffdashboard from './pages/staff/Staffdashboard';
import Clients from './pages/staff/Clients';
import ClientNotes from './pages/staff/ClientNotes';
import WriteNote from './pages/staff/WriteNote';
import VoiceNote from './pages/staff/VoiceNote';
import ViewNote from './pages/staff/ViewNote';
import EditNote from './pages/staff/EditNote';
import ReviewNote from './pages/staff/ReviewNote';
import DailyConsolidationTimeline from './pages/staff/DailyConsolidationTimeline';
import Incident from './pages/staff/Incident';
import Shifts from './pages/staff/Shifts';
import ShiftHistory from './pages/staff/ShiftHistory';
import Appointment from './pages/staff/Appointment';
import StaffAppointments from './pages/staff/StaffAppointments';
import ClientAppointmentsView from './pages/staff/ClientAppointmentsView';

// Supervisor pages
import Supervisordashboard from './pages/supervisor/Supervisordashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'supervisor' ? '/supervisor/dashboard' : '/staff/dashboard'} replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to={user.role === 'supervisor' ? '/supervisor/dashboard' : '/staff/dashboard'} replace /> : <Signup />} />

      {/* Staff routes */}
      <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff']}><Staffdashboard /></ProtectedRoute>} />
      <Route path="/staff/clients" element={<ProtectedRoute allowedRoles={['staff']}><Clients /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/notes" element={<ProtectedRoute allowedRoles={['staff']}><ClientNotes /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/notes/:noteId" element={<ProtectedRoute allowedRoles={['staff']}><ViewNote /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/notes/:noteId/edit" element={<ProtectedRoute allowedRoles={['staff']}><EditNote /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/write-note" element={<ProtectedRoute allowedRoles={['staff']}><WriteNote /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/voice-note" element={<ProtectedRoute allowedRoles={['staff']}><VoiceNote /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/review" element={<ProtectedRoute allowedRoles={['staff']}><ReviewNote /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/daily-consolidation" element={<ProtectedRoute allowedRoles={['staff']}><DailyConsolidationTimeline /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/incident" element={<ProtectedRoute allowedRoles={['staff']}><Incident /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/appointment" element={<ProtectedRoute allowedRoles={['staff']}><Appointment /></ProtectedRoute>} />
      <Route path="/staff/clients/:clientId/view-appointments" element={<ProtectedRoute allowedRoles={['staff']}><ClientAppointmentsView /></ProtectedRoute>} />
      <Route path="/staff/shifts" element={<ProtectedRoute allowedRoles={['staff']}><Shifts /></ProtectedRoute>} />
      <Route path="/staff/shift-history" element={<ProtectedRoute allowedRoles={['staff']}><ShiftHistory /></ProtectedRoute>} />
      <Route path="/staff/appointments" element={<ProtectedRoute allowedRoles={['staff']}><StaffAppointments /></ProtectedRoute>} />

      {/* Supervisor routes - single dashboard handles sub-pages */}
      <Route path="/supervisor/dashboard" element={<ProtectedRoute allowedRoles={['supervisor']}><Supervisordashboard /></ProtectedRoute>} />
      <Route path="/supervisor/clients" element={<ProtectedRoute allowedRoles={['supervisor']}><Supervisordashboard /></ProtectedRoute>} />
      <Route path="/supervisor/clients/:clientId" element={<ProtectedRoute allowedRoles={['supervisor']}><Supervisordashboard /></ProtectedRoute>} />
      <Route path="/supervisor/notes" element={<ProtectedRoute allowedRoles={['supervisor']}><Supervisordashboard /></ProtectedRoute>} />
      <Route path="/supervisor/verify-notes" element={<ProtectedRoute allowedRoles={['supervisor']}><Supervisordashboard /></ProtectedRoute>} />
      <Route path="/supervisor/assign-staff" element={<ProtectedRoute allowedRoles={['supervisor']}><Supervisordashboard /></ProtectedRoute>} />
      <Route path="/supervisor/unlock-notes" element={<ProtectedRoute allowedRoles={['supervisor']}><Supervisordashboard /></ProtectedRoute>} />
      <Route path="/supervisor/shift-history" element={<ProtectedRoute allowedRoles={['supervisor']}><Supervisordashboard /></ProtectedRoute>} />

      {/* Supervisor view note route */}
      <Route path="/supervisor/view-note/:clientId/:noteId" element={<ProtectedRoute allowedRoles={['supervisor']}><ViewNote /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <RecordingProvider>
        <Router>
          <AppRoutes />
        </Router>
      </RecordingProvider>
    </AuthProvider>
  );
}

export default App;
