import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { username } = useAuth();
  return username ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { username } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={username ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={username ? <Navigate to="/" replace /> : <Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
