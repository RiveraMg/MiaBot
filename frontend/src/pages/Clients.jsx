import { useState, useEffect } from 'react';
import { clientsAPI } from '../services/api';
import {
    Users, Plus, Search, Mail, Phone,
    Edit2, Trash2, Loader2, ChevronLeft, ChevronRight,
    MapPin, Building
} from 'lucide-react';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-900/30">
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-dark-50">Clientes</h1>
                        <p className="text-sm text-dark-400">Gestión de clientes</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingClient(null); setShowModal(true); }}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Cliente
                </button>
            </div>

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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-dark-400">
                        Página {page} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-secondary btn-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="btn-secondary btn-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-lg mx-4">
                        <h2 className="text-lg font-bold text-dark-100 mb-4">
                            {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Nombre</label>
                                <input type="text" className="input" defaultValue={editingClient?.name} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">NIT / Cédula</label>
                                    <input type="text" className="input" defaultValue={editingClient?.nit} />
                                </div>
                                <div>
                                    <label className="label">Teléfono</label>
                                    <input type="tel" className="input" defaultValue={editingClient?.phone} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input type="email" className="input" defaultValue={editingClient?.email} />
                            </div>
                            <div>
                                <label className="label">Dirección</label>
                                <input type="text" className="input" defaultValue={editingClient?.address} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">
                                Cancelar
                            </button>
                            <button className="btn-primary">
                                {editingClient ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
