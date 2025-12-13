import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import {
    Users, Plus, Search, Mail, Phone,
    Edit2, Trash2, Loader2, ChevronLeft, ChevronRight,
    Briefcase, Calendar, Shield
} from 'lucide-react';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadEmployees();
    }, [page]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const response = await usersAPI.list({ page, limit: 10 });
            setEmployees(response.data.users || response.data);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
        try {
            await usersAPI.delete(id);
            loadEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const filteredEmployees = employees.filter(employee =>
        employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN': return 'badge-danger';
            case 'EMPLOYEE': return 'badge-primary';
            default: return 'badge-info';
        }
    };

    const getDeptBadge = (dept) => {
        switch (dept) {
            case 'FINANCE': return 'badge-success';
            case 'HR': return 'badge-warning';
            default: return 'badge-info';
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-900/30">
                        <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-dark-50">Empleados</h1>
                        <p className="text-sm text-dark-400">Gestión del personal</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingEmployee(null); setShowModal(true); }}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Empleado
                </button>
            </div>

            {/* Search */}
            <div className="max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                />
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto text-dark-600 mb-3" />
                        <p className="text-dark-400">No se encontraron empleados</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Cargo</th>
                                <th>Departamento</th>
                                <th>Rol</th>
                                <th>Ingreso</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((employee) => (
                                <tr key={employee.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-medium">
                                                {employee.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-dark-100">{employee.name}</p>
                                                <p className="text-xs text-dark-500">{employee.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-dark-300">
                                            <Briefcase className="w-4 h-4 text-dark-500" />
                                            {employee.position || 'Sin cargo'}
                                        </div>
                                    </td>
                                    <td>
                                        {employee.department ? (
                                            <span className={getDeptBadge(employee.department)}>
                                                {employee.department === 'FINANCE' ? 'Finanzas' : 'RRHH'}
                                            </span>
                                        ) : (
                                            <span className="text-dark-500">-</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={getRoleBadge(employee.role)}>
                                            {employee.role}
                                        </span>
                                    </td>
                                    <td className="text-dark-400">
                                        {formatDate(employee.hireDate)}
                                    </td>
                                    <td>
                                        <span className={employee.isActive ? 'badge-success' : 'badge-danger'}>
                                            {employee.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setEditingEmployee(employee); setShowModal(true); }}
                                                className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-200"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(employee.id)}
                                                className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-dark-100 mb-4">
                            {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Nombre completo</label>
                                <input type="text" className="input" defaultValue={editingEmployee?.name} />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input type="email" className="input" defaultValue={editingEmployee?.email} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Cargo</label>
                                    <input type="text" className="input" defaultValue={editingEmployee?.position} />
                                </div>
                                <div>
                                    <label className="label">Teléfono</label>
                                    <input type="tel" className="input" defaultValue={editingEmployee?.phone} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Departamento</label>
                                    <select className="input" defaultValue={editingEmployee?.department || ''}>
                                        <option value="">Seleccionar...</option>
                                        <option value="FINANCE">Finanzas</option>
                                        <option value="HR">RRHH</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Rol</label>
                                    <select className="input" defaultValue={editingEmployee?.role || 'EMPLOYEE'}>
                                        <option value="EMPLOYEE">Empleado</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Fecha de ingreso</label>
                                    <input type="date" className="input" defaultValue={editingEmployee?.hireDate?.split('T')[0]} />
                                </div>
                                <div>
                                    <label className="label">Fecha de nacimiento</label>
                                    <input type="date" className="input" defaultValue={editingEmployee?.birthDate?.split('T')[0]} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">
                                Cancelar
                            </button>
                            <button className="btn-primary">
                                {editingEmployee ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
