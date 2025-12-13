import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import {
    Package, Users, FileText, Calendar, AlertTriangle,
    TrendingUp, TrendingDown, Clock, CheckCircle,
    Bell, ArrowRight, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user, isAdmin, isFinance, isHR } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-50">
                        Bienvenido, {user?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-dark-400 mt-1">
                        Aquí tienes un resumen de tu jornada
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-dark-400">
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {dashboard?.alerts?.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-dark-100">Alertas</h2>
                    <div className="grid gap-3">
                        {dashboard.alerts.map((alert, index) => {
                            const Icon = getAlertIcon(alert.type);
                            return (
                                <div
                                    key={index}
                                    className={`flex items-start gap-4 p-4 rounded-xl border ${getPriorityColor(alert.priority)}`}
                                >
                                    <div className="p-2 rounded-lg bg-dark-800/50">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{alert.title}</p>
                                        <p className="text-sm opacity-75 truncate">{alert.message}</p>
                                    </div>
                                    <span className="text-xs uppercase font-medium opacity-75">
                                        {alert.priority}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tareas Pendientes */}
                <div className="metric-card">
                    <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-primary-900/30">
                            <CheckCircle className="w-5 h-5 text-primary-400" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="metric-value">{dashboard?.metrics?.pendingTasks || 0}</span>
                        <p className="metric-label">Tareas Pendientes</p>
                    </div>
                </div>

                {/* Eventos de Hoy */}
                <div className="metric-card">
                    <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-blue-900/30">
                            <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="metric-value">{dashboard?.metrics?.todayEvents || 0}</span>
                        <p className="metric-label">Eventos Hoy</p>
                    </div>
                </div>

                {/* Finanzas */}
                {isFinance() && (
                    <>
                        <div className="metric-card">
                            <div className="flex items-center justify-between">
                                <div className="p-2 rounded-lg bg-orange-900/30">
                                    <Package className="w-5 h-5 text-orange-400" />
                                </div>
                                {dashboard?.metrics?.lowStockProducts > 0 && (
                                    <span className="badge-warning">Stock bajo</span>
                                )}
                            </div>
                            <div className="mt-4">
                                <span className="metric-value">{dashboard?.metrics?.totalProducts || 0}</span>
                                <p className="metric-label">Productos</p>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="flex items-center justify-between">
                                <div className="p-2 rounded-lg bg-green-900/30">
                                    <FileText className="w-5 h-5 text-green-400" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="metric-value">{dashboard?.metrics?.pendingInvoices || 0}</span>
                                <p className="metric-label">Facturas Pendientes</p>
                            </div>
                        </div>
                    </>
                )}

                {/* RRHH */}
                {isHR() && !isFinance() && (
                    <>
                        <div className="metric-card">
                            <div className="flex items-center justify-between">
                                <div className="p-2 rounded-lg bg-purple-900/30">
                                    <Users className="w-5 h-5 text-purple-400" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="metric-value">{dashboard?.metrics?.totalEmployees || 0}</span>
                                <p className="metric-label">Empleados Activos</p>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="flex items-center justify-between">
                                <div className="p-2 rounded-lg bg-yellow-900/30">
                                    <Clock className="w-5 h-5 text-yellow-400" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="metric-value">{dashboard?.metrics?.pendingLeaveRequests || 0}</span>
                                <p className="metric-label">Permisos Pendientes</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Shortcuts */}
            {dashboard?.shortcuts?.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-dark-100">Accesos Rápidos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {dashboard.shortcuts.map((shortcut) => (
                            <Link
                                key={shortcut.id}
                                to={shortcut.action}
                                className="card-hover flex flex-col items-center justify-center py-6 text-center group"
                            >
                                <div className="p-3 rounded-xl bg-dark-700 group-hover:bg-primary-900/30 transition-colors">
                                    <ArrowRight className="w-5 h-5 text-dark-400 group-hover:text-primary-400" />
                                </div>
                                <span className="mt-3 text-sm text-dark-300 group-hover:text-dark-100">
                                    {shortcut.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
