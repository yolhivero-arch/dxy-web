import React, { useState, useMemo } from 'react';
import { Product, PurchaseInvoice } from '../types';
import { formatCurrency, exportElementAsPDF } from '../utils';
import { parsePurchaseInvoice } from '../services/geminiService';
import { useToast } from './Toast';

interface Props {
  products: Product[];
  purchaseInvoices: PurchaseInvoice[];
  onRegisterPurchase: (
    invoiceDetails: Omit<PurchaseInvoice, 'id'>,
    items: { id: string; quantity: number; providerCost?: number }[],
    updateCosts: boolean
  ) => void;
}

type ParsedItem = {
  id: string;
  quantity: number;
  providerCost: number;
};

const PurchaseManager: React.FC<Props> = ({ products, purchaseInvoices, onRegisterPurchase }) => {
  const { showToast } = useToast();
  const [invoiceDetails, setInvoiceDetails] = useState<Omit<PurchaseInvoice, 'id' | 'date'>>({
    vendor: 'Disfit',
    invoiceNumber: '',
    goodsAmount: 0,
    shippingCost: 0,
    notes: ''
  });
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 7));
  const [itemsText, setItemsText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoiceDetails(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleLoadPurchase = async () => {
    if (!itemsText.trim()) {
      showToast('Por favor, pegue los ítems de la factura', 'warning');
      return;
    }
    setIsParsing(true);
    const parsedItems: ParsedItem[] | null = await parsePurchaseInvoice(itemsText, products);
    setIsParsing(false);

    if (!parsedItems || parsedItems.length === 0) {
      showToast('No se pudieron procesar los ítems. Verifique el formato.', 'error');
      return;
    }

    const productMap = new Map(products.map(p => [p.id, p]));
    const costChanges: string[] = [];
    
    // Fix: Explicitly type `item` to resolve 'unknown' type errors on property access.
    parsedItems.forEach((item: ParsedItem) => {
      const product = productMap.get(item.id);
      if (product && product.providerCost !== item.providerCost) {
        const percentageChange = ((item.providerCost - product.providerCost) / product.providerCost * 100).toFixed(1);
        // FIX: Parse percentageChange to float before comparing with 0. .toFixed() returns a string.
        costChanges.push(`- ${product.name}: ${formatCurrency(product.providerCost)} → ${formatCurrency(item.providerCost)} (${parseFloat(percentageChange) > 0 ? '+' : ''}${percentageChange}%)`);
      }
    });

    let confirmUpdate = true;
    if (costChanges.length > 0) {
      const confirmationMessage = `Se detectaron cambios de costo:\n\n${costChanges.join('\n')}\n\n¿Deseas actualizar estos costos en la base de datos? Esto afectará los precios de venta.`;
      confirmUpdate = window.confirm(confirmationMessage);
    }
    
    const finalInvoice: Omit<PurchaseInvoice, 'id'> = {
        ...invoiceDetails,
        date: invoiceDate
    };

    onRegisterPurchase(finalInvoice, parsedItems, confirmUpdate);
    
    // Reset form
    setItemsText('');
    setInvoiceDetails({ vendor: 'Disfit', invoiceNumber: '', goodsAmount: 0, shippingCost: 0, notes: '' });
  };
  
  const monthlyReport = useMemo(() => {
    return purchaseInvoices.reduce((acc, inv) => {
        const month = inv.date;
        if (!acc[month]) {
            acc[month] = { totals: { goods: 0, shipping: 0, grandTotal: 0 }, vendors: {} };
        }
        
        acc[month].totals.goods += inv.goodsAmount;
        acc[month].totals.shipping += inv.shippingCost;
        acc[month].totals.grandTotal += inv.goodsAmount + inv.shippingCost;

        if (!acc[month].vendors[inv.vendor]) {
            acc[month].vendors[inv.vendor] = { goods: 0, shipping: 0, total: 0 };
        }
        acc[month].vendors[inv.vendor].goods += inv.goodsAmount;
        acc[month].vendors[inv.vendor].shipping += inv.shippingCost;
        acc[month].vendors[inv.vendor].total += inv.goodsAmount + inv.shippingCost;

        return acc;
    }, {} as Record<string, { totals: any, vendors: any }>);
  }, [purchaseInvoices]);
  
  const handlePDFExport = async () => {
    setIsExporting(true);
    await exportElementAsPDF('investmentReport', 'Inversion_DXY_Mensual.pdf');
    setIsExporting(false);
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white rounded-[2rem] shadow-sm border border-slate-200 p-10">
          <h2 className="text-2xl font-black text-brand-gray uppercase tracking-tight italic">Registrar Compra a Proveedor</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 mb-8">Sincronización de Stock y Costos</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <input type="month" name="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray" />
                <select name="vendor" value={invoiceDetails.vendor} onChange={handleDetailChange} className="col-span-2 w-full px-4 py-3 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray uppercase">
                    <option>Disfit</option><option>Bunker</option><option>ColoMayorista</option><option>Suplemed</option><option>Otro</option>
                </select>
            </div>
            <input type="text" name="invoiceNumber" placeholder="Nro de Factura" value={invoiceDetails.invoiceNumber} onChange={handleDetailChange} className="w-full px-4 py-3 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray" />
            <div className="grid grid-cols-2 gap-4">
                <input type="number" name="goodsAmount" placeholder="Importe Mercadería" value={invoiceDetails.goodsAmount || ''} onChange={handleDetailChange} className="w-full px-4 py-3 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray" />
                <input type="number" name="shippingCost" placeholder="Costo Envío" value={invoiceDetails.shippingCost || ''} onChange={handleDetailChange} className="w-full px-4 py-3 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray" />
            </div>
            <textarea name="notes" placeholder="Observaciones..." value={invoiceDetails.notes} onChange={handleDetailChange} rows={2} className="w-full px-4 py-3 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray" />
            <textarea
                value={itemsText}
                onChange={e => setItemsText(e.target.value)}
                placeholder="Pegar ítems de la factura aquí...&#10;Formato: Cantidad Producto @ Costo Unitario"
                className="w-full h-40 p-4 bg-slate-800 text-brand-yellow rounded-xl border-2 border-slate-700 focus:border-brand-yellow outline-none font-mono text-sm"
            />
            <button onClick={handleLoadPurchase} disabled={isParsing} className="w-full py-4 bg-brand-yellow text-brand-dark rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-yellow/10 disabled:opacity-50">
              {isParsing ? 'Procesando con IA...' : 'Cargar Compra'}
            </button>
          </div>
        </div>
        <div className="lg:col-span-2">
            <div id="investmentReport" className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                <div className="print-header hidden">
                    <div className="logo"><span className="logo-dx">DX</span><span className="logo-y">Y</span></div>
                    <div className="date">Reporte de Inversión</div>
                </div>
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-black text-brand-gray uppercase tracking-tight">Inversión DXY Mensual</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Libro de Compras</p>
                    </div>
                     <button onClick={handlePDFExport} disabled={isExporting} className="bg-brand-dark text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-125 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 print-hidden">
                        {isExporting ? '...' : 'PDF'}
                    </button>
                </div>

                <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {Object.keys(monthlyReport).sort((a,b) => b.localeCompare(a)).map(month => (
                        <div key={month} className="bg-brand-light p-4 rounded-xl">
                            <div className="flex justify-between items-center pb-2 border-b-2 border-white mb-2">
                                <h4 className="font-black text-sm text-brand-gray uppercase">{new Date(month + '-02').toLocaleString('es-AR', { month: 'long', year: 'numeric' })}</h4>
                                <span className="font-black text-lg text-brand-gray italic">{formatCurrency(monthlyReport[month].totals.grandTotal)}</span>
                            </div>
                            <table className="w-full text-xs">
                                <tbody>
                                {Object.keys(monthlyReport[month].vendors).map(vendor => (
                                    <tr key={vendor}>
                                        <td className="font-bold uppercase py-1">{vendor}</td>
                                        <td className="text-right font-semibold">{formatCurrency(monthlyReport[month].vendors[vendor].total)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseManager;