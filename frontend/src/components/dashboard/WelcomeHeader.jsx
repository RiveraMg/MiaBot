import { Sparkles, Calendar } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const WelcomeHeader = ({ user, showChatButton = true, className = '' }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '¡Buenos días';
        if (hour < 18) return '¡Buenas tardes';
        return '¡Buenas noches';
    };

    const getRoleName = (user) => {
        if (user?.role === 'ADMIN') return 'Administrador';
        if (user?.department === 'FINANCE') return 'Finanzas';
        if (user?.department === 'HR') return 'Recursos Humanos';
        return 'Usuario';
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900/40 via-primary-800/20 to-dark-800 border border-primary-700/30 p-8 ${className}`}>
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
                                {getRoleName(user)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick action button */}
                {showChatButton && (
                    <Link
                        to="/app/chat"
                        className="hidden md:flex items-center gap-2 px-6 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105"
                    >
                        <img src="/logo.png" alt="MiaBot" className="w-10 h-10 object-contain" />
                        <span className="font-medium">Abrir Asistente</span>
                    </Link>
                )}
            </div>
        </div>
    );
};

WelcomeHeader.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        role: PropTypes.string,
        department: PropTypes.string
    }).isRequired,
    showChatButton: PropTypes.bool,
    className: PropTypes.string
};

export default WelcomeHeader;
