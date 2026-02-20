import React from 'react';
import { Product } from '../types';
import { calculateProductMetrics, formatCurrency } from '../utils';

interface Props {
  products: Product[];
}

const DashboardHeader: React.FC<Props> = ({ products = [] }) => {
  const productsArray = Array.isArray(products) ? products : [];
  
  const stats = productsArray.reduce((acc, p) => {
    const m = calculateProductMetrics(p);
    acc.totalInventoryValue += m.inventoryValue || 0;
    acc.totalPotentialProfit += (m.netProfit || 0) * (p.currentStock || 0);
    if (m.status === 'AGOTADO') acc.outOfStockCount++;
    if (m.status === 'PEDIR') acc.lowStockCount++;
    return acc;
  }, { totalInventoryValue: 0, totalPotentialProfit: 0, outOfStockCount: 0, lowStockCount: 0 });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-4 lg:mb-8">
      <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-3xl shadow-sm border-l-4 border-brand-gray hover:shadow-md transition-shadow">
        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Stock</p>
        <h3 className="text-lg lg:text-2xl font-black text-brand-gray mt-1">{formatCurrency(stats.totalInventoryValue)}</h3>
        <div className="h-1 w-6 lg:w-8 bg-brand-yellow mt-2 lg:mt-3"></div>
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-3xl shadow-sm border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilidad Proy.</p>
        <h3 className="text-lg lg:text-2xl font-black text-emerald-600 mt-1">{formatCurrency(stats.totalPotentialProfit)}</h3>
        <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 mt-1 lg:mt-2 uppercase tracking-tight hidden sm:block">Ganancia neta</p>
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-3xl shadow-sm border-l-4 border-brand-yellow hover:shadow-md transition-shadow">
        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Repo. Pend.</p>
        <h3 className="text-lg lg:text-2xl font-black text-brand-gray mt-1">{stats.lowStockCount}</h3>
        <p className="text-[8px] lg:text-[9px] font-bold text-brand-gray/50 mt-1 lg:mt-2 uppercase tracking-tight hidden sm:block">Bajo mínimo</p>
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-3xl shadow-sm border-l-4 border-rose-500 hover:shadow-md transition-shadow">
        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Crítico</p>
        <h3 className="text-lg lg:text-2xl font-black text-rose-600 mt-1">{stats.outOfStockCount}</h3>
        <p className="text-[8px] lg:text-[9px] font-bold text-rose-400 mt-1 lg:mt-2 uppercase tracking-tight hidden sm:block">Agotados</p>
      </div>
    </div>
  );
};

export default DashboardHeader;