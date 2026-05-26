/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  CarServiceOrder,
  User,
  ServiceItem,
  PaymentStatus,
  ServiceTypeConfig,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../types';
import { Search, Calendar, Filter, Car, Phone, User as UserIcon, HelpCircle, Eye, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface HistoryViewProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  mechanics: User[];
  serviceConfigs: ServiceTypeConfig[];
  onSelectOrder: (id: string) => void;
}

export default function HistoryView({ orders, services, mechanics, serviceConfigs, onSelectOrder }: HistoryViewProps) {
  // Filter States
  const [filterCarPlate, setFilterCarPlate] = useState('');
  const [filterClientName, setFilterClientName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMechanicId, setFilterMechanicId] = useState('');
  const [filterServiceType, setFilterServiceType] = useState<string>('');
  const [filterPayment, setFilterPayment] = useState<string>('');
  const [filterWorkStatus, setFilterWorkStatus] = useState<string>('all');

  // Clear filters
  const resetFilters = () => {
    setFilterCarPlate('');
    setFilterClientName('');
    setFilterDate('');
    setFilterMechanicId('');
    setFilterServiceType('');
    setFilterPayment('');
    setFilterWorkStatus('all');
  };

  const getServiceLabel = (typeId: string) => {
    const conf = serviceConfigs.find((c) => c.id === typeId);
    return conf ? conf.name : typeId;
  };

  // Evaluate matching items
  const filteredOrders = orders.filter((order) => {
    // 1. Car plate Filter
    if (filterCarPlate && !order.carNumber.toLowerCase().includes(filterCarPlate.toLowerCase().trim())) {
      return false;
    }

    // 2. Client Name Filter
    if (filterClientName && !order.clientFullName.toLowerCase().includes(filterClientName.toLowerCase().trim())) {
      return false;
    }

    // 3. Date Filter
    if (filterDate && order.date !== filterDate) {
      return false;
    }

    // 4. Payment status Filter
    if (filterPayment && order.paymentStatus !== filterPayment) {
      return false;
    }

    // 5. Work Completion status Filter
    if (filterWorkStatus !== 'all') {
      if (filterWorkStatus === 'completed' && order.status !== 'completed') {
        return false;
      }
      if (filterWorkStatus === 'ongoing' && order.status === 'completed') {
        return false;
      }
    }

    // Get child services for this order to filter child fields (Mechanics & Service Types)
    const orderSrvList = services.filter((s) => s.orderId === order.id);

    // 6. Mechanic ID filter (any technician of recorded services matches)
    if (filterMechanicId) {
      const hasMechanic = orderSrvList.some((s) => s.mechanicId === filterMechanicId);
      if (!hasMechanic) return false;
    }

    // 7. Service Type filter (any service matches type)
    if (filterServiceType) {
      const hasType = orderSrvList.some((s) => s.serviceType === filterServiceType);
      if (!hasType) return false;
    }

    return true;
  });

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-sans tracking-tight text-slate-100 flex items-center gap-2">
          <span className="bg-cyan-500/10 p-2 rounded-xl text-cyan-400 border border-cyan-500/20">
            <Filter className="w-5 h-5" />
          </span>
          სერვისების ისტორია
        </h2>
        <button
          id="reset-history-filters-btn"
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          გასუფთავება
        </button>
      </div>

      {/* Filters Form Drawer Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          ფილტრები და პარამეტრები
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Plate Number */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">სახ. ნომერი</label>
            <input
              id="filter-plate"
              type="text"
              value={filterCarPlate}
              onChange={(e) => setFilterCarPlate(e.target.value)}
              placeholder="მაგ: ZZ-777-YY"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs placeholder-slate-700 focus:outline-none focus:border-cyan-500/60 font-mono"
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">კლიენტის სახელი</label>
            <input
              id="filter-client"
              type="text"
              value={filterClientName}
              onChange={(e) => setFilterClientName(e.target.value)}
              placeholder="მაგ: გიორგი"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs placeholder-slate-700 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Match Day */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">თარიღი</label>
            <input
              id="filter-date-picker"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Payment Status Dropdown */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">გადახდის სტატუსი</label>
            <select
              id="filter-payment-status"
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60"
            >
              <option value="">ყველა</option>
              <option value="unpaid">გადაუხდელია</option>
              <option value="paid">გადახდილია</option>
            </select>
          </div>

          {/* Assigned mechanic worker dropdown */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">ხელოსანი</label>
            <select
              id="filter-mechanic-user"
              value={filterMechanicId}
              onChange={(e) => setFilterMechanicId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 font-sans"
            >
              <option value="">ყველა ხელოსანი</option>
              {mechanics.map((mech) => (
                <option key={mech.id} value={mech.id}>
                  {mech.firstName} {mech.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Service Group Type Dropdown */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">კატეგორია</label>
            <select
              id="filter-category-select"
              value={filterServiceType}
              onChange={(e) => setFilterServiceType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 font-sans"
            >
              <option value="">ყველა ტიპი</option>
              <option value="diagnostic">დიაგნოსტიკა</option>
              <option value="electromechanics">ელექტრო მექანიკა</option>
              <option value="other">სხვა სამუშაოები</option>
            </select>
          </div>

          {/* Work Completion Status Filter */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">სამუშაოს სტატუსი</label>
            <select
              id="filter-work-status"
              value={filterWorkStatus}
              onChange={(e) => setFilterWorkStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 font-sans"
            >
              <option value="all">ყველა სამუშაო</option>
              <option value="completed">მხოლოდ დასრულებული</option>
              <option value="ongoing">მიმდინარე / დაუსრულებელი</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matching History Cards */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-850 text-center text-slate-600">
          <HelpCircle className="w-10 h-10 mb-2 text-slate-700" />
          <p className="font-sans text-xs">არცერთი ჩანაწერი არ ემთხვევა მოცემულ ფილტრებს</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-slate-500 text-xs">
            <span>ნაპოვნია <b>{filteredOrders.length}</b> მანქანა</span>
          </div>

          {filteredOrders.map((order) => {
            const orderSrvList = services.filter((s) => s.orderId === order.id);
            const totalCost = orderSrvList.reduce((sum, s) => sum + s.price, 0);
            const totalEarning = orderSrvList.reduce((sum, s) => sum + s.mechanicEarning, 0);

            // Get unique worker mechanics for this order
            const uniqueMechNames = Array.from(
              new Set(
                orderSrvList
                  .map((srv) => {
                    const found = mechanics.find((m) => m.id === srv.mechanicId);
                    return found ? `${found.firstName} ${found.lastName}` : null;
                  })
                  .filter((name): name is string => !!name)
              )
            );

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={order.id}
                onClick={() => onSelectOrder(order.id)}
                className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors p-4 rounded-xl shadow-md cursor-pointer block group"
              >
                <div className="flex items-start justify-between mb-2 pb-2 border-b border-slate-800/60 font-sans">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block leading-none mb-1">{order.date}</span>
                    <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">
                      {order.carBrand}
                    </h4>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-xs font-mono font-bold tracking-widest text-slate-200">
                    {order.carNumber}
                  </div>
                </div>

                {uniqueMechNames.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2 px-1">
                    <span className="font-semibold text-amber-500">მომუშავე პერსონალი:</span>
                    <span className="text-slate-250 font-medium">{uniqueMechNames.join(', ')}</span>
                  </div>
                )}

                {/* Info summary row details */}
                <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-400 font-sans mb-3">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-slate-500" />
                    <span className="truncate">{order.clientFullName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{order.clientPhone}</span>
                  </div>
                </div>

                {/* Sub services list summary */}
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-2 mb-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    ჩატარებული მომსახურებები ({orderSrvList.length}):
                  </span>
                  {orderSrvList.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">დამატებული მომსახურებები არ არის</span>
                  ) : (
                    <div className="space-y-1">
                      {orderSrvList.map((srv, idx) => {
                        const mObj = mechanics.find((x) => x.id === srv.mechanicId);
                        return (
                          <div key={srv.id} className="text-[10.5px] text-slate-300 flex justify-between gap-2.5">
                            <span className="truncate">
                              • <b className="text-amber-500">{getServiceLabel(srv.serviceType)}</b>: {srv.description}
                            </span>
                            <span className="text-slate-500 whitespace-nowrap">
                              ({mObj?.firstName || 'ხელოსანი'} - {srv.price}₾)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Price summary bottom metrics */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex gap-1.5 items-center">
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-500/20 text-green-400 border-green-500/20'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                        order.status === 'completed'
                          ? 'bg-green-950/40 text-green-400 border-green-500/20'
                          : order.status === 'pending'
                          ? 'bg-sky-950/40 text-sky-400 border-sky-500/20'
                          : 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="text-right text-[11px] font-mono">
                    <div className="text-slate-300">ჯამი: <b className="text-slate-100 font-bold">{totalCost} ₾</b></div>
                    <div className="text-slate-500">ხელოსნებს: <b className="text-cyan-400">{totalEarning} ₾</b></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
