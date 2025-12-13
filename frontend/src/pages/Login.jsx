import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Validation states
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [shakeError, setShakeError] = useState(false);

    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Validación de email corporativo
    const validateEmail = (value) => {
        if (!value) {
            return 'El correo electrónico es requerido';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Ingresa un correo electrónico válido';
        }
        return '';
    };

    // Validación de contraseña
    const validatePassword = (value) => {
        if (!value) {
            return 'La contraseña es requerida';
        }
        if (value.length < 8) {
            return 'La contraseña debe tener al menos 8 caracteres';
        }
        return '';
    };

    // Validar email en tiempo real
    useEffect(() => {
        if (emailTouched) {
            setEmailError(validateEmail(email));
        }
    }, [email, emailTouched]);

    // Validar contraseña en tiempo real
    useEffect(() => {
        if (passwordTouched) {
            setPasswordError(validatePassword(password));
        }
    }, [password, passwordTouched]);

    const handleEmailBlur = () => {
        setEmailTouched(true);
        setEmailError(validateEmail(email));
    };

    const handlePasswordBlur = () => {
        setPasswordTouched(true);
        setPasswordError(validatePassword(password));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validar todos los campos
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);
        
        setEmailError(emailValidation);
        setPasswordError(passwordValidation);
        setEmailTouched(true);
        setPasswordTouched(true);

        // Si hay errores, no continuar
        if (emailValidation || passwordValidation) {
            setShakeError(true);
            setTimeout(() => setShakeError(false), 500);
            return;
        }

        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.');
            setShakeError(true);
            setTimeout(() => setShakeError(false), 500);
        } finally {
            setLoading(false);
        }
    };

    // Determinar si el formulario es válido
    const isFormValid = email && password && !emailError && !passwordError;

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-900 to-dark-950" />

            {/* Login Card */}
            <div className="relative w-full max-w-md">
                <div className="card border-dark-700 shadow-2xl">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-lg shadow-primary-500/25">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-dark-50">MiaBot</h1>
                        <p className="text-dark-400 mt-1 text-sm">Plataforma de Gestión Empresarial</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={`alert-danger mb-6 animate-fade-in ${shakeError ? 'animate-shake' : ''}`}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="field-wrapper">
                            <label htmlFor="email" className="label">
                                Correo electrónico corporativo
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={handleEmailBlur}
                                className={`input transition-all ${
                                    emailTouched && emailError 
                                        ? 'input-error' 
                                        : emailTouched && !emailError && email 
                                        ? 'input-success' 
                                        : ''
                                }`}
                                placeholder="ejemplo@empresa.com"
                                autoComplete="email"
                                autoFocus
                            />
                            {emailTouched && emailError && (
                                <div className="error-message animate-fade-in">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{emailError}</span>
                                </div>
                            )}
                            {emailTouched && !emailError && email && (
                                <div className="success-message animate-fade-in">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Correo válido</span>
                                </div>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="field-wrapper">
                            <label htmlFor="password" className="label">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={handlePasswordBlur}
                                    className={`input pr-12 transition-all ${
                                        passwordTouched && passwordError 
                                            ? 'input-error' 
                                            : passwordTouched && !passwordError && password 
                                            ? 'input-success' 
                                            : ''
                                    }`}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {passwordTouched && passwordError && (
                                <div className="error-message animate-fade-in">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{passwordError}</span>
                                </div>
                            )}
                            {passwordTouched && !passwordError && password && (
                                <div className="success-message animate-fade-in">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Contraseña válida</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className="btn-primary w-full transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-dark-700 text-center">
                        <p className="text-sm text-dark-500">
                            Acceso exclusivo para empleados
                        </p>
                    </div>
                </div>

                {/* Help text */}
                <p className="text-center text-dark-500 text-sm mt-6">
                    ¿Problemas para acceder? Contacta a tu administrador
                </p>
            </div>
        </div>
    );
};

export default Login;
