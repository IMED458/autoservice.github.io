import React, { useState } from 'react';
import {
  CarServiceOrder, User, ServiceItem, ORDER_STATUS_LABELS, ServiceTypeConfig, isOwnerLike, isAssignableMechanic,
  findOwnerId, getPaidDate, getServiceShares, getUserServiceEarning, isServiceParticipant, splitServiceMoney, formatSharePct,
} from '../types';
import { Calendar, DollarSign, Wrench, Briefcase, ArrowRight, Clock, TrendingUp, Wallet, Users, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDateDDMMYYYY, isDateInRange, shiftISODate, toISODateInputValue } from '../utils/date';
import DayFilter from './DayFilter';

interface MechanicPanelViewProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  currentUser: User;
  allUsers: User[];
  serviceConfigs: ServiceTypeConfig[];
  onSelectOrder: (id: string) => void;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function getPeriodRanges() {
  const today = toISODateInputValue();
  const now = new Date();
  const dow = now.getDay();
  const monday = shiftISODate(today, dow === 0 ? -6 : 1 - dow);
  return {
    today,
    week: [monday, shiftISODate(monday, 6)] as [string, string],
    month: [`${today.slice(0, 7)}-01`, `${today.slice(0, 7)}-31`] as [string, string],
    year: [`${today.slice(0, 4)}-01-01`, `${today.slice(0, 4)}-12-31`] as [string, string],
  };
}

// ──────────────────────────────────────────────
// Owner profit view (Zviadi + manager see Zviadi's money)
// ──────────────────────────────────────────────
function OwnerProfitView({
  orders,
  services,
  allUsers,
  serviceConfigs,
  onSelectOrder,
}: Omit<MechanicPanelViewProps, 'currentUser'>) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const ownerId = findOwnerId(allUsers);
  const ownerUser = allUsers.find(u => u.id === ownerId);
  const ownerName = ownerUser?.firstName || 'ზვიადი';
  const orderById = new Map(orders.map(o => [o.id, o]));
  const ranges = getPeriodRanges();

  // Only paid orders count, dated by the payment date
  const servicesIn = (from: string, to: string) =>
    services.filter(srv => {
      const o = orderById.get(srv.orderId);
      const paidDate = o ? getPaidDate(o) : null;
      return !!paidDate && isDateInRange(paidDate, from, to);
    });

  const computeStats = (srvList: ServiceItem[]) => {
    const acc = { revenue: 0, unpaid: 0, wages: 0, executor: 0, ownerProfit: 0 };
    srvList.forEach(srv => {
      const m = splitServiceMoney(srv, ownerId);
      acc.revenue += srv.price;
      if (orderById.get(srv.orderId)?.paymentStatus !== 'paid') acc.unpaid += srv.price;
      acc.wages += m.wages;
      acc.executor += m.ownerExecutor;
      acc.ownerProfit += m.ownerProfit;
    });
    return {
      revenue: r2(acc.revenue), unpaid: r2(acc.unpaid), wages: r2(acc.wages),
      executor: r2(acc.executor), ownerProfit: r2(acc.ownerProfit), total: r2(acc.executor + acc.ownerProfit),
    };
  };

  const todayStats = computeStats(servicesIn(ranges.today, ranges.today));
  const weekStats = computeStats(servicesIn(...ranges.week));
  const monthStats = computeStats(servicesIn(...ranges.month));
  const yearStats = computeStats(servicesIn(...ranges.year));
  const allTimeStats = computeStats(servicesIn('', ''));

  const filteredServices = servicesIn(startDate, endDate);
  const filteredStats = computeStats(filteredServices);
  const hasFilter = !!(startDate || endDate);

  // Per-employee wages for the selected filter (non-owner workers)
  const employeeWages = allUsers.filter(u => isAssignableMechanic(u) && u.id !== ownerId).map(u => {
    const wages = r2(filteredServices.reduce((sum, s) => sum + getUserServiceEarning(s, u.id, ownerId), 0));
    return { user: u, wages };
  }).filter(e => e.wages > 0).sort((a, b) => b.wages - a.wages);

  const getServiceLabel = (typeId: string) => {
    const conf = serviceConfigs.find(c => c.id === typeId);
    return conf ? conf.name : typeId;
  };
  const userFirstName = (id: string) => allUsers.find(u => u.id === id)?.firstName || 'უცნობი';

  const filteredOrders = orders
    .filter(o => filteredServices.some(s => s.orderId === o.id))
    .sort((a, b) => (getPaidDate(b) || '').localeCompare(getPaidDate(a) || '') || b.createdAt.localeCompare(a.createdAt));

  const StatCard = ({
    label, stats, color, icon,
  }: {
    label: string; stats: ReturnType<typeof computeStats>; color: string; icon: React.ReactNode;
  }) => (
    <div className={`bg-slate-900 border ${color} rounded-2xl p-4 shadow-md relative overflow-hidden`}>
      <div className="absolute right-2 bottom-1 opacity-[0.07]">{icon}</div>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">{label}</span>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <span className="text-slate-400">გადახდილი ბრუნვა</span>
          <span className="font-mono font-bold text-slate-100">{stats.revenue.toLocaleString()} ₾</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-400">ხელოსნების ხელფასები</span>
          <span className="font-mono font-bold text-rose-400">−{stats.wages.toLocaleString()} ₾</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-400">შემსრულებლად</span>
          <span className="font-mono font-bold text-cyan-400">{stats.executor.toLocaleString()} ₾</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-400">მფლობელის წილი</span>
          <span className="font-mono font-bold text-amber-400">{stats.ownerProfit.toLocaleString()} ₾</span>
        </div>
        <div className="flex justify-between gap-2 pt-1 border-t border-slate-800/60 mt-1">
          <span className="text-slate-300 font-semibold">ჯამური მოგება</span>
          <span className={`font-mono font-black text-base ${stats.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.total.toLocaleString()} ₾
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      {/* Owner banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 rounded-2xl p-5 mb-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-black text-amber-200">ჩემი — მფლობელის პანელი</span>
          <h2 className="text-xl font-black font-sans mt-0.5">{ownerName}ს ჯამური მოგება</h2>
          <p className="text-[11px] text-amber-100/90 mt-1 font-sans">
            საკუთარ სამუშაოებში გამომუშავებული + სხვების სამუშაოებიდან დარიცხული მფლობელის წილი. ითვლება მხოლოდ გადახდილი ავტომობილები, გადახდის თარიღით.
          </p>
          <div className="mt-3 text-3xl font-black font-mono">{allTimeStats.total.toLocaleString()} ₾</div>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center">
          <Wallet className="w-40 h-40 rotate-[15deg] translate-x-10 translate-y-10" />
        </div>
      </div>

      {/* Period stats */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5">
        პერიოდების მიხედვით
      </h3>
      <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-2">
        <StatCard label="დღეს" stats={todayStats} color="border-rose-500/20" icon={<Sun className="w-16 h-16" />} />
        <StatCard label="ამ კვირა" stats={weekStats} color="border-cyan-500/20" icon={<Calendar className="w-16 h-16" />} />
        <StatCard label="ამ თვე" stats={monthStats} color="border-emerald-500/20" icon={<Briefcase className="w-16 h-16" />} />
        <StatCard label="ამ წელი" stats={yearStats} color="border-amber-500/20" icon={<TrendingUp className="w-16 h-16" />} />
        <StatCard label="სულ ყველა დრო" stats={allTimeStats} color="border-indigo-500/20" icon={<DollarSign className="w-16 h-16" />} />
      </div>

      {/* Day / range filter */}
      <div className="mb-3">
        <DayFilter from={startDate} to={endDate} onChange={(f, t) => { setStartDate(f); setEndDate(t); }} title="დღის / თარიღის ფილტრი" />
      </div>
      {hasFilter && (
        <div className="mb-5">
          <StatCard label={`არჩეული: ${formatDateDDMMYYYY(startDate) || '...'} — ${formatDateDDMMYYYY(endDate) || '...'}`} stats={filteredStats}
            color="border-amber-500/40" icon={<Calendar className="w-16 h-16" />} />
        </div>
      )}

      {/* Per-employee wages */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> თანამშრომლების ხელფასი ({hasFilter ? 'არჩეული პერიოდი' : 'სულ'})
      </h3>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2.5">
        {employeeWages.length === 0 && <p className="text-xs text-slate-600 text-center">ხელფასები არ ფიქსირდება</p>}
        {employeeWages.map(({ user, wages }) => (
          <div key={user.id} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0 gap-2">
            <span className="text-sm text-slate-300 font-semibold">{user.firstName} {user.lastName}</span>
            <span className="font-mono font-bold text-rose-400">{wages.toLocaleString()} ₾</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
          <span className="text-xs text-slate-400 font-bold uppercase">სულ ხელფასები</span>
          <span className="font-mono font-black text-rose-400 text-sm">{filteredStats.wages.toLocaleString()} ₾</span>
        </div>
      </div>

      {/* Breakdown per order / service */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5">
        სად რა გამოიმუშავა {ownerName} ({filteredOrders.length})
      </h3>
      <div className="space-y-3">
        {filteredOrders.length === 0 && (
          <div className="p-6 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs">ჩანაწერები არ არის</div>
        )}
        {filteredOrders.map(order => {
          const srvs = filteredServices.filter(s => s.orderId === order.id);
          const orderOwnerTotal = r2(srvs.reduce((a, s) => a + splitServiceMoney(s, ownerId).ownerTotal, 0));
          return (
            <div key={order.id} onClick={() => onSelectOrder(order.id)}
              className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl shadow hover:border-slate-700 cursor-pointer">
              <div className="flex justify-between items-start gap-2 border-b border-slate-800/60 pb-2 mb-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 block font-mono">გადახდა: {formatDateDDMMYYYY(getPaidDate(order) || '')}</span>
                  <h4 className="text-sm font-black text-slate-200 uppercase truncate">{order.carBrand} <span className="font-mono text-slate-400">{order.carNumber}</span></h4>
                </div>
                <span className="text-emerald-400 font-mono font-black text-sm whitespace-nowrap">+{orderOwnerTotal} ₾</span>
              </div>
              <div className="space-y-1.5">
                {srvs.map(srv => {
                  const m = splitServiceMoney(srv, ownerId);
                  const workers = getServiceShares(srv, ownerId).filter(x => x.mechanicId !== ownerId);
                  return (
                    <div key={srv.id} className="text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800/60 rounded-lg p-2">
                      <div className="flex justify-between gap-2">
                        <span className="min-w-0 break-words">• {getServiceLabel(srv.serviceType)} — {srv.description}</span>
                        <span className="font-mono text-slate-100 whitespace-nowrap">{srv.price} ₾</span>
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                        {workers.map((w, i) => (
                          <span key={i}>{userFirstName(w.mechanicId)}: <b className="text-rose-300 font-mono">{w.earning} ₾</b> ({formatSharePct(w.earning, srv.price)})</span>
                        ))}
                        {m.ownerExecutor > 0 && <span>{ownerName} შემსრ.: <b className="text-cyan-400 font-mono">{m.ownerExecutor} ₾</b> ({formatSharePct(m.ownerExecutor, srv.price)})</span>}
                        {m.ownerProfit !== 0 && <span>{ownerName} მფლობ.: <b className="text-amber-400 font-mono">{m.ownerProfit} ₾</b> ({formatSharePct(m.ownerProfit, srv.price)})</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Employee earnings view (admin / mechanic)
// ──────────────────────────────────────────────
function EmployeeEarningsView({
  orders,
  services,
  currentUser,
  serviceConfigs,
  onSelectOrder,
}: Omit<MechanicPanelViewProps, 'allUsers'>) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const mechanicServices = services.filter(s => isServiceParticipant(s, currentUser.id));

  const getEarning = (s: typeof services[0]) => getUserServiceEarning(s, currentUser.id);

  const ranges = getPeriodRanges();
  // Wages accrue only after payment, on the payment date
  const paidDateOf = (srv: ServiceItem) => {
    const orderObj = orders.find(o => o.id === srv.orderId);
    return orderObj ? getPaidDate(orderObj) : null;
  };
  const sumIn = (from: string, to: string) => r2(mechanicServices.reduce((sum, srv) => {
    const paidDate = paidDateOf(srv);
    return paidDate && isDateInRange(paidDate, from, to) ? sum + getEarning(srv) : sum;
  }, 0));
  const expectedServices = mechanicServices.filter(srv => !paidDateOf(srv) && orders.some(o => o.id === srv.orderId));
  const expectedEarnings = r2(expectedServices.reduce((sum, s) => sum + getEarning(s), 0));
  const expectedCars = new Set(expectedServices.map(s => s.orderId)).size;
  const todayEarnings = sumIn(ranges.today, ranges.today);
  const weekEarnings = sumIn(...ranges.week);
  const monthEarnings = sumIn(...ranges.month);
  const yearEarnings = sumIn(...ranges.year);
  const totalLifetimeEarnings = sumIn('', '');

  const filteredServices = mechanicServices.filter(srv => {
    const paidDate = paidDateOf(srv);
    return !!paidDate && isDateInRange(paidDate, startDate, endDate);
  });

  const filteredEarningsSum = r2(filteredServices.reduce((sum, s) => sum + getEarning(s), 0));

  const getServiceLabel = (typeId: string) => {
    const conf = serviceConfigs.find(c => c.id === typeId);
    return conf ? conf.name : typeId;
  };

  const orderIdsMatched = Array.from(new Set(filteredServices.map(s => s.orderId)));
  const mechanicOrdersFiltered = orders.filter(o => orderIdsMatched.includes(o.id));

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      {/* Bio banner */}
      <div className="bg-gradient-to-r from-cyan-600 to-indigo-700 rounded-2xl p-5 mb-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-black text-cyan-200">ჩემი პანელი</span>
          <h2 className="text-xl font-black font-sans mt-0.5">
            გამარჯობა, {currentUser.firstName} {currentUser.lastName}!
          </h2>
          <p className="text-[11px] text-cyan-100/90 mt-1 font-sans">
            აქ ნახავთ თქვენს მიერ შესრულებულ სამუშაოებს და დარიცხულ წილს (მხოლოდ გადახდილი ავტომობილები, გადახდის თარიღით).
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center">
          <Wrench className="w-40 h-40 rotate-[35deg] translate-x-10 translate-y-10" />
        </div>
      </div>

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5">
        ჩემი ფინანსური მაჩვენებლები
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="col-span-2 bg-slate-900 border border-amber-500/30 p-3.5 rounded-xl shadow">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">მოსალოდნელი (გადაუხდელი) ხელფასი</span>
          <div className="text-xl font-black font-mono mt-1 text-amber-400">{expectedEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">{expectedCars} გადაუხდელი ავტომობილიდან — დაგერიცხებათ გადახდისთანავე</p>
        </div>
        <div className="col-span-2 bg-slate-900 border border-rose-500/20 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">დღევანდელი ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-rose-300">{todayEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">{formatDateDDMMYYYY(ranges.today)}</p>
          <div className="absolute right-2 bottom-1 text-rose-500/10"><Sun className="w-10 h-10 -mr-2 -mb-2" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">კვირის ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-cyan-400">{weekEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">ორშაბათიდან კვირის ჩათვლით</p>
          <div className="absolute right-2 bottom-1 text-cyan-500/10"><Calendar className="w-10 h-10 -mr-2 -mb-2" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">თვის ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-emerald-400">{monthEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">მთელი მიმდინარე თვე</p>
          <div className="absolute right-2 bottom-1 text-emerald-500/10"><Briefcase className="w-10 h-10 -mr-2 -mb-2" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">წლის ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-amber-500">{yearEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">მთელი მიმდინარე წელი</p>
          <div className="absolute right-2 bottom-1 text-amber-500/10"><Clock className="w-10 h-10 -mr-2 -mb-2" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ჯამური გამომუშავება</span>
          <div className="text-xl font-black font-mono mt-1 text-indigo-400">{totalLifetimeEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">მთლიანი მუშაობის პერიოდი</p>
          <div className="absolute right-2 bottom-1 text-indigo-500/10"><DollarSign className="w-10 h-10 -mr-2 -mb-2" /></div>
        </div>
      </div>

      <div className="mb-5 space-y-2">
        <DayFilter from={startDate} to={endDate} onChange={(f, t) => { setStartDate(f); setEndDate(t); }} accent="cyan" title="გამომუშავების ფილტრი დღის / თარიღის მიხედვით" />
        {(startDate || endDate) && (
          <div className="bg-slate-900 border border-cyan-500/30 p-3 rounded-lg flex items-center justify-between text-xs font-sans">
            <span className="text-[10px] text-slate-400 uppercase font-black">გაფილტრული წილი:</span>
            <span className="font-mono text-emerald-400 font-extrabold text-sm">{filteredEarningsSum.toLocaleString()} ₾</span>
          </div>
        )}
      </div>

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-3">
        დავალებები ჩემი მონაწილეობით ({mechanicOrdersFiltered.length})
      </h3>

      {mechanicOrdersFiltered.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs">
          ითავებდა ან მითითებულ შუალედში დავალებები არ ფიქსირდება.
        </div>
      ) : (
        <div className="space-y-4">
          {mechanicOrdersFiltered.map(order => {
            const myOrderServices = filteredServices.filter(s => s.orderId === order.id);
            const myEarnOnThisOrder = myOrderServices.reduce((sum, s) => sum + getEarning(s), 0);
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                onClick={() => onSelectOrder(order.id)}
                className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow hover:border-slate-700 cursor-pointer group transition-all"
              >
                <div className="flex justify-between items-start border-b border-slate-800/60 pb-2 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono leading-none">{formatDateDDMMYYYY(order.date)}</span>
                    <h4 className="text-sm font-black text-slate-200 uppercase tracking-tight">{order.carBrand}</h4>
                  </div>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-300">{order.carNumber}</span>
                </div>
                <div className="space-y-1 mb-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-bold block mb-1">ჩემი შესრულებული მომსახურებები:</span>
                  {myOrderServices.map(srv => (
                    <div key={srv.id} className="text-[11px] text-slate-300 flex justify-between gap-2">
                      <span>• {getServiceLabel(srv.serviceType)} — {srv.description}</span>
                      <span className="text-cyan-400 font-mono font-bold whitespace-nowrap">+{getEarning(srv)} ₾ <span className="text-slate-500 font-normal">({formatSharePct(getEarning(srv), srv.price)})</span></span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/40 text-xs text-slate-400">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    order.status === 'completed' ? 'bg-green-950/40 border border-green-500/20 text-green-400'
                    : order.status === 'pending' ? 'bg-sky-950/40 border border-sky-500/20 text-sky-400'
                    : 'bg-amber-950/40 border border-amber-500/20 text-amber-400'
                  }`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
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

// ──────────────────────────────────────────────
// Main export — switches based on role
// ──────────────────────────────────────────────
export default function MechanicPanelView(props: MechanicPanelViewProps) {
  if (isOwnerLike(props.currentUser.role)) {
    return (
      <OwnerProfitView
        orders={props.orders}
        services={props.services}
        allUsers={props.allUsers}
        serviceConfigs={props.serviceConfigs}
        onSelectOrder={props.onSelectOrder}
      />
    );
  }
  return <EmployeeEarningsView {...props} />;
}
