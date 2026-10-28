import { useState } from 'react';
import {
  CarServiceOrder, User, ServiceItem, ServiceTypeConfig, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS,
  findOwnerId, getCompletedDate, getServiceShares, getUserServiceEarning, isAdminRole, isServiceParticipant,
  splitServiceMoney, formatSharePct,
} from '../types';
import { Hourglass, Car, Users, ArrowRight } from 'lucide-react';
import { formatDateDDMMYYYY, isDateInRange } from '../utils/date';
import DayFilter from './DayFilter';

interface UnpaidViewProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  allUsers: User[];
  currentUser: User;
  serviceConfigs: ServiceTypeConfig[];
  onSelectOrder: (id: string) => void;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Unpaid cars and the wages that will accrue once they are paid */
export default function UnpaidView({ orders, services, allUsers, currentUser, serviceConfigs, onSelectOrder }: UnpaidViewProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const seeAll = isAdminRole(currentUser.role);
  const ownerId = findOwnerId(allUsers);
  const userName = (id: string) => {
    const u = allUsers.find(x => x.id === id);
    return u ? `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}` : 'უცნობი';
  };
  const getServiceLabel = (typeId: string) => serviceConfigs.find(c => c.id === typeId)?.name || typeId;

  const unpaidOrders = orders
    .filter(o => o.paymentStatus !== 'paid' && isDateInRange(o.date, dateFrom, dateTo))
    .map(o => ({ order: o, srvs: services.filter(s => s.orderId === o.id) }))
    .filter(x => x.srvs.length > 0)
    .filter(x => seeAll || x.srvs.some(s => isServiceParticipant(s, currentUser.id)))
    .sort((a, b) => (b.order.date || '').localeCompare(a.order.date || ''));

  const totalDue = r2(unpaidOrders.reduce((a, x) => a + x.srvs.reduce((b, s) => b + s.price, 0), 0));
  const myExpected = r2(unpaidOrders.reduce((a, x) => a + x.srvs.reduce((b, s) =>
    b + (currentUser.id === ownerId ? splitServiceMoney(s, ownerId).ownerTotal : getUserServiceEarning(s, currentUser.id, ownerId)), 0), 0));

  // Expected wages per person (owner = executor share + owner share)
  const perEmployee = new Map<string, number>();
  if (seeAll) {
    unpaidOrders.forEach(({ srvs }) => srvs.forEach(s => {
      getServiceShares(s, ownerId).forEach(sh => {
        if (sh.mechanicId === ownerId) return;
        perEmployee.set(sh.mechanicId, (perEmployee.get(sh.mechanicId) || 0) + sh.earning);
      });
      if (ownerId) perEmployee.set(ownerId, (perEmployee.get(ownerId) || 0) + splitServiceMoney(s, ownerId).ownerTotal);
    }));
  }
  const perEmployeeList = Array.from(perEmployee.entries())
    .map(([id, amount]) => ({ id, amount: r2(amount) }))
    .filter(x => x.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
  const totalWages = r2(perEmployeeList.filter(x => x.id !== ownerId).reduce((a, x) => a + x.amount, 0));

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      <div className="bg-gradient-to-r from-rose-700 to-amber-700 rounded-2xl p-5 mb-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-black text-rose-100">გადაუხდელი ავტომობილები</span>
          <h2 className="text-xl font-black mt-0.5">მოსალოდნელი ხელფასები</h2>
          <p className="text-[11px] text-rose-50/90 mt-1">ხელფასი დაირიცხება ავტომატურად ავტომობილის გადახდისთანავე, გადახდის თარიღით.</p>
        </div>
        <Hourglass className="absolute right-2 bottom-2 w-24 h-24 opacity-10" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">გადაუხდელი ავტომობილი</span>
          <div className="text-xl font-black font-mono mt-1 text-rose-400">{unpaidOrders.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">{seeAll ? 'გადასახდელი ჯამი' : 'ავტომობილების ჯამი'}</span>
          <div className="text-xl font-black font-mono mt-1 text-slate-100">{totalDue.toLocaleString()} ₾</div>
        </div>
        <div className="col-span-2 bg-slate-900 border border-amber-500/30 p-3.5 rounded-xl">
          <span className="text-[10px] text-amber-400 font-bold uppercase block">ჩემი მოსალოდნელი ხელფასი</span>
          <div className="text-2xl font-black font-mono mt-1 text-amber-400">{myExpected.toLocaleString()} ₾</div>
        </div>
        {seeAll && (
          <div className="col-span-2 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">ხელოსნების მოსალოდნელი ხელფასები (ჯამი)</span>
            <div className="text-xl font-black font-mono mt-1 text-cyan-400">{totalWages.toLocaleString()} ₾</div>
          </div>
        )}
      </div>

      <div className="mb-5">
        <DayFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} title="ფილტრი მომსახურების თარიღით" />
      </div>

      {seeAll && perEmployeeList.length > 0 && (
        <>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> მოსალოდნელი ხელფასი თანამშრომლების მიხედვით
          </h3>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2">
            {perEmployeeList.map(x => (
              <div key={x.id} className="flex items-center justify-between gap-2 py-1 border-b border-slate-800/40 last:border-0">
                <span className="text-sm text-slate-300 font-semibold">{userName(x.id)}{x.id === ownerId && <span className="text-[10px] text-amber-400 ml-1">(შემსრ. + მფლობ.)</span>}</span>
                <span className={`font-mono font-bold ${x.id === ownerId ? 'text-amber-400' : 'text-cyan-400'}`}>{x.amount.toLocaleString()} ₾</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5 flex items-center gap-1.5">
        <Car className="w-3.5 h-3.5" /> ავტომობილები ({unpaidOrders.length})
      </h3>
      <div className="space-y-3">
        {unpaidOrders.length === 0 && (
          <div className="p-6 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs">გადაუხდელი ავტომობილები არ არის</div>
        )}
        {unpaidOrders.map(({ order, srvs }) => {
          const orderTotal = r2(srvs.reduce((a, s) => a + s.price, 0));
          const myShare = r2(srvs.reduce((a, s) => a + (currentUser.id === ownerId ? splitServiceMoney(s, ownerId).ownerTotal : getUserServiceEarning(s, currentUser.id, ownerId)), 0));
          const completed = getCompletedDate(order);
          return (
            <div key={order.id} onClick={() => onSelectOrder(order.id)}
              className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl shadow hover:border-slate-700 cursor-pointer">
              <div className="flex justify-between items-start gap-2 border-b border-slate-800/60 pb-2 mb-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-slate-200 uppercase truncate">{order.carBrand}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">რეგ.: {formatDateDDMMYYYY(order.date)} · დასრ.: {completed ? formatDateDDMMYYYY(completed) : '—'}</span>
                </div>
                <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-200 whitespace-nowrap">{order.carNumber}</span>
              </div>
              <div className="space-y-1.5 mb-2">
                {srvs.filter(s => seeAll || isServiceParticipant(s, currentUser.id)).map(srv => {
                  const shares = getServiceShares(srv, ownerId);
                  const m = splitServiceMoney(srv, ownerId);
                  return (
                    <div key={srv.id} className="text-[11px] bg-slate-950/70 border border-slate-800/60 rounded-lg p-2">
                      <div className="flex justify-between gap-2 text-slate-300">
                        <span className="min-w-0 break-words">• {getServiceLabel(srv.serviceType)} — {srv.description}</span>
                        <span className="font-mono text-slate-100 whitespace-nowrap">{srv.price} ₾</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ხელოსანი: {shares.map(sh => userName(sh.mechanicId)).join(', ')}</div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                        {seeAll ? (
                          <>
                            {shares.filter(sh => sh.mechanicId !== ownerId).map((sh, i) => (
                              <span key={i}>{allUsers.find(u => u.id === sh.mechanicId)?.firstName}: <b className="text-cyan-400 font-mono">{sh.earning} ₾</b> ({formatSharePct(sh.earning, srv.price)})</span>
                            ))}
                            <span>ზვიადი: <b className="text-amber-400 font-mono">{m.ownerTotal} ₾</b> ({formatSharePct(m.ownerTotal, srv.price)})</span>
                          </>
                        ) : (
                          <span>ჩემი წილი: <b className="text-cyan-400 font-mono">{getUserServiceEarning(srv, currentUser.id, ownerId)} ₾</b></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/40 text-[11px]">
                <div className="flex gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-bold">{ORDER_STATUS_LABELS[order.status]}</span>
                </div>
                <div className="text-right font-mono">
                  {seeAll && <div className="text-slate-200">გადასახდელი: <b>{orderTotal} ₾</b></div>}
                  <div className="text-amber-400 font-bold">ჩემი: {myShare} ₾</div>
                </div>
              </div>
              <div className="text-amber-500 text-[11px] font-semibold flex items-center gap-1 justify-end mt-1">შესვლა <ArrowRight className="w-3 h-3" /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
