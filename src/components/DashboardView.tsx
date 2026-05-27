/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CarServiceOrder, User, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, OrderStatus } from '../types';
import { Plus, Search, Car, HelpCircle, Phone, User as UserIcon, Calendar, CreditCard, ArrowRight, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  orders: CarServiceOrder[];
  currentUser: User;
  onSelectOrder: (id: string) => void;
  onOpenAddOrder: () => void;
}

export default function DashboardView({
  orders,
  currentUser,
  onSelectOrder,
  onOpenAddOrder,
}: DashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all_active'); // 'all_active', 'new', 'pending', 'completed', 'all'

  // Apply search and status filter
  const filteredOrders = orders.filter((order) => {
    // 1. Search Query mapping
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      order.carNumber.toLowerCase().includes(q) ||
      order.carBrand.toLowerCase().includes(q) ||
      order.clientFullName.toLowerCase().includes(q) ||
      order.clientPhone.includes(q);

    // 2. Status filter mapping
    if (!matchesSearch) return false;
    if (selectedStatusFilter === 'all_active') {
      return order.status === 'new' || order.status === 'pending';
    }
    if (selectedStatusFilter === 'unpaid') {
      return order.paymentStatus === 'unpaid';
    }
    if (selectedStatusFilter === 'all') return true;
    return order.status === selectedStatusFilter;
  });

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      {/* Admin Action Block */}
      {currentUser.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <button
            id="quick-add-car-btn"
            onClick={onOpenAddOrder}
            className="w-full py-4 px-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 hover:from-amber-600 hover:to-amber-800 font-extrabold rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/10 cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="bg-slate-950/20 p-2.5 rounded-xl border border-slate-950/10 text-slate-950">
                <Car className="w-5 h-5 stroke-[2.5]" />
              </span>
              <div className="text-left">
                <div className="text-base font-sans tracking-tight">ახალი მანქანის რეგისტრაცია</div>
                <div className="text-[11px] text-slate-900 font-sans font-medium opacity-85">კლიენტისა და ავტომობილის მონაცემების შეყვანა</div>
              </div>
            </div>
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </motion.div>
      )}

      {/* Title & Stats Headers */}
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-bold font-sans text-slate-200">
          {selectedStatusFilter === 'all_active' ? 'მიმდინარე დავალებები' : 'ყველა დავალება'}
        </h3>
        <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 font-mono font-bold">
          {filteredOrders.length} ჩანაწერი
        </span>
      </div>

      {/* Search Input Block - Plate Number Search (სახელმწიფო ნომრით სწრაფი ძებნა) */}
      <div className="relative mb-5">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          id="dashboard-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ძებნა ნომრით, მარკით ან მფლობელით..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-slate-100 font-sans"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-none mb-3 -mx-4 px-4">
        {[
          { id: 'all_active', label: 'მიმდინარე' },
          { id: 'new', label: 'ახალი' },
          { id: 'pending', label: 'პროცესშია' },
          { id: 'completed', label: 'დასრულებული' },
          { id: 'unpaid', label: 'გადაუხდელია' },
          { id: 'all', label: 'ყველა' },
        ].map((pill) => (
          <button
            id={`filter-pill-${pill.id}`}
            key={pill.id}
            onClick={() => setSelectedStatusFilter(pill.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold select-none cursor-pointer transition-all border ${
              selectedStatusFilter === pill.id
                ? 'bg-slate-100 border-slate-100 text-slate-950 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Grid of job cards */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-center text-slate-500">
          <HelpCircle className="w-10 h-10 mb-2 text-slate-700" />
          <p className="font-sans text-sm">დავალებები მოცემული ფილტრით ვერ მოიძებნა</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            // Colors based on Status
            const statusStyle =
              order.status === 'new'
                ? { bg: 'bg-amber-950/50', border: 'border-amber-500/30', text: 'text-amber-400' }
                : order.status === 'pending'
                ? { bg: 'bg-sky-950/50', border: 'border-sky-500/30', text: 'text-sky-400' }
                : { bg: 'bg-green-950/50', border: 'border-green-500/30', text: 'text-green-400' };

            const payStyle =
              order.paymentStatus === 'paid'
                ? { bg: 'bg-green-500/20 text-green-400 border-green-500/20' }
                : { bg: 'bg-rose-500/20 text-rose-400 border-rose-500/20' };

            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={order.id}
                onClick={() => onSelectOrder(order.id)}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-md hover:border-slate-700 transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99]"
              >
                {/* Status Indicator line on side */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    order.status === 'new'
                      ? 'bg-amber-500'
                      : order.status === 'pending'
                      ? 'bg-sky-500'
                      : 'bg-green-500'
                  }`}
                />

                {/* Header: Brand & State Plate Number */}
                <div className="flex items-start justify-between mb-2.5 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-200 uppercase font-sans tracking-tight">
                      {order.carBrand}
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-widest text-slate-150 shadow-inner">
                    {order.carNumber}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-slate-400 pl-2 mb-3 font-sans">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate text-slate-300 font-semibold">{order.clientFullName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{order.clientPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{order.date}</span>
                  </div>
                </div>

                {/* Problems Area */}
                <div className="bg-slate-950 rounded-xl p-2.5 text-xs text-slate-300 pl-2.5 mx-1 border border-slate-800/60 mb-3 block">
                  <span className="text-slate-500 font-semibold block mb-0.5">ზიანი / Проблема:</span>
                  <p className="line-clamp-2 italic font-sans">{order.problemDescription}</p>
                </div>

                {/* Status badges & Action Footer */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 pl-2">
                  <div className="flex gap-1.5">
                    {/* Work Status Label */}
                    <span
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text} font-sans`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    {/* Payment Status Label */}
                    <span
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg border ${payStyle.bg}`}
                    >
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </span>
                  </div>

                  <span className="text-amber-500 text-xs font-semibold flex items-center gap-1 hover:text-amber-400 font-sans">
                    შესვლა <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
