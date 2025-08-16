
import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext.tsx'; 
import { UserCredentials } from '../types.ts';
import Button from '../components/common/Button.tsx';
// Select component is no longer needed here
import Card from '../components/common/Card.tsx'; 
import { APP_NAME } from '../constants.tsx';
import Input from '../components/common/Input.tsx';

const LoginPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [identifier, setIdentifier] = useState(''); // Can be username or email
  const [secret, setSecret] = useState(''); // Can be password or fiscalId
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (auth) {
      setIsLoggingIn(true);
      setLoginError(null);
      if (!identifier || !secret) {
        setLoginError("Por favor, ingrese su usuario/email y contraseña/ID Fiscal.");
        setIsLoggingIn(false);
        return;
      }
      try {
        const credentials: UserCredentials = { identifier, secret };
        await auth.login(credentials);
        // Successful login is handled by App.tsx redirecting
      } catch (error: any) {
        setLoginError(error.message || "Error al iniciar sesión.");
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-indigo-700 dark:from-indigo-800 dark:to-slate-950 flex flex-col justify-center items-center p-4">
      <div className="text-center mb-12">
        <WrenchScrewdriverIcon className="h-20 w-20 text-white dark:text-indigo-300 mx-auto mb-4" />
        <h1 className="text-5xl font-bold text-white dark:text-indigo-100 mb-2">{APP_NAME}</h1>
        <p className="text-xl text-indigo-200 dark:text-indigo-400">Optimiza la Gestión de tu Taller</p>
      </div>
      
      <Card title="Iniciar Sesión" className="w-full max-w-md">
        {loginError && <p className="text-red-500 dark:text-red-400 text-sm text-center mb-3 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{loginError}</p>}
        
        <Input
          label="Usuario o Email"
          type="text" // Changed from email to text to accommodate usernames
          name="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="nombredeusuario o su.email@ejemplo.com"
          required
          containerClassName="mb-4"
        />
        <Input
          label="Contraseña o ID Fiscal"
          type="password" 
          name="secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Su contraseña o ID Fiscal (C.C./NIT)"
          required
          containerClassName="mb-4"
        />
        <p className="text-slate-600 dark:text-slate-300 mb-4 text-xs">
          <strong>Personal interno:</strong> Ingrese su nombre de usuario y contraseña.
          <br/>
          <strong>Clientes:</strong> Ingrese su email y su ID Fiscal (C.C. o NIT) como contraseña.
        </p>
        <Button onClick={handleLogin} variant="primary" size="lg" className="w-full" isLoading={isLoggingIn} disabled={isLoggingIn || !identifier || !secret}>
          Ingresar
        </Button>
      </Card>

      <footer className="mt-12 text-center text-indigo-200 dark:text-indigo-400">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

const WrenchScrewdriverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.73-.726 1.182-.997l3.216-1.654a.75.75 0 00-.421-1.359l-2.163.318a3.374 3.374 0 00-3.162-3.162l.318-2.162a.75.75 0 00-1.359-.422l-1.654 3.216c-.27.552-.613.965-.997 1.182L5.17 11.42a3.375 3.375 0 00-2.344 2.344l-1.006 3.018s.216.588.588.216l3.018-1.005a3.375 3.375 0 002.344-2.344z" />
    </svg>
  );

export default LoginPage;