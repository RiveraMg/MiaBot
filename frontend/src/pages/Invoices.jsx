import { useState, useEffect } from 'react';
import { invoicesAPI } from '../services/api';
import {
    FileText, Plus, Search, Filter, Calendar,
    Edit2, Trash2, Loader2, ChevronLeft, ChevronRight,
    DollarSign, Clock, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadInvoices();
    }, [page, statusFilter]);

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
                <button className="btn-primary">
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
                                                <button className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-red-400">
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
        </div>
    );
};

export default Invoices;
