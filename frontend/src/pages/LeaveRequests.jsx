import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveRequestsAPI } from '../services/api';
import {
    CalendarOff, Plus, Search, Clock, Check, X,
    Loader2, ChevronLeft, ChevronRight,
    Calendar, Plane, HeartPulse, User, Baby
} from 'lucide-react';

const LeaveRequests = () => {
    const { user, isAdmin, isHR } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [respondingRequest, setRespondingRequest] = useState(null);
    const [responseNote, setResponseNote] = useState('');

    useEffect(() => {
        loadRequests();
    }, [statusFilter]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const response = await leaveRequestsAPI.list(params);
            setRequests(response.data.leaveRequests || response.data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id, status) => {
        try {
            await leaveRequestsAPI.respond(id, status, responseNote);
            setRespondingRequest(null);
            setResponseNote('');
            loadRequests();
        } catch (error) {
            console.error('Error responding to request:', error);
        }
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'VACATION': return { label: 'Vacaciones', icon: Plane, color: 'blue' };
            case 'SICK': return { label: 'Enfermedad', icon: HeartPulse, color: 'red' };
            case 'PERSONAL': return { label: 'Personal', icon: User, color: 'purple' };
            case 'MATERNITY': return { label: 'Maternidad', icon: Baby, color: 'pink' };
            default: return { label: type, icon: Calendar, color: 'gray' };
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'PENDING': return { label: 'Pendiente', class: 'badge-warning', icon: Clock };
            case 'APPROVED': return { label: 'Aprobada', class: 'badge-success', icon: Check };
            case 'REJECTED': return { label: 'Rechazada', class: 'badge-danger', icon: X };
            default: return { label: status, class: 'badge-info', icon: Clock };
        }
    };

    const formatDateRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const options = { day: '2-digit', month: 'short' };

        if (startDate.toDateString() === endDate.toDateString()) {
            return startDate.toLocaleDateString('es-ES', { ...options, year: 'numeric' });
        }
        return `${startDate.toLocaleDateString('es-ES', options)} - ${endDate.toLocaleDateString('es-ES', { ...options, year: 'numeric' })}`;
    };

    const getDaysCount = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const filteredRequests = requests.filter(request =>
        request.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canManage = isAdmin() || isHR();

    const leaveTypes = [
        { value: 'VACATION', label: 'Vacaciones' },
        { value: 'SICK', label: 'Enfermedad' },
        { value: 'PERSONAL', label: 'Personal' },
        { value: 'MATERNITY', label: 'Maternidad' },
        { value: 'OTHER', label: 'Otro' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-yellow-900/30">
                        <CalendarOff className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-dark-50">Permisos</h1>
                        <p className="text-sm text-dark-400">Solicitudes de ausencia</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Solicitud
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input w-auto"
                >
                    <option value="">Todos los estados</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="APPROVED">Aprobadas</option>
                    <option value="REJECTED">Rechazadas</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Pendientes', value: requests.filter(r => r.status === 'PENDING').length, color: 'yellow' },
                    { label: 'Aprobadas', value: requests.filter(r => r.status === 'APPROVED').length, color: 'green' },
                    { label: 'Rechazadas', value: requests.filter(r => r.status === 'REJECTED').length, color: 'red' },
                ].map((stat, i) => (
                    <div key={i} className="card bg-dark-800/50">
                        <div className="flex items-center justify-between">
                            <span className="text-dark-400">{stat.label}</span>
                            <span className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="card text-center py-12">
                    <CalendarOff className="w-12 h-12 mx-auto text-dark-600 mb-3" />
                    <p className="text-dark-400">No hay solicitudes</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRequests.map((request) => {
                        const typeConfig = getTypeConfig(request.type);
                        const statusConfig = getStatusConfig(request.status);
                        const TypeIcon = typeConfig.icon;
                        const StatusIcon = statusConfig.icon;
                        const days = getDaysCount(request.startDate, request.endDate);

                        return (
                            <div key={request.id} className="card">
                                <div className="flex items-start gap-4">
                                    {/* Type Icon */}
                                    <div className={`p-2 rounded-lg bg-${typeConfig.color}-900/30`}>
                                        <TypeIcon className={`w-5 h-5 text-${typeConfig.color}-400`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-dark-100">{request.user?.name}</h3>
                                            <span className={statusConfig.class}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-dark-400 mb-2">{typeConfig.label}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1 text-dark-300">
                                                <Calendar className="w-4 h-4 text-dark-500" />
                                                {formatDateRange(request.startDate, request.endDate)}
                                            </div>
                                            <span className="badge-info">{days} día{days > 1 ? 's' : ''}</span>
                                        </div>
                                        {request.reason && (
                                            <p className="text-sm text-dark-500 mt-2 italic">"{request.reason}"</p>
                                        )}
                                        {request.responseNote && (
                                            <p className="text-sm text-dark-400 mt-2 bg-dark-800 rounded p-2">
                                                <strong>Respuesta:</strong> {request.responseNote}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {canManage && request.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setRespondingRequest({ ...request, action: 'APPROVED' })}
                                                className="btn-sm bg-green-900/30 text-green-400 hover:bg-green-900/50"
                                            >
                                                <Check className="w-4 h-4" />
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => setRespondingRequest({ ...request, action: 'REJECTED' })}
                                                className="btn-sm bg-red-900/30 text-red-400 hover:bg-red-900/50"
                                            >
                                                <X className="w-4 h-4" />
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New Request Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-lg mx-4">
                        <h2 className="text-lg font-bold text-dark-100 mb-4">Nueva Solicitud</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Tipo de permiso</label>
                                <select className="input">
                                    {leaveTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Fecha inicio</label>
                                    <input type="date" className="input" />
                                </div>
                                <div>
                                    <label className="label">Fecha fin</label>
                                    <input type="date" className="input" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Motivo</label>
                                <textarea className="input min-h-[80px]" placeholder="Describe brevemente el motivo..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">
                                Cancelar
                            </button>
                            <button className="btn-primary">
                                Enviar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Response Modal */}
            {respondingRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-md mx-4">
                        <h2 className="text-lg font-bold text-dark-100 mb-4">
                            {respondingRequest.action === 'APPROVED' ? 'Aprobar' : 'Rechazar'} Solicitud
                        </h2>
                        <p className="text-dark-400 mb-4">
                            Solicitud de <strong>{respondingRequest.user?.name}</strong> para {getTypeConfig(respondingRequest.type).label.toLowerCase()}
                        </p>
                        <div>
                            <label className="label">Nota (opcional)</label>
                            <textarea
                                className="input min-h-[80px]"
                                value={responseNote}
                                onChange={(e) => setResponseNote(e.target.value)}
                                placeholder="Agregar una nota a la respuesta..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setRespondingRequest(null); setResponseNote(''); }} className="btn-secondary">
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleRespond(respondingRequest.id, respondingRequest.action)}
                                className={respondingRequest.action === 'APPROVED' ? 'btn-primary' : 'btn-danger'}
                            >
                                {respondingRequest.action === 'APPROVED' ? 'Aprobar' : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveRequests;
