import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    Users,
    FileText,
    Calendar,
    CalendarOff,
    MessageSquare,
    Settings,
    LogOut,
    Bot,
    ChevronLeft,
    Truck
} from 'lucide-react';

const Sidebar = ({ collapsed, setCollapsed }) => {
    const { user, logout, isAdmin, isFinance, isHR } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavItem = ({ to, icon: Icon, label }) => (
        <NavLink
            to={to}
            className={({ isActive }) =>
                isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
        >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
        </NavLink>
    );

    return (
        <aside className={`fixed left-0 top-0 h-full bg-dark-900 border-r border-dark-800 flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-64'}`}>
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-dark-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && <span className="font-semibold text-dark-50">MiaBot</span>}
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-dark-200 transition-colors"
                >
                    <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
                <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />

                {/* Finanzas */}
                {isFinance() && (
                    <>
                        {!collapsed && (
                            <div className="pt-4 pb-2">
                                <span className="px-3 text-xs font-medium text-dark-500 uppercase tracking-wider">
                                    Finanzas
                                </span>
                            </div>
                        )}
                        <NavItem to="/products" icon={Package} label="Inventario" />
                        <NavItem to="/clients" icon={Users} label="Clientes" />
                        <NavItem to="/suppliers" icon={Truck} label="Proveedores" />
                        <NavItem to="/invoices" icon={FileText} label="Facturas" />
                    </>
                )}

                {/* RRHH */}
                {isHR() && (
                    <>
                        {!collapsed && (
                            <div className="pt-4 pb-2">
                                <span className="px-3 text-xs font-medium text-dark-500 uppercase tracking-wider">
                                    RRHH
                                </span>
                            </div>
                        )}
                        <NavItem to="/employees" icon={Users} label="Empleados" />
                        <NavItem to="/events" icon={Calendar} label="Eventos" />
                        <NavItem to="/leave-requests" icon={CalendarOff} label="Permisos" />
                    </>
                )}

                {/* General */}
                {!collapsed && (
                    <div className="pt-4 pb-2">
                        <span className="px-3 text-xs font-medium text-dark-500 uppercase tracking-wider">
                            General
                        </span>
                    </div>
                )}
                <NavItem to="/chat" icon={MessageSquare} label="Chat IA" />

                {isAdmin() && (
                    <NavItem to="/settings" icon={Settings} label="Configuración" />
                )}
            </nav>

            {/* User Footer */}
            <div className="p-3 border-t border-dark-800">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark-100 truncate">{user?.name}</p>
                            <p className="text-xs text-dark-500 truncate">{user?.role}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-red-400 transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
