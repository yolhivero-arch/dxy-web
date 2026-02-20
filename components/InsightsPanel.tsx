import React, { useState } from 'react';
import { Product } from '../types';
import { getBusinessInsights } from '../services/geminiService';

interface Props {
  products: Product[];
}

const InsightsPanel: React.FC<Props> = ({ products }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetInsight = async () => {
    setLoading(true);
    const result = await getBusinessInsights(products);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="bg-brand-gray rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 mb-4 lg:mb-8 text-white shadow-2xl relative overflow-hidden border-b-4 lg:border-b-8 border-brand-yellow">
      <div className="absolute -top-4 -right-4 p-8 opacity-5 hidden lg:block">
        <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
          <div className="p-2 lg:p-3 bg-brand-yellow rounded-xl lg:rounded-2xl">
            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-brand-dark" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
          </div>
          <div>
            <h2 className="text-lg lg:text-2xl font-black uppercase tracking-tight">DXY Intelligence</h2>
            <p className="text-[10px] lg:text-xs font-bold text-brand-yellow/80 uppercase tracking-widest">Análisis IA</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 lg:gap-4 py-4 lg:py-8">
            <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-4 border-brand-yellow border-t-transparent"></div>
            <p className="text-sm lg:text-lg font-bold italic">Calculando estrategias...</p>
          </div>
        ) : insight ? (
          <div className="bg-brand-dark/40 backdrop-blur-md rounded-xl lg:rounded-3xl p-4 lg:p-8 border border-white/5 animate-in slide-in-from-bottom-4 duration-500">
             <div className="prose prose-invert max-w-none text-xs lg:text-sm leading-relaxed mb-4 lg:mb-6 font-medium text-slate-200">
              {insight}
            </div>
            <button 
              onClick={() => setInsight(null)}
              className="px-4 lg:px-6 py-2 bg-brand-yellow text-brand-dark rounded-xl font-black text-[10px] lg:text-xs uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Nuevo Análisis
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
            <p className="text-slate-300 text-xs lg:text-sm max-w-lg font-medium">
              Obtené recomendaciones sobre márgenes, stock crítico y oportunidades de combos.
            </p>
            <button
              onClick={handleGetInsight}
              disabled={products.length === 0}
              className="w-full lg:w-auto px-6 lg:px-10 py-3 lg:py-4 bg-brand-yellow text-brand-dark rounded-xl lg:rounded-2xl font-black uppercase tracking-widest text-xs lg:text-sm hover:scale-105 transition-all shadow-xl shadow-brand-yellow/10 disabled:opacity-50"
            >
              Consultar IA
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;