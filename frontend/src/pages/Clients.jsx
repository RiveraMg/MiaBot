import { useState, useEffect } from 'react';
import { clientsAPI } from '../services/api';
import {
    Users, Plus, Search, Mail, Phone,
    Edit2, Trash2, Loader2, MapPin
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [form, setForm] = useState({
        name: '',
        nit: '',
        phone: '',
        email: '',
        address: '',
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadClients();
    }, [page]);

    const loadClients = async () => {
        setLoading(true);
        try {
            const response = await clientsAPI.list({ page, limit: 10 });
            setClients(response.data.clients || response.data);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
        try {
            await clientsAPI.delete(id);
            loadClients();
        } catch (error) {
            console.error('Error deleting client:', error);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.nit?.includes(searchTerm)
    );

    const headerActions = (
        <button
            onClick={() => {
                setEditingClient(null);
                setShowModal(true);
            }}
            className="btn-primary"
        >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
        </button>
    );

    useEffect(() => {
        if (!showModal) return;

        setSaveError('');
        setSaving(false);
        setForm({
            name: editingClient?.name || '',
            nit: editingClient?.nit || '',
            phone: editingClient?.phone || '',
            email: editingClient?.email || '',
            address: editingClient?.address || '',
        });
    }, [showModal, editingClient]);

    const handleSave = async () => {
        if (saving) return;

        setSaveError('');
        if (!form.name.trim()) {
            setSaveError('El nombre es requerido');
            return;
        }

        const payload = {
            name: form.name.trim(),
            nit: form.nit.trim() || undefined,
            phone: form.phone.trim() || undefined,
            email: form.email.trim() || undefined,
            address: form.address.trim() || undefined,
        };

        setSaving(true);
        try {
            if (editingClient?.id) {
                await clientsAPI.update(editingClient.id, payload);
            } else {
                await clientsAPI.create(payload);
            }
            setShowModal(false);
            setEditingClient(null);
            await loadClients();
        } catch (error) {
            setSaveError(error.response?.data?.error || 'No se pudo guardar el cliente');
        } finally {
            setSaving(false);
        }
    };

    const modalFooter = (
        <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Guardando...' : editingClient ? 'Guardar' : 'Crear'}
            </button>
        </>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Clientes"
                subtitle="Gestión de clientes"
                icon={Users}
                iconColor="blue"
                actions={headerActions}
            />

            {/* Search */}
            <div className="max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o NIT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="card text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-dark-600 mb-3" />
                    <p className="text-dark-400">No se encontraron clientes</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client) => (
                        <div key={client.id} className="card-hover">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                                    {client.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => { setEditingClient(client); setShowModal(true); }}
                                        className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-200"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-semibold text-dark-100 mb-1">{client.name}</h3>
                            {client.nit && (
                                <p className="text-xs text-dark-500 mb-3">NIT: {client.nit}</p>
                            )}

                            <div className="space-y-2 text-sm">
                                {client.email && (
                                    <div className="flex items-center gap-2 text-dark-400">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-dark-400">
                                        <Phone className="w-4 h-4" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-2 text-dark-400">
                                        <MapPin className="w-4 h-4" />
                                        <span className="truncate">{client.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                footer={modalFooter}
            >
                <div className="space-y-4">
                    {saveError && (
                        <div className="alert-danger">
                            <MapPin className="w-5 h-5 mt-0.5" />
                            <div>
                                <p className="text-sm">{saveError}</p>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="label">Nombre</label>
                        <input
                            type="text"
                            className="input"
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">NIT / Cédula</label>
                            <input
                                type="text"
                                className="input"
                                value={form.nit}
                                onChange={(e) => setForm((p) => ({ ...p, nit: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="label">Teléfono</label>
                            <input
                                type="tel"
                                className="input"
                                value={form.phone}
                                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            className="input"
                            value={form.email}
                            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="label">Dirección</label>
                        <input
                            type="text"
                            className="input"
                            value={form.address}
                            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Clients;
