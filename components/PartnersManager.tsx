import React, { useState, useMemo } from 'react';
import { Trainer, TrainerSale } from '../types';
import { formatCurrency } from '../utils';
import { useToast } from './Toast';

interface Props {
  trainers: Trainer[];
  trainerSales: TrainerSale[];
  onAddTrainer: (trainer: Omit<Trainer, 'id' | 'createdAt'>) => void;
  onAddSale: (sale: Omit<TrainerSale, 'id'>) => void;
  onToggleTrainerStatus: (trainerId: string) => void;
}

const PartnersManager: React.FC<Props> = ({ trainers, trainerSales, onAddTrainer, onAddSale, onToggleTrainerStatus }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trainers' | 'sales'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [newTrainer, setNewTrainer] = useState({ name: '', phone: '', email: '' });
  const [newSale, setNewSale] = useState({ 
    trainerId: '', 
    clientName: '', 
    clientPhone: '',
    amount: 0, 
    productName: '',
    couponUsed: 'client' as 'trainer' | 'client'
  });

  const getDiscountLevel = (uniqueClients: number): 20 | 25 | 35 => {
    if (uniqueClients >= 21) return 35;
    if (uniqueClients >= 11) return 25;
    return 20;
  };

  const trainerStats = useMemo(() => {
    return trainers.map(trainer => {
      const monthSales = trainerSales.filter(
        sale => sale.trainerId === trainer.id && sale.date.startsWith(selectedMonth)
      );
      
      const clientSales = monthSales.filter(s => s.couponUsed === 'client');
      const uniqueClients = new Set(clientSales.map(s => s.clientName.toLowerCase())).size;
      
      const trainerOwnSales = monthSales.filter(s => s.couponUsed === 'trainer');
      const trainerOwnAmount = trainerOwnSales.reduce((sum, s) => sum + s.amount, 0);
      
      const discountLevel = getDiscountLevel(uniqueClients);
      
      const baseDiscount = 20;
      const reimbursement = discountLevel > baseDiscount 
        ? trainerOwnAmount * ((discountLevel - baseDiscount) / 100)
        : 0;

      return { trainer, uniqueClients, totalSales: monthSales.length, totalAmount: monthSales.reduce((sum, s) => sum + s.amount, 0), trainerOwnAmount, discountLevel, reimbursement };
    });
  }, [trainers, trainerSales, selectedMonth]);

  const totals = useMemo(() => {
    return trainerStats.reduce((acc, stat) => ({
      totalClients: acc.totalClients + stat.uniqueClients,
      totalSales: acc.totalSales + stat.totalSales,
      totalAmount: acc.totalAmount + stat.totalAmount,
      totalReimbursement: acc.totalReimbursement + stat.reimbursement
    }), { totalClients: 0, totalSales: 0, totalAmount: 0, totalReimbursement: 0 });
  }, [trainerStats]);

  const handleAddTrainer = () => {
    if (!newTrainer.name.trim()) {
      showToast('Ingrese el nombre', 'warning');
      return;
    }
    const normalizedName = newTrainer.name.toUpperCase().replace(/\s+/g, '');
    onAddTrainer({
      ...newTrainer,
      name: newTrainer.name.trim(),
      couponTrainer: `DXY-${normalizedName}`,
      couponClient: `CLIENTE-${normalizedName}`,
      isActive: true
    });
    setNewTrainer({ name: '', phone: '', email: '' });
    showToast('Partner registrado', 'success');
  };

  const handleAddSale = () => {
    if (!newSale.trainerId || !newSale.clientName || newSale.amount <= 0) {
     showToast('Complete todos los campos', 'warning');
      return;
    }
    onAddSale({ ...newSale, date: new Date().toISOString().slice(0, 10) });
    setNewSale({ trainerId: '', clientName: '', clientPhone: '', amount: 0, productName: '', couponUsed: 'client' });
    showToast('Venta registrada', 'success');
  };

  const activeTrainers = trainers.filter(t => t.isActive);

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="glass-dark bg-gradient-to-r from-brand-gray to-slate-700 rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 lg:gap-4">
          <div>
            <h2 className="text-xl lg:text-3xl font-black uppercase tracking-tight">Partners DXY</h2>
            <p className="text-brand-yellow text-[10px] lg:text-sm font-bold mt-1">Entrenadores & Gimnasios</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[9px] lg:text-xs text-slate-300 uppercase">Mes</p>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs lg:text-sm font-bold mt-1 w-32 lg:w-auto"
            />
          </div>
        </div>
        
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mt-4">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[9px] lg:text-xs text-slate-300 uppercase">Partners</p>
            <p className="text-lg lg:text-2xl font-black">{activeTrainers.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[9px] lg:text-xs text-slate-300 uppercase">Clientes</p>
            <p className="text-lg lg:text-2xl font-black">{totals.totalClients}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[9px] lg:text-xs text-slate-300 uppercase">Ventas</p>
            <p className="text-base lg:text-2xl font-black truncate">{formatCurrency(totals.totalAmount)}</p>
          </div>
          <div className="bg-brand-yellow/20 rounded-xl p-3">
            <p className="text-[9px] lg:text-xs text-brand-yellow uppercase">Reintegros</p>
            <p className="text-base lg:text-2xl font-black text-brand-yellow truncate">{formatCurrency(totals.totalReimbursement)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'trainers', label: 'Partners' },
          { id: 'sales', label: 'Ventas' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-bold text-[10px] lg:text-sm uppercase transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-brand-yellow text-brand-dark' 
                : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-3 lg:p-6 border-b border-slate-200">
            <h3 className="font-black text-brand-gray uppercase text-[10px] lg:text-sm tracking-widest">Rendimiento</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-slate-50 text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-3 lg:px-6 py-2.5 lg:py-4 text-left">Partner</th>
                  <th className="px-2 lg:px-4 py-2.5 lg:py-4 text-center">Clientes</th>
                  <th className="px-2 lg:px-4 py-2.5 lg:py-4 text-center">Nivel</th>
                  <th className="px-2 lg:px-4 py-2.5 lg:py-4 text-right">Ventas</th>
                  <th className="px-2 lg:px-4 py-2.5 lg:py-4 text-right">Reint.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trainerStats.map(({ trainer, uniqueClients, totalAmount, discountLevel, reimbursement }) => (
                  <tr key={trainer.id} className="hover:bg-slate-50">
                    <td className="px-3 lg:px-6 py-2.5 lg:py-4">
                      <p className="font-black text-brand-gray text-xs lg:text-sm">{trainer.name}</p>
                      <p className="text-[8px] lg:text-[10px] text-slate-400 hidden sm:block">{trainer.couponClient}</p>
                    </td>
                    <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-center">
                      <span className="font-black text-base lg:text-lg">{uniqueClients}</span>
                    </td>
                    <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-center">
                      <span className={`px-2 py-0.5 lg:py-1 rounded-full text-[9px] lg:text-xs font-black ${
                        discountLevel === 35 ? 'bg-emerald-100 text-emerald-700' :
                        discountLevel === 25 ? 'bg-brand-yellow text-brand-dark' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {discountLevel}%
                      </span>
                    </td>
                    <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-right font-black text-brand-gray text-xs lg:text-sm">{formatCurrency(totalAmount)}</td>
                    <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-right">
                      {reimbursement > 0 ? (
                        <span className="font-black text-emerald-600 text-xs lg:text-sm">{formatCurrency(reimbursement)}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trainers */}
      {activeTab === 'trainers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
          <div className="glass-card bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-200 p-4 lg:p-8">
            <h3 className="font-black text-brand-gray uppercase text-[10px] lg:text-sm tracking-widest mb-4">Nuevo Partner</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre"
                value={newTrainer.name}
                onChange={e => setNewTrainer(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={newTrainer.phone}
                onChange={e => setNewTrainer(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={newTrainer.email}
                onChange={e => setNewTrainer(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm"
              />
              {newTrainer.name && (
                <div className="bg-slate-50 p-3 rounded-xl text-[9px] lg:text-xs space-y-1">
                  <p><span className="text-slate-400">Personal:</span> <span className="font-bold">DXY-{newTrainer.name.toUpperCase().replace(/\s+/g, '')}</span></p>
                  <p><span className="text-slate-400">Clientes:</span> <span className="font-bold">CLIENTE-{newTrainer.name.toUpperCase().replace(/\s+/g, '')}</span></p>
                </div>
              )}
              <button onClick={handleAddTrainer} className="w-full py-2.5 bg-brand-yellow text-brand-dark rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all text-xs lg:text-sm">
                Registrar
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-200 p-4 lg:p-8">
            <h3 className="font-black text-brand-gray uppercase text-[10px] lg:text-sm tracking-widest mb-4">Partners</h3>
            <div className="space-y-2 max-h-[350px] lg:max-h-[500px] overflow-y-auto">
              {trainers.length === 0 ? (
                <p className="text-center text-slate-400 py-10 text-sm">Sin partners</p>
              ) : (
                trainers.map(trainer => (
                  <div key={trainer.id} className={`p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${trainer.isActive ? 'bg-slate-50' : 'bg-rose-50'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-brand-gray text-xs lg:text-sm">{trainer.name}</p>
                      <p className="text-[9px] lg:text-xs text-slate-400 truncate">{trainer.phone} • {trainer.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="bg-brand-gray text-white text-[8px] lg:text-[10px] px-1.5 lg:px-2 py-0.5 rounded font-bold">{trainer.couponTrainer}</span>
                        <span className="bg-brand-yellow text-brand-dark text-[8px] lg:text-[10px] px-1.5 lg:px-2 py-0.5 rounded font-bold">{trainer.couponClient}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleTrainerStatus(trainer.id)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] lg:text-xs font-bold uppercase flex-shrink-0 ${
                        trainer.isActive 
                          ? 'bg-rose-100 text-rose-600' 
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {trainer.isActive ? 'Desact.' : 'Activar'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales */}
      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
          <div className="glass-card bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-200 p-4 lg:p-8">
            <h3 className="font-black text-brand-gray uppercase text-[10px] lg:text-sm tracking-widest mb-4">Registrar Venta</h3>
            <div className="space-y-3">
              <select
                value={newSale.trainerId}
                onChange={e => setNewSale(prev => ({ ...prev, trainerId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm"
              >
                <option value="">Seleccionar Partner</option>
                {activeTrainers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewSale(prev => ({ ...prev, couponUsed: 'client' }))}
                  className={`p-2.5 lg:p-4 rounded-xl border-2 transition-all ${
                    newSale.couponUsed === 'client' 
                      ? 'border-brand-yellow bg-brand-yellow/10' 
                      : 'border-slate-200'
                  }`}
                >
                  <p className="font-black text-[10px] lg:text-sm">Cliente</p>
                </button>
                <button
                  onClick={() => setNewSale(prev => ({ ...prev, couponUsed: 'trainer' }))}
                  className={`p-2.5 lg:p-4 rounded-xl border-2 transition-all ${
                    newSale.couponUsed === 'trainer' 
                      ? 'border-brand-gray bg-slate-100' 
                      : 'border-slate-200'
                  }`}
                >
                  <p className="font-black text-[10px] lg:text-sm">Entrenador</p>
                </button>
              </div>

              <input
                type="text"
                placeholder={newSale.couponUsed === 'client' ? "Nombre Cliente" : "Compra propia"}
                value={newSale.clientName}
                onChange={e => setNewSale(prev => ({ ...prev, clientName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm"
              />
              
              <input
                type="text"
                placeholder="Producto"
                value={newSale.productName}
                onChange={e => setNewSale(prev => ({ ...prev, productName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm"
              />
              
              <input
                type="number"
                placeholder="Monto"
                value={newSale.amount || ''}
                onChange={e => setNewSale(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 rounded-xl border-2 bg-brand-light focus:border-brand-yellow outline-none font-bold text-brand-gray text-xs lg:text-sm"
              />

              <button onClick={handleAddSale} className="w-full py-3 bg-brand-yellow text-brand-dark rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all text-xs lg:text-sm">
                Registrar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-200 p-4 lg:p-8">
            <h3 className="font-black text-brand-gray uppercase text-[10px] lg:text-sm tracking-widest mb-4">Últimas Ventas</h3>
            <div className="space-y-2 max-h-[350px] lg:max-h-[500px] overflow-y-auto">
              {trainerSales
                .filter(s => s.date.startsWith(selectedMonth))
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 20)
                .map(sale => {
                  const trainer = trainers.find(t => t.id === sale.trainerId);
                  return (
                    <div key={sale.id} className="p-2.5 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate">{sale.clientName}</p>
                          <p className="text-[8px] lg:text-[10px] text-slate-400 truncate">{sale.productName}</p>
                          <p className="text-[8px] lg:text-[10px] text-slate-400">
                            {trainer?.name} • {sale.couponUsed === 'client' ? 'Cliente' : 'Personal'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-brand-gray text-xs lg:text-sm">{formatCurrency(sale.amount)}</p>
                          <p className="text-[8px] lg:text-[10px] text-slate-400">{sale.date.slice(5)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnersManager;