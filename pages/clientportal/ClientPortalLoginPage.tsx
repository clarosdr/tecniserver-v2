
import React from 'react';
import Card from '../../components/common/Card.tsx';
import Button from '../../components/common/Button.tsx';
import Input from '../../components/common/Input.tsx';
import { APP_NAME } from '../../constants.tsx';
import { Link } from 'react-router-dom';

const ClientPortalLoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-blue-600 dark:from-sky-800 dark:to-blue-900 flex flex-col justify-center items-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Portal de Clientes de {APP_NAME}</h1>
        <p className="text-lg text-blue-100 dark:text-blue-300">Accede para gestionar tus servicios y equipos.</p>
      </div>

      <Card title="Iniciar Sesión Cliente" className="w-full max-w-md">
        <form className="space-y-4">
          <Input name="email" type="email" label="Correo Electrónico" placeholder="tu@email.com" required />
          <Input name="password" type="password" label="Contraseña" placeholder="Tu contraseña" required />
          <Button type="submit" variant="primary" className="w-full mt-2">Ingresar</Button>
        </form>
        <div className="mt-4 text-sm text-center">
          <Link to="#" className="font-medium text-primary hover:text-primary-light dark:text-primary-light dark:hover:text-primary">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="mt-2 text-sm text-center text-slate-600 dark:text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link to="#" className="font-medium text-primary hover:text-primary-light dark:text-primary-light dark:hover:text-primary">
            Regístrate aquí
          </Link>
        </div>
      </Card>
      <footer className="mt-10 text-center text-blue-200 dark:text-blue-400 text-sm">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Acceso exclusivo para clientes.</p>
      </footer>
    </div>
  );
};

export default ClientPortalLoginPage;
