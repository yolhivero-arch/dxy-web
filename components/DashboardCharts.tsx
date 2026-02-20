import React, { useMemo } from 'react';
import { Product, DailySale } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  products: Product[];
  dailySales: DailySale[];
}

const DashboardCharts: React.FC<Props> = ({ products = [], dailySales = [] }) => {
  
  const salesArray = Array.isArray(dailySales) ? dailySales : [];
  const productsArray = Array.isArray(products) ? products : [];

  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const todaySales = salesArray.filter(s => s.date === today);
    const monthSales = salesArray.filter(s => s.date?.startsWith(thisMonth));
    
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    const monthRevenue = monthSales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    
    const lowStockProducts = productsArray.filter(p => p.currentStock <= p.minStock && p.currentStock > 0);
    const outOfStockProducts = productsArray.filter(p => p.currentStock === 0);
    
    const totalInventoryValue = productsArray.reduce((sum, p) => sum + ((p.providerCost || 0) * (p.currentStock || 0)), 0);
    
    return {
      todaySales: todaySales.length,
      todayRevenue,
      monthSales: monthSales.length,
      monthRevenue,
      lowStock: lowStockProducts.length,
      outOfStock: outOfStockProducts.length,
      totalInventoryValue
    };
  }, [productsArray, salesArray]);

  const last7DaysSales = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const dayName = date.toLocaleDateString('es-AR', { weekday: 'short' });
      
      const daySales = salesArray.filter(s => s.date === dateStr);
      const revenue = daySales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
      
      days.push({
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        date: dateStr.slice(5),
        ventas: daySales.length,
        ingresos: revenue
      });
    }
    return days;
  }, [salesArray]);

  const topProducts = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthSales = salesArray.filter(s => s.date?.startsWith(thisMonth));
    
    const productCount: Record<string, { name: string; count: number; revenue: number }> = {};
    
    monthSales.forEach(sale => {
      const key = sale.productName || 'Desconocido';
      if (!productCount[key]) {
        productCount[key] = { name: key, count: 0, revenue: 0 };
      }
      productCount[key].count += 1;
      productCount[key].revenue += (sale.amountPaid || 0);
    });
    
    return Object.values(productCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [salesArray]);

  const criticalStock = useMemo(() => {
    return productsArray
      .filter(p => p.currentStock <= p.minStock)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 8);
  }, [productsArray]);

  const maxRevenue = Math.max(...last7DaysSales.map(d => d.ingresos), 1);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas Hoy</p>
              <p className="text-xl lg:text-3xl font-black text-brand-gray mt-1">{kpis.todaySales}</p>
              <p className="text-[10px] lg:text-sm font-bold text-emerald-500 mt-1 truncate">{formatCurrency(kpis.todayRevenue)}</p>
            </div>
            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-emerald-100 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 lg:w-7 lg:h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas Mes</p>
              <p className="text-xl lg:text-3xl font-black text-brand-gray mt-1">{kpis.monthSales}</p>
              <p className="text-[10px] lg:text-sm font-bold text-blue-500 mt-1 truncate">{formatCurrency(kpis.monthRevenue)}</p>
            </div>
            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-blue-100 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 lg:w-7 lg:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Bajo</p>
              <p className="text-xl lg:text-3xl font-black text-amber-500 mt-1">{kpis.lowStock}</p>
              <p className="text-[10px] lg:text-sm font-bold text-rose-500 mt-1">{kpis.outOfStock} agotados</p>
            </div>
            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-amber-100 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 lg:w-7 lg:h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventario</p>
              <p className="text-lg lg:text-2xl font-black text-brand-gray mt-1 truncate">{formatCurrency(kpis.totalInventoryValue)}</p>
              <p className="text-[10px] lg:text-sm font-bold text-slate-400 mt-1">costo total</p>
            </div>
            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-brand-yellow/20 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 lg:w-7 lg:h-7 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-slate-200 shadow-sm">
          <h3 className="font-black text-brand-gray uppercase text-xs lg:text-sm tracking-widest mb-4 lg:mb-6">Últimos 7 Días</h3>
          <div className="space-y-2 lg:space-y-3">
            {last7DaysSales.map((day, index) => (
              <div key={index} className="flex items-center gap-2 lg:gap-4">
                <div className="w-8 lg:w-12 text-right flex-shrink-0">
                  <p className="text-[10px] lg:text-xs font-bold text-slate-600">{day.day}</p>
                  <p className="text-[8px] lg:text-[10px] text-slate-400 hidden sm:block">{day.date}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-6 lg:h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-yellow to-amber-400 rounded-lg transition-all duration-500 flex items-center justify-end pr-1 lg:pr-2"
                      style={{ width: `${Math.max((day.ingresos / maxRevenue) * 100, 8)}%` }}
                    >
                      {day.ingresos > 0 && (
                        <span className="text-[8px] lg:text-[10px] font-black text-brand-dark truncate">{formatCurrency(day.ingresos)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-6 lg:w-8 text-center flex-shrink-0">
                  <span className="text-[10px] lg:text-xs font-black text-brand-gray">{day.ventas}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-slate-200 shadow-sm">
          <h3 className="font-black text-brand-gray uppercase text-xs lg:text-sm tracking-widest mb-4 lg:mb-6">Top Productos</h3>
          {topProducts.length === 0 ? (
            <div className="text-center py-6 lg:py-10 text-slate-400">
              <p className="text-xs lg:text-sm">No hay ventas este mes</p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-2 lg:gap-4">
                  <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center font-black text-xs lg:text-sm flex-shrink-0 ${
                    index === 0 ? 'bg-brand-yellow text-brand-dark' :
                    index === 1 ? 'bg-slate-200 text-slate-600' :
                    index === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs lg:text-sm text-brand-gray truncate">{product.name}</p>
                    <p className="text-[9px] lg:text-[10px] text-slate-400 truncate">{formatCurrency(product.revenue)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] lg:text-xs font-black">
                      {product.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-slate-200 shadow-sm">
        <h3 className="font-black text-brand-gray uppercase text-xs lg:text-sm tracking-widest mb-4 lg:mb-6">
          Stock Crítico
          <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-[9px] lg:text-[10px]">
            {criticalStock.length}
          </span>
        </h3>
        {criticalStock.length === 0 ? (
          <div className="text-center py-4 lg:py-6 text-emerald-500">
            <svg className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold text-xs lg:text-sm">¡Stock OK!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
            {criticalStock.map(product => (
              <div 
                key={product.id} 
                className={`p-2 lg:p-4 rounded-lg lg:rounded-xl ${product.currentStock === 0 ? 'bg-rose-50 border-2 border-rose-200' : 'bg-amber-50 border-2 border-amber-200'}`}
              >
                <p className="font-bold text-[10px] lg:text-xs text-slate-700 truncate">{product.name}</p>
                <p className="text-[9px] lg:text-[10px] text-slate-400 truncate">{product.brand}</p>
                <div className="flex items-center justify-between mt-1 lg:mt-2">
                  <span className={`text-lg lg:text-2xl font-black ${product.currentStock === 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                    {product.currentStock}
                  </span>
                  <span className={`text-[8px] lg:text-[9px] font-bold uppercase px-1.5 lg:px-2 py-0.5 rounded ${
                    product.currentStock === 0 ? 'bg-rose-200 text-rose-700' : 'bg-amber-200 text-amber-700'
                  }`}>
                    {product.currentStock === 0 ? 'AGOTADO' : 'BAJO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;