import { useState, useEffect } from 'react';
import { invoicesAPI } from '../services/api';
import {
    FileText, Plus, Search, Filter, Calendar,
    Edit2, Trash2, Loader2, ChevronLeft, ChevronRight,
    DollarSign, Clock, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import Modal from '../components/common/Modal';
import { clientsAPI } from '../services/api';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState({
        clientId: '',
        dueDate: '',
        notes: '',
        itemDescription: '',
        quantity: 1,
        unitPrice: '',
    });

    useEffect(() => {
        loadInvoices();
    }, [page, statusFilter]);

    useEffect(() => {
        if (!showModal) return;

        setSaveError('');
        setSaving(false);
        setForm({
            clientId: '',
            dueDate: '',
            notes: '',
            itemDescription: '',
            quantity: 1,
            unitPrice: '',
        });

        (async () => {
            try {
                const res = await clientsAPI.list({ limit: 200 });
                setClients(res.data.clients || res.data);
            } catch (e) {
                setClients([]);
            }
        })();
    }, [showModal]);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (statusFilter) params.status = statusFilter;
            const response = await invoicesAPI.list(params);
            setInvoices(response.data.invoices || response.data);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'DRAFT': return { label: 'Borrador', class: 'badge-info', icon: FileText };
            case 'SENT': return { label: 'Enviada', class: 'badge-primary', icon: Clock };
            case 'PAID': return { label: 'Pagada', class: 'badge-success', icon: CheckCircle };
            case 'OVERDUE': return { label: 'Vencida', class: 'badge-danger', icon: AlertCircle };
            case 'CANCELLED': return { label: 'Cancelada', class: 'badge-warning', icon: XCircle };
            default: return { label: status, class: 'badge-info', icon: FileText };
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta factura?')) return;
        try {
            await invoicesAPI.delete(id);
            await loadInvoices();
        } catch (error) {
            console.error('Error deleting invoice:', error);
        }
    };

    const handleSave = async () => {
        if (saving) return;
        setSaveError('');

        if (!form.clientId) {
            setSaveError('Selecciona un cliente');
            return;
        }
        if (!form.dueDate) {
            setSaveError('Selecciona la fecha de vencimiento');
            return;
        }

        const quantity = Number(form.quantity);
        const unitPrice = Number(form.unitPrice);
        if (!Number.isFinite(quantity) || quantity < 1) {
            setSaveError('Cantidad inválida');
            return;
        }
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            setSaveError('Precio unitario inválido');
            return;
        }

        const payload = {
            clientId: form.clientId,
            dueDate: form.dueDate,
            notes: form.notes.trim() || undefined,
            items: [
                {
                    quantity,
                    unitPrice,
                    description: form.itemDescription.trim() || undefined,
                },
            ],
        };

        setSaving(true);
        try {
            await invoicesAPI.create(payload);
            setShowModal(false);
            await loadInvoices();
        } catch (error) {
            setSaveError(error.response?.data?.error || 'No se pudo crear la factura');
        } finally {
            setSaving(false);
        }
    };

    const filteredInvoices = invoices.filter(invoice =>
        invoice.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusOptions = [
        { value: '', label: 'Todos' },
        { value: 'DRAFT', label: 'Borrador' },
        { value: 'SENT', label: 'Enviada' },
        { value: 'PAID', label: 'Pagada' },
        { value: 'OVERDUE', label: 'Vencida' },
        { value: 'CANCELLED', label: 'Cancelada' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-green-900/30">
                        <FileText className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-dark-50">Facturas</h1>
                        <p className="text-sm text-dark-400">Gestión de facturación</p>
                    </div>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Nueva Factura
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                        type="text"
                        placeholder="Buscar por número o cliente..."
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
                    {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Facturas', value: invoices.length, icon: FileText, color: 'blue' },
                    { label: 'Pendientes', value: invoices.filter(i => i.status === 'SENT').length, icon: Clock, color: 'yellow' },
                    { label: 'Pagadas', value: invoices.filter(i => i.status === 'PAID').length, icon: CheckCircle, color: 'green' },
                    { label: 'Vencidas', value: invoices.filter(i => i.status === 'OVERDUE').length, icon: AlertCircle, color: 'red' },
                ].map((card, i) => (
                    <div key={i} className="card bg-dark-800/50">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${card.color}-900/30`}>
                                <card.icon className={`w-5 h-5 text-${card.color}-400`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-dark-100">{card.value}</p>
                                <p className="text-xs text-dark-400">{card.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto text-dark-600 mb-3" />
                        <p className="text-dark-400">No se encontraron facturas</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Vencimiento</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice) => {
                                const statusConfig = getStatusConfig(invoice.status);
                                const StatusIcon = statusConfig.icon;
                                return (
                                    <tr key={invoice.id}>
                                        <td>
                                            <span className="font-mono text-dark-100">{invoice.number}</span>
                                        </td>
                                        <td>
                                            <p className="font-medium text-dark-100">{invoice.client?.name}</p>
                                        </td>
                                        <td className="text-dark-400">
                                            {formatDate(invoice.issueDate)}
                                        </td>
                                        <td className={invoice.status === 'OVERDUE' ? 'text-red-400' : 'text-dark-400'}>
                                            {formatDate(invoice.dueDate)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-dark-100 font-medium">
                                                <DollarSign className="w-4 h-4 text-dark-500" />
                                                {Number(invoice.total).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${statusConfig.class} inline-flex items-center gap-1`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-200">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(invoice.id)}
                                                    className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-dark-700">
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
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Nueva Factura"
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn-secondary">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={saving} className="btn-primary">
                            {saving ? 'Creando...' : 'Crear'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {saveError && (
                        <div className="alert-danger">
                            <AlertCircle className="w-5 h-5 mt-0.5" />
                            <div>
                                <p className="text-sm">{saveError}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="label">Cliente</label>
                        <select
                            className="input"
                            value={form.clientId}
                            onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
                        >
                            <option value="">Selecciona un cliente</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label">Fecha de vencimiento</label>
                        <input
                            type="date"
                            className="input"
                            value={form.dueDate}
                            onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="label">Notas</label>
                        <textarea
                            className="input min-h-[90px]"
                            value={form.notes}
                            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                        />
                    </div>

                    <div className="card bg-dark-800/50">
                        <h3 className="text-sm font-semibold text-dark-100 mb-3">Ítem (mínimo 1)</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="label">Descripción</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={form.itemDescription}
                                    onChange={(e) => setForm((p) => ({ ...p, itemDescription: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Cantidad</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={form.quantity}
                                        onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="label">Precio unitario</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={form.unitPrice}
                                        onChange={(e) => setForm((p) => ({ ...p, unitPrice: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Invoices;
