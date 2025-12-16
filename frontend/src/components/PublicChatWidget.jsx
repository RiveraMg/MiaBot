import { useEffect, useRef, useState } from 'react';
import { chatAPI } from '../services/api';
import { Send, User, Loader2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

const PublicChatWidget = ({ className = '' }) => {
    const companyId = import.meta.env.VITE_COMPANY_ID;

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content:
                '¡Hola! Soy MiaBot, tu asistente virtual.\n\nPuedes consultarme sobre productos, servicios, cotizaciones o soporte.\n\n¿En qué puedo ayudarte hoy?'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        if (!companyId) return;

        const userMessage = input.trim();
        setInput('');

        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await chatAPI.sendExternal(userMessage, { companyId }, sessionId);

            const { message, sessionId: newSessionId, action } = response.data;
            if (newSessionId) setSessionId(newSessionId);

            setMessages((prev) => [...prev, { role: 'assistant', content: message, action }]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
                    isError: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: '¡Nueva conversación iniciada! ¿En qué puedo ayudarte?'
            }
        ]);
        setSessionId(null);
    };

    const suggestedQuestions = [
        '¿Cuáles son sus horarios de atención?',
        '¿Cómo puedo solicitar una cotización?',
        '¿Dónde están ubicados?',
        'Quiero hablar con un asesor'
    ];

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-dark-50">Chat con MiaBot</h2>
                        <p className="text-sm text-dark-400">Asistente virtual</p>
                    </div>
                </div>
                <button onClick={handleNewChat} className="btn-secondary">
                    <RefreshCw className="w-4 h-4" />
                    Nueva conversación
                </button>
            </div>

            {!companyId && (
                <div className="alert-danger mb-4">
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <div>
                        <p className="font-medium">Falta configuración</p>
                        <p className="text-sm">
                            Debes definir <span className="font-mono">VITE_COMPANY_ID</span> en el frontend.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex-1 card overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                    message.role === 'user'
                                        ? 'bg-primary-600'
                                        : message.isError
                                            ? 'bg-red-600'
                                            : 'bg-gradient-to-br from-primary-500 to-primary-700'
                                }`}
                            >
                                {message.role === 'user' ? (
                                    <User className="w-4 h-4 text-white" />
                                ) : message.isError ? (
                                    <AlertCircle className="w-4 h-4 text-white" />
                                ) : (
                                    <img src="/logo.png" alt="MiaBot" className="w-12 h-12 object-contain" />
                                )}
                            </div>

                            <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>
                                <div
                                    className={`inline-block px-4 py-3 rounded-2xl ${
                                        message.role === 'user'
                                            ? 'bg-primary-600 text-white rounded-br-md'
                                            : message.isError
                                                ? 'bg-red-900/30 text-red-300 border border-red-700 rounded-bl-md'
                                                : 'bg-dark-700 text-dark-100 rounded-bl-md'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                                </div>

                                {message.action && (
                                    <p className="text-xs text-primary-400 mt-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Acción ejecutada: {message.action.type}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                <img src="/logo.png" alt="MiaBot" className="w-12 h-12 object-contain" />
                            </div>
                            <div className="bg-dark-700 px-4 py-3 rounded-2xl rounded-bl-md">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                                    <span className="text-sm text-dark-400">Pensando...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {messages.length === 1 && (
                    <div className="px-4 pb-4">
                        <p className="text-xs text-dark-500 mb-2">Sugerencias:</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInput(question)}
                                    className="px-3 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-full transition-colors"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-4 border-t border-dark-700">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe tu mensaje..."
                            className="input flex-1"
                            disabled={loading || !companyId}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim() || !companyId}
                            className="btn-primary px-4"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PublicChatWidget;
