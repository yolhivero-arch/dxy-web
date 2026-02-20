import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { calculateProductMetrics, formatCurrency } from '../utils';
import { useToast } from './Toast';

interface ComboItem {
  product: Product;
  quantity: number;
}

interface Props {
  products: Product[];
}

const ComboCalculator: React.FC<Props> = ({ products = [] }) => {
  const { showToast } = useToast();
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [comboName, setComboName] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [priceOptions, setPriceOptions] = useState<{ price: number; discount: number; profit: number; margin: number }[] | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const productsArray = Array.isArray(products) ? products : [];

  // Productos disponibles (excluye los ya agregados al combo)
  const availableProducts = useMemo(() => {
    return productsArray.filter(p => !comboItems.some(item => item.product.id === p.id));
  }, [productsArray, comboItems]);

  // Productos filtrados por búsqueda
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    
    let filtered = availableProducts;
    
    if (term) {
      filtered = availableProducts.filter(p => 
        (p.name || '').toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term) ||
        (p.flavors || []).some(f => (f || '').toLowerCase().includes(term))
      );
    }
    
    // Si showAllProducts está activo, mostrar todos, sino limitar a 10
    return showAllProducts ? filtered : filtered.slice(0, 10);
  }, [searchTerm, availableProducts, showAllProducts]);

  const comboTotals = useMemo(() => {
    let totalCost = 0;
    let totalCashPrice = 0;
    let totalWholesale = 0;

    comboItems.forEach(item => {
      const metrics = calculateProductMetrics(item.product);
      totalCost += metrics.realCost * item.quantity;
      totalCashPrice += metrics.cashPrice * item.quantity;
      totalWholesale += metrics.wholesalePrice * item.quantity;
    });

    return {
      cost: totalCost,
      cashPrice: totalCashPrice,
      wholesale: totalWholesale,
      potentialProfit: totalCashPrice - totalCost
    };
  }, [comboItems]);

  const addToCombo = (product: Product) => {
    setComboItems(prev => [...prev, { product, quantity: 1 }]);
    setSearchTerm('');
    setPriceOptions(null);
    showToast(`${product.brand} - ${product.name} agregado al combo`, 'success');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setComboItems(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
    setPriceOptions(null);
  };

  const removeFromCombo = (productId: string) => {
    setComboItems(prev => prev.filter(item => item.product.id !== productId));
    setPriceOptions(null);
  };

  const calculatePriceOptions = async () => {
    if (comboItems.length < 2) {
      showToast('Agregá al menos 2 productos al combo', 'warning');
      return;
    }

    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { cost, cashPrice } = comboTotals;
    
    const options = [
      {
        price: Math.round(cashPrice * 0.85 / 100) * 100,
        discount: 15,
        profit: Math.round(cashPrice * 0.85) - cost,
        margin: ((Math.round(cashPrice * 0.85) - cost) / Math.round(cashPrice * 0.85)) * 100
      },
      {
        price: Math.round(cashPrice * 0.80 / 100) * 100,
        discount: 20,
        profit: Math.round(cashPrice * 0.80) - cost,
        margin: ((Math.round(cashPrice * 0.80) - cost) / Math.round(cashPrice * 0.80)) * 100
      },
      {
        price: Math.round(cashPrice * 0.75 / 100) * 100,
        discount: 25,
        profit: Math.round(cashPrice * 0.75) - cost,
        margin: ((Math.round(cashPrice * 0.75) - cost) / Math.round(cashPrice * 0.75)) * 100
      }
    ];

    setPriceOptions(options);
    setIsCalculating(false);
  };

  const clearCombo = () => {
    setComboItems([]);
    setComboName('');
    setPriceOptions(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-brand-gray uppercase tracking-tight">Combos DXY</h2>
          <p className="text-sm text-slate-500 mt-1">Creá combos promocionales y calculá precios con IA</p>
        </div>
        <div className="text-sm text-slate-500">
          <span className="font-bold text-brand-gray">{availableProducts.length}</span> productos disponibles
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Nombre del combo */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <input
              type="text"
              value={comboName}
              onChange={(e) => setComboName(e.target.value)}
              placeholder="Nombre del combo (ej: Pack Rendimiento)"
              className="w-full px-4 py-3 text-lg font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-yellow transition-all"
            />
          </div>

          {/* Buscador de productos */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, marca o sabor..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium outline-none focus:border-brand-yellow transition-all"
                />
                <svg className="w-5 h-5 absolute left-3 top-3.5 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => setShowAllProducts(!showAllProducts)}
                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all ${
                  showAllProducts 
                    ? 'bg-brand-yellow text-brand-dark' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {showAllProducts ? 'Ver menos' : 'Ver todos'}
              </button>
            </div>

            {/* Lista de productos */}
            <div className="max-h-[400px] overflow-y-auto border-t border-slate-100 pt-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="font-medium">No se encontraron productos</p>
                  <p className="text-xs mt-1">Probá con otro término de búsqueda</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProducts.map(product => {
                    const metrics = calculateProductMetrics(product);
                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCombo(product)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-yellow/20 transition-all text-left group"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          product.currentStock === 0 ? 'bg-rose-100' : 
                          product.currentStock <= product.minStock ? 'bg-amber-100' : 'bg-emerald-100'
                        }`}>
                          <span className={`text-xs font-black ${
                            product.currentStock === 0 ? 'text-rose-600' : 
                            product.currentStock <= product.minStock ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {product.currentStock}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-brand-gray">{product.brand} - {product.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {product.flavors && product.flavors.length > 0 ? product.flavors.join(', ') : 'Sin sabor'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-sm text-brand-gray">{formatCurrency(metrics.cashPrice)}</p>
                          <p className="text-[9px] text-slate-400">costo: {formatCurrency(metrics.realCost)}</p>
                        </div>
                        <svg className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {!showAllProducts && filteredProducts.length === 10 && (
                <button
                  onClick={() => setShowAllProducts(true)}
                  className="w-full mt-2 py-2 text-center text-sm text-brand-yellow font-bold hover:underline"
                >
                  Ver más productos ({availableProducts.length - 10} más)
                </button>
              )}
            </div>
          </div>

          {/* Productos en el combo */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <h3 className="font-black text-brand-gray uppercase text-xs tracking-widest mb-4">
              Productos en el Combo ({comboItems.length})
            </h3>
            
            {comboItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="font-medium">Buscá y agregá productos</p>
                <p className="text-xs mt-1">Mínimo 2 productos para crear un combo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {comboItems.map(item => {
                  const metrics = calculateProductMetrics(item.product);
                  return (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.product.brand} - {item.product.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.product.flavors && item.product.flavors.length > 0 ? item.product.flavors.join(', ') : 'Sin sabor'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center font-black text-sm hover:bg-slate-300"
                        >-</button>
                        <span className="w-8 text-center font-black">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center font-black text-sm hover:brightness-110"
                        >+</button>
                      </div>
                      <p className="font-black text-sm w-24 text-right">{formatCurrency(metrics.cashPrice * item.quantity)}</p>
                      <button 
                        onClick={() => removeFromCombo(item.product.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Resumen y opciones de precio */}
        <div className="space-y-4">
          <div className="bg-brand-gray text-white rounded-2xl p-6 shadow-xl">
            <h3 className="font-black uppercase text-xs tracking-widest text-brand-yellow mb-4">Resumen</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">Productos:</span>
                <span className="font-black">{comboItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">Unidades totales:</span>
                <span className="font-black">{comboItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">Costo total:</span>
                <span className="font-black">{formatCurrency(comboTotals.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">Precio sin dto:</span>
                <span className="font-black">{formatCurrency(comboTotals.cashPrice)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="text-brand-yellow text-sm font-bold">Ganancia máx:</span>
                <span className="font-black text-emerald-400">{formatCurrency(comboTotals.potentialProfit)}</span>
              </div>
            </div>

            <button
              onClick={calculatePriceOptions}
              disabled={comboItems.length < 2 || isCalculating}
              className="w-full mt-6 py-3 bg-brand-yellow text-brand-dark rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Calcular con IA
                </>
              )}
            </button>

            {comboItems.length > 0 && (
              <button
                onClick={clearCombo}
                className="w-full mt-2 py-2 text-slate-400 text-xs font-bold uppercase hover:text-white transition-colors"
              >
                Limpiar combo
              </button>
            )}
          </div>

          {priceOptions && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4">
              <h3 className="font-black text-brand-gray uppercase text-xs tracking-widest mb-4">Opciones de Precio</h3>
              
              <div className="space-y-3">
                {priceOptions.map((option, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02] ${
                      index === 0 ? 'border-emerald-500 bg-emerald-50' :
                      index === 1 ? 'border-brand-yellow bg-brand-yellow/10' :
                      'border-rose-300 bg-rose-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        index === 0 ? 'bg-emerald-500 text-white' :
                        index === 1 ? 'bg-brand-yellow text-brand-dark' :
                        'bg-rose-400 text-white'
                      }`}>
                        {index === 0 ? 'Recomendado' : index === 1 ? 'Equilibrado' : 'Agresivo'}
                      </span>
                      <span className="text-xs font-bold text-slate-500">-{option.discount}%</span>
                    </div>
                    <p className="text-2xl font-black text-brand-gray">{formatCurrency(option.price)}</p>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-slate-500">Ganancia:</span>
                      <span className={`font-black ${option.profit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(option.profit)} ({option.margin.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComboCalculator;
