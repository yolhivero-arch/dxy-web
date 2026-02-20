import React, { useState, useMemo, useEffect } from 'react';
import { DailySale, PaymentMethod } from '../types';
import { formatCurrency, exportElementAsPDF } from '../utils';
import { analyzeSalesImage, getSalesInsights } from '../services/geminiService';
import { useToast } from './Toast';

interface Props {
  dailySales: DailySale[];
  onRegisterSale: (sales: DailySale[], deductStock: boolean) => void;
  onUpdateSale: (updatedSale: DailySale) => void;
  onDeleteSale: (saleId: string) => void;
}

const SalesManager: React.FC<Props> = ({ dailySales = [], onRegisterSale, onUpdateSale, onDeleteSale }) => {
    const { showToast } = useToast();
    const today = new Date().toISOString().slice(0, 10);
    const AUTOMATIC_STOCK_DEDUCT_DATE = '2026-03-01';
    const [editingSale, setEditingSale] = useState<DailySale | null>(null);
    const [newSale, setNewSale] = useState<Omit<DailySale, 'id'>>({
        date: today,
        productName: '',
        channel: 'Física',
        paymentMethod: 'Efectivo',
        totalAmount: 0,
        amountPaid: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [query, setQuery] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        if (editingSale) {
            const { id, ...saleData } = editingSale;
            setNewSale(saleData);
        }
    }, [editingSale]);

    const resetForm = () => {
        setEditingSale(null);
        setNewSale({
            date: today,
            productName: '',
            channel: 'Física',
            paymentMethod: 'Efectivo',
            totalAmount: 0,
            amountPaid: 0,
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const numericValue = type === 'number' ? parseFloat(value) || 0 : value;
        setNewSale(prev => {
            const updated = { ...prev, [name]: numericValue };
            if (name === 'totalAmount') {
                updated.amountPaid = numericValue as number;
            }
            return updated;
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newSale.productName || newSale.totalAmount <= 0) {
            showToast('Complete el producto y monto total', 'warning');
            return;
        }
        
        if (editingSale) {
            onUpdateSale({ ...newSale, id: editingSale.id });
            showToast('Venta actualizada', 'success');
        } else {
            const saleToRegister: DailySale = { ...newSale, id: crypto.randomUUID() };
            
            let deductStock = false;
            if (newSale.date >= AUTOMATIC_STOCK_DEDUCT_DATE) {
                deductStock = true;
            } else {
                deductStock = window.confirm("¿Deseas descontar 1 unidad de este producto del stock?");
            }

            onRegisterSale([saleToRegister], deductStock);
            showToast('Venta registrada', 'success');
        }
        
        resetForm();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const extractedSales = await analyzeSalesImage(base64);
          if (extractedSales && extractedSales.length > 0) {
            const newSales: DailySale[] = extractedSales.map((s: any) => ({
              ...s,
              id: crypto.randomUUID(),
            }));
            
            const firstSaleDate = newSales[0]?.date;
            let deductStock = false;
            if (firstSaleDate && firstSaleDate >= AUTOMATIC_STOCK_DEDUCT_DATE) {
                deductStock = true;
                showToast(`${newSales.length} ventas detectadas. Stock descontado.`, 'success');
            } else {
                deductStock = window.confirm(`Se detectaron ${newSales.length} ventas. ¿Descontar del stock?`);
            }
            onRegisterSale(newSales, deductStock);
          } else {
            showToast('No se pudieron extraer ventas de la imagen', 'error');
          }
          setIsLoading(false);
        };
    };
    
    const handleQuery = async () => {
        if (!query) return;
        setIsAnalyzing(true);
        const result = await getSalesInsights(dailySales, query);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    const salesArray = Array.isArray(dailySales) ? dailySales : [];

    const filteredSales = useMemo(() => {
        if (!selectedMonth) return salesArray;
        return salesArray.filter(sale => sale.date?.startsWith(selectedMonth));
    }, [salesArray, selectedMonth]);

    const totals = useMemo(() => {
        if (!filteredSales || filteredSales.length === 0) {
            return { month: 0, pending: 0 };
        }
        return filteredSales.reduce((acc, sale) => {
            acc.month += sale.amountPaid || 0;
            if ((sale.totalAmount || 0) > (sale.amountPaid || 0)) {
                acc.pending += (sale.totalAmount || 0) - (sale.amountPaid || 0);
            }
            return acc;
        }, { month: 0, pending: 0 });
    }, [filteredSales]);

    const paymentMethodDistribution = useMemo(() => {
        if (!filteredSales || filteredSales.length === 0) {
            return [];
        }
        const distribution = filteredSales.reduce((acc, sale) => {
            const method = sale.paymentMethod || 'Otro';
            acc[method] = (acc[method] || 0) + (sale.amountPaid || 0);
            return acc;
        }, {} as Record<string, number>);
        
        const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
        
        return Object.entries(distribution).map(([method, amount]) => ({
            method,
            amount,
            percentage: total > 0 ? (amount / total) * 100 : 0
        }));
    }, [filteredSales]);

    const pieChartStyle = useMemo(() => {
        if (!paymentMethodDistribution || paymentMethodDistribution.length === 0) {
            return { background: '#e5e5e5' };
        }
        const gradient = paymentMethodDistribution.reduce((acc, item, index, arr) => {
            const start = index === 0 ? 0 : arr.slice(0, index).reduce((sum, i) => sum + i.percentage, 0);
            const end = start + item.percentage;
            const colors = ['#F9D85A', '#575756', '#333333', '#f4f4f4', '#a3a3a3', '#d4d4d4', '#e5e5e5'];
            return `${acc}, ${colors[index % colors.length]} ${start}% ${end}%`;
        }, '');
        return { background: `conic-gradient(${gradient})` };
    }, [paymentMethodDistribution]);

    const sortedSales = useMemo(() => {
        return [...salesArray].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }, [salesArray]);

    return (
        <div className="space-y-4 lg:space-y-8 animate-in fade-in duration-500">
            {/* Form and OCR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-8">
                <form onSubmit={handleSubmit} className="glass-card bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-200 p-4 lg:p-8 space-y-3">
                    <h3 className="font-black text-brand-gray uppercase text-[11px] lg:text-sm tracking-widest">{editingSale ? 'Editar Venta' : 'Registrar Venta'}</h3>
                    <div className="grid grid-cols-2 gap-2 lg:gap-4">
                        <input type="date" name="date" value={newSale.date} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm" />
                        <input type="text" name="productName" value={newSale.productName} onChange={handleInputChange} placeholder="Producto" className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:gap-4">
                        <select name="channel" value={newSale.channel} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray uppercase text-xs lg:text-sm">
                            <option>Física</option><option>Online</option>
                        </select>
                        <select name="paymentMethod" value={newSale.paymentMethod} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray uppercase text-[10px] lg:text-sm">
                            <option>Efectivo</option><option>Transferencia</option><option>Tarjeta Crédito</option><option>Débito</option><option>Bancor</option><option>Carta Personal</option><option>Canje/Servicio</option>
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-2 lg:gap-4">
                        <input type="number" name="totalAmount" value={newSale.totalAmount || ''} onChange={handleInputChange} placeholder="Monto Total" className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm" />
                        <input type="number" name="amountPaid" value={newSale.amountPaid || ''} onChange={handleInputChange} placeholder="Pagado" className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 py-2.5 bg-brand-yellow text-brand-dark rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all text-xs lg:text-sm">{editingSale ? 'Actualizar' : 'Registrar'}</button>
                        {editingSale && (
                            <button type="button" onClick={resetForm} className="px-4 py-2.5 bg-slate-200 text-brand-dark rounded-xl font-black uppercase hover:bg-slate-300 transition-all text-xs lg:text-sm">✕</button>
                        )}
                    </div>
                </form>
                
                <div className="glass-dark bg-brand-gray text-white rounded-2xl lg:rounded-[2rem] shadow-xl border-b-4 lg:border-b-8 border-brand-yellow p-5 lg:p-8 flex flex-col justify-center items-center text-center">
                    <h3 className="text-lg lg:text-2xl font-black uppercase tracking-tight">DXY Vision</h3>
                    <p className="text-brand-yellow/80 text-[9px] lg:text-xs font-bold uppercase tracking-widest mt-1 mb-3 lg:mb-4">Carga desde Cuaderno</p>
                    <label className="inline-flex items-center px-4 lg:px-6 py-2.5 lg:py-3 bg-brand-yellow text-brand-dark rounded-xl font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-lg text-xs lg:text-sm">
                        <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {isLoading ? '...' : 'Escanear'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isLoading} />
                    </label>
                </div>
            </div>

             {/* Daily Log Table */}
            <div className="bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 lg:p-6 border-b border-slate-200">
                    <h3 className="font-black text-brand-gray uppercase text-[11px] lg:text-sm tracking-widest">Libro de Caja</h3>
                </div>
                <div className="overflow-x-auto max-h-[350px] lg:max-h-[400px]">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="sticky top-0 bg-slate-100/95 text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <tr>
                                <th className="px-2 lg:px-6 py-2.5 lg:py-3">Fecha</th>
                                <th className="px-2 lg:px-4 py-2.5 lg:py-3">Producto</th>
                                <th className="px-2 lg:px-4 py-2.5 lg:py-3 hidden sm:table-cell">Canal</th>
                                <th className="px-2 lg:px-4 py-2.5 lg:py-3">Pago</th>
                                <th className="px-2 lg:px-4 py-2.5 lg:py-3 text-right">Pagado</th>
                                <th className="px-2 lg:px-4 py-2.5 lg:py-3 text-right">Pend.</th>
                                <th className="px-2 lg:px-6 py-2.5 lg:py-3 text-right">Acc.</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedSales.map(sale => (
                                <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-2 lg:px-6 py-2.5 lg:py-4 text-[10px] lg:text-xs font-bold">{(sale.date || '').slice(5)}</td>
                                    <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-[10px] lg:text-sm font-bold uppercase max-w-[100px] lg:max-w-none truncate">{sale.productName}</td>
                                    <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-[10px] lg:text-xs font-medium uppercase hidden sm:table-cell">{sale.channel}</td>
                                    <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-[9px] lg:text-xs font-medium uppercase">{(sale.paymentMethod || '').slice(0,6)}</td>
                                    <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-right font-black text-emerald-600 text-[10px] lg:text-sm">{formatCurrency(sale.amountPaid || 0)}</td>
                                    <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-right font-bold text-rose-600 text-[10px] lg:text-sm">{(sale.totalAmount || 0) - (sale.amountPaid || 0) > 0 ? formatCurrency((sale.totalAmount || 0) - (sale.amountPaid || 0)) : '-'}</td>
                                    <td className="px-2 lg:px-6 py-2.5 lg:py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => setEditingSale(sale)} className="p-1 lg:p-2 text-slate-400 hover:text-brand-gray">
                                                <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => onDeleteSale(sale.id)} className="p-1 lg:p-2 text-slate-400 hover:text-rose-600">
                                                <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* BI and Reporting */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-200 p-4 lg:p-8">
                    <h3 className="font-black text-brand-gray uppercase text-[11px] lg:text-sm tracking-widest mb-3 lg:mb-4">DXY Intelligence</h3>
                    <div className="flex gap-2 mb-3">
                        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ej: ¿Cuánto vendí en Enero?" className="flex-1 px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm" />
                        <button onClick={handleQuery} disabled={isAnalyzing} className="px-4 py-2.5 bg-brand-dark text-white rounded-xl font-black uppercase text-[10px] lg:text-xs tracking-widest hover:brightness-125 transition-all">
                            {isAnalyzing ? '...' : 'OK'}
                        </button>
                    </div>
                    {analysis && <div className="prose prose-sm max-w-none p-3 bg-brand-light rounded-lg text-xs lg:text-sm" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}></div>}
                </div>
                 <div id="summaryReport" className="glass-card bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-200 p-4 lg:p-8">
                    <div className="flex justify-between items-center gap-2 mb-3 lg:mb-4">
                        <h3 className="font-black text-brand-gray uppercase text-[10px] lg:text-sm tracking-widest">Resumen</h3>
                        <div className="flex items-center gap-1 lg:gap-2">
                           <input 
                                type="month" 
                                value={selectedMonth} 
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="print-hidden bg-brand-light border-2 border-slate-200 rounded-lg text-[10px] lg:text-xs font-bold px-2 py-1 outline-none focus:border-brand-yellow w-28 lg:w-auto"
                            />
                            <button onClick={() => exportElementAsPDF('summaryReport', `Resumen_${selectedMonth}.pdf`)} className="print-hidden bg-brand-dark text-white px-2 lg:px-3 py-1 rounded-lg text-[8px] lg:text-[9px] font-black uppercase">PDF</button>
                        </div>
                    </div>
                     <div style={pieChartStyle} className="w-16 h-16 lg:w-24 lg:h-24 rounded-full mx-auto my-3 lg:my-4"></div>
                     <div className="text-[9px] lg:text-xs space-y-1 mb-3 lg:mb-4">
                        {paymentMethodDistribution.slice(0,5).map(({method, percentage}, i) => (
                           <div key={method} className="flex items-center gap-2">
                               <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-sm flex-shrink-0" style={{backgroundColor: ['#F9D85A', '#575756', '#333333', '#f4f4f4', '#a3a3a3'][i % 5]}}></div>
                               <span className="truncate">{method}: {percentage.toFixed(0)}%</span>
                           </div>
                        ))}
                    </div>
                    <p className="text-xs lg:text-sm">Total: <span className="font-bold">{formatCurrency(totals.month)}</span></p>
                    <p className="text-xs lg:text-sm">Pendiente: <span className="font-bold text-rose-600">{formatCurrency(totals.pending)}</span></p>
                </div>
            </div>
        </div>
    );
};

export default SalesManager;