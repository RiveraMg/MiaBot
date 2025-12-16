import { Link } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PublicChatWidget from '../components/PublicChatWidget';

const Landing = () => {
    const { isAuthenticated } = useAuth();

    const companyName = import.meta.env.VITE_COMPANY_NAME || 'Tu Compañía';
    const companyTagline = import.meta.env.VITE_COMPANY_TAGLINE || 'Asistente virtual para atender a tus clientes 24/7';

    return (
        <div className="min-h-screen bg-dark-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    {/* Left: hero */}
                    <div className="space-y-6 lg:h-full lg:flex lg:flex-col lg:justify-center">
                        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-primary-900/30 border border-primary-700/30 text-primary-200">
                            <img src="/logo.png" alt="MiaBot" className="w-12 h-12 object-contain" />
                            <span className="text-sm font-medium">MiaBot</span>
                        </div>

                        <div>
                            <h1 className="text-4xl sm:text-5xl font-bold text-dark-50 leading-tight">
                                {companyName}
                            </h1>
                            <p className="text-lg text-dark-300 mt-4">
                                {companyTagline}
                            </p>
                        </div>

                        <div className="card space-y-3">
                            <h3 className="text-lg font-semibold text-dark-100">¿Qué puedes hacer aquí?</h3>
                            <p className="text-dark-400 text-sm">
                                Haz preguntas sobre productos, disponibilidad, servicios, horarios o soporte.
                                El chat está pensado para clientes externos.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {isAuthenticated ? (
                                <Link to="/app" className="btn-primary">
                                    Ir al panel
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <Link to="/login" className="btn-primary">
                                    <Lock className="w-4 h-4" />
                                    Login empleados
                                </Link>
                            )}

                            <a
                                href="#chat"
                                className="btn-secondary"
                            >
                                Abrir chat
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="text-xs text-dark-500">
                            Estoy para hacer tu trabajo mas facil y productivo.
                        </div>
                    </div>

                    {/* Right: chat */}
                    <div id="chat" className="h-[calc(100vh-6rem)] min-h-[620px]">
                        <PublicChatWidget className="h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
