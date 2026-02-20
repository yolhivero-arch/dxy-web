
import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { formatCurrency } from '../utils';

const ExpenseManager: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('dxy_expenses');
    const defaultExpenses = [
      { id: '1', category: 'Alquiler', amount: 0, date: '2024-03' },
      { id: '2', category: 'Luz', amount: 0, date: '2024-03' },
      { id: '3', category: 'Monotributo', amount: 0, date: '2024-03' },
      { id: '4', category: 'Publicidad Meta', amount: 0, date: '2024-03' },
      { id: '5', category: 'Imprenta', amount: 0, date: '2024-03' },
      { id: '6', category: 'Limpieza', amount: 0, date: '2024-03' },
      { id: '7', category: 'Empleada', amount: 0, date: '2024-03' },
      { id: '8', category: 'Otros', amount: 0, date: '2024-03' },
    ];
    if (!saved) return defaultExpenses;
    const loaded = JSON.parse(saved);
    const loadedCategories = loaded.map((e: Expense) => e.category.toLowerCase());
    const missingDefaults = defaultExpenses.filter(d => !loadedCategories.includes(d.category.toLowerCase()));
    return [...loaded, ...missingDefaults];
  });

  useEffect(() => {
    localStorage.setItem('dxy_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const updateExpense = (id: string, amount: number) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, amount } : e));
  };

  const updateCategory = (id: string, category: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, category } : e));
  };

  const addCustomExpense = () => {
    setExpenses([...expenses, { id: crypto.randomUUID(), category: 'Nuevo Gasto', amount: 0, date: new Date().toISOString().slice(0, 7) }]);
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const avgMargin = 0.35;
  const breakEvenSales = totalExpenses / avgMargin;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-8 duration-500">
      <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-200 p-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-2xl font-black text-brand-gray uppercase tracking-tight">Estructura de Costos</h3>
            <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest mt-1">Gestión Mensual Operativa</p>
          </div>
          <button 
            onClick={addCustomExpense}
            className="px-6 py-2.5 bg-brand-gray text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-dark transition-all shadow-lg active:scale-95"
          >
            + Nueva Categoría
          </button>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
          {expenses.map(exp => (
            <div key={exp.id} className="flex items-center justify-between p-5 bg-brand-light rounded-2xl group transition-all hover:bg-white hover:shadow-md border border-transparent hover:border-brand-yellow/30">
              <input 
                type="text"
                value={exp.category}
                onChange={(e) => updateCategory(exp.id, e.target.value)}
                className="font-black text-brand-gray bg-transparent border-none outline-none focus:ring-0 w-1/2 uppercase text-xs tracking-wider"
              />
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-brand-gray/30 font-black">$</span>
                  <input 
                    type="number"
                    value={exp.amount || ''}
                    onChange={(e) => updateExpense(exp.id, parseFloat(e.target.value) || 0)}
                    className="pl-8 pr-4 py-2 bg-white border-2 border-slate-100 rounded-xl w-36 font-black text-brand-gray outline-none focus:border-brand-yellow transition-all"
                    placeholder="0"
                  />
                </div>
                <button 
                  onClick={() => removeExpense(exp.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-brand-gray rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/10 rounded-bl-[4rem] group-hover:bg-brand-yellow/20 transition-all"></div>
          <p className="text-brand-yellow text-[10px] font-black uppercase tracking-[0.2em] mb-2">Costos Fijos Operativos</p>
          <h3 className="text-4xl font-black italic tracking-tighter">{formatCurrency(totalExpenses)}</h3>
          <p className="text-[10px] text-white/50 font-bold uppercase mt-4">Piso de gastos mensuales</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 text-brand-gray shadow-xl border-b-8 border-brand-yellow flex flex-col justify-between h-[300px]">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Punto de Equilibrio (BEP)</p>
            <h3 className="text-4xl font-black italic tracking-tighter text-brand-gray">{formatCurrency(breakEvenSales)}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-4 leading-relaxed uppercase tracking-tight">
              Facturación mínima requerida para cubrir gastos (Márgen 35%).
            </p>
          </div>
          
          <div className="bg-brand-light p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Objetivo Diario</p>
              <p className="text-xl font-black text-brand-gray italic">{formatCurrency(breakEvenSales / 30)}</p>
            </div>
            <div className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-dark" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseManager;
