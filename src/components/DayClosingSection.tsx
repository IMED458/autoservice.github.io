// ფაილი მდებარეობს: /src/components/DayClosingSection.tsx
import React, { useState } from 'react';
import { ProductSale, CarServiceOrder, DailyClosing, Role, ServiceItem } from '../types';
import { Lock, Clock, CheckCircle2, Printer, Check } from 'lucide-react';

interface DayClosingSectionProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  productSales: ProductSale[];
  dailyClosings: DailyClosing[];
  currentUser: { role: Role; firstName: string; lastName: string };
  onConfirmCloseDay: (closing: Omit<DailyClosing, 'id' | 'createdAt'>) => void;
}

export default function DayClosingSection({
  orders,
  services,
  productSales,
  dailyClosings,
  currentUser,
  onConfirmCloseDay,
}: DayClosingSectionProps) {
  const [closingNote, setClosingNote] = useState('დღიური ფინანსური ნაშთი ემთხვევა სალაროს. ხარვეზები არ დაფიქსირებულა.');
  const [lastClosedReport, setLastClosedReport] = useState<DailyClosing | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const isAlreadyClosed = dailyClosings.some((c) => c.date === todayStr);
  const activeClosingInfo = dailyClosings.find((c) => c.date === todayStr);

  // ფინანსებისა და სერვისების დაჯამება
  const todayOrders = orders.filter((o) => o.date === todayStr);
  const todayServicesRevenue = todayOrders.reduce((sum, o) => {
    if (o.paymentStatus === 'paid') {
      const orderServices = services.filter((s) => s.orderId === o.id);
      return sum + orderServices.reduce((sSum, s) => sSum + s.price, 0);
    }
    return sum;
  }, 0);

  const todayProductSales = productSales.filter((s) => s.date === todayStr);
  const todayProductsPaidRevenue = todayProductSales.reduce((sum, s) => s.paymentStatus === 'paid' ? sum + s.finalAmount : sum, 0);

  const grandTotalReceivedToday = todayServicesRevenue + todayProductsPaidRevenue;

  const handleCloseDayFinal = () => {
    if (isAlreadyClosed) return;

    const closingPayload = {
      date: todayStr,
      startTime: '09:00',
      closingTime: new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }),
      totalReceived: grandTotalReceivedToday,
      totalOutstanding: todayProductSales.reduce((sum, s) => s.paymentStatus === 'unpaid' ? sum + s.finalAmount : sum, 0),
      productSalesCount: todayProductSales.length,
      servicesCount: todayOrders.length,
      productRevenue: todayProductsPaidRevenue,
      serviceRevenue: todayServicesRevenue,
      productProfit: todayProductsPaidRevenue * 0.3, // მიახლოებითი მარჟა
      totalCash: grandTotalReceivedToday * 0.8, // ნაღდი
      totalCard: 0,
      totalTbc: 0,
      totalBog: 0,
      totalTransfer: grandTotalReceivedToday * 0.2, // გადარიცხვა
      itemsSold: [],
      servicesDone: [],
      closedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      note: closingNote.trim(),
    };

    onConfirmCloseDay(closingPayload);
    setLastClosedReport(closingPayload as DailyClosing);
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {isAlreadyClosed ? (
        <div className="p-4 bg-emerald-950/25 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">დღევანდელი სამუშაო დღე წარმატებით დახურულია!</h4>
            <p className="text-slate-400 text-[10.5px] mt-0.5">სალარო დაარქივებულია. ცვლილებების უფლება აქვთ მხოლოდ სუპერ ადმინისტრატორებს.</p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-950/25 border border-amber-500/20 text-amber-400 rounded-xl flex items-center gap-2.5 animate-pulse">
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">მიმდინარე აქტიური დღის აღრიცხვა</h4>
            <p className="text-slate-400 text-[10.5px] mt-0.5">ნებისმიერი ახალი გაყიდვა ან ხელობა ავტომატურად აისახება რეალურად.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <h3 className="text-slate-400 uppercase font-bold">ხელოსნების ნავაჭრი სერვისებზე</h3>
          <span className="text-2xl font-mono font-black text-indigo-400 block mt-2">+{todayServicesRevenue.toLocaleString()} ₾</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <h3 className="text-slate-400 uppercase font-bold">მაღაზიის ნავაჭრი პროდუქტზე</h3>
          <span className="text-2xl font-mono font-black text-amber-500 block mt-2">+{todayProductsPaidRevenue.toLocaleString()} ₾</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5">
        <div className="flex justify-between border-b border-slate-800 pb-2.5">
          <span className="text-slate-200 uppercase font-black">სულ დღიური შემოსავალი სალაროში:</span>
          <span className="text-emerald-400 font-mono font-bold text-base">{grandTotalReceivedToday.toLocaleString()} ₾</span>
        </div>
        {!isAlreadyClosed ? (
          <div className="space-y-3 pt-2">
            <input placeholder="ჩაწერეთ შენიშვნები..." value={closingNote} onChange={(e) => setClosingNote(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none" />
            <button onClick={handleCloseDayFinal} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10.5px] rounded-lg tracking-wider flex items-center gap-1.5 cursor-pointer">
              <Check className="w-4 h-4" /> დღის დახურვა & დაარქივება
            </button>
          </div>
        ) : (
          <div className="space-y-2 select-text text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
            <p>დამხურავი: {activeClosingInfo?.closedBy}</p>
            <p>დახურვის დრო: {activeClosingInfo?.startTime} - {activeClosingInfo?.closingTime}</p>
            {activeClosingInfo?.note && <p className="italic text-slate-400">"{activeClosingInfo.note}"</p>}
          </div>
        )}
      </div>
    </div>
  );
}
