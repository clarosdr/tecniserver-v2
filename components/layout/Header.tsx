
import React, { useContext } from 'react';
import { User } from '../../types.ts';
import { AuthContext } from '../../contexts/AuthContext.tsx'; 
import { APP_NAME } from '../../constants.tsx';
import ThemeToggleButton from '../common/ThemeToggleButton.tsx'; 

interface HeaderProps {
  user: User | null;
  onToggleSidebar: () => void;
  notificationCount: number;
  setNotificationCount: React.Dispatch<React.SetStateAction<number>>;
}

const Header: React.FC<HeaderProps> = ({ user, onToggleSidebar, notificationCount, setNotificationCount }) => {
  const auth = useContext(AuthContext);

  const handleNotificationsClick = () => {
    // Here you would typically open a notification dropdown or navigate to a notifications page.
    // For now, let's just clear the count as a simulation.
    setNotificationCount(0);
    alert("Notificaciones vistas (simulado). En una app real, aquí se mostraría un panel de notificaciones.");
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md dark:shadow-slate-700/50 p-4 flex justify-between items-center shrink-0">
      <button 
        onClick={onToggleSidebar} 
        className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-light md:hidden"
        aria-label="Toggle sidebar"
      >
        <MenuIcon className="h-6 w-6" />
      </button>
      <div className="text-xl font-semibold text-slate-700 dark:text-slate-200 hidden md:block">
        Bienvenido a {APP_NAME}
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4">
        <ThemeToggleButton /> 
        <button 
          onClick={handleNotificationsClick}
          className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light relative" 
          aria-label="Notifications"
        >
          <BellIcon className="h-6 w-6" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
        {user && (
          <div className="flex items-center">
            <span className="text-slate-700 dark:text-slate-200 mr-2 hidden sm:inline">{user.username}</span>
            <UserCircleIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
          </div>
        )}
        <button
          onClick={() => auth?.logout()}
          className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary-dark dark:hover:text-primary-light"
          title="Cerrar Sesión"
          aria-label="Cerrar Sesión"
        >
          <LogoutIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);


export default Header;