import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator as CalculatorIcon, 
  Sparkles, 
  History as HistoryIcon, 
  Delete, 
  X, 
  ChevronRight,
  MessageSquare,
  Send,
  RotateCcw
} from 'lucide-react';
import { cn } from './lib/utils';
import { solveMathProblem } from './services/geminiService';

// --- Types ---
interface CalculationHistory {
  expression: string;
  result: string;
  timestamp: Date;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  className, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: 'default' | 'accent' | 'operator' | 'function' | 'ai';
}) => {
  const variants = {
    default: 'bg-[#2a2b2e] hover:bg-[#3a3b3e] text-white',
    accent: 'bg-blue-600 hover:bg-blue-500 text-white',
    operator: 'bg-[#3a3b3e] hover:bg-[#4a4b4e] text-blue-400',
    function: 'bg-[#1a1b1e] hover:bg-[#2a2b2e] text-calculator-muted text-sm',
    ai: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-blue-500/20',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'h-12 md:h-14 rounded-xl font-medium transition-colors flex items-center justify-center',
        variants[variant],
        className
      )}
    >
      {children}
    </motion.button>
  );
};

export default function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleNumber = (num: string) => {
    let val = num;
    if (num === 'pi') val = 'pi';
    if (num === 'e') val = 'e';

    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleOperator = (op: string) => {
    setExpression(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleFunction = (fn: string) => {
    try {
      let result;
      if (fn === 'sqrt') result = math.sqrt(parseFloat(display));
      else if (fn === 'sin') result = math.sin(math.unit(parseFloat(display), 'deg'));
      else if (fn === 'cos') result = math.cos(math.unit(parseFloat(display), 'deg'));
      else if (fn === 'tan') result = math.tan(math.unit(parseFloat(display), 'deg'));
      else if (fn === 'log') result = math.log10(parseFloat(display));
      else if (fn === 'ln') result = math.log(parseFloat(display));
      else if (fn === 'exp') result = math.exp(parseFloat(display));
      else if (fn === 'pow2') result = math.pow(parseFloat(display), 2);
      else if (fn === 'pow3') result = math.pow(parseFloat(display), 3);
      else if (fn === 'fact') result = math.factorial(parseFloat(display));
      
      const resultStr = result?.toString() || '0';
      setDisplay(resultStr);
      setHistory([{
        expression: `${fn}(${display})`,
        result: resultStr,
        timestamp: new Date()
      }, ...history.slice(0, 19)]);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const calculate = () => {
    try {
      const fullExpression = expression + display;
      const result = math.evaluate(fullExpression);
      const resultStr = result.toString();
      
      setHistory([{
        expression: fullExpression,
        result: resultStr,
        timestamp: new Date()
      }, ...history.slice(0, 19)]);
      
      setDisplay(resultStr);
      setExpression('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleAiSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiLoading(true);

    try {
      const response = await solveMathProblem(userMsg);
      setAiMessages(prev => [...prev, { role: 'ai', content: response || 'Sorry, I couldn\'t solve that.' }]);
    } catch (error: any) {
      const errorMessage = error.message.includes("API_KEY_MISSING") 
        ? "⚠️ Gemini API Key is missing. Please configure it in your environment variables."
        : "❌ Error connecting to AI service. Please try again later.";
      setAiMessages(prev => [...prev, { role: 'ai', content: errorMessage }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        
        {/* Main Calculator Card */}
        <div className="bg-calculator-bg rounded-[32px] shadow-2xl overflow-hidden border border-white/5 flex flex-col">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-bottom border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                <CalculatorIcon size={20} />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">Scientific</h1>
                <p className="text-xs text-calculator-muted uppercase tracking-widest">Precision Tool v2.5</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsAiOpen(!isAiOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isAiOpen ? "bg-blue-600 text-white" : "bg-white/5 text-calculator-muted hover:text-white"
                )}
              >
                <Sparkles size={20} />
              </button>
            </div>
          </div>

          {/* Display Area */}
          <div className="p-8 bg-calculator-display flex flex-col items-end justify-end min-h-[160px] relative">
            <div className="absolute top-4 left-8 text-xs font-mono text-calculator-muted uppercase tracking-widest">
              Output Terminal
            </div>
            <div className="text-calculator-muted font-mono text-sm mb-2 h-6 overflow-hidden text-right w-full">
              {expression}
            </div>
            <div className="text-5xl md:text-6xl font-mono font-medium tracking-tighter break-all text-right w-full">
              {display}
            </div>
          </div>

          {/* Keypad */}
          <div className="p-4 md:p-6 grid grid-cols-4 gap-2 md:gap-3">
            {/* Scientific Row 1 */}
            <Button variant="function" onClick={() => handleFunction('sin')}>sin</Button>
            <Button variant="function" onClick={() => handleFunction('cos')}>cos</Button>
            <Button variant="function" onClick={() => handleFunction('tan')}>tan</Button>
            <Button variant="function" onClick={() => handleFunction('log')}>log</Button>
            
            {/* Scientific Row 2 */}
            <Button variant="function" onClick={() => handleFunction('ln')}>ln</Button>
            <Button variant="function" onClick={() => handleFunction('sqrt')}>√</Button>
            <Button variant="function" onClick={() => handleFunction('pow2')}>x²</Button>
            <Button variant="function" onClick={() => handleFunction('pow3')}>x³</Button>

            {/* Scientific Row 3 */}
            <Button variant="function" onClick={() => handleFunction('exp')}>exp</Button>
            <Button variant="function" onClick={() => handleFunction('fact')}>n!</Button>
            <Button variant="function" onClick={() => handleNumber('pi')}>π</Button>
            <Button variant="function" onClick={() => handleNumber('e')}>e</Button>

            {/* Scientific Row 4 */}
            <Button variant="function" onClick={() => handleNumber('(')}>(</Button>
            <Button variant="function" onClick={() => handleNumber(')')}>)</Button>
            <Button variant="function" onClick={() => handleOperator('^')}>^</Button>
            <Button variant="operator" onClick={() => handleOperator('%')}>%</Button>

            {/* Main Keypad - Row 1 */}
            <Button variant="operator" onClick={clear} className="text-red-400">AC</Button>
            <Button variant="operator" onClick={backspace}><Delete size={20} /></Button>
            <Button variant="operator" onClick={() => handleOperator('/')}>÷</Button>
            <Button variant="operator" onClick={() => handleOperator('*')}>×</Button>

            {/* Main Keypad - Row 2 */}
            <Button onClick={() => handleNumber('7')} className="text-xl">7</Button>
            <Button onClick={() => handleNumber('8')} className="text-xl">8</Button>
            <Button onClick={() => handleNumber('9')} className="text-xl">9</Button>
            <Button variant="operator" onClick={() => handleOperator('-')}>−</Button>

            {/* Main Keypad - Row 3 */}
            <Button onClick={() => handleNumber('4')} className="text-xl">4</Button>
            <Button onClick={() => handleNumber('5')} className="text-xl">5</Button>
            <Button onClick={() => handleNumber('6')} className="text-xl">6</Button>
            <Button variant="operator" onClick={() => handleOperator('+')}>+</Button>

            {/* Main Keypad - Row 4 */}
            <Button onClick={() => handleNumber('1')} className="text-xl">1</Button>
            <Button onClick={() => handleNumber('2')} className="text-xl">2</Button>
            <Button onClick={() => handleNumber('3')} className="text-xl">3</Button>
            <Button variant="accent" onClick={calculate} className="row-span-2 h-full text-2xl">=</Button>

            {/* Main Keypad - Row 5 */}
            <Button onClick={() => handleNumber('0')} className="col-span-2 text-xl">0</Button>
            <Button onClick={() => handleNumber('.')} className="text-xl">.</Button>
          </div>
        </div>

        {/* Side Panel (AI & History) */}
        <div className="flex flex-col gap-6">
          {/* AI Assistant Panel */}
          <AnimatePresence>
            {isAiOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-calculator-bg rounded-[32px] border border-white/5 flex flex-col h-[500px] shadow-2xl"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-500" />
                    <span className="font-semibold text-sm">AI Math Expert</span>
                  </div>
                  <button onClick={() => setIsAiOpen(false)} className="text-calculator-muted hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {aiMessages.length === 0 && (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageSquare size={20} className="text-blue-500" />
                      </div>
                      <p className="text-sm text-calculator-muted">Ask me to solve complex equations or explain math concepts.</p>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-sm",
                      msg.role === 'user' 
                        ? "bg-blue-600 text-white ml-auto rounded-tr-none" 
                        : "bg-white/5 text-calculator-text mr-auto rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="bg-white/5 text-calculator-text mr-auto rounded-2xl rounded-tl-none p-3 max-w-[85%] flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleAiSubmit} className="p-4 border-t border-white/5">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ask AI..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={isAiLoading || !aiInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 disabled:text-calculator-muted"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Panel */}
          <div className="bg-calculator-bg rounded-[32px] border border-white/5 flex flex-col flex-1 min-h-[300px] shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon size={16} className="text-calculator-muted" />
                <span className="font-semibold text-sm">History</span>
              </div>
              <button 
                onClick={() => setHistory([])}
                className="text-xs text-calculator-muted hover:text-white flex items-center gap-1"
              >
                <RotateCcw size={12} /> Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-10 text-calculator-muted text-sm italic">
                  No calculations yet
                </div>
              ) : (
                history.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="group cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-colors"
                    onClick={() => {
                      setDisplay(item.result);
                      setExpression('');
                    }}
                  >
                    <div className="text-xs text-calculator-muted mb-1 flex justify-between">
                      <span>{item.expression}</span>
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="font-mono text-lg text-white">= {item.result}</div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
