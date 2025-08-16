
import React, { useContext, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { APP_NAME, MapPinOutlineIcon, MapPinSolidIcon } from '../../constants.tsx';
import { NavigationItem, UserRole } from '../../types.ts';
import { AuthContext } from '../../contexts/AuthContext.tsx';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPinned: boolean;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
  accessibleRoutes: NavigationItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isPinned, setIsPinned, accessibleRoutes }) => {
  const auth = useContext(AuthContext);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!isPinned && window.innerWidth >= 768) { // 768px is tailwind's md breakpoint
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned && window.innerWidth >= 768) {
      setIsOpen(false);
    }
  };

  const togglePin = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    if (newPinnedState) {
      setIsOpen(true); // Ensure sidebar is open when pinned
    }
    // If unpinning, mouseLeave will handle collapsing if mouse is outside
  };

  // Close sidebar on mobile when a NavLink is clicked, if not pinned
  const handleNavLinkClick = () => {
    if (window.innerWidth < 768 && isOpen && !isPinned) {
      setIsOpen(false);
    }
    // If pinned, nav link click does not change open state
  };


  return (
    <>
      {/* Backdrop for mobile, only if not pinned and open */}
      {isOpen && !isPinned && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-20 md:hidden"
          aria-hidden="true"
          data-testid="sidebar-backdrop"
        />
      )}
      <div
        ref={sidebarRef}
        className={`
          bg-primary-dark dark:bg-indigo-900 text-white dark:text-indigo-100
          p-3 sm:p-4 flex flex-col h-screen fixed md:static
          transition-transform duration-300 ease-in-out
          md:transition-all // Desktop width transition
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-20'}
          md:translate-x-0
          z-30 md:z-auto
        `}
        aria-label="Barra lateral principal"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center">
            <WrenchScrewdriverIcon className={`h-10 w-10 text-accent shrink-0 ${isOpen ? 'mr-2' : 'mx-auto md:mr-2'} ${!isOpen && 'md:mx-auto'}`} />
            {(isOpen) && <h1 className="text-2xl font-semibold">{APP_NAME}</h1>}
          </div>
          {isOpen && window.innerWidth >= 768 && ( // Show pin button only when sidebar is open and on desktop
            <button
              onClick={togglePin}
              className="p-1 text-indigo-300 hover:text-white dark:text-indigo-400 dark:hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-full"
              title={isPinned ? "Desfijar barra lateral" : "Fijar barra lateral"}
              aria-pressed={isPinned}
            >
              {isPinned ? <MapPinSolidIcon className="h-5 w-5" /> : <MapPinOutlineIcon className="h-5 w-5" />}
            </button>
          )}
        </div>
        <nav className="flex-grow">
          <ul>
            {accessibleRoutes.map((item) => (
              <li key={item.name} className="mb-2">
                <NavLink
                  to={item.path}
                  onClick={handleNavLinkClick}
                  className={({ isActive }) =>
                    `flex items-center py-2 px-3 rounded-lg hover:bg-primary-light dark:hover:bg-indigo-700 transition-colors ${
                      isActive ? 'bg-primary-light dark:bg-indigo-700 font-semibold' : ''
                    } ${(isOpen) ? '' : 'justify-center'}`
                  }
                  title={item.name}
                >
                  <item.icon className={`h-6 w-6 ${(isOpen) ? 'mr-3' : ''} shrink-0`} aria-hidden="true" />
                  {(isOpen) && <span className="truncate">{item.name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto">
          {auth?.user && (isOpen) && (
            <div className="p-2 text-sm text-slate-300 dark:text-indigo-300 border-t border-primary-light dark:border-indigo-700">
              <p>Usuario: {auth.user.username}</p>
              <p>Rol: {auth.user.role}</p>
            </div>
          )}
          <button
            onClick={() => {
              auth?.logout();
              // No automatic sidebar close on logout if pinned, user can manually close or unpin
              if (window.innerWidth < 768 && isOpen && !isPinned) setIsOpen(false);
            }}
            className={`w-full flex items-center py-2 px-3 rounded-lg hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-colors mt-4 ${(isOpen) ? '' : 'justify-center'}`}
            title="Cerrar Sesión"
          >
            <LogoutIcon className={`h-6 w-6 ${(isOpen) ? 'mr-3' : ''} shrink-0`} aria-hidden="true" />
            {(isOpen) && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </>
  );
};


const WrenchScrewdriverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.73-.726 1.182-.997l3.216-1.654a.75.75 0 00-.421-1.359l-2.163.318a3.374 3.374 0 00-3.162-3.162l.318-2.162a.75.75 0 00-1.359-.422l-1.654 3.216c-.27.552-.613.965-.997 1.182L5.17 11.42a3.375 3.375 0 00-2.344 2.344l-1.006 3.018s.216.588.588.216l3.018-1.005a3.375 3.375 0 002.344-2.344z" />
  </svg>
);

const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);


export default Sidebar;
