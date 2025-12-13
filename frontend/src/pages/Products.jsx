import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import {
    Package, Plus, Search, Filter, AlertTriangle,
    Edit2, Trash2, Loader2, ChevronLeft, ChevronRight,
    TrendingDown, TrendingUp
} from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadProducts();
    }, [page, showLowStock]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (showLowStock) {
                const response = await productsAPI.getLowStock();
                setProducts(response.data);
                setTotalPages(1);
            } else {
                const response = await productsAPI.list(params);
                setProducts(response.data.products || response.data);
                setTotalPages(response.data.totalPages || 1);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await productsAPI.delete(id);
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStockStatus = (product) => {
        if (product.stock <= 0) return { label: 'Sin stock', class: 'badge-danger' };
        if (product.stock <= product.minStock) return { label: 'Stock bajo', class: 'badge-warning' };
        return { label: 'En stock', class: 'badge-success' };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-900/30">
                        <Package className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-dark-50">Inventario</h1>
                        <p className="text-sm text-dark-400">Gestión de productos y stock</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setShowModal(true); }}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Producto
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <button
                    onClick={() => setShowLowStock(!showLowStock)}
                    className={`btn ${showLowStock ? 'btn-primary' : 'btn-secondary'}`}
                >
                    <AlertTriangle className="w-4 h-4" />
                    Stock bajo
                </button>
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 mx-auto text-dark-600 mb-3" />
                        <p className="text-dark-400">No se encontraron productos</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>SKU</th>
                                <th>Stock</th>
                                <th>Precio Costo</th>
                                <th>Precio Venta</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => {
                                const stockStatus = getStockStatus(product);
                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <div>
                                                <p className="font-medium text-dark-100">{product.name}</p>
                                                {product.category && (
                                                    <p className="text-xs text-dark-500">{product.category.name}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-dark-400 font-mono text-sm">{product.sku || '-'}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className={product.stock <= product.minStock ? 'text-red-400' : 'text-dark-100'}>
                                                    {product.stock}
                                                </span>
                                                <span className="text-dark-500 text-xs">/ {product.minStock} min</span>
                                            </div>
                                        </td>
                                        <td className="text-dark-300">
                                            ${Number(product.costPrice).toLocaleString()}
                                        </td>
                                        <td className="text-dark-100 font-medium">
                                            ${Number(product.salePrice).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={stockStatus.class}>{stockStatus.label}</span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingProduct(product); setShowModal(true); }}
                                                    className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-200"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
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

            {/* Modal placeholder - would need full implementation */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-lg mx-4">
                        <h2 className="text-lg font-bold text-dark-100 mb-4">
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Nombre</label>
                                <input type="text" className="input" defaultValue={editingProduct?.name} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">SKU</label>
                                    <input type="text" className="input" defaultValue={editingProduct?.sku} />
                                </div>
                                <div>
                                    <label className="label">Stock</label>
                                    <input type="number" className="input" defaultValue={editingProduct?.stock || 0} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Precio Costo</label>
                                    <input type="number" className="input" defaultValue={editingProduct?.costPrice} />
                                </div>
                                <div>
                                    <label className="label">Precio Venta</label>
                                    <input type="number" className="input" defaultValue={editingProduct?.salePrice} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">
                                Cancelar
                            </button>
                            <button className="btn-primary">
                                {editingProduct ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
