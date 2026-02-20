
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import VoiceInput from './VoiceInput';

interface Props {
  initialProduct?: Product;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

const BRANDS = [
  'Star Nutrition', 'ENA', 'One Fit', 'Mervick', 'Granger', 
  'Gold', 'Nutremax', 'Ultra Tech', 'Body Advance', 'Gentech', 'Otras'
];

const ProductForm: React.FC<Props> = ({ initialProduct, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    brand: 'Star Nutrition',
    providerCost: 0,
    freightCost: 800,
    markupPercent: 50,
    cardSurchargePercent: 25,
    currentStock: 0,
    minStock: 3,
    flavors: [],
    unitsPerBox: 1,
  });

  useEffect(() => {
    if (initialProduct) {
      const { id, ...rest } = initialProduct;
      setFormData({
        ...rest,
        flavors: rest.flavors || [],
        unitsPerBox: rest.unitsPerBox || 1
      });
    }
  }, [initialProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: initialProduct?.id || crypto.randomUUID()
    });
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-8 border-t-[12px] border-brand-yellow">
        <div className="px-10 py-8 bg-brand-light/50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-brand-gray uppercase tracking-tight">
              {initialProduct ? 'Configuración Pro' : 'Alta de Producto'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Gestor de Stock DXY</p>
          </div>
          <button onClick={onCancel} className="p-3 bg-brand-gray/5 text-brand-gray hover:bg-brand-gray hover:text-white rounded-2xl transition-all active:scale-95">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
             <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Producto</label>
                <div className="flex gap-2">
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="flex-1 px-6 py-4 rounded-2xl border-2 border-brand-light bg-brand-light font-black text-brand-gray focus:border-brand-yellow focus:bg-white outline-none transition-all uppercase placeholder:normal-case"
                    placeholder="Ej: Whey Protein"
                  />
                  <VoiceInput 
                    onTranscription={(text) => setFormData(p => ({ ...p, name: text }))} 
                    className="h-[56px] w-[56px] rounded-2xl"
                  />
                </div>
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Marca / Fabricante</label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-brand-light bg-brand-light font-black text-brand-gray focus:border-brand-yellow focus:bg-white outline-none transition-all uppercase"
                >
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unidades por Caja</label>
                  <input type="number" name="unitsPerBox" value={formData.unitsPerBox} onChange={handleChange} className="w-full px-6 py-4 rounded-2xl border-2 border-brand-light bg-brand-light font-black text-brand-gray focus:border-brand-yellow focus:bg-white outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-brand-light rounded-3xl border border-slate-100">
                <p className="text-[9px] font-black text-brand-gray/40 uppercase tracking-[0.2em] mb-4">Gestión de Stock</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Actual</label>
                    <input type="number" name="currentStock" value={formData.currentStock} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-white focus:border-brand-yellow outline-none font-black text-brand-gray text-xl text-center bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Crítico</label>
                    <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-white focus:border-brand-yellow outline-none font-black text-rose-500 text-xl text-center bg-white" />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-brand-light rounded-3xl border border-slate-100">
                <p className="text-[9px] font-black text-brand-gray/40 uppercase tracking-[0.2em] mb-4">Costos Base (ARS)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Proveedor</label>
                    <input type="number" name="providerCost" value={formData.providerCost} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-white focus:border-brand-yellow outline-none font-black text-brand-gray text-center bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Flete Unitario</label>
                    <input type="number" name="freightCost" value={formData.freightCost} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-white focus:border-brand-yellow outline-none font-black text-brand-gray text-center bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Utilidad (%)</label>
                <input type="number" name="markupPercent" value={formData.markupPercent} onChange={handleChange} className="w-full px-6 py-4 rounded-2xl bg-brand-light border-2 border-transparent focus:border-brand-yellow font-black text-emerald-600 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recargo TN (%)</label>
                <input type="number" name="cardSurchargePercent" value={formData.cardSurchargePercent} onChange={handleChange} className="w-full px-6 py-4 rounded-2xl bg-brand-light border-2 border-transparent focus:border-brand-yellow font-black text-brand-gray outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-5 px-8 rounded-2xl font-black text-brand-gray uppercase tracking-widest bg-brand-light hover:bg-slate-200 transition-all text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-5 px-8 rounded-2xl font-black text-brand-dark uppercase tracking-widest bg-brand-yellow hover:scale-105 shadow-xl shadow-brand-yellow/20 transition-all active:scale-95 text-xs"
            >
              Confirmar Operación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;