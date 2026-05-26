/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CarServiceOrder,
  User,
  ServiceItem,
  OrderStatus,
  PaymentStatus,
  ServiceTypeConfig,
  calculateMechanicEarning,
  ROLE_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../types';
import {
  Wrench,
  User as UserIcon,
  Phone,
  Gauge,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Check,
  Edit,
  Save,
  ArrowLeft,
  Settings,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderDetailsViewProps {
  order: CarServiceOrder;
  services: ServiceItem[];
  mechanics: User[];
  allUsers: User[];
  currentUser: User;
  serviceConfigs: ServiceTypeConfig[];
  onSaveTransaction: (
    orderId: string,
    updatedOrder: CarServiceOrder,
    updatedServices: ServiceItem[]
  ) => void;
  onBack: () => void;
}

export default function OrderDetailsView({
  order,
  services,
  mechanics,
  allUsers,
  currentUser,
  serviceConfigs,
  onSaveTransaction,
  onBack,
}: OrderDetailsViewProps) {
  const isMechanic = currentUser.role === 'mechanic';

  // --- LOCAL TRANSATIONAL DRAFT STATES ---
  const [draftOrder, setDraftOrder] = useState<CarServiceOrder>({ ...order });
  const [draftServices, setDraftServices] = useState<ServiceItem[]>(() =>
    services.filter((s) => s.orderId === order.id)
  );

  // Sync draft states when original props change (re-initialization safety)
  useEffect(() => {
    setDraftOrder({ ...order });
    setDraftServices(services.filter((s) => s.orderId === order.id));
    setTempProblem(order.problemDescription);
  }, [order, services]);

  // --- Problem description edit state ---
  const [isEditingProblem, setIsEditingProblem] = useState(false);
  const [tempProblem, setTempProblem] = useState(draftOrder.problemDescription);

  // --- Inline Add Service Form ---
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [serviceType, setServiceType] = useState<string>(serviceConfigs[0]?.id || 'diagnostic');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState<number | string>('');
  const [selectedMechanicId, setSelectedMechanicId] = useState(
    isMechanic ? currentUser.id : mechanics[0]?.id || ''
  );
  const [serviceError, setServiceError] = useState('');

  // Handle default price change when selecting service category configs
  useEffect(() => {
    const selectedConf = serviceConfigs.find((c) => c.id === serviceType);
    if (selectedConf) {
      setServicePrice(selectedConf.defaultPrice);
    }
  }, [serviceType, serviceConfigs]);

  // --- Admin Core Fields Editing form ---
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [editBrand, setEditBrand] = useState(draftOrder.carBrand);
  const [editNumber, setEditNumber] = useState(draftOrder.carNumber);
  const [editClientName, setEditClientName] = useState(draftOrder.clientFullName);
  const [editPhone, setEditPhone] = useState(draftOrder.clientPhone);
  const [editOdo, setEditOdo] = useState<number>(draftOrder.odo);
  const [editProblem, setEditProblem] = useState(draftOrder.problemDescription);

  // --- Inline Service Editing states (Admin edit mechanic errors) ---
  const [editingSrvId, setEditingSrvId] = useState<string | null>(null);
  const [editSrvType, setEditSrvType] = useState('');
  const [editSrvDesc, setEditSrvDesc] = useState('');
  const [editSrvPriceValue, setEditSrvPriceValue] = useState<number | string>('');
  const [editSrvMechId, setEditSrvMechId] = useState('');

  // Auto update defaults when starting edit of recorded service
  const handleStartEditService = (srv: ServiceItem) => {
    setEditingSrvId(srv.id);
    setEditSrvType(srv.serviceType);
    setEditSrvDesc(srv.description);
    setEditSrvPriceValue(srv.price);
    setEditSrvMechId(srv.mechanicId);
  };

  const handleSaveEditServiceInline = () => {
    if (editSrvPriceValue === '' || Number(editSrvPriceValue) <= 0 || !editSrvDesc.trim()) {
      alert('გთხოვთ მიუთითოთ ვალიდური ფასი და აღწერა');
      return;
    }

    const updatedEarn = calculateMechanicEarning(editSrvType, Number(editSrvPriceValue), serviceConfigs);

    setDraftServices((prev) =>
      prev.map((s) => {
        if (s.id === editingSrvId) {
          return {
            ...s,
            serviceType: editSrvType,
            description: editSrvDesc.trim(),
            price: Number(editSrvPriceValue),
            mechanicId: editSrvMechId,
            mechanicEarning: updatedEarn,
          };
        }
        return s;
      })
    );
    setEditingSrvId(null);
  };

  // Totals calculations based on local draftServices list
  const totalCost = draftServices.reduce((sum, s) => sum + s.price, 0);
  const totalMechEarnings = draftServices.reduce((sum, s) => sum + s.mechanicEarning, 0);

  // Helpers to fetch dynamic labels
  const getServiceLabel = (typeId: string) => {
    const conf = serviceConfigs.find((c) => c.id === typeId);
    return conf ? conf.name : typeId;
  };

  // --- Handle Adding Service to Draft ---
  const handleAddNewServiceToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError('');

    if (servicePrice === '' || Number(servicePrice) < 0) {
      setServiceError('ფასი უნდა იყოს ნულზე მეტი ან ნულის ტოლი');
      return;
    }
    if (!serviceDescription.trim()) {
      setServiceError('სამუშაო აღწერა სავალდებულოა');
      return;
    }
    if (!selectedMechanicId) {
      setServiceError('გთხოვთ აირჩიოთ შემსრულებელი ხელოსანი');
      return;
    }

    const calculatedEarn = calculateMechanicEarning(serviceType, Number(servicePrice), serviceConfigs);

    const newDraftSrv: ServiceItem = {
      id: `srv-draft-${Date.now()}`,
      orderId: draftOrder.id,
      serviceType,
      description: serviceDescription.trim(),
      price: Number(servicePrice),
      mechanicId: selectedMechanicId,
      mechanicEarning: calculatedEarn,
      createdAt: new Date().toISOString(),
    };

    setDraftServices((prev) => [...prev, newDraftSrv]);

    // Automatically transition general order status to 'pending' from 'new' when work is added
    if (draftOrder.status === 'new') {
      setDraftOrder((prev) => ({ ...prev, status: 'pending' }));
    }

    // Reset fields
    setServiceDescription('');
    setShowAddServiceForm(false);
  };

  // --- Handle Deleting Service from Draft ---
  const handleDeleteServiceFromDraft = (srvId: string) => {
    setDraftServices((prev) => prev.filter((s) => s.id !== srvId));
  };

  // --- Handle Admin core edits save to draft ---
  const handleSaveAdminEditToDraft = () => {
    setDraftOrder((prev) => ({
      ...prev,
      carBrand: editBrand,
      carNumber: editNumber.toUpperCase(),
      clientFullName: editClientName,
      clientPhone: editPhone,
      odo: Number(editOdo),
      problemDescription: editProblem,
    }));
    setIsEditingAdmin(false);
  };

  // List of possible values for 'Paid To' person
  const paidToOptions = ['ზვიადი', ...allUsers.map((u) => u.firstName)];
  // Filter unique names
  const uniquePaidToOptions = Array.from(new Set(paidToOptions));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl"
    >
      {/* Back button and status header */}
      <div className="flex items-center justify-between mb-4">
        <button
          id="details-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          უკან დაბრუნება (გაუქმება)
        </button>

        <span className="text-xs text-slate-500 font-mono">ID: {draftOrder.id.split('-')[1] || draftOrder.id}</span>
      </div>

      {/* Main Order Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5 shadow-xl relative overflow-hidden">
        {/* Status Line */}
        <div
          className={`absolute top-0 inset-x-0 h-1.5 ${
            draftOrder.status === 'new'
              ? 'bg-amber-500'
              : draftOrder.status === 'pending'
              ? 'bg-sky-500'
              : 'bg-green-500'
          }`}
        />

        {!isEditingAdmin ? (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">ავტომობილი</span>
                <h2 className="text-xl font-bold font-sans text-slate-50 uppercase tracking-tight">
                  {draftOrder.carBrand}
                </h2>
              </div>
              <div className="bg-slate-950 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-sm font-mono font-black tracking-widest text-slate-100 shadow-inner">
                {draftOrder.carNumber}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-3 text-xs text-slate-300 border-t border-b border-slate-800 py-3.5 mb-4 font-sans">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide mb-0.5">კლიენტი</span>
                <span className="font-semibold text-slate-200">{draftOrder.clientFullName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide mb-0.5">ტელეფონი</span>
                <a href={`tel:${draftOrder.clientPhone}`} className="text-amber-400 font-semibold underline">
                  {draftOrder.clientPhone}
                </a>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide mb-0.5">მიღების თარიღი</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> {draftOrder.date}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide mb-0.5">გარბენი (ODO)</span>
                <span className="flex items-center gap-1 font-mono">
                  <Gauge className="w-3 h-3 text-slate-500" /> {draftOrder.odo.toLocaleString()} კმ
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide">პრობლემის აღწერა:</span>
                {!isEditingProblem ? (
                  <button
                    id="edit-problem-desc-btn"
                    onClick={() => {
                      setTempProblem(draftOrder.problemDescription);
                      setIsEditingProblem(true);
                    }}
                    className="text-[10px] text-amber-500 hover:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800"
                  >
                    შეცვლა / რედაქტირება
                  </button>
                ) : null}
              </div>

              {!isEditingProblem ? (
                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 italic">
                  {draftOrder.problemDescription || 'აღწერა არ არის მითითებული'}
                </p>
              ) : (
                <div className="space-y-2">
                  <textarea
                    id="edit-problem-textarea"
                    value={tempProblem}
                    onChange={(e) => setTempProblem(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                    placeholder="შეიყვანეთ პრობლემის დეტალური აღწერა..."
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      id="cancel-edit-problem-btn"
                      type="button"
                      onClick={() => setIsEditingProblem(false)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-850 cursor-pointer"
                    >
                      გაუქმება
                    </button>
                    <button
                      id="save-edit-problem-btn"
                      type="button"
                      onClick={() => {
                        setDraftOrder((prev) => ({ ...prev, problemDescription: tempProblem }));
                        setIsEditingProblem(false);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      დრაფტში შენახვა
                    </button>
                  </div>
                </div>
              )}
            </div>

            {currentUser.role === 'admin' && (
              <button
                id="edit-admin-trigger-btn"
                onClick={() => {
                  setEditBrand(draftOrder.carBrand);
                  setEditNumber(draftOrder.carNumber);
                  setEditClientName(draftOrder.clientFullName);
                  setEditPhone(draftOrder.clientPhone);
                  setEditOdo(draftOrder.odo);
                  setEditProblem(draftOrder.problemDescription);
                  setIsEditingAdmin(true);
                }}
                className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                მონაცემების რედაქტირება (მხოლოდ ადმინი)
              </button>
            )}
          </div>
        ) : (
          /* Admin Quick Edit Inputs Form */
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-amber-500 font-sans mb-1">
              ინფორმაციის განახლება (ადმინი)
            </h3>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">მარკა და მოდელი</label>
              <input
                id="edit-car-brand"
                type="text"
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">სახ. ნომერი</label>
                <input
                  id="edit-car-number"
                  type="text"
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 text-center uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">გარბენი (ODO)</label>
                <input
                  id="edit-car-odo"
                  type="number"
                  value={editOdo}
                  onChange={(e) => setEditOdo(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">კლიენტის სახელი, გვარი</label>
              <input
                id="edit-client-name"
                type="text"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">კლიენტის ტელეფონი</label>
              <input
                id="edit-client-phone"
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">პრობლემის აღწერა</label>
              <textarea
                id="edit-client-problem"
                value={editProblem}
                onChange={(e) => setEditProblem(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                id="edit-admin-cancel"
                type="button"
                onClick={() => setIsEditingAdmin(false)}
                className="py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-xs font-semibold cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                id="edit-admin-save"
                type="button"
                onClick={handleSaveAdminEditToDraft}
                className="py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
              >
                დრაფტში შენახვა
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Controls Section: Status & Payment Toggler */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 font-sans">
          შეკვეთის მართვა და სტატუსები
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Work Status Toggle (Admins and mechanics both can update. Handyman must update to pending or complete!) */}
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">სამუშაოს მსვლელობა:</span>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['new', 'pending', 'completed'] as OrderStatus[]).map((st) => {
                const isActive = draftOrder.status === st;
                return (
                  <button
                    id={`status-toggle-${st}`}
                    key={st}
                    onClick={() => setDraftOrder((prev) => ({ ...prev, status: st }))}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? st === 'new'
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : st === 'pending'
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-green-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[st]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Status Toggle (Admin Only is allowed to change as requested "ადმინს უნდა შეეძლოს გადახდის სტატუსის მითითება") */}
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">
              გადახდის სტატუსი {isMechanic && ' (მხოლოდ ადმინი)'}:
            </span>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['unpaid', 'paid'] as PaymentStatus[]).map((pay) => {
                const isActive = draftOrder.paymentStatus === pay;
                return (
                  <button
                    id={`pay-toggle-${pay}`}
                    key={pay}
                    disabled={isMechanic}
                    onClick={() => {
                      setDraftOrder((prev) => ({
                        ...prev,
                        paymentStatus: pay,
                        paidTo: pay === 'paid' ? prev.paidTo || 'ზვიადი' : undefined,
                      }));
                    }}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                      isMechanic ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      isActive
                        ? pay === 'paid'
                          ? 'bg-green-500 text-slate-950 font-bold'
                          : 'bg-rose-500 text-slate-100 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {PAYMENT_STATUS_LABELS[pay]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ვისთან გადაიხადა (Paid To) field */}
        {draftOrder.paymentStatus === 'paid' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <label className="block text-[10px] text-amber-500 uppercase font-bold">ვისთან მოხდა გადახდა ? *</label>
              <span className="text-[10px] text-slate-500">(50% ხელოსანს / 50% მიმღებს)</span>
            </div>
            <select
              id="paid-to-select"
              disabled={isMechanic} // Default/admin sets this
              value={draftOrder.paidTo || 'ზვიადი'}
              onChange={(e) => setDraftOrder((prev) => ({ ...prev, paidTo: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-sans cursor-pointer focus:outline-none focus:border-amber-500/50"
            >
              {uniquePaidToOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </div>

      {/* Services List Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-5">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/85 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-sans">მომსახურებების სია (დრაფტი)</h3>
            <span className="text-[10px] text-slate-500 font-sans">სამუშაოები რომელიც შეინახება შენახვისას</span>
          </div>

          {/* Add Service Button */}
          <button
            id="toggle-add-service-btn"
            onClick={() => setShowAddServiceForm(!showAddServiceForm)}
            className="flex items-center gap-1 text-xs text-slate-950 bg-amber-500 hover:bg-amber-600 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" /> დამატება
          </button>
        </div>

        {/* Inline Add Service Form Popover/Drawer */}
        <AnimatePresence>
          {showAddServiceForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddNewServiceToDraft}
              className="mb-4 bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3 overflow-hidden"
            >
              <h4 className="text-xs font-bold text-amber-500 font-sans flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5" /> მომსახურების ჩაწერა დრაფტში
              </h4>

              {serviceError && (
                <div className="p-2 bg-red-950/40 border border-red-500/20 text-red-500 text-[11px] rounded-lg">
                  {serviceError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {/* Service Type Pick */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">მომსახურების ტიპი</label>
                  <select
                    id="new-service-type"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    {serviceConfigs.map((cfg) => (
                      <option key={cfg.id} value={cfg.id}>
                        {cfg.name} (default {cfg.defaultPrice}₾)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Price */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">ფასი (ლარი) *</label>
                  <input
                    id="new-service-price"
                    type="number"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    placeholder="მაგ: 150"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Automatic Earning Hint Area */}
              <div className="bg-slate-900 p-2 border border-slate-800/60 rounded-lg text-[10.5px] text-slate-400">
                <span className="font-semibold block mb-0.5 text-slate-300">ხელოსნის შემოსავალი (ავტომატური):</span>
                {(() => {
                  const conf = serviceConfigs.find((c) => c.id === serviceType);
                  if (conf) {
                    if (conf.rewardType === 'flat') {
                      return (
                        <p>
                          ფიქსირებული = ხელოსანს ერიცხება ფიქსირებულად{' '}
                          <span className="text-emerald-400 font-bold font-mono">{conf.flatReward} ლარი</span>
                        </p>
                      );
                    } else {
                      const earn = Number(servicePrice) > 0 ? (Number(servicePrice) * conf.percentageReward) / 100 : 0;
                      return (
                        <p>
                          ფასის {conf.percentageReward}% ={' '}
                          <span className="text-emerald-400 font-bold font-mono">{earn.toFixed(1)} ლარი</span>
                        </p>
                      );
                    }
                  }
                  return <p>ფასის 50%</p>;
                })()}
              </div>

              {/* Performer Mechanic selection */}
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">სამუშაოს შემსრულებელი ხელოსანი *</label>
                <select
                  id="new-service-mechanic"
                  disabled={isMechanic} // Handyman defaults to assignment on themselves
                  value={selectedMechanicId}
                  onChange={(e) => setSelectedMechanicId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-sans"
                >
                  {mechanics.map((mech) => (
                    <option key={mech.id} value={mech.id}>
                      {mech.firstName} {mech.lastName} ({ROLE_LABELS[mech.role]})
                    </option>
                  ))}
                </select>
                {isMechanic && (
                  <span className="text-[9px] text-slate-500 italic block mt-0.5 leading-none">
                    მომსახურება დაგეწერებათ საკუთარ თავზე ({currentUser.firstName})
                  </span>
                )}
              </div>

              {/* Detail description */}
              <div>
                <label className="block text-[10px] text-slate-450 mb-0.5">გაწეული მომსახურების დეტალური აღწერა *</label>
                <input
                  id="new-service-desc"
                  type="text"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="მაგ: უცხო კოდების წაშლა, კოჭის შეცვლა..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="cancel-add-srv-btn"
                  type="button"
                  onClick={() => setShowAddServiceForm(false)}
                  className="py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  id="add-srv-btn"
                  type="submit"
                  className="py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> დამატება დრაფტში
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Existing services items table breakdown */}
        {draftServices.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-850/60 font-sans text-xs">
            მომსახურებები ჯერ არ არის ჩაწერილი დრაფტში. ჩასაწერად დააკლიკეთ ზედა „დამატება“ ღილაკს.
          </div>
        ) : (
          <div className="space-y-3">
            {draftServices.map((srv) => {
              const isEditingThisSrv = editingSrvId === srv.id;
              const mechObj = mechanics.find((m) => m.id === srv.mechanicId) || {
                firstName: 'უცნობი',
                lastName: 'ხელოსანი',
              };

              return (
                <div
                  key={srv.id}
                  className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl block relative space-y-3"
                >
                  {isEditingThisSrv ? (
                    /* Inline service edit form (Admins only to override mechanic mistakes) */
                    <div className="space-y-2 text-xs">
                      <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest pl-1">
                        მომსახურების შესწორება (ადმინი)
                      </h4>

                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">კატეგორია</label>
                        <select
                          value={editSrvType}
                          onChange={(e) => setEditSrvType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 py-1 px-2.5 text-slate-200"
                        >
                          {serviceConfigs.map((cfg) => (
                            <option key={cfg.id} value={cfg.id}>
                              {cfg.name} (default {cfg.defaultPrice}₾)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">ფასი (₾)</label>
                          <input
                            type="number"
                            value={editSrvPriceValue}
                            onChange={(e) => setEditSrvPriceValue(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 px-2.5 text-slate-200 font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">ხელოსანი</label>
                          <select
                            value={editSrvMechId}
                            onChange={(e) => setEditSrvMechId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 px-2.5 text-slate-200"
                          >
                            {allUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">დასახელება / აღწერა</label>
                        <input
                          type="text"
                          value={editSrvDesc}
                          onChange={(e) => setEditSrvDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1.5">
                        <button
                          onClick={() => setEditingSrvId(null)}
                          className="py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          გაუქმება
                        </button>
                        <button
                          onClick={handleSaveEditServiceInline}
                          className="py-1.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> შენახვა
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* General service card detail */
                    <div className="flex items-center justify-between gap-3 font-sans">
                      <div className="flex-1 space-y-1">
                        {/* Header: Service Category Name */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-[10px] bg-slate-900 border border-slate-800 text-amber-500 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {getServiceLabel(srv.serviceType)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            ხელოსანი: <b className="text-slate-400">{mechObj.firstName} {mechObj.lastName}</b>
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 font-medium pl-0.5 leading-snug">
                          {srv.description}
                        </p>

                        <div className="text-[10.5px] text-slate-400 flex items-center gap-2 pt-0.5">
                          <span>ფასი: <b className="text-slate-150 font-mono">{srv.price} ლარი</b></span>
                          <span className="text-slate-600">|</span>
                          <span>გამომუშავება: <b className="text-cyan-400 font-mono">{srv.mechanicEarning} ლარი</b></span>
                        </div>
                      </div>

                      {/* Deletion (Mechanic and Admin both can delete recorded services from local draft!) */}
                      <div className="flex items-center gap-1">
                        {!isMechanic && (
                          <button
                            onClick={() => handleStartEditService(srv)}
                            className="p-2 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer"
                            title="მომსახურების რედაქტირება"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          id={`delete-srv-${srv.id}`}
                          onClick={() => {
                            if (confirm('ნამდვილად გსურთ ამ მომსახურების ამოღება? (ცვლილებები ძალაში შევა შენახვისას)')) {
                              handleDeleteServiceFromDraft(srv.id);
                            }
                          }}
                          className="p-2 border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 text-red-100 hover:text-red-300 rounded-xl transition-all cursor-pointer"
                          title="მომსახურების წაშლა"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Total Summary Footer of list */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 mt-4 text-xs font-sans shadow-inner">
              <div className="flex justify-between items-center text-slate-400">
                <span>ჯამური ღირებულება:</span>
                <span className="text-slate-100 font-mono font-extrabold text-sm">{totalCost} ₾</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800/60">
                <span>ხელოსნების ჯამური გამომუშავება:</span>
                <span className="text-cyan-400 font-mono font-extrabold text-sm">{totalMechEarnings} ₾</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BIG ACTION TRANSACTION SAVE BUTTON FOR CAR SERVICE MANAGMENT */}
      <div className="pt-2 pb-6">
        <button
          id="btn-save-entire-transaction"
          onClick={() => {
            onSaveTransaction(order.id, draftOrder, draftServices);
          }}
          className="w-full py-4.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl shadow-xl text-xs uppercase tracking-widest cursor-pointer active:scale-95 hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 border border-amber-400/20"
        >
          <Save className="w-4.5 h-4.5 stroke-[2.5]" />
          ყველა ცვლილების შენახვა
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          ყველა შეყვანილი სერვისი, სტატუსი და პარამეტრი შეინახება ერთიან ტრანზაქციად.
        </p>
      </div>
    </motion.div>
  );
}
