import { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import {
    Calendar, Plus, Search, Clock, MapPin,
    Edit2, Trash2, Loader2, ChevronLeft, ChevronRight, AlertTriangle,
    Users, Cake, Award, BookOpen, Building, Flag
} from 'lucide-react';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // list or calendar
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'MEETING',
        allDay: false,
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const response = await eventsAPI.list({ limit: 50 });
            setEvents(response.data.events || response.data);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este evento?')) return;
        try {
            await eventsAPI.delete(id);
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const getEventTypeConfig = (type) => {
        switch (type) {
            case 'MEETING': return { label: 'Reunión', icon: Users, color: 'blue' };
            case 'BIRTHDAY': return { label: 'Cumpleaños', icon: Cake, color: 'pink' };
            case 'ANNIVERSARY': return { label: 'Aniversario', icon: Award, color: 'purple' };
            case 'TRAINING': return { label: 'Capacitación', icon: BookOpen, color: 'green' };
            case 'CORPORATE': return { label: 'Corporativo', icon: Building, color: 'orange' };
            case 'DEADLINE': return { label: 'Fecha límite', icon: Flag, color: 'red' };
            default: return { label: type, icon: Calendar, color: 'gray' };
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isToday = (date) => {
        const today = new Date();
        const eventDate = new Date(date);
        return today.toDateString() === eventDate.toDateString();
    };

    const isUpcoming = (date) => {
        return new Date(date) > new Date();
    };

    const filteredEvents = events.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedEvents = [...filteredEvents].sort((a, b) =>
        new Date(a.startDate) - new Date(b.startDate)
    );

    const eventTypes = [
        { value: 'MEETING', label: 'Reunión' },
        { value: 'BIRTHDAY', label: 'Cumpleaños' },
        { value: 'ANNIVERSARY', label: 'Aniversario' },
        { value: 'TRAINING', label: 'Capacitación' },
        { value: 'CORPORATE', label: 'Corporativo' },
        { value: 'DEADLINE', label: 'Fecha límite' },
        { value: 'OTHER', label: 'Otro' },
    ];

    useEffect(() => {
        if (!showModal) return;

        setSaveError('');
        setSaving(false);

        const toLocalInput = (value) => {
            if (!value) return '';
            const d = new Date(value);
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setForm({
            title: editingEvent?.title || '',
            description: editingEvent?.description || '',
            type: editingEvent?.type || 'MEETING',
            allDay: !!editingEvent?.allDay,
            startDate: toLocalInput(editingEvent?.startDate),
            endDate: toLocalInput(editingEvent?.endDate),
        });
    }, [showModal, editingEvent]);

    const handleSave = async () => {
        if (saving) return;
        setSaveError('');

        if (!form.title.trim()) {
            setSaveError('El título es requerido');
            return;
        }
        if (!form.startDate) {
            setSaveError('La fecha inicio es requerida');
            return;
        }

        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            type: form.type,
            allDay: !!form.allDay,
            startDate: new Date(form.startDate).toISOString(),
            endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        };

        setSaving(true);
        try {
            if (editingEvent?.id) {
                await eventsAPI.update(editingEvent.id, payload);
            } else {
                await eventsAPI.create(payload);
            }
            setShowModal(false);
            setEditingEvent(null);
            await loadEvents();
        } catch (error) {
            setSaveError(error.response?.data?.error || 'No se pudo guardar el evento');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-900/30">
                        <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-dark-50">Eventos</h1>
                        <p className="text-sm text-dark-400">Calendario y reuniones</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingEvent(null); setShowModal(true); }}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Evento
                </button>
            </div>

            {/* Search */}
            <div className="max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                />
            </div>

            {/* Events List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : sortedEvents.length === 0 ? (
                <div className="card text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto text-dark-600 mb-3" />
                    <p className="text-dark-400">No hay eventos programados</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedEvents.map((event) => {
                        const typeConfig = getEventTypeConfig(event.type);
                        const TypeIcon = typeConfig.icon;
                        const today = isToday(event.startDate);
                        const upcoming = isUpcoming(event.startDate);

                        return (
                            <div
                                key={event.id}
                                className={`card-hover flex items-center gap-4 ${today ? 'ring-2 ring-primary-500/50' : ''} ${!upcoming ? 'opacity-50' : ''}`}
                            >
                                {/* Date */}
                                <div className="flex-shrink-0 w-16 text-center">
                                    <p className={`text-2xl font-bold ${today ? 'text-primary-400' : 'text-dark-100'}`}>
                                        {new Date(event.startDate).getDate()}
                                    </p>
                                    <p className="text-xs text-dark-500 uppercase">
                                        {new Date(event.startDate).toLocaleDateString('es-ES', { month: 'short' })}
                                    </p>
                                </div>

                                {/* Divider */}
                                <div className="w-px h-12 bg-dark-700" />

                                {/* Icon */}
                                <div className={`p-2 rounded-lg bg-${typeConfig.color}-900/30`}>
                                    <TypeIcon className={`w-5 h-5 text-${typeConfig.color}-400`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-dark-100 truncate">{event.title}</h3>
                                        {today && <span className="badge-primary">Hoy</span>}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
                                        {!event.allDay && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {formatTime(event.startDate)}
                                            </div>
                                        )}
                                        <span className="text-dark-600">•</span>
                                        <span>{typeConfig.label}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setEditingEvent(event); setShowModal(true); }}
                                        className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-200"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-lg mx-4">
                        <h2 className="text-lg font-bold text-dark-100 mb-4">
                            {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                        </h2>
                        {saveError && (
                            <div className="alert-danger mb-4">
                                <AlertTriangle className="w-5 h-5 mt-0.5" />
                                <div>
                                    <p className="text-sm">{saveError}</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="label">Título</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={form.title}
                                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="label">Descripción</label>
                                <textarea
                                    className="input min-h-[80px]"
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Tipo</label>
                                    <select
                                        className="input"
                                        value={form.type}
                                        onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                                    >
                                        {eventTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-7">
                                    <input
                                        type="checkbox"
                                        id="allDay"
                                        checked={form.allDay}
                                        onChange={(e) => setForm((p) => ({ ...p, allDay: e.target.checked }))}
                                        className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="allDay" className="text-sm text-dark-300">Todo el día</label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Fecha inicio</label>
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={form.startDate}
                                        onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="label">Fecha fin</label>
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={form.endDate}
                                        onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={saving} className="btn-primary">
                                {saving ? 'Guardando...' : editingEvent ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
