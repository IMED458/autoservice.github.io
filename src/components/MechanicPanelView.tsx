/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CarServiceOrder, User, ServiceItem, ORDER_STATUS_LABELS, ServiceTypeConfig } from '../types';
import { Compass, Calendar, DollarSign, Wrench, Briefcase, FileClock, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface MechanicPanelViewProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  currentUser: User;
  serviceConfigs: ServiceTypeConfig[];
  onSelectOrder: (id: string) => void;
}

export default function MechanicPanelView({
  orders,
  services,
  currentUser,
  serviceConfigs,
  onSelectOrder,
}: MechanicPanelViewProps) {
  // Date range filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Find all service entries where this mechanic is primary or co-mechanic
  const mechanicServices = services.filter((s) =>
    s.mechanicId === currentUser.id || s.coMechanicId === currentUser.id
  );

  const getEarning = (s: typeof services[0]) =>
    s.mechanicId === currentUser.id ? s.mechanicEarning : (s.coMechanicEarning || 0);

  // Helper to safely parse localized "YYYY-MM-DD" style dates without timezone shifts
  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(NaN);
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  };

  // Generate date bounds for current calendar week, month, and year dynamically based on local system/user time
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentDate = today.getDate();

  // Create "today" at local midnight
  const todayLocal = new Date(currentYear, currentMonth, currentDate);
  const dayOfWeek = todayLocal.getDay(); // 0 is Sunday, 1 is Monday...

  // Distance to Monday (if Sunday (0) -> -6, Monday (1) -> 0, Tuesday (2) -> -1, etc.)
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const mondayLocal = new Date(todayLocal);
  mondayLocal.setDate(todayLocal.getDate() + distanceToMonday);

  const sundayLocal = new Date(mondayLocal);
  sundayLocal.setDate(mondayLocal.getDate() + 6);
  sundayLocal.setHours(23, 59, 59, 999);

  // Compute automagic stats
  let weekEarnings = 0;
  let monthEarnings = 0;
  let yearEarnings = 0;
  const totalLifetimeEarnings = mechanicServices.reduce((sum, s) => sum + getEarning(s), 0);

  mechanicServices.forEach((srv) => {
    const orderObj = orders.find((o) => o.id === srv.orderId);
    if (!orderObj) return;

    const orderDate = parseLocalDate(orderObj.date);
    if (isNaN(orderDate.getTime())) return;

    // 1. Weekly Earnings: Monday through Sunday
    if (orderDate >= mondayLocal && orderDate <= sundayLocal) {
      weekEarnings += getEarning(srv);
    }

    // 2. Monthly Earnings: Entire current month
    if (orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth) {
      monthEarnings += getEarning(srv);
    }

    // 3. Yearly Earnings: Entire current year
    if (orderDate.getFullYear() === currentYear) {
      yearEarnings += getEarning(srv);
    }
  });

  // Filter service items based on date query
  const filteredServices = mechanicServices.filter((srv) => {
    const orderObj = orders.find((o) => o.id === srv.orderId);
    if (!orderObj) return false;

    if (startDate && orderObj.date < startDate) return false;
    if (endDate && orderObj.date > endDate) return false;

    return true;
  });

  // Calculate earnings of matching filtered services
  const filteredEarningsSum = filteredServices.reduce((sum, s) => sum + getEarning(s), 0);

  const getServiceLabel = (typeId: string) => {
    const conf = serviceConfigs.find((c) => c.id === typeId);
    return conf ? conf.name : typeId;
  };

  // Find all unique orders associated with these filtered services
  const orderIdsMatched = Array.from(new Set(filteredServices.map((s) => s.orderId)));
  const mechanicOrdersFiltered = orders.filter((o) => orderIdsMatched.includes(o.id));

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      {/* Bio banner */}
      <div className="bg-gradient-to-r from-cyan-600 to-indigo-700 rounded-2xl p-5 mb-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-black text-cyan-200">ხელოსნის პანელი</span>
          <h2 className="text-xl font-black font-sans mt-0.5">
            გამარჯობა, {currentUser.firstName} {currentUser.lastName}!
          </h2>
          <p className="text-[11px] text-cyan-100/90 mt-1 font-sans">
            აქ ნახავთ თქვენს მიერ შესრულებულ სამუშაოებს და გამომუშავებულ წილს.
          </p>
        </div>

        {/* Diagonal background graphics for visuals */}
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center">
          <Wrench className="w-40 h-40 rotate-[35deg] translate-x-10 translate-y-10" />
        </div>
      </div>

      {/* Auto Analytics Stats grid */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5">
        ჩემი ფინანსური მაჩვენებლები
      </h3>
      
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Week */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">კვირის ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-cyan-400">
            {weekEarnings.toLocaleString()} ₾
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">ორშაბათიდან კვირის ჩათვლით</p>
          <div className="absolute right-2 bottom-1 text-cyan-500/10">
            <Calendar className="w-10 h-10 -mr-2 -mb-2" />
          </div>
        </div>

        {/* Month */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">თვის ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-emerald-400">
            {monthEarnings.toLocaleString()} ₾
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">მთელი მიმდინარე თვე</p>
          <div className="absolute right-2 bottom-1 text-emerald-500/10">
            <Briefcase className="w-10 h-10 -mr-2 -mb-2" />
          </div>
        </div>

        {/* Year */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">წლის ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-amber-500">
            {yearEarnings.toLocaleString()} ₾
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">მთელი მიმდინარე წელი</p>
          <div className="absolute right-2 bottom-1 text-amber-500/10">
            <Clock className="w-10 h-10 -mr-2 -mb-2" />
          </div>
        </div>

        {/* Lifetime Earnings */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ჯამური გამომუშავება</span>
          <div className="text-xl font-black font-mono mt-1 text-indigo-400">
            {totalLifetimeEarnings.toLocaleString()} ₾
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">მთლიანი მუშაობის პერიოდი</p>
          <div className="absolute right-2 bottom-1 text-indigo-500/10">
            <DollarSign className="w-10 h-10 -mr-2 -mb-2" />
          </div>
        </div>
      </div>

      {/* Date Filters Form Card (თარიღების მიხედვით ფილტრი) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          გამომუშავების ფილტრი თარიღებით
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-დან (თარიღი)</label>
            <input
              id="mech-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-მდე (თარიღი)</label>
            <input
              id="mech-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500 text-slate-200"
            />
          </div>
        </div>

        {/* Live Filter Indicator inside filter box for maximum usability */}
        {(startDate || endDate) && (
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between text-xs font-sans">
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-black block leading-none mb-0.5">გაფილტრული წილი:</span>
              <span className="font-mono text-emerald-400 font-extrabold text-sm">{filteredEarningsSum.toLocaleString()} ₾</span>
            </div>
            <button
              id="clear-mech-dates-btn"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-rose-400 rounded-lg cursor-pointer transition-colors border border-slate-800/80"
            >
              ფილტრის მოხსნა
            </button>
          </div>
        )}
      </div>

      {/* List of my associated works */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-3">
        დავალებები ჩემი მონაწილეობით ({mechanicOrdersFiltered.length})
      </h3>

      {mechanicOrdersFiltered.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs">
          ითავებდა ან მითითებულ შუალედში დავალებები არ ფიქსირდება.
        </div>
      ) : (
        <div className="space-y-4">
          {mechanicOrdersFiltered.map((order) => {
            // My services associated within this specific order
            const myOrderServices = filteredServices.filter((s) => s.orderId === order.id);
            const myEarnOnThisOrder = myOrderServices.reduce((sum, s) => sum + getEarning(s), 0);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                onClick={() => onSelectOrder(order.id)}
                className="bg-slate-900 border border-slate-800/80 hover:border-slate-705 p-4 rounded-xl shadow hover:border-slate-700 cursor-pointer group transition-all"
              >
                <div className="flex justify-between items-start border-b border-slate-800/60 pb-2 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono leading-none">{order.date}</span>
                    <h4 className="text-sm font-black text-slate-200 uppercase tracking-tight fn-sans">
                      {order.carBrand}
                    </h4>
                  </div>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-300">
                    {order.carNumber}
                  </span>
                </div>

                {/* Services list provided specifically by this mechanic */}
                <div className="space-y-1 mb-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold block mb-1">
                    ჩემი შესრულებული მომსახურებები:
                  </span>
                  {myOrderServices.map((srv) => (
                    <div key={srv.id} className="text-[11px] text-slate-300 flex justify-between gap-2">
                      <span>• {getServiceLabel(srv.serviceType)} — {srv.description}</span>
                      <span className="text-cyan-400 font-mono font-bold">+{getEarning(srv)} ₾</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/40 text-xs text-slate-400">
                  <div className="flex gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        order.status === 'completed'
                          ? 'bg-green-950/40 border border-green-500/20 text-green-400'
                          : order.status === 'pending'
                          ? 'bg-sky-950/40 border border-sky-500/20 text-sky-400'
                          : 'bg-amber-950/40 border border-amber-500/20 text-amber-400'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <span className="text-amber-500 hover:text-amber-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer">
                    დავალებაზე შესვლა <ArrowRight className="w-3.5 h-3.5" />
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
