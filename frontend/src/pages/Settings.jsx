import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Settings as SettingsIcon, User, Lock, Bell,
    Palette, Database, Shield, Save, Loader2,
    Eye, EyeOff, Check
} from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const tabs = [
        { id: 'profile', label: 'Perfil', icon: User },
        { id: 'security', label: 'Seguridad', icon: Lock },
        { id: 'notifications', label: 'Notificaciones', icon: Bell },
        { id: 'appearance', label: 'Apariencia', icon: Palette },
    ];

    const handleSave = async () => {
        setLoading(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-dark-100">{user?.name}</h3>
                                <p className="text-dark-400">{user?.email}</p>
                                <span className="badge-primary mt-2">{user?.role}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Nombre completo</label>
                                <input
                                    type="text"
                                    defaultValue={user?.name}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Correo electrónico</label>
                                <input
                                    type="email"
                                    defaultValue={user?.email}
                                    className="input"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="label">Teléfono</label>
                                <input
                                    type="tel"
                                    defaultValue={user?.phone || ''}
                                    placeholder="+57 300 123 4567"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Rol</label>
                                <input
                                    type="text"
                                    value={user?.role || 'N/A'}
                                    className="input"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="label">Departamento</label>
                                <input
                                    type="text"
                                    value={user?.department || 'N/A'}
                                    className="input"
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-dark-100 mb-4">Cambiar contraseña</h3>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="label">Contraseña actual</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            className="input pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400"
                                        >
                                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Nueva contraseña</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                            className="input pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400"
                                        >
                                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Confirmar contraseña</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="input pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-dark-700">
                            <h3 className="text-lg font-semibold text-dark-100 mb-4">Sesiones activas</h3>
                            <div className="card bg-dark-800/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-green-900/30">
                                            <Shield className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-dark-100">Sesión actual</p>
                                            <p className="text-xs text-dark-400">Windows • Chrome • Bogotá, Colombia</p>
                                        </div>
                                    </div>
                                    <span className="badge-success">Activa</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-dark-100">Preferencias de notificaciones</h3>

                        {[
                            { label: 'Stock bajo', description: 'Alertas cuando productos tienen stock bajo' },
                            { label: 'Facturas vencidas', description: 'Notificaciones de facturas por vencer o vencidas' },
                            { label: 'Eventos del día', description: 'Recordatorios de eventos y reuniones' },
                            { label: 'Solicitudes de permisos', description: 'Nuevas solicitudes de permisos (solo Admin)' },
                            { label: 'Correo electrónico', description: 'Recibir resumen diario por correo' },
                        ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-dark-700 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-dark-100">{item.label}</p>
                                    <p className="text-xs text-dark-400">{item.description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-dark-600 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                );

            case 'appearance':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-dark-100">Tema</h3>
                        <div className="grid grid-cols-3 gap-4 max-w-md">
                            {[
                                { id: 'dark', label: 'Oscuro', active: true },
                                { id: 'light', label: 'Claro', active: false },
                                { id: 'system', label: 'Sistema', active: false },
                            ].map((theme) => (
                                <button
                                    key={theme.id}
                                    className={`p-4 rounded-xl border-2 transition-all ${theme.active
                                        ? 'border-primary-500 bg-primary-900/20'
                                        : 'border-dark-700 hover:border-dark-600'
                                        }`}
                                >
                                    <div className={`w-full h-16 rounded-lg mb-2 ${theme.id === 'dark' ? 'bg-dark-900' :
                                        theme.id === 'light' ? 'bg-gray-100' :
                                            'bg-gradient-to-r from-dark-900 to-gray-100'
                                        }`} />
                                    <span className="text-sm text-dark-300">{theme.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="pt-6">
                            <h3 className="text-lg font-semibold text-dark-100 mb-4">Sidebar</h3>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-dark-600 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 relative"></div>
                                <span className="text-sm text-dark-300">Colapsar sidebar automáticamente</span>
                            </label>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-dark-800">
                        <SettingsIcon className="w-5 h-5 text-dark-300" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-dark-50">Configuración</h1>
                        <p className="text-sm text-dark-400">Administra tu cuenta y preferencias</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saved ? 'Guardado' : 'Guardar cambios'}
                </button>
            </div>

            {/* Content */}
            <div className="flex gap-6">
                {/* Tabs */}
                <div className="w-48 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeTab === tab.id
                                    ? 'bg-primary-900/30 text-primary-400'
                                    : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="text-sm">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 card">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings;
