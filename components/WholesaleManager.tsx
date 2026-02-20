import React, { useState, useMemo, useRef } from 'react';
import { Product, OrderItem, ClientInfo } from '../types';
import { 
  calculateProductMetrics, 
  formatCurrency, 
  exportWholesaleCatalogToCSV,
  exportWholesaleCatalogToPDFBlob
} from '../utils';
import { useToast } from './Toast';

interface Props {
  products: Product[];
  activeOrder: OrderItem[];
  setActiveOrder: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  onAddToOrder: (product: Product, quantity: number) => void;
  onFinalizeOrder: (order: OrderItem[], client: ClientInfo, deductStock: boolean) => boolean;
  finalizedOrder: { order: OrderItem[]; client: ClientInfo } | null;
  setFinalizedOrder: React.Dispatch<React.SetStateAction<{ order: OrderItem[]; client: ClientInfo } | null>>;
}

const WholesaleManager: React.FC<Props> = ({ 
    products, 
    activeOrder, 
    setActiveOrder,
    onAddToOrder,
    onFinalizeOrder,
    finalizedOrder,
    setFinalizedOrder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ name: '', location: '', phone: '' });
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [orderText, setOrderText] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      (p.brand || '').toLowerCase().includes(term) ||
      (p.flavors || []).some(f => f.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setActiveOrder(prev => prev.filter(item => item.id !== id));
    } else {
      setActiveOrder(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    }
  };

  const orderTotal = useMemo(() => {
    return activeOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [activeOrder]);

  const downloadPDF = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DXY_Catalogo_${new Date().toISOString().slice(0,10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async (shareToWhatsApp: boolean = false) => {
    setIsExportingPDF(true);
    try {
      const pdfBlob = await exportWholesaleCatalogToPDFBlob(products);
      
      if (shareToWhatsApp && navigator.share) {
        const file = new File([pdfBlob], `DXY_Catalogo_${new Date().toISOString().slice(0,10)}.pdf`, { type: 'application/pdf' });
        try {
          await navigator.share({
            files: [file],
            title: 'Catálogo DXY Suplementos',
            text: '¡Mirá nuestro catálogo mayorista actualizado! 💪'
          });
          showToast('Compartido exitosamente', 'success');
        } catch {
          downloadPDF(pdfBlob);
          window.open('https://wa.me/?text=¡Hola! Te comparto el catálogo mayorista de DXY Suplementos 💪', '_blank');
          showToast('PDF descargado. Adjuntalo en WhatsApp', 'info');
        }
      } else {
        downloadPDF(pdfBlob);
        showToast('Catálogo PDF generado', 'success');
      }
    } catch {
      showToast('Error al generar PDF', 'error');
    }
    setIsExportingPDF(false);
  };

  const handleFinalize = () => {
    if (activeOrder.length === 0) {
      showToast('El carrito está vacío', 'warning');
      return;
    }
    if (!clientInfo.name || !clientInfo.location) {
      showToast('Complete el nombre y localidad del cliente', 'warning');
      return;
    }
    const deductStock = window.confirm("¿Deseas descontar los productos del stock actual?");
    const success = onFinalizeOrder(activeOrder, clientInfo, deductStock);
    if (success) {
      setClientInfo({ name: '', location: '', phone: '' });
      showToast('Venta finalizada correctamente', 'success');
    }
  };

  const handleProcessOrder = () => {
    if (!orderText.trim()) {
      showToast('Ingrese el texto del pedido', 'warning');
      return;
    }
    setIsProcessingOrder(true);
    const lines = orderText.split('\n').filter(line => line.trim());
    let addedCount = 0;
    
    lines.forEach(line => {
      const match = line.match(/(\d+)\s*[x×]?\s*(.+)|(.+?)\s*[x×]\s*(\d+)/i);
      if (match) {
        const quantity = parseInt(match[1] || match[4]) || 1;
        const term = (match[2] || match[3] || '').toLowerCase().trim();
        const product = products.find(p => 
          p.name.toLowerCase().includes(term) ||
          (p.brand || '').toLowerCase().includes(term) ||
          `${p.brand} ${p.name}`.toLowerCase().includes(term)
        );
        if (product && product.currentStock > 0) {
          onAddToOrder(product, quantity);
          addedCount++;
        }
      }
    });
    
    if (addedCount > 0) {
      showToast(`${addedCount} producto(s) agregados`, 'success');
      setOrderText('');
    } else {
      showToast('No se encontraron productos válidos', 'warning');
    }
    setIsProcessingOrder(false);
  };

  const FinalizedInvoiceModal = () => {
    if (!finalizedOrder) return null;
    const { order, client } = finalizedOrder;
    const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const currentDate = new Date().toLocaleDateString('es-AR');

    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-black text-brand-gray">Orden Finalizada</h3>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="px-3 py-2 bg-brand-dark text-white rounded-lg text-xs font-bold uppercase">Imprimir</button>
              <button onClick={() => setFinalizedOrder(null)} className="px-3 py-2 bg-brand-yellow text-brand-dark rounded-lg text-xs font-bold uppercase">Nueva Venta</button>
            </div>
          </div>
          <div ref={invoicePrintRef} className="p-6 overflow-y-auto">
            <h1 className="text-2xl font-black text-brand-gray mb-2">ORDEN DE VENTA</h1>
            <p className="font-bold text-brand-yellow text-sm">FECHA: {currentDate}</p>
            
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-brand-light p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">DE</p>
                <p className="font-black text-brand-gray text-sm">DXY Suplementos</p>
                <p className="text-xs text-slate-600">Morteros, Córdoba</p>
              </div>
              <div className="bg-brand-light p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">PARA</p>
                <p className="font-black text-brand-gray text-sm">{client.name}</p>
                <p className="text-xs text-slate-600">{client.location}</p>
                {client.phone && <p className="text-xs text-slate-600">{client.phone}</p>}
              </div>
            </div>

            <table className="w-full text-left">
              <thead className="bg-brand-gray text-white">
                <tr>
                  <th className="p-2 text-[10px] uppercase">Producto</th>
                  <th className="p-2 text-center text-[10px] uppercase">Cant.</th>
                  <th className="p-2 text-right text-[10px] uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.map(item => (
                  <tr key={item.id}>
                    <td className="p-2 font-bold text-xs">{item.name}</td>
                    <td className="p-2 text-center text-xs">{item.quantity}</td>
                    <td className="p-2 text-right font-bold text-xs">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="flex justify-end mt-6">
              <div className="bg-brand-yellow text-brand-dark p-4 rounded-2xl">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs font-bold uppercase">Total</span>
                  <span className="text-2xl font-black">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <FinalizedInvoiceModal />
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-brand-gray uppercase">Catálogo Mayorista</h2>
            <p className="text-xs text-slate-400">Gestión de pedidos y catálogo</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => handleExportPDF(false)} disabled={isExportingPDF} className="px-4 py-2 bg-brand-dark text-white rounded-xl text-xs font-black uppercase disabled:opacity-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>
              {isExportingPDF ? '...' : 'PDF'}
            </button>
            <button onClick={() => handleExportPDF(true)} disabled={isExportingPDF} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button onClick={() => exportWholesaleCatalogToCSV(products)} className="px-4 py-2 bg-slate-500 text-white rounded-xl text-xs font-black uppercase">CSV</button>
          </div>
        </div>
      </div>

      {/* Carga Rápida */}
      <div className="bg-gradient-to-r from-brand-gray to-slate-700 rounded-2xl p-4 lg:p-6 text-white">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-black uppercase">Carga Rápida</h3>
            <p className="text-brand-yellow/80 text-[10px] font-bold uppercase">Pegá el pedido del cliente</p>
          </div>
          <div className="flex-1 w-full">
            <textarea
              value={orderText}
              onChange={e => setOrderText(e.target.value)}
              placeholder="Ej: 2 creatina star&#10;1 proteina gold"
              className="w-full h-16 p-3 bg-white/10 border border-white/20 rounded-xl text-sm placeholder:text-white/40 outline-none focus:border-brand-yellow resize-none"
            />
          </div>
          <button onClick={handleProcessOrder} disabled={isProcessingOrder} className="px-6 py-3 bg-brand-yellow text-brand-dark rounded-xl font-black uppercase text-xs disabled:opacity-50">
            {isProcessingOrder ? '...' : 'Agregar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Catálogo */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar producto..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-brand-light border-2 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:border-brand-yellow" 
              />
              <svg className="w-4 h-4 absolute left-3 top-3 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="p-4 max-h-[50vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map(p => {
                const m = calculateProductMetrics(p);
                return (
                  <div key={p.id} className={`p-3 rounded-xl flex justify-between items-center ${p.currentStock === 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-black text-brand-gray text-xs uppercase truncate">{p.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{p.brand}</p>
                      <p className={`text-[10px] font-bold mt-1 ${p.currentStock === 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                        {p.currentStock === 0 ? 'AGOTADO' : `Stock: ${p.currentStock}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-base text-brand-gray">{formatCurrency(m.wholesalePrice)}</p>
                      <button onClick={() => onAddToOrder(p, 1)} disabled={p.currentStock === 0} className="mt-1 px-3 py-1 bg-brand-yellow text-brand-dark rounded-lg font-black text-xs disabled:opacity-30">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <h3 className="font-black text-brand-gray uppercase text-xs mb-1">Orden de Venta</h3>
          <p className="text-[10px] text-slate-400 mb-4">Complete los datos del cliente</p>

          <div className="bg-brand-light p-3 rounded-xl mb-4 space-y-2">
            <input type="text" placeholder="Nombre Cliente" value={clientInfo.name} onChange={e => setClientInfo(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2 text-xs rounded-lg border-2 border-transparent focus:border-brand-yellow outline-none font-bold uppercase" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Localidad" value={clientInfo.location} onChange={e => setClientInfo(p => ({...p, location: e.target.value}))} className="w-full px-3 py-2 text-xs rounded-lg border-2 border-transparent focus:border-brand-yellow outline-none font-bold uppercase" />
              <input type="text" placeholder="Teléfono" value={clientInfo.phone} onChange={e => setClientInfo(p => ({...p, phone: e.target.value}))} className="w-full px-3 py-2 text-xs rounded-lg border-2 border-transparent focus:border-brand-yellow outline-none font-bold uppercase" />
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[200px]">
            {activeOrder.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase truncate">{item.name}</p>
                  <p className="text-[9px] font-bold text-slate-400">{formatCurrency(item.price)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <input type="number" value={item.quantity} onChange={e => updateQuantity(item.id, parseInt(e.target.value))} className="w-10 text-center bg-white border border-slate-200 rounded-md font-bold text-xs" />
                  <button onClick={() => updateQuantity(item.id, 0)} className="text-rose-500 p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            ))}
            {activeOrder.length === 0 && <p className="text-center text-[10px] text-slate-400 py-8">Carrito vacío</p>}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex justify-between items-baseline mb-3">
              <span className="font-bold uppercase text-slate-500 text-xs">Total:</span>
              <span className="font-black text-2xl text-brand-gray">{formatCurrency(orderTotal)}</span>
            </div>
            <button onClick={handleFinalize} className="w-full py-2.5 bg-brand-yellow text-brand-dark rounded-xl font-black uppercase text-xs">
              Finalizar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesaleManager;