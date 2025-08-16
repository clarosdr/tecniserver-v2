
import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom'; // Changed useHistory to useNavigate
import { APP_NAME, UserIcon as DefaultUserIcon, WORKSHOP_CONTACT_PHONE, WORKSHOP_CONTACT_EMAIL, EnvelopeIcon } from '../../constants.tsx';
import { AuthContext } from '../../contexts/AuthContext.tsx';
import ThemeToggleButton from '../common/ThemeToggleButton.tsx';
import { NavigationItem } from '../../types.ts';
import Button from '../common/Button.tsx';

interface ClientPortalLayoutProps {
  children?: React.ReactNode; 
  navItems: NavigationItem[];
}

const ClientPortalLayout: React.FC<ClientPortalLayoutProps> = ({ children, navItems }) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate(); // Changed from useHistory

  const handleLogout = () => {
    auth?.logout();
    navigate('/'); // Changed from navigate('/')
  };

  // A simple WhatsApp SVG icon
  const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 14c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.2-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.2.3-.3.1-.1.1-.2 0-.4-.1-.1-.6-1.3-.8-1.8-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3-.6.6-.9 1.3-.9 2.1.1.9.4 1.8 1 2.6.6.8 1.4 1.5 2.3 2.1.9.6 1.9.9 2.9 1.2.3.1.5.1.7.1.3 0 .9-.2 1.2-.5.3-.2.3-.8.2-1zm5.8-10.3C20.7 2 18.6 1 16.3 1 14.1 1 12 1.6 10.2 3S6.9 5.8 6.2 7.7c-.8 2.1-1 4.3-.4 6.5.6 2.2 1.8 4.1 3.6 5.6 1.8 1.5 3.9 2.3 6.1 2.3h.1c2.1 0 4.1-.7 5.8-2.1 1.7-1.4 2.9-3.3 3.4-5.5.5-2.2.2-4.5-.8-6.6zm-4.9 13.7c-1.3 1.1-3 1.8-4.8 1.8h-.1c-1.7 0-3.4-.6-4.8-1.7-1.3-1.1-2.3-2.7-2.8-4.4-.5-1.8-.7-3.6-.3-5.4.4-1.8 1.4-3.5 2.8-4.8 1.4-1.3 3.2-2.1 5.1-2.1s3.7.8 5.1 2.1c1.4 1.3 2.3 3 2.8 4.8.5 1.8.3 3.8-.4 5.6-.5 1.7-1.5 3.3-2.8 4.6z"/>
    </svg>
  );


  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/client-portal" className="flex items-center space-x-2">
            <WrenchScrewdriverIcon className="h-8 w-8 text-primary dark:text-primary-light" />
            <span className="text-xl font-semibold text-slate-700 dark:text-slate-200">{APP_NAME} - Portal Clientes</span>
          </Link>
          <div className="flex items-center space-x-3">
            <ThemeToggleButton />
            {auth?.user && (
              <div className="flex items-center space-x-2">
                <DefaultUserIcon className="h-7 w-7 text-slate-500 dark:text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-200 hidden sm:inline">
                  {auth.user.name || auth.user.username}
                </span>
              </div>
            )}
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-700/50">
              Salir
            </Button>
          </div>
        </div>
        {/* Navigation for client portal */}
        <nav className="bg-slate-50 dark:bg-slate-700/50 border-y border-slate-200 dark:border-slate-700">
            <div className="container mx-auto px-4 py-2 flex space-x-2 sm:space-x-3 overflow-x-auto">
                {navItems.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.path} // Assuming path is relative for client portal, e.g., 'profile' not '/client-portal/profile'
                    end={item.path === '/client-portal'} // `end` prop for exact match on root
                    className={({ isActive }) =>
                    `flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors
                    ${isActive
                        ? 'bg-primary text-white dark:bg-primary-dark dark:text-indigo-100'
                        : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`
                    }
                >
                    <item.icon className="h-5 w-5 mr-1.5 sm:mr-2" />
                    {item.name}
                </NavLink>
                ))}
            </div>
        </nav>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {children} {/* Render child routes here */}
      </main>

      <footer className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs p-6 mt-auto">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
            <div>
                <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Contacto Taller</h5>
                <p>Teléfono: <a href={`tel:${WORKSHOP_CONTACT_PHONE}`} className="hover:underline">{WORKSHOP_CONTACT_PHONE}</a></p>
                <p>Email: <a href={`mailto:${WORKSHOP_CONTACT_EMAIL}`} className="hover:underline">{WORKSHOP_CONTACT_EMAIL}</a></p>
            </div>
            <div>
                <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Horario de Atención</h5>
                <p>Lunes - Viernes: 9:00 AM - 6:00 PM</p>
                <p>Sábados: 9:00 AM - 1:00 PM</p>
            </div>
            <div className="flex flex-col items-center md:items-end">
                <p className="mb-1">&copy; {new Date().getFullYear()} {APP_NAME}</p>
                <div className="flex space-x-3">
                    <a href={`mailto:${WORKSHOP_CONTACT_EMAIL}`} title="Enviar Email" className="hover:text-primary dark:hover:text-primary-light">
                        <EnvelopeIcon className="h-5 w-5"/>
                    </a>
                    <a href={`https://wa.me/${WORKSHOP_CONTACT_PHONE.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="Contactar por WhatsApp" className="hover:text-emerald-500 dark:hover:text-emerald-400">
                        <WhatsAppIcon className="h-5 w-5"/>
                    </a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

const WrenchScrewdriverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.73-.726 1.182-.997l3.216-1.654a.75.75 0 00-.421-1.359l-2.163.318a3.374 3.374 0 00-3.162-3.162l.318-2.162a.75.75 0 00-1.359-.422l-1.654 3.216c-.27.552-.613.965-.997 1.182L5.17 11.42a3.375 3.375 0 00-2.344 2.344l-1.006 3.018s.216.588.588.216l3.018-1.005a3.375 3.375 0 002.344-2.344z" />
  </svg>
);

export default ClientPortalLayout;
