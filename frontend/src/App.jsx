import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Employees from './pages/Employees';
import Events from './pages/Events';
import LeaveRequests from './pages/LeaveRequests';

// Placeholder for suppliers (can be similar to clients)
const PlaceholderPage = ({ title }) => (
  <div className="card">
    <h1 className="text-xl font-bold text-dark-100">{title}</h1>
    <p className="text-dark-400 mt-2">Módulo en desarrollo...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />

            {/* Finanzas */}
            <Route path="/products" element={<Products />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/suppliers" element={<PlaceholderPage title="Proveedores" />} />
            <Route path="/invoices" element={<Invoices />} />

            {/* RRHH */}
            <Route path="/employees" element={<Employees />} />
            <Route path="/events" element={<Events />} />
            <Route path="/leave-requests" element={<LeaveRequests />} />

            {/* General */}
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
