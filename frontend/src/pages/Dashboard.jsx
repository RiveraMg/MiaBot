import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import {
    Package, Users, FileText, Calendar, AlertTriangle,
    TrendingUp, Clock, CheckCircle, Bell, BarChart3, Target, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Common components
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import LoadingCard from '../components/common/LoadingCard';

// Dashboard components
import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import MetricCard from '../components/dashboard/MetricCard';
import AlertCard from '../components/dashboard/AlertCard';
import FloatingChatButton from '../components/dashboard/FloatingChatButton';

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
            setLoading(true);
            setError(null);
            const response = await dashboardAPI.get();
            setDashboard(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar el dashboard');
            console.error(err);
        } finally {
            setLoading(false);
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

    // Loading state
    if (loading) {
        return (
            <div className="space-y-8">
                <div className="h-48 bg-dark-800 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <LoadingCard count={4} />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <ErrorMessage
                title="Error al cargar el dashboard"
                message={error}
                onRetry={loadDashboard}
                variant="card"
            />
        );
    }

    // No data state
    if (!dashboard) {
        return (
            <EmptyState
                icon={BarChart3}
                title="No hay datos disponibles"
                message="No se pudo cargar la información del dashboard. Por favor, intenta de nuevo más tarde."
                actionLabel="Recargar"
                onAction={loadDashboard}
            />
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Welcome Header */}
            <WelcomeHeader user={user} showChatButton={true} />

            {/* Alerts Section */}
            {dashboard?.alerts?.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-dark-100 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary-400" />
                            Alertas Importantes
                        </h2>
                        <span className="text-sm text-dark-400">
                            {dashboard.alerts.length} pendiente{dashboard.alerts.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="grid gap-3">
                        {dashboard.alerts.map((alert, index) => (
                            <AlertCard
                                key={index}
                                type={alert.type}
                                priority={alert.priority}
                                title={alert.title}
                                message={alert.message}
                                icon={getAlertIcon(alert.type)}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Metrics Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-dark-100 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-400" />
                    Métricas Clave
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tareas Pendientes */}
                    <MetricCard
                        title="Tareas Pendientes"
                        value={dashboard?.metrics?.pendingTasks || 0}
                        icon={CheckCircle}
                        iconBgColor="from-primary-900/40 to-primary-800/20"
                        iconBorderColor="border-primary-700/30"
                        iconColor="text-primary-400"
                        hoverBorderColor="hover:border-primary-600/50"
                        hoverShadowColor="hover:shadow-primary-500/10"
                        hoverTextColor="group-hover:text-primary-400"
                        linkTo="/tasks"
                        linkLabel="Ver todas"
                        linkColor="text-primary-400 hover:text-primary-300"
                        decorationIcon={Target}
                        decorationColor="text-dark-700"
                        animationDelay="0ms"
                    />

                    {/* Eventos de Hoy */}
                    <MetricCard
                        title="Eventos Hoy"
                        value={dashboard?.metrics?.todayEvents || 0}
                        icon={Calendar}
                        iconBgColor="from-blue-900/40 to-blue-800/20"
                        iconBorderColor="border-blue-700/30"
                        iconColor="text-blue-400"
                        hoverBorderColor="hover:border-blue-600/50"
                        hoverShadowColor="hover:shadow-blue-500/10"
                        hoverTextColor="group-hover:text-blue-400"
                        linkTo="/events"
                        linkLabel="Ver calendario"
                        linkColor="text-blue-400 hover:text-blue-300"
                        decorationIcon={Clock}
                        decorationColor="text-dark-700"
                        animationDelay="50ms"
                    />

                    {/* Finanzas - Productos */}
                    {isFinance() && (
                        <>
                            <MetricCard
                                title="Productos"
                                value={dashboard?.metrics?.totalProducts || 0}
                                icon={Package}
                                iconBgColor="from-orange-900/40 to-orange-800/20"
                                iconBorderColor="border-orange-700/30"
                                iconColor="text-orange-400"
                                hoverBorderColor="hover:border-orange-600/50"
                                hoverShadowColor="hover:shadow-orange-500/10"
                                hoverTextColor="group-hover:text-orange-400"
                                linkTo="/products"
                                linkLabel="Ver inventario"
                                linkColor="text-orange-400 hover:text-orange-300"
                                badge={
                                    dashboard?.metrics?.lowStockProducts > 0 ? (
                                        <span className="badge-warning animate-pulse">Stock bajo</span>
                                    ) : null
                                }
                                animationDelay="100ms"
                            />

                            <MetricCard
                                title="Facturas Pendientes"
                                value={dashboard?.metrics?.pendingInvoices || 0}
                                icon={FileText}
                                iconBgColor="from-green-900/40 to-green-800/20"
                                iconBorderColor="border-green-700/30"
                                iconColor="text-green-400"
                                hoverBorderColor="hover:border-green-600/50"
                                hoverShadowColor="hover:shadow-green-500/10"
                                hoverTextColor="group-hover:text-green-400"
                                linkTo="/invoices"
                                linkLabel="Ver facturas"
                                linkColor="text-green-400 hover:text-green-300"
                                decorationIcon={TrendingUp}
                                decorationColor="text-dark-700"
                                animationDelay="150ms"
                            />
                        </>
                    )}

                    {/* RRHH */}
                    {isHR() && !isFinance() && (
                        <>
                            <MetricCard
                                title="Empleados Activos"
                                value={dashboard?.metrics?.totalEmployees || 0}
                                icon={Users}
                                iconBgColor="from-purple-900/40 to-purple-800/20"
                                iconBorderColor="border-purple-700/30"
                                iconColor="text-purple-400"
                                hoverBorderColor="hover:border-purple-600/50"
                                hoverShadowColor="hover:shadow-purple-500/10"
                                hoverTextColor="group-hover:text-purple-400"
                                linkTo="/employees"
                                linkLabel="Ver empleados"
                                linkColor="text-purple-400 hover:text-purple-300"
                                decorationIcon={TrendingUp}
                                decorationColor="text-dark-700"
                                animationDelay="100ms"
                            />

                            <MetricCard
                                title="Permisos Pendientes"
                                value={dashboard?.metrics?.pendingLeaveRequests || 0}
                                icon={Clock}
                                iconBgColor="from-yellow-900/40 to-yellow-800/20"
                                iconBorderColor="border-yellow-700/30"
                                iconColor="text-yellow-400"
                                hoverBorderColor="hover:border-yellow-600/50"
                                hoverShadowColor="hover:shadow-yellow-500/10"
                                hoverTextColor="group-hover:text-yellow-400"
                                linkTo="/leave-requests"
                                linkLabel="Ver solicitudes"
                                linkColor="text-yellow-400 hover:text-yellow-300"
                                decorationIcon={Bell}
                                decorationColor="text-dark-700"
                                animationDelay="150ms"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Shortcuts Section */}
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
            <FloatingChatButton />
        </div>
    );
};

export default Dashboard;
