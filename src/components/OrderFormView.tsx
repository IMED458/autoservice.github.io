/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CarServiceOrder, OrderStatus, PaymentStatus } from '../types';
import { Calendar, Car, User, Phone, Edit3, Gauge, Plus, FileText, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderFormViewProps {
  onAddOrder: (order: Omit<CarServiceOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  onCancel: () => void;
}

export default function OrderFormView({ onAddOrder, onCancel }: OrderFormViewProps) {
  // Set default date to today in local timezone
  const todayStr = new Date().toISOString().substring(0, 10);

  const [date, setDate] = useState(todayStr);
  const [carBrand, setCarBrand] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [clientFullName, setClientFullName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [status, setStatus] = useState<OrderStatus>('new');
  const [odo, setOdo] = useState<number | string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    // No fields are mandatory anymore.
    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validate();

    onAddOrder({
      date: date || todayStr,
      carBrand: carBrand.trim() || 'არაა მითითებული',
      carNumber: carNumber.trim().toUpperCase() || 'არაა მითითებული',
      clientFullName: clientFullName.trim() || 'არაა მითითებული',
      clientPhone: clientPhone.trim() || 'არაა მითითებული',
      problemDescription: problemDescription.trim() || 'არაა აღწერილი',
      status,
      odo: odo === '' ? 0 : Number(odo),
      paymentStatus,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-center gap-2">
          <span className="bg-amber-500/10 p-2 rounded-xl text-amber-500 border border-amber-500/20">
            <Plus className="w-5 h-5" />
          </span>
          ახალი მანქანის რეგისტრაცია
        </h2>
        <button
          id="cancel-reg-btn"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          უკან დაბრუნება
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        {/* Date Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            მიღების თარიღი *
          </label>
          <input
            id="reg-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>

        {/* Car Brand */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-500" />
            მანქანის მარკა და მოდელი
          </label>
          <input
            id="reg-carBrand"
            type="text"
            value={carBrand}
            onChange={(e) => setCarBrand(e.target.value)}
            placeholder="მაგ: Toyota Prius, BMW X5 ფერი შავი"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600"
          />
          {errors.carBrand && <p className="text-red-500 text-xs mt-1">{errors.carBrand}</p>}
        </div>

        {/* Car State Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            მანქანის სახელმწიფო ნომერი
          </label>
          <input
            id="reg-carNumber"
            type="text"
            value={carNumber}
            onChange={(e) => setCarNumber(e.target.value)}
            placeholder="მაგ: AB-123-CD ან ZZ-777-YY"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm uppercase text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600"
          />
          {errors.carNumber && <p className="text-red-500 text-xs mt-1">{errors.carNumber}</p>}
        </div>

        {/* ODO Mileage */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            გარბენი (ODO) მილები ან კმ
          </label>
          <input
            id="reg-odo"
            type="number"
            value={odo}
            onChange={(e) => setOdo(e.target.value)}
            placeholder="მაგ: 145000"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600"
          />
          {errors.odo && <p className="text-red-500 text-xs mt-1">{errors.odo}</p>}
        </div>

        {/* Client Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            კლიენტის სახელი და გვარი
          </label>
          <input
            id="reg-clientFullName"
            type="text"
            value={clientFullName}
            onChange={(e) => setClientFullName(e.target.value)}
            placeholder="მაგ: გიორგი იაშვილი"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600"
          />
          {errors.clientFullName && <p className="text-red-500 text-xs mt-1">{errors.clientFullName}</p>}
        </div>

        {/* Client Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            კლიენტის ტელეფონი
          </label>
          <input
            id="reg-clientPhone"
            type="text"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="მაგ: 599123456"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600"
          />
          {errors.clientPhone && <p className="text-red-500 text-xs mt-1">{errors.clientPhone}</p>}
        </div>

        {/* Problem Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            პრობლემის პირველადი აღწერა
          </label>
          <textarea
            id="reg-problemDescription"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="აღწერეთ რა პრობლემა აქვს ავტომობილს..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600"
          />
          {errors.problemDescription && <p className="text-red-500 text-xs mt-1">{errors.problemDescription}</p>}
        </div>

        {/* Status choices */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-sans">
              სამუშაო სტატუსი
            </label>
            <select
              id="reg-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 font-sans"
            >
              <option value="new">ახალი (მიღებული)</option>
              <option value="pending">პროცესშია</option>
              <option value="completed">დასრულებულია</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-sans">
              გადახდის სტატუსი
            </label>
            <select
              id="reg-paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 font-sans"
            >
              <option value="unpaid">გადაუხდელია</option>
              <option value="paid">გადახდილია</option>
            </select>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <button
            id="reg-cancel-action-btn"
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs active:scale-95 transition-transform cursor-pointer font-sans"
          >
            გაუქმება
          </button>
          <button
            id="reg-submit-btn"
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs active:scale-95 transition-transform cursor-pointer font-sans flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/5"
          >
            <CheckCircle className="w-4 h-4" />
            დარეგისტრირება
          </button>
        </div>
      </form>
    </motion.div>
  );
}
