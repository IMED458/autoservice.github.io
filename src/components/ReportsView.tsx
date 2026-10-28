/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  CarServiceOrder,
  User,
  ServiceItem,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAID_TO_OPTIONS,
  findOwnerId,
  getPaidDate,
  getUserServiceEarning,
  isServiceParticipant,
  splitServiceMoney,
} from '../types';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Users,
  Award,
  CalendarDays,
  Calendar,
  Wallet,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDateDDMMYYYY, toISODateInputValue, shiftISODate, isDateInRange } from '../utils/date';
import DayFilter from './DayFilter';

interface ReportsViewProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  mechanics: User[];
  allUsers: User[];
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'all';

const r2 = (n: number) => Math.round(n * 100) / 100;

export default function ReportsView({ orders, services, mechanics, allUsers }: ReportsViewProps) {
  const today = toISODateInputValue();
  const periodRange = (p: PeriodType): [string, string] =>
    p === 'day' ? [today, today]
      : p === 'week' ? [shiftISODate(today, -6), today]
      : p === 'month' ? [shiftISODate(today, -29), today]
      : p === 'year' ? [shiftISODate(today, -364), today]
      : ['', ''];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const activePeriod = (['day', 'week', 'month', 'year', 'all'] as PeriodType[])
    .find(p => { const [f, t] = periodRange(p); return f === dateFrom && t === dateTo; });
  const setActivePeriod = (p: PeriodType) => { const [f, t] = periodRange(p); setDateFrom(f); setDateTo(t); };

  const ownerId = findOwnerId(allUsers);
  const ownerUser = allUsers.find(u => u.id === ownerId);

  // Filtered orders & services for current active period calculation
  const periodOrders = orders.filter(o => isDateInRange(o.date, dateFrom, dateTo));
  const periodOrderIds = new Set(periodOrders.map((o) => o.id));
  const periodServices = services.filter((srv) => periodOrderIds.has(srv.orderId));

  // Wages / owner share accrue only for paid orders, on the payment date
  const paidInPeriodIds = new Set(orders.filter(o => {
    const paidDate = getPaidDate(o);
    return !!paidDate && isDateInRange(paidDate, dateFrom, dateTo);
  }).map(o => o.id));
  const paidServices = services.filter(srv => paidInPeriodIds.has(srv.orderId));

  const totalCompletedOrders = periodOrders.filter((o) => o.status === 'completed').length;

  // Let's compute overall finances from the period selection services
  let totalRevenue = 0;
  let paidRevenue = 0;
  let unpaidRevenue = 0;

  // Count & Revenue of dynamic ServiceType categories
  const categoryStats: Record<string, { revenue: number; count: number }> = {};

  periodServices.forEach((srv) => {
    const parentOrder = periodOrders.find((o) => o.id === srv.orderId);
    if (!parentOrder) return;

    totalRevenue += srv.price;

    if (parentOrder.paymentStatus === 'paid') {
      paidRevenue += srv.price;
    } else {
      unpaidRevenue += srv.price;
    }

    if (!categoryStats[srv.serviceType]) {
      categoryStats[srv.serviceType] = { revenue: 0, count: 0 };
    }
    categoryStats[srv.serviceType].revenue += srv.price;
    categoryStats[srv.serviceType].count += 1;
  });

  // Calculate mechanic-by-mechanic shares (ხელოსნების გამომუშავება)
  interface MechanicPerformance {
    id: string;
    fullName: string;
    username: string;
    totalWorksCost: number;
    totalEarned: number;
    tasksCount: number;
  }

  const mechanicPerformances: MechanicPerformance[] = mechanics.map((mech) => {
    const mySrvs = paidServices.filter((s) => isServiceParticipant(s, mech.id));
    const totalWorksCost = mySrvs.filter(s => s.mechanicId === mech.id).reduce((sum, s) => sum + s.price, 0);
    const totalEarned = r2(mySrvs.reduce((sum, s) => sum + getUserServiceEarning(s, mech.id, ownerId), 0));

    return {
      id: mech.id,
      fullName: `${mech.firstName} ${mech.lastName}`.trim(),
      username: mech.username,
      totalWorksCost,
      totalEarned,
      tasksCount: mySrvs.length,
    };
  }).sort((a, b) => b.totalEarned - a.totalEarned);

  // Owner (Zviadi): as executor + as owner of everyone else's work
  const ownerTotals = paidServices.reduce((acc, srv) => {
    const m = splitServiceMoney(srv, ownerId);
    acc.wages += m.wages;
    acc.executor += m.ownerExecutor;
    acc.ownerProfit += m.ownerProfit;
    if (srv.mechanicId === ownerId) acc.ownTurnover += srv.price;
    return acc;
  }, { wages: 0, executor: 0, ownerProfit: 0, ownTurnover: 0 });

  // Calculate cash collectors while keeping the owner profit assigned to Zviadi.
  interface PaidToShare {
    name: string;
    totalReceived: number; // amount physically received by this person
    ownerProfitShare: number; // remaining amount after wages; always belongs to Zviadi
    handymanPaidOut: number; // wages paid from these services
  }

  const ownerName = 'ზვიადი';
  const paidToSharesRecords: Record<string, PaidToShare> = {};
  PAID_TO_OPTIONS.forEach(name => {
    paidToSharesRecords[name] = { name, totalReceived: 0, ownerProfitShare: 0, handymanPaidOut: 0 };
  });

  orders.filter(o => paidInPeriodIds.has(o.id)).forEach((order) => {
    const orderSrvList = paidServices.filter((s) => s.orderId === order.id);
    const paidToName = order.paidTo && PAID_TO_OPTIONS.includes(order.paidTo) ? order.paidTo : ownerName;

    orderSrvList.forEach((srv) => {
      const m = splitServiceMoney(srv, ownerId);
      paidToSharesRecords[paidToName].totalReceived = r2(paidToSharesRecords[paidToName].totalReceived + srv.price);
      paidToSharesRecords[paidToName].ownerProfitShare = r2(paidToSharesRecords[paidToName].ownerProfitShare + m.ownerTotal);
      paidToSharesRecords[paidToName].handymanPaidOut = r2(paidToSharesRecords[paidToName].handymanPaidOut + m.wages);
    });
  });

  const activePaidToShares = Object.values(paidToSharesRecords);

  // Dynamic label for categories
  const getCategoryLabel = (typeId: string) => {
    if (typeId === 'diagnostic') return 'დიაგნოსტიკა';
    if (typeId === 'electromechanics') return 'ელექტრო მექანიკა';
    if (typeId === 'other') return 'სხვა სამუშაოები';
    return typeId;
  };

  // Programmatic CSV Export tool function (Client-Side)
  const handleExportCSV = () => {
    const headers = [
      'თარიღი (Date)',
      'მარკა (Car)',
      'სახ. ნომერი (Number)',
      'კლიენტი (Client)',
      'ტელეფონი (Phone)',
      'მომსახურების რაოდენობა',
      'ჯამური ფასი (Total Cost)',
      'ხელოსნის გამომუშავება',
      'ზვიადის წილი',
      'გადახდილია ვისთან (Paid To)',
      'სამუშაო სტატუსი',
      'გადახდა',
    ];

    const rows = periodOrders.map((order) => {
      const orderSrvList = periodServices.filter((s) => s.orderId === order.id);
      const totalCost = orderSrvList.reduce((sum, s) => sum + s.price, 0);
      const totalEarn = r2(orderSrvList.reduce((sum, s) => sum + splitServiceMoney(s, ownerId).wages, 0));
      const ownerEarn = r2(orderSrvList.reduce((sum, s) => sum + splitServiceMoney(s, ownerId).ownerTotal, 0));

      return [
        formatDateDDMMYYYY(order.date),
        `"${order.carBrand.replace(/"/g, '""')}"`,
        order.carNumber,
        `"${order.clientFullName.replace(/"/g, '""')}"`,
        order.clientPhone,
        orderSrvList.length,
        totalCost,
        totalEarn,
        ownerEarn,
        order.paidTo || 'ზვიადი',
        ORDER_STATUS_LABELS[order.status],
        PAYMENT_STATUS_LABELS[order.paymentStatus],
      ];
    });

    const csvContent =
      '\uFEFF' + 
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ავტოსერვისი_ანგარიში_${dateFrom || 'start'}_${dateTo || 'end'}_${formatDateDDMMYYYY(toISODateInputValue()).replace(/\//g, '.')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <span className="bg-amber-500/10 p-2 rounded-xl text-amber-500 border border-amber-500/20">
            <BarChart3 className="w-5 h-5" />
          </span>
          ფინანსური რეპორტი
        </h2>

        {/* Export CSV button */}
        <button
          id="export-csv-btn"
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 text-xs text-slate-950 bg-amber-500 hover:bg-amber-600 font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95 transition-all text-center w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          ექსპორტი (CSV)
        </button>
      </div>

      {/* Modern Horizontal Period Selector Buttons */}
      <div className="grid grid-cols-5 gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl mb-3 text-center text-xs">
        {(['day', 'week', 'month', 'year', 'all'] as PeriodType[]).map((p) => {
          const isActive = activePeriod === p;
          return (
            <button
              id={`report-period-${p}`}
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`py-2 px-1.5 font-bold rounded-lg transition-all cursor-pointer truncate ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'day' && 'დღე'}
              {p === 'week' && 'კვირა'}
              {p === 'month' && 'თვე'}
              {p === 'year' && 'წელი'}
              {p === 'all' && 'სულ'}
            </button>
          );
        })}
      </div>

      <div className="mb-5">
        <DayFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} title="დღის / თარიღის ფილტრი" />
      </div>

      {/* Main Stats metrics Cards */}
      <div className="grid grid-cols-3 gap-2 mb-5 text-center">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider leading-tight">ბრუნვა</span>
          <div className="text-base font-black text-slate-150 font-mono mt-0.5">{totalRevenue} ₾</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] text-green-500 font-bold uppercase block tracking-wider leading-tight">გადახდილი</span>
          <div className="text-base font-black text-green-400 font-mono mt-0.5">{paidRevenue} ₾</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] text-rose-500 font-bold uppercase block tracking-wider leading-tight">გადაუხდელი</span>
          <div className="text-base font-black text-rose-400 font-mono mt-0.5">{unpaidRevenue} ₾</div>
        </div>
      </div>

      {/* ვისთან გადაიხადეს (Paid To) and who owns the remaining profit */}
      <div className="flex items-center justify-between pl-1 mb-2.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
          <Wallet className="w-3.5 h-3.5 text-green-400" />
          თანხების მიმღებები და ზვიადის წილი
        </h3>
        <span className="text-[9px] text-slate-500 italic block leading-none">კასა (Paid To)</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 mb-5 shadow space-y-4">
        {activePaidToShares.map((item) => {
          return (
            <div
              key={item.name}
              className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0 text-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold">
                    ₾
                  </div>
                  <h4 className="font-bold text-slate-200">
                    მიმღები: <span className="text-amber-500">{item.name}</span>
                  </h4>
                </div>
                <div className="font-mono text-slate-400">
                  მიიღო სულ: <b className="text-slate-200 font-bold">{item.totalReceived} ₾</b>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <div className="space-y-0.5 border-r border-slate-850 pr-2">
                  <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wide">ზვიადის წილი ხელფასების შემდეგ:</span>
                  <span className="text-green-400 font-mono font-black">{item.ownerProfitShare} ₾</span>
                </div>
                <div className="space-y-0.5 pl-2">
                  <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wide">გაიცა ხელოსნებზე:</span>
                  <span className="text-cyan-400 font-mono font-black">{item.handymanPaidOut} ₾</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zviadi: executor + owner */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5">
        {ownerUser?.firstName || ownerName} — შემსრულებლად და მფლობელად
      </h3>
      <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 mb-5 shadow space-y-2 text-xs">
        <div className="flex justify-between gap-2">
          <span className="text-slate-400">საკუთარი სამუშაოების ბრუნვა:</span>
          <span className="font-mono font-bold text-slate-100">{r2(ownerTotals.ownTurnover)} ₾</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-400">გამოიმუშავა შემსრულებლად:</span>
          <span className="font-mono font-bold text-cyan-400">{r2(ownerTotals.executor)} ₾</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-400">მფლობელის წილი სხვების სამუშაოდან:</span>
          <span className="font-mono font-bold text-amber-400">{r2(ownerTotals.ownerProfit)} ₾</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-400">ხელოსნების ხელფასები:</span>
          <span className="font-mono font-bold text-rose-400">{r2(ownerTotals.wages)} ₾</span>
        </div>
        <div className="flex justify-between gap-2 pt-2 border-t border-slate-800">
          <span className="text-slate-200 font-bold">ჯამური მოგება:</span>
          <span className="font-mono font-black text-emerald-400 text-sm">{r2(ownerTotals.executor + ownerTotals.ownerProfit)} ₾</span>
        </div>
        <p className="text-[10px] text-slate-500">გადახდილი ბრუნვა ({r2(paidServices.reduce((a, s) => a + s.price, 0))} ₾) = ხელფასები + ზვიადის ჯამური მოგება. ითვლება გადახდის თარიღით.</p>
      </div>

      {/* Dynamic service category stats */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5">
        თანხები კატეგორიების მიხედვით
      </h3>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 mb-5 shadow space-y-3">
        {Object.keys(categoryStats).length === 0 ? (
          <p className="text-xs text-slate-600 italic text-center py-2">არ ფიქსირდება სამუშაოები მითითებულ პერიოდში</p>
        ) : (
          Object.entries(categoryStats).map(([typeId, stats]) => {
            const pct = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;
            return (
              <div key={typeId} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">
                    • {getCategoryLabel(typeId)} ({stats.count} სამუშაო)
                  </span>
                  <span className="font-mono text-slate-100">{stats.revenue} ₾</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-850">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mechanic Earnings Rating Section */}
      <div className="flex items-center justify-between pl-1 mb-2.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
          ხელოსნების გამომუშავება და რეიტინგი (გადახდილი)
        </h3>
        <Award className="w-4 h-4 text-amber-500" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow mb-5 space-y-4">
        {mechanicPerformances.length === 0 ? (
          <p className="text-xs text-slate-600 italic text-center py-2">პერსონალი არ არის დამატებული</p>
        ) : (
          mechanicPerformances.map((perf, index) => {
            return (
              <div
                key={perf.id}
                className="flex items-center justify-between border-b border-slate-800/60 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5">
                  <span className="bg-slate-950 border border-slate-850 text-slate-400 font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {perf.fullName}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-sans">
                      შესრულებულია: <b>{perf.tasksCount}</b> მომსახურება
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs text-slate-300">
                    ბრუნვა: <b className="text-slate-200">{perf.totalWorksCost} ₾</b>
                  </div>
                  <div className="text-xs font-black text-cyan-400">
                    გამომუშავება: <b>{perf.totalEarned} ₾</b>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Date-wise timeline metadata */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5 flex items-center gap-1">
        <CalendarDays className="w-3.5 h-3.5" />
        მომსახურების დინამიკა პერიოდში
      </h3>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow text-xs space-y-2 font-sans">
        <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
          <span className="text-slate-400">აქტიური პერიოდი:</span>
          <span className="text-slate-200 font-bold bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase text-[10px]">
            <Clock className="w-3 h-3 text-amber-500" />
            {activePeriod === 'day' ? 'დღეს'
              : activePeriod === 'week' ? 'უკანასკნელი 7 დღე'
              : activePeriod === 'month' ? 'უკანასკნელი 30 დღე'
              : activePeriod === 'year' ? 'უკანასკნელი 365 დღე'
              : activePeriod === 'all' ? 'მთლიანი პერიოდი'
              : `${formatDateDDMMYYYY(dateFrom) || '...'} — ${formatDateDDMMYYYY(dateTo) || '...'}`}
          </span>
        </div>
        <div className="flex justify-between items-center py-1 bg-slate-950/40 rounded px-2">
          <span className="text-slate-500">გატარებული მანქანების რაოდენობა პერიოდში:</span>
          <span className="font-mono text-slate-200 font-bold">{periodOrders.length}</span>
        </div>
        <div className="flex justify-between items-center py-1 bg-slate-950/40 rounded px-2">
          <span className="text-slate-500">დასრულებული სამუშაოების სტატუსით:</span>
          <span className="font-mono text-slate-200 font-bold">{totalCompletedOrders}</span>
        </div>
        <div className="flex justify-between items-center py-1 bg-slate-950/40 rounded px-2">
          <span className="text-slate-500">საშუალო შემოსავალი ერთ მანქანაზე:</span>
          <span className="font-mono text-amber-500 font-bold">
            {periodOrders.length > 0 ? (totalRevenue / periodOrders.length).toFixed(1) : 0} ₾
          </span>
        </div>
      </div>
    </div>
  );
}
