
import React, { useState } from 'react';
import { formatCurrency } from '../utils';

const CalculatorDXY: React.FC = () => {
  const [basePrice, setBasePrice] = useState(0);
  const [profile, setProfile] = useState('none');

  const profiles = [
    { id: 'padel_prof', name: 'Profesor Pádel (25%)', discount: 0.25 },
    { id: 'padel_alum_sub', name: 'Alumno Pádel y Subcampeón (15%)', discount: 0.15 },
    { id: 'gym_partners', name: 'Socios Gym y Afiliados (10%)', discount: 0.10 },
    { id: 'coach_1_10', name: 'Entrenador (1-10 cl.) (20%)', discount: 0.20 },
    { id: 'coach_11_20', name: 'Entrenador (11-20 cl.) (25%)', discount: 0.25 },
    { id: 'coach_21', name: 'Entrenador (+21 cl.) (35%)', discount: 0.35 },
    { id: 'tourn_champ', name: 'Campeón Torneo (20%)', discount: 0.20 },
    { id: 'community', name: 'Comunidad IG (5%)', discount: 0.05 },
  ];

  const selectedDiscount = profiles.find(p => p.id === profile)?.discount || 0;
  const finalPrice = basePrice * (1 - selectedDiscount);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-brand-gray p-8 text-white flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">DXY Price Engine</h3>
            <p className="text-brand-yellow text-[10px] font-bold uppercase tracking-widest mt-1">Cotizador Inteligente de Beneficios</p>
          </div>
          <svg className="w-12 h-12 text-brand-yellow opacity-20" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
        </div>
        
        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-brand-gray uppercase tracking-widest mb-3">Monto Base (PVP Efectivo)</label>
              <div className="relative">
                <span className="absolute left-5 top-5 text-brand-gray/30 font-black text-2xl">$</span>
                <input 
                  type="number"
                  value={basePrice || ''}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-12 pr-6 py-5 bg-brand-light border-2 border-transparent focus:border-brand-yellow rounded-2xl text-3xl font-black text-brand-gray outline-none transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-brand-gray uppercase tracking-widest mb-3">Segmento de Beneficio</label>
              <select 
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="w-full px-6 py-5 bg-brand-light border-2 border-transparent focus:border-brand-yellow rounded-2xl font-black text-brand-gray outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="none">Seleccionar Perfil (Precio Base)</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-brand-gray rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-brand-yellow uppercase tracking-[0.2em] mb-2">Precio Final Sugerido</p>
              <p className="text-6xl font-black text-white tracking-tighter italic">{formatCurrency(finalPrice)}</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
              <div className="px-4 py-2 bg-white/10 rounded-xl">
                <p className="text-[10px] font-black text-brand-yellow uppercase mb-1">Descuento aplicado</p>
                <p className="text-2xl font-black text-white">-{formatCurrency(basePrice - finalPrice)}</p>
              </div>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2 italic">Sin mínimos de compra aplicables</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border-t-4 border-brand-yellow shadow-lg flex items-start gap-6">
        <div className="w-12 h-12 bg-brand-yellow rounded-2xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-brand-dark" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <div>
            <p className="text-[10px] font-black text-brand-gray uppercase tracking-widest mb-1">Socios & Afiliados</p>
            <p className="text-xs font-bold text-slate-500">Beneficio 10% OFF directo</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-brand-gray uppercase tracking-widest mb-1">Pádel & Competición</p>
            <p className="text-xs font-bold text-slate-500">Subcampeones 15% | Campeones 20%</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-brand-gray uppercase tracking-widest mb-1">Comunidad IG</p>
            <p className="text-xs font-bold text-slate-500">5% OFF por mención</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-brand-gray uppercase tracking-widest mb-1">DXY Trainers</p>
            <p className="text-xs font-bold text-slate-500">Escalado preferencial hasta 35%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorDXY;
