import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAppSetting } from '../utils/storage';
import { MaintenancePage } from '../pages/MaintenancePage';
import { useLocation } from 'react-router-dom';

export function MaintenanceGuard({ children }) {
    const { isSuperAdmin, isAdmin } = useAuth(); // Dependendo de como a regra de negocio funciona, pode ser só isSuperAdmin
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const maintenanceSetting = await getAppSetting('maintenance_mode');
                setIsMaintenance(maintenanceSetting === 'true' || maintenanceSetting === true);
            } catch (error) {
                console.error("Error checking maintenance mode", error);
            } finally {
                setLoading(false);
            }
        };

        checkMaintenance();
        
        // Polling a cada 3 minutos para atualizar caso liguem/desliguem enquanto o app tá aberto
        const interval = setInterval(checkMaintenance, 3 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">Carregando...</div>;
    }

    // Rotas liberadas mesmo em manutenção (Login, Atualizar Senha, Confirmar Email)
    const bypassPaths = ['/login', '/update-password', '/confirm-email'];
    const isBypassPath = bypassPaths.some(path => location.pathname.startsWith(path));

    // Se estiver em manutenção e NÃO for uma rota de bypass e NÃO for super_admin
    if (isMaintenance && !isBypassPath && !isSuperAdmin) {
        return <MaintenancePage />;
    }

    return children;
}
