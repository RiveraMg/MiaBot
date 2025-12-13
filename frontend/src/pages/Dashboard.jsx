import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import {
    Package, Users, FileText, Calendar, AlertTriangle,
    TrendingUp, TrendingDown, Clock, CheckCircle,
    Bell, ArrowRight, Loader2, MessageCircle, Bot,
    Sparkles, BarChart3, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user, isAdmin, isFinance, isHR } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showChatButton, setShowChatButton] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await dashboardAPI.get();
            setDashboard(response.data);
        } catch (err) {
            setError('Error al cargar el dashboard');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-400 bg-red-900/30 border-red-700';
            case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-700';
            case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
            default: return 'text-blue-400 bg-blue-900/30 border-blue-700';
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'LOW_STOCK': return Package;
            case 'INVOICE_OVERDUE':
            case 'INVOICE_DUE': return FileText;
            case 'LEAVE_REQUEST': return Calendar;
            case 'CONTRACT_END': return Users;
            case 'BIRTHDAY': return Bell;
            default: return AlertTriangle;
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '¡Buenos días';
        if (hour < 18) return '¡Buenas tardes';
        return '¡Buenas noches';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert-danger">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Welcome Header - Enhanced */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900/40 via-primary-800/20 to-dark-800 border border-primary-700/30 p-8">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -z-10" />

                <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-primary-500/20 border border-primary-500/30">
                                <Sparkles className="w-6 h-6 text-primary-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-dark-50">
                                {getGreeting()}, {user?.name?.split(' ')[0]}!
                            </h1>
                        </div>
                        <p className="text-dark-300 text-lg mt-2">
                            Aquí tienes un resumen de tu jornada y las tareas más importantes
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-dark-400">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    {new Date().toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="px-3 py-1 rounded-full bg-primary-900/50 text-primary-300 border border-primary-700">
                                    {user?.role === 'ADMIN' ? 'Administrador' : user?.department === 'FINANCE' ? 'Finanzas' : 'Recursos Humanos'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick action button */}
                    <Link
                        to="/chat"
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105"
                    >
                        <Bot className="w-5 h-5" />
                        <span className="font-medium">Abrir Asistente</span>
                    </Link>
                </div>
            </div>

            {/* Alerts */}
            {dashboard?.alerts?.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-dark-100 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary-400" />
                            Alertas Importantes
                        </h2>
                        <span className="text-sm text-dark-400">{dashboard.alerts.length} pendiente{dashboard.alerts.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid gap-3">
                        {dashboard.alerts.map((alert, index) => {
                            const Icon = getAlertIcon(alert.type);
                            return (
                                <div
                                    key={index}
                                    className={`flex items-start gap-4 p-4 rounded-xl border ${getPriorityColor(alert.priority)} transition-all duration-200 hover:scale-[1.02] animate-fade-in`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="p-2.5 rounded-lg bg-dark-800/50 backdrop-blur-sm">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-base">{alert.title}</p>
                                        <p className="text-sm opacity-80 mt-0.5">{alert.message}</p>
                                    </div>
                                    <span className="text-xs uppercase font-bold opacity-75 px-2 py-1 rounded-md bg-dark-900/30">
                                        {alert.priority}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Metrics - Enhanced */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-dark-100 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-400" />
                    Métricas Clave
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tareas Pendientes */}
                    <div className="metric-card group hover:border-primary-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/10 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-900/40 to-primary-800/20 border border-primary-700/30 group-hover:scale-110 transition-transform duration-200">
                                <CheckCircle className="w-6 h-6 text-primary-400" />
                            </div>
                            <Target className="w-8 h-8 text-dark-700 group-hover:text-primary-800 transition-colors" />
                        </div>
                        <div className="mt-4">
                            <span className="metric-value group-hover:text-primary-400 transition-colors">{dashboard?.metrics?.pendingTasks || 0}</span>
                            <p className="metric-label">Tareas Pendientes</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-dark-700">
                            <Link to="/tasks" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 group/link">
                                Ver todas
                                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Eventos de Hoy */}
                    <div className="metric-card group hover:border-blue-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 animate-fade-in" style={{ animationDelay: '50ms' }}>
                        <div className="flex items-center justify-between">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30 group-hover:scale-110 transition-transform duration-200">
                                <Calendar className="w-6 h-6 text-blue-400" />
                            </div>
                            <Clock className="w-8 h-8 text-dark-700 group-hover:text-blue-800 transition-colors" />
                        </div>
                        <div className="mt-4">
                            <span className="metric-value group-hover:text-blue-400 transition-colors">{dashboard?.metrics?.todayEvents || 0}</span>
                            <p className="metric-label">Eventos Hoy</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-dark-700">
                            <Link to="/events" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 group/link">
                                Ver calendario
                                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Finanzas */}
                    {isFinance() && (
                        <>
                            <div className="metric-card group hover:border-orange-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10 animate-fade-in" style={{ animationDelay: '100ms' }}>
                                <div className="flex items-center justify-between">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-700/30 group-hover:scale-110 transition-transform duration-200">
                                        <Package className="w-6 h-6 text-orange-400" />
                                    </div>
                                    {dashboard?.metrics?.lowStockProducts > 0 && (
                                        <span className="badge-warning animate-pulse">Stock bajo</span>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <span className="metric-value group-hover:text-orange-400 transition-colors">{dashboard?.metrics?.totalProducts || 0}</span>
                                    <p className="metric-label">Productos</p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-dark-700">
                                    <Link to="/products" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 group/link">
                                        Ver inventario
                                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>

                            <div className="metric-card group hover:border-green-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 animate-fade-in" style={{ animationDelay: '150ms' }}>
                                <div className="flex items-center justify-between">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/30 group-hover:scale-110 transition-transform duration-200">
                                        <FileText className="w-6 h-6 text-green-400" />
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-dark-700 group-hover:text-green-800 transition-colors" />
                                </div>
                                <div className="mt-4">
                                    <span className="metric-value group-hover:text-green-400 transition-colors">{dashboard?.metrics?.pendingInvoices || 0}</span>
                                    <p className="metric-label">Facturas Pendientes</p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-dark-700">
                                    <Link to="/invoices" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 group/link">
                                        Ver facturas
                                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}

                    {/* RRHH */}
                    {isHR() && !isFinance() && (
                        <>
                            <div className="metric-card group hover:border-purple-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 animate-fade-in" style={{ animationDelay: '100ms' }}>
                                <div className="flex items-center justify-between">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30 group-hover:scale-110 transition-transform duration-200">
                                        <Users className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-dark-700 group-hover:text-purple-800 transition-colors" />
                                </div>
                                <div className="mt-4">
                                    <span className="metric-value group-hover:text-purple-400 transition-colors">{dashboard?.metrics?.totalEmployees || 0}</span>
                                    <p className="metric-label">Empleados Activos</p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-dark-700">
                                    <Link to="/employees" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 group/link">
                                        Ver empleados
                                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>

                            <div className="metric-card group hover:border-yellow-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/10 animate-fade-in" style={{ animationDelay: '150ms' }}>
                                <div className="flex items-center justify-between">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-700/30 group-hover:scale-110 transition-transform duration-200">
                                        <Clock className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <Bell className="w-8 h-8 text-dark-700 group-hover:text-yellow-800 transition-colors" />
                                </div>
                                <div className="mt-4">
                                    <span className="metric-value group-hover:text-yellow-400 transition-colors">{dashboard?.metrics?.pendingLeaveRequests || 0}</span>
                                    <p className="metric-label">Permisos Pendientes</p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-dark-700">
                                    <Link to="/leave-requests" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 group/link">
                                        Ver solicitudes
                                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Shortcuts */}
            {dashboard?.shortcuts?.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-dark-100">Accesos Rápidos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {dashboard.shortcuts.map((shortcut, index) => (
                            <Link
                                key={shortcut.id}
                                to={shortcut.action}
                                className="card-hover flex flex-col items-center justify-center py-6 text-center group animate-fade-in"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className="p-3 rounded-xl bg-dark-700 group-hover:bg-primary-900/30 transition-all duration-200 group-hover:scale-110">
                                    <ArrowRight className="w-5 h-5 text-dark-400 group-hover:text-primary-400 transition-colors" />
                                </div>
                                <span className="mt-3 text-sm text-dark-300 group-hover:text-dark-100 font-medium transition-colors">
                                    {shortcut.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Floating Chat Button */}
            {showChatButton && (
                <Link
                    to="/chat"
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-2xl shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300 hover:scale-110 group animate-fade-in"
                >
                    <div className="relative">
                        <Bot className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <span className="font-semibold hidden md:block">Asistente Virtual</span>
                    <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </Link>
            )}
        </div>
    );
};

export default Dashboard;
