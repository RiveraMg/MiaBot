import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

// Placeholder pages (will be implemented)
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
            <Route path="/products" element={<PlaceholderPage title="Inventario" />} />
            <Route path="/clients" element={<PlaceholderPage title="Clientes" />} />
            <Route path="/suppliers" element={<PlaceholderPage title="Proveedores" />} />
            <Route path="/invoices" element={<PlaceholderPage title="Facturas" />} />

            {/* RRHH */}
            <Route path="/employees" element={<PlaceholderPage title="Empleados" />} />
            <Route path="/events" element={<PlaceholderPage title="Eventos" />} />
            <Route path="/leave-requests" element={<PlaceholderPage title="Permisos" />} />

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
