'use client';

import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<string[]>([
    '[Sistema] Dashboard MCP Criativo iniciado...',
    '[Sistema] Conexão local estabelecida. Aguardando comandos para o macOS, Blender ou Qwen.'
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Mantém a rolagem sempre no final para novas mensagens e logs
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        setLogs((prev) => [...prev, `[Erro] ${data.error}`]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
        
        // Espelha ações de background no painel de logs do sistema
        if (data.response.includes('Comando executado') || data.response.includes('Tarefa delegada')) {
           setLogs((prev) => [...prev, `[Ação Executada] ${new Date().toLocaleTimeString()} - Verifique a resposta da IA para os detalhes da saída.`]);
        }
      }
    } catch (err) {
      setLogs((prev) => [...prev, `[Erro Fatal] Falha de comunicação com o backend Next.js.`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans">
      
      {/* PAINEL ESQUERDO: Chat da IA (Orquestrador) */}
      <div className="flex flex-col w-1/2 border-r border-gray-800">
        <header className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-lg font-semibold tracking-wide text-white">Central MCP: Orquestrador</h1>
          <span className="flex items-center text-xs text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Claude & Qwen Online
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-gray-500 italic mt-10 text-center">
              Como posso ajudar a gerenciar a fábrica hoje? Peça scripts de blocagem, estruturação de repositórios ou automações de áudio.
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
              }`}>
                <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-400 p-4 rounded-xl rounded-tl-none border border-gray-700 animate-pulse text-sm">
                Processando comando na máquina...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-gray-900 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite o comando para o Mac ou para o Blender..."
              className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>

      {/* PAINEL DIREITO: Logs do Sistema (Mac / Blender) */}
      <div className="flex flex-col w-1/2 bg-[#0d1117]">
        <header className="p-4 bg-gray-900 border-b border-gray-800">
          <h2 className="text-lg font-semibold tracking-wide text-white">Console do Sistema</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`p-2 rounded ${
                  log.includes('[Erro]') ? 'text-red-400 bg-red-950/30' :
                  log.includes('[Ação Executada]') ? 'text-green-400 bg-green-950/20' :
                  'text-gray-400'
                }`}
              >
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

    </div>
  );
}