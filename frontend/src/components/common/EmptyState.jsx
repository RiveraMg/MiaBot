import { Inbox, Plus, Search, FileQuestion } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const EmptyState = ({
    icon: Icon = Inbox,
    title = 'No hay datos',
    message = 'No se encontraron elementos para mostrar.',
    actionLabel = null,
    actionLink = null,
    onAction = null,
    className = ''
}) => {
    return (
        <div className={`card flex flex-col items-center text-center py-12 ${className}`}>
            <div className="p-6 rounded-2xl bg-dark-700/50 border border-dark-600 mb-6">
                <Icon className="w-12 h-12 text-dark-400" />
            </div>

            <h3 className="text-xl font-semibold text-dark-100 mb-2">{title}</h3>
            <p className="text-dark-400 max-w-md mb-6">{message}</p>

            {(actionLabel && (actionLink || onAction)) && (
                <>
                    {actionLink ? (
                        <Link to={actionLink} className="btn-primary">
                            <Plus className="w-4 h-4" />
                            {actionLabel}
                        </Link>
                    ) : (
                        <button onClick={onAction} className="btn-primary">
                            <Plus className="w-4 h-4" />
                            {actionLabel}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

EmptyState.propTypes = {
    icon: PropTypes.elementType,
    title: PropTypes.string,
    message: PropTypes.string,
    actionLabel: PropTypes.string,
    actionLink: PropTypes.string,
    onAction: PropTypes.func,
    className: PropTypes.string
};

export default EmptyState;
