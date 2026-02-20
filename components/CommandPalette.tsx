import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, AppView } from '../types';
import { formatCurrency, calculateProductMetrics } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onNavigate: (view: AppView) => void;
  onSelectProduct: (product: Product) => void;
}

const CommandPalette: React.FC<Props> = ({ isOpen, onClose, products, onNavigate, onSelectProduct }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    { id: 'nav-inventory', type: 'navigation', label: 'Ir a Inventario', icon: '📦', action: () => onNavigate('inventory') },
    { id: 'nav-sales', type: 'navigation', label: 'Ir a Registro Diario', icon: '📊', action: () => onNavigate('daily_log') },
    { id: 'nav-wholesale', type: 'navigation', label: 'Ir a Mayorista', icon: '⚡', action: () => onNavigate('wholesale') },
    { id: 'nav-purchases', type: 'navigation', label: 'Ir a Proveedores', icon: '📄', action: () => onNavigate('purchases') },
    { id: 'nav-partners', type: 'navigation', label: 'Ir a Partners DXY', icon: '👥', action: () => onNavigate('partners') },
    { id: 'nav-expenses', type: 'navigation', label: 'Ir a Gastos', icon: '💰', action: () => onNavigate('expenses') },
    { id: 'nav-calculator', type: 'navigation', label: 'Ir a Calculadora', icon: '🧮', action: () => onNavigate('calculator') },
    { id: 'nav-combos', type: 'navigation', label: 'Ir a Combos DXY', icon: '🎁', action: () => onNavigate('combos') },
  ];

  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return { commands: commands.slice(0, 5), products: [] };
    }

    const filteredCommands = commands.filter(c => 
      c.label.toLowerCase().includes(q)
    );

    const productsArray = Array.isArray(products) ? products : [];
    const filteredProducts = productsArray
      .filter(p => 
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.flavors || []).some(f => f.toLowerCase().includes(q))
      )
      .slice(0, 6);

    return { commands: filteredCommands, products: filteredProducts };
  }, [query, products]);

  const allResults = [
    ...filteredResults.commands.map(c => ({ ...c, resultType: 'command' as const })),
    ...filteredResults.products.map(p => ({ ...p, resultType: 'product' as const }))
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      const selected = allResults[selectedIndex];
      if (selected.resultType === 'command') {
        (selected as any).action();
      } else {
        onSelectProduct(selected as Product);
      }
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
          <svg className="w-5 h-5 text-brand-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar productos, comandos..."
            className="flex-1 text-sm font-medium outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {filteredResults.commands.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Navegación</p>
              {filteredResults.commands.map((cmd, i) => {
                const globalIndex = i;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      selectedIndex === globalIndex 
                        ? 'bg-brand-yellow text-brand-dark' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">{cmd.icon}</span>
                    <span className="font-bold text-sm">{cmd.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredResults.products.length > 0 && (
            <div className="p-2 border-t border-slate-100">
              <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos</p>
              {filteredResults.products.map((product, i) => {
                const globalIndex = filteredResults.commands.length + i;
                const metrics = calculateProductMetrics(product);
                return (
                  <button
                    key={product.id}
                    onClick={() => { onSelectProduct(product); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      selectedIndex === globalIndex 
                        ? 'bg-brand-yellow text-brand-dark' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className={`text-xs font-black ${product.currentStock === 0 ? 'text-rose-500' : product.currentStock <= product.minStock ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {product.currentStock}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{product.brand} - {product.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{product.flavors?.join(', ') || 'Sin sabor'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-sm">{formatCurrency(metrics.cashPrice)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {allResults.length === 0 && query && (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-medium">No se encontraron resultados</p>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-bold">↑↓</kbd> navegar</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-bold">↵</kbd> seleccionar</span>
          </div>
          <span className="font-bold">DXY Command</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;