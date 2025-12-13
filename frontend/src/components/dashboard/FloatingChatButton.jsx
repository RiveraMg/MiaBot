import { Bot, MessageCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const FloatingChatButton = ({
    to = '/chat',
    label = 'Asistente Virtual',
    showLabel = true,
    className = ''
}) => {
    return (
        <Link
            to={to}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-2xl shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300 hover:scale-110 group animate-fade-in ${className}`}
        >
            <div className="relative">
                <Bot className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            {showLabel && (
                <span className="font-semibold hidden md:block">{label}</span>
            )}
            <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </Link>
    );
};

FloatingChatButton.propTypes = {
    to: PropTypes.string,
    label: PropTypes.string,
    showLabel: PropTypes.bool,
    className: PropTypes.string
};

export default FloatingChatButton;
