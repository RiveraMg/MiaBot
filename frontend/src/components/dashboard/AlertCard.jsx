import PropTypes from 'prop-types';

const AlertCard = ({
    type,
    priority = 'medium',
    title,
    message,
    icon: Icon,
    index = 0,
    className = ''
}) => {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-400 bg-red-900/30 border-red-700';
            case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-700';
            case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
            default: return 'text-blue-400 bg-blue-900/30 border-blue-700';
        }
    };

    return (
        <div
            className={`flex items-start gap-4 p-4 rounded-xl border ${getPriorityColor(priority)} transition-all duration-200 hover:scale-[1.02] animate-fade-in ${className}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="p-2.5 rounded-lg bg-dark-800/50 backdrop-blur-sm">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">{title}</p>
                <p className="text-sm opacity-80 mt-0.5">{message}</p>
            </div>
            <span className="text-xs uppercase font-bold opacity-75 px-2 py-1 rounded-md bg-dark-900/30">
                {priority}
            </span>
        </div>
    );
};

AlertCard.propTypes = {
    type: PropTypes.string.isRequired,
    priority: PropTypes.oneOf(['low', 'medium', 'high', 'urgent']),
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    index: PropTypes.number,
    className: PropTypes.string
};

export default AlertCard;
