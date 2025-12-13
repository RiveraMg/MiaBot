import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ErrorMessage = ({
    title = 'Algo salió mal',
    message = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    onRetry = null,
    showHomeButton = false,
    variant = 'card',
    className = ''
}) => {
    const content = (
        <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-red-900/30 border border-red-700/50">
                <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-dark-100">{title}</h3>
                <p className="text-sm text-dark-400 max-w-md">{message}</p>
            </div>

            <div className="flex items-center gap-3">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="btn-primary btn-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                    </button>
                )}
                {showHomeButton && (
                    <Link to="/" className="btn-secondary btn-sm">
                        <Home className="w-4 h-4" />
                        Ir al inicio
                    </Link>
                )}
            </div>
        </div>
    );

    if (variant === 'inline') {
        return (
            <div className={`alert-danger ${className}`}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm opacity-90 mt-0.5">{message}</p>
                </div>
                {onRetry && (
                    <button onClick={onRetry} className="btn-ghost btn-sm ml-auto">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    if (variant === 'full-page') {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
                {content}
            </div>
        );
    }

    // variant === 'card'
    return (
        <div className={`card ${className}`}>
            {content}
        </div>
    );
};

ErrorMessage.propTypes = {
    title: PropTypes.string,
    message: PropTypes.string,
    onRetry: PropTypes.func,
    showHomeButton: PropTypes.bool,
    variant: PropTypes.oneOf(['inline', 'card', 'full-page']),
    className: PropTypes.string
};

export default ErrorMessage;
