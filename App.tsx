
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // Updated imports for v6/v7
import Sidebar from './components/layout/Sidebar.tsx';
import Header from './components/layout/Header.tsx';
import PageContainer from './components/layout/PageContainer.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import WorkOrdersPage from './pages/WorkOrdersPage.tsx';
import WorkOrderFormPage from './pages/WorkOrderFormPage.tsx';
import ClientsPage from './pages/ClientsPage.tsx';
import ClientDetailPage from './pages/ClientDetailPage.tsx';
import InventoryPage from './pages/InventoryPage.tsx';
import AccountingPage from './pages/AccountingPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import AppGuidePage from './pages/AppGuidePage.tsx';
import { User, UserRole, NavigationItem, UserCredentials, Client, Permission } from './types.ts';
import { NAVIGATION_ITEMS, CLIENT_PORTAL_NAV_ITEMS, APP_NAME } from './constants.tsx';
import LoginPage from './pages/LoginPage.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthContext, AuthContextType } from './contexts/AuthContext.tsx';
import { authenticateClient, getClients, authenticateInternalUser } from './services/apiService.ts';
import ClientPortalLayout from './components/clientportal/ClientPortalLayout.tsx';

// Client Portal Pages
import ClientPortalDashboardPage from './pages/clientportal/ClientPortalDashboardPage.tsx';
import ClientPortalRequestServicePage from './pages/clientportal/ClientPortalRequestServicePage.tsx';
import ClientPortalHistoryPage from './pages/clientportal/ClientPortalHistoryPage.tsx';
import ClientPortalProfilePage from './pages/clientportal/ClientPortalProfilePage.tsx';
import ClientPortalEquipmentPage from './pages/clientportal/ClientPortalEquipmentPage.tsx';
import ClientPortalWorkOrdersPage from './pages/clientportal/ClientPortalWorkOrdersPage.tsx';


import UserManagementPage from './pages/UserManagementPage.tsx';
import PersonalBudgetPage from './pages/PersonalBudgetPage.tsx';
import ClientPortalManagementPage from './pages/admin/ClientPortalManagementPage.tsx';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPinned, setIsPinned] = useState<boolean>(() => localStorage.getItem('sidebarPinned') === 'true');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const storedPin = localStorage.getItem('sidebarPinned');
    return storedPin === 'true' ? true : window.innerWidth >= 768;
  });
  const [adminNotificationCount, setAdminNotificationCount] = useState(0);
  const [mockAllClients, setMockAllClients] = useState<Client[]>([]);

  useEffect(() => {
      const fetchClientsForAuth = async () => {
          try {
            const clients = await getClients();
            setMockAllClients(clients);
          } catch (error) {
            console.error("Failed to fetch clients for auth simulation:", error);
          }
      };
      fetchClientsForAuth();
  }, []);


  useEffect(() => {
    localStorage.setItem('sidebarPinned', isPinned.toString());
    if (isPinned) setIsSidebarOpen(true);
  }, [isPinned]);

  useEffect(() => {
    const handleResize = () => {
      if (!isPinned) setIsSidebarOpen(window.innerWidth >= 768);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPinned]);

  useEffect(() => {
    const handleNewAdminNotification = (event: Event) => {
      setAdminNotificationCount(prev => prev + 1);
    };
    window.addEventListener('newAdminNotification', handleNewAdminNotification);
    return () => window.removeEventListener('newAdminNotification', handleNewAdminNotification);
  }, []);

  const authContextValue = useMemo((): AuthContextType => ({
    user: currentUser,
    login: async (credentials: UserCredentials) => {
      let authenticatedUser: User | null = null;

      authenticatedUser = await authenticateInternalUser(credentials.identifier, credentials.secret);

      if (authenticatedUser) {
        setCurrentUser(authenticatedUser);
      } else {
        const clientUser = await authenticateClient(credentials.identifier, credentials.secret, mockAllClients);
        if (clientUser) {
          setCurrentUser({
            id: clientUser.id,
            username: clientUser.email,
            role: UserRole.Client,
            name: clientUser.name,
            email: clientUser.email,
            fiscalId: clientUser.fiscalId,
            permissions: [ // Assign default client permissions
                Permission.VIEW_CLIENT_PORTAL_DASHBOARD,
                Permission.VIEW_CLIENT_PORTAL_PROFILE,
                Permission.MANAGE_CLIENT_PORTAL_EQUIPMENT,
                Permission.VIEW_CLIENT_PORTAL_WORK_ORDERS,
                Permission.REQUEST_CLIENT_PORTAL_SERVICE,
                Permission.VIEW_CLIENT_PORTAL_HISTORY,
                Permission.MANAGE_PERSONAL_BUDGET,
                Permission.VIEW_APP_GUIDE,
            ]
          });
        } else {
          throw new Error("Credenciales inválidas. Verifique su usuario/email y contraseña/ID Fiscal.");
        }
      }
      
      if (isPinned) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(window.innerWidth >= 768);
      }
    },
    logout: () => {
      setCurrentUser(null);
      setAdminNotificationCount(0);
    },
  }), [currentUser, isPinned, mockAllClients]);

  const handleToggleSidebar = () => {
    if (isPinned && window.innerWidth >= 768) {
      setIsPinned(false);
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(prev => !prev);
    }
  };

  if (!currentUser) {
    return (
      <ThemeProvider>
        <AuthContext.Provider value={authContextValue}>
          <LoginPage />
        </AuthContext.Provider>
      </ThemeProvider>
    );
  }

  const isInternalUser = currentUser.role !== UserRole.Client;
  
  const accessibleMainRoutes = NAVIGATION_ITEMS.filter(item =>
    !item.isClientPortal && item.requiredPermission && currentUser.permissions?.includes(item.requiredPermission)
  );
  
  const accessibleClientPortalRoutes = CLIENT_PORTAL_NAV_ITEMS.filter(item =>
     item.requiredPermission && currentUser.permissions?.includes(item.requiredPermission) && item.isClientPortal
  );

  const defaultPathForRole = currentUser.role === UserRole.Client
    ? '/client-portal'
    : (accessibleMainRoutes.find(r => r.path === '/' && r.requiredPermission && currentUser.permissions.includes(r.requiredPermission))
        ? '/'
        : (accessibleMainRoutes[0]?.path || '/'));


  const MainAppLayout: React.FC<{children?: React.ReactNode}> = ({ children }) => (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 md:overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
        accessibleRoutes={accessibleMainRoutes}
      />
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <Header user={currentUser} onToggleSidebar={handleToggleSidebar} notificationCount={adminNotificationCount} setNotificationCount={setAdminNotificationCount} />
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
  
  const ClientPortalAppRoutes = () => (
    <ClientPortalLayout navItems={accessibleClientPortalRoutes}>
      <Routes>
        <Route index element={<ClientPortalDashboardPage />} />
        {accessibleClientPortalRoutes.find(r => r.path === '/client-portal/profile') && <Route path="profile" element={<ClientPortalProfilePage />} />}
        {accessibleClientPortalRoutes.find(r => r.path === '/client-portal/equipment') && <Route path="equipment" element={<ClientPortalEquipmentPage />} />}
        {accessibleClientPortalRoutes.find(r => r.path === '/client-portal/work-orders') && <Route path="work-orders" element={<ClientPortalWorkOrdersPage />} />}
        {accessibleClientPortalRoutes.find(r => r.path === '/client-portal/request-service') && <Route path="request-service" element={<ClientPortalRequestServicePage />} />}
        {accessibleClientPortalRoutes.find(r => r.path === '/client-portal/history') && <Route path="history" element={<ClientPortalHistoryPage />} />}
        {/* Shared routes accessible from client portal, ensure paths are relative or correctly prefixed */}
        {currentUser.permissions.includes(Permission.MANAGE_PERSONAL_BUDGET) && <Route path="personal-budget" element={<PersonalBudgetPage />} />}
        {currentUser.permissions.includes(Permission.VIEW_APP_GUIDE) && <Route path="app-guide" element={<AppGuidePage />} />}
        <Route path="*" element={<Navigate to="" replace />} /> {/* Redirect to client portal index for unknown paths */}
      </Routes>
    </ClientPortalLayout>
  );

  const InternalAppRoutes = () => (
    <MainAppLayout>
      <Routes>
        <Route index element={accessibleMainRoutes.find(r => r.path === '/') ? <DashboardPage /> : <Navigate to={defaultPathForRole} replace />} />
        {accessibleMainRoutes.find(r => r.path === '/work-orders') && <Route path="work-orders" element={<WorkOrdersPage />} />}
        {/* Nested routes for work orders if WorkOrdersPage uses <Outlet /> or siblings */}
        {accessibleMainRoutes.find(r => r.path === '/work-orders') && (
          <>
            <Route path="work-orders/new" element={<WorkOrderFormPage />} />
            <Route path="work-orders/edit/:workOrderId" element={<WorkOrderFormPage />} />
          </>
        )}
        {accessibleMainRoutes.find(r => r.path === '/clients') && <Route path="clients" element={<ClientsPage />} />}
        {accessibleMainRoutes.find(r => r.path === '/clients') && <Route path="clients/:clientId" element={<ClientDetailPage />} />}
        {accessibleMainRoutes.find(r => r.path === '/inventory') && <Route path="inventory" element={<InventoryPage />} />}
        {accessibleMainRoutes.find(r => r.path === '/accounting') && <Route path="accounting" element={<AccountingPage />} />}
        {accessibleMainRoutes.find(r => r.path === '/user-management') && <Route path="user-management" element={<UserManagementPage />} />}
        {accessibleMainRoutes.find(r => r.path === '/client-portal-management') && <Route path="client-portal-management" element={<ClientPortalManagementPage />} />}
        {accessibleMainRoutes.find(r => r.path === '/settings') && <Route path="settings" element={<SettingsPage />} />}
        {/* Shared routes accessible from main app */}
        {currentUser.permissions.includes(Permission.MANAGE_PERSONAL_BUDGET) && <Route path="personal-budget" element={<PersonalBudgetPage />} />}
        {currentUser.permissions.includes(Permission.VIEW_APP_GUIDE) && <Route path="app-guide" element={<AppGuidePage />} />}
        <Route path="*" element={<Navigate to={defaultPathForRole} replace />} />
      </Routes>
    </MainAppLayout>
  );

  return (
    <ThemeProvider>
      <AuthContext.Provider value={authContextValue}>
        <HashRouter>
            <Routes>
              {currentUser.role === UserRole.Client ? (
                <Route path="/client-portal/*" element={<ClientPortalAppRoutes />} />
              ) : (
                <Route path="/*" element={<InternalAppRoutes />} />
              )}
               {/* Fallback redirect if user somehow doesn't match roles or if at a non-matching root path */}
               {/* This might need adjustment based on exact desired initial redirect behavior for authenticated users */}
              <Route path="*" element={<Navigate to={defaultPathForRole} replace />} />
            </Routes>
        </HashRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

export default App;
