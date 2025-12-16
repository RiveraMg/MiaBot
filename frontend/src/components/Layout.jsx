import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Bell, Search, Menu } from 'lucide-react';

const Layout = () => {
    const { user } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-dark-950">
            {/* Sidebar */}
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 bg-dark-900/80 backdrop-blur-lg border-b border-dark-800">
                    <div className="flex items-center justify-between h-full px-6">
                        {/* Search */}
                        <div className="flex-1 max-w-xl">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <button className="relative p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-dark-200 transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* User */}
                            <div className="flex items-center gap-3 pl-4 border-l border-dark-700">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-dark-100">{user?.name}</p>
                                    <p className="text-xs text-dark-500">
                                        {user?.department || user?.role}
                                    </p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-medium">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
