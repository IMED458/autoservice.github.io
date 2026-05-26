/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Role, ROLE_LABELS, ServiceTypeConfig } from '../types';
import { hashPassword } from '../utils/crypto';
import { Users, Plus, KeyRound, UserPlus, Trash2, Shield, Wrench, AlertCircle, Edit, Save, Trash, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface EmployeesViewProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onDeleteUser: (id: string) => void;
  serviceConfigs: ServiceTypeConfig[];
  onSaveServiceConfigs: (configs: ServiceTypeConfig[]) => void;
}

export default function EmployeesView({
  users,
  currentUser,
  onAddUser,
  onDeleteUser,
  serviceConfigs,
  onSaveServiceConfigs,
}: EmployeesViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'services'>('employees');

  // --- Employees Management state ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('mechanic');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // --- Service configs state ---
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvPrice, setNewSrvPrice] = useState<number | string>('');
  const [newSrvRewardType, setNewSrvRewardType] = useState<'percentage' | 'flat'>('percentage');
  const [newSrvPercentage, setNewSrvPercentage] = useState<number>(50);
  const [newSrvFlat, setNewSrvFlat] = useState<number>(30);
  const [showAddSrvForm, setShowAddSrvForm] = useState(false);

  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [editSrvName, setEditSrvName] = useState('');
  const [editSrvPrice, setEditSrvPrice] = useState<number | string>('');
  const [editSrvRewardType, setEditSrvRewardType] = useState<'percentage' | 'flat'>('percentage');
  const [editSrvPercentage, setEditSrvPercentage] = useState<number>(50);
  const [editSrvFlat, setEditSrvFlat] = useState<number>(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName.trim() || !lastName.trim() || !username.trim() || !password.trim()) {
      setError('გთხოვთ შეავსოთ ყველა ველი');
      return;
    }

    // Check if username already exists
    const exists = users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      setError('ეს იუზერნეიმი უკვე დაკავებულია');
      return;
    }

    const passwordHash = hashPassword(password);

    onAddUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase(),
      passwordHash,
      role,
    });

    setSuccess('თანამშრომელი წარმატებით დაემატა!');
    setFirstName('');
    setLastName('');
    setUsername('');
    setPassword('');
    setRole('mechanic');
    setShowAddForm(false);
  };

  // --- Handles Service Configurations Add / Edit / Delete ---
  const handleAddServiceConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newSrvName.trim() || newSrvPrice === '') {
      setError('გთხოვთ შეავსოთ სერვისის დასახელება და ფასი');
      return;
    }

    const newId = `srv-config-${Date.now()}`;
    const newConfig: ServiceTypeConfig = {
      id: newId,
      name: newSrvName.trim(),
      defaultPrice: Number(newSrvPrice),
      percentageReward: newSrvRewardType === 'percentage' ? Number(newSrvPercentage) : 0,
      flatReward: newSrvRewardType === 'flat' ? Number(newSrvFlat) : 0,
      rewardType: newSrvRewardType,
    };

    onSaveServiceConfigs([...serviceConfigs, newConfig]);
    setSuccess('ახალი სერვისის პარამეტრი დაემატა!');
    setNewSrvName('');
    setNewSrvPrice('');
    setNewSrvPercent(50);
    setNewSrvFlatReward(30);
    setShowAddSrvForm(false);
  };

  const handleStartEditConfig = (conf: ServiceTypeConfig) => {
    setEditingConfigId(conf.id);
    setEditSrvName(conf.name);
    setEditSrvPrice(conf.defaultPrice);
    setEditSrvRewardType(conf.rewardType);
    setEditSrvPercentage(conf.percentageReward);
    setEditSrvFlat(conf.flatReward);
  };

  const handleSaveEditConfig = () => {
    if (!editSrvName.trim() || editSrvPrice === '') {
      alert('გთხოვთ შეავსოთ ველები');
      return;
    }

    const updated = serviceConfigs.map((c) => {
      if (c.id === editingConfigId) {
        return {
          ...c,
          name: editSrvName.trim(),
          defaultPrice: Number(editSrvPrice),
          rewardType: editSrvRewardType,
          percentageReward: editSrvRewardType === 'percentage' ? Number(editSrvPercentage) : 0,
          flatReward: editSrvRewardType === 'flat' ? Number(editSrvFlat) : 0,
        };
      }
      return c;
    });

    onSaveServiceConfigs(updated);
    setEditingConfigId(null);
    setSuccess('ცვლილებები შენახულია!');
  };

  const handleDeleteConfig = (id: string) => {
    if (confirm('ნამდვილად გსურთ ამ სერვისის წაშლა?')) {
      const filtered = serviceConfigs.filter((c) => c.id !== id);
      onSaveServiceConfigs(filtered);
      setSuccess('სერვისის პარამეტრი წაიშალა!');
    }
  };

  // Temporary local state wrappers for clean UI editing
  function setNewSrvPercent(val: number) {
    setNewSrvPercentage(val);
  }
  function setNewSrvFlatReward(val: number) {
    setNewSrvFlat(val);
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl animate-fade-in">
      {/* Sub Tabs Toggle for Admin Settings */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl mb-5">
        <button
          id="subtab-employees"
          onClick={() => {
            setActiveSubTab('employees');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1.5 ${
            activeSubTab === 'employees'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          თანამშრომლები
        </button>
        <button
          id="subtab-services"
          onClick={() => {
            setActiveSubTab('services');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1.5 ${
            activeSubTab === 'services'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          სერვისების პარამეტრები
        </button>
      </div>

      {success && (
        <div className="p-3 bg-green-950/40 border border-green-500/20 text-green-400 text-xs rounded-xl mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-500 text-xs rounded-xl mb-4 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* --- Tab 1: EMPLOYEES MANAGEMENT --- */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-300 font-sans">პერსონალის მართვა</h3>
            <button
              id="toggle-add-emp-form"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setError('');
                setSuccess('');
              }}
              className="flex items-center gap-1 text-[11px] text-slate-950 bg-amber-500 hover:bg-amber-600 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {showAddForm ? 'დახურვა' : 'თანამშრომლის დამატება'}
            </button>
          </div>

          {/* Add Employee Form Card */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-3 shadow-xl space-y-4"
            >
              <h3 className="text-sm font-bold text-amber-500 font-sans">ახალი თანამშრომლის რეგისტრაცია</h3>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                {/* First Name */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">სახელი *</label>
                  <input
                    id="emp-firstname"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ჩაწერეთ სახელი (მაგ: დავით)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-700 focus:outline-none"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">გვარი *</label>
                  <input
                    id="emp-lastname"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="ჩაწერეთ გვარი (მაგ: კაპანაძე)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-700 focus:outline-none"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">იუზერნეიმი (Username) *</label>
                  <input
                    id="emp-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="მაგ: dato_electro"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-700 focus:outline-none"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">პაროლი *</label>
                  <input
                    id="emp-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ჩაწერეთ საიმედო პაროლი..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-700 focus:outline-none"
                  />
                </div>

                {/* Role select toggle row */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">როლი სისტემაში *</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                    <button
                      id="role-mock-mechanic"
                      type="button"
                      onClick={() => setRole('mechanic')}
                      className={`py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                        role === 'mechanic' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      ხელოსანი (Mechanic)
                    </button>
                    <button
                      id="role-mock-admin"
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                        role === 'admin' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      ადმინისტრატორი
                    </button>
                  </div>
                </div>

                <button
                  id="emp-submit"
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  შენახვა და დამატება
                </button>
              </form>
            </motion.div>
          )}

          {/* Staff lists */}
          <div className="space-y-2.5 pt-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
              ყველა თანამშრომელი ({users.length})
            </h3>

            {users.map((user) => {
              const isOwnAccount = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        user.role === 'admin'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {user.role === 'admin' ? <Shield className="w-5 h-5" /> : <Wrench className="w-4 h-4" />}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-200 font-sans tracking-tight">
                        {user.firstName} {user.lastName} {isOwnAccount && <span className="text-[10px] text-slate-500">(თქვენ)</span>}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5 font-sans">
                        <span>იუზერი: <b className="text-slate-400 font-mono">{user.username}</b></span>
                        <span className="hidden sm:inline">•</span>
                        <span>როლი: <b className="text-slate-400">{ROLE_LABELS[user.role]}</b></span>
                      </div>
                    </div>
                  </div>

                  {!isOwnAccount && (
                    <button
                      id={`delete-user-${user.id}`}
                      onClick={() => {
                        if (confirm(`ნამდვილად გსურთ წაშალოთ თანამშრომელი: ${user.firstName}?`)) {
                          onDeleteUser(user.id);
                        }
                      }}
                      className="p-2.5 bg-red-950/25 hover:bg-red-950/45 border border-red-500/25 text-red-400 hover:text-red-300 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Tab 2: DYNAMIC SERVICES PARAMETERS --- */}
      {activeSubTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-300 font-sans">მომსახურების ფასების კონფიგურაციები</h3>
              <p className="text-[10px] text-slate-500">მომსახურებების დამატება და ხელოსნების წილის განაწილება</p>
            </div>
            <button
              id="toggle-add-srv-config-form"
              onClick={() => {
                setShowAddSrvForm(!showAddSrvForm);
                setError('');
                setSuccess('');
              }}
              className="flex items-center gap-1 text-[11px] text-slate-950 bg-amber-500 hover:bg-amber-600 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              {showAddSrvForm ? 'დახურვა' : 'სერვისის დამატება'}
            </button>
          </div>

          {/* Inline Add Service Config Form */}
          {showAddSrvForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-3 shadow-xl space-y-4"
            >
              <h3 className="text-sm font-bold text-amber-500 font-sans">ახალი სერვისის ტიპის შექმნა</h3>

              <form onSubmit={handleAddServiceConfig} className="space-y-3 text-xs">
                {/* Service Name */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">სერვისის დასახელება *</label>
                  <input
                    id="new-srv-config-name"
                    type="text"
                    value={newSrvName}
                    onChange={(e) => setNewSrvName(e.target.value)}
                    placeholder="მაგ: მატორის ხელობა, ხადავოი"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-700 focus:outline-none"
                  />
                </div>

                {/* Default price */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">სტანდარტული ფასი (ლარი) *</label>
                  <input
                    id="new-srv-config-default-price"
                    type="number"
                    value={newSrvPrice}
                    onChange={(e) => setNewSrvPrice(e.target.value)}
                    placeholder="მაგ: 100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono placeholder-slate-700 focus:outline-none"
                  />
                </div>

                {/* Reward Type Selection */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">ხელოსნის წილი / გამომუშავება *</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl mb-2">
                    <button
                      type="button"
                      onClick={() => setNewSrvRewardType('percentage')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                        newSrvRewardType === 'percentage' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      პროცენტული (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSrvRewardType('flat')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                        newSrvRewardType === 'flat' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      ფიქსირებული (ლარი)
                    </button>
                  </div>

                  {newSrvRewardType === 'percentage' ? (
                    <div>
                      <label className="block text-slate-500 mb-1">ხელოსნის წილის პროცენტი (%) *</label>
                      <input
                        id="new-srv-config-percentage"
                        type="number"
                        value={newSrvPercentage}
                        onChange={(e) => setNewSrvPercentage(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-500 mb-1">ხელოსნის ფიქსირებული თანხა (ლარი) *</label>
                      <input
                        id="new-srv-config-flat"
                        type="number"
                        value={newSrvFlat}
                        onChange={(e) => setNewSrvFlat(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  id="new-srv-config-submit"
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  პარამეტრის შექმნა
                </button>
              </form>
            </motion.div>
          )}

          {/* Service configs list */}
          <div className="space-y-3">
            {serviceConfigs.map((conf) => {
              const isEditing = editingConfigId === conf.id;

              return (
                <div
                  key={conf.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
                >
                  {isEditing ? (
                    /* Editing view configuration */
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-slate-450 font-bold mb-0.5">სერვისის დასახელება</label>
                        <input
                          type="text"
                          value={editSrvName}
                          onChange={(e) => setEditSrvName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-250 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-450 font-bold mb-0.5">default ფასი (₾)</label>
                          <input
                            type="number"
                            value={editSrvPrice}
                            onChange={(e) => setEditSrvPrice(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-slate-250 text-xs text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-450 font-bold mb-0.5">გამონაწილების ტიპი</label>
                          <select
                            value={editSrvRewardType}
                            onChange={(e) => setEditSrvRewardType(e.target.value as 'percentage' | 'flat')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-slate-250 text-xs text-center"
                          >
                            <option value="percentage">პროცენტული</option>
                            <option value="flat">ფიქსირებული</option>
                          </select>
                        </div>
                      </div>

                      {editSrvRewardType === 'percentage' ? (
                        <div>
                          <label className="block text-slate-450 font-bold mb-0.5">თანამშრომლის წილი (%)</label>
                          <input
                            type="number"
                            value={editSrvPercentage}
                            onChange={(e) => setEditSrvPercentage(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-slate-150 text-xs text-center"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-slate-450 font-bold mb-0.5">ხელოსნის ფიქსირებული წილი (₾)</label>
                          <input
                            type="number"
                            value={editSrvFlat}
                            onChange={(e) => setEditSrvFlat(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-slate-150 text-xs text-center"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => setEditingConfigId(null)}
                          className="py-1.5 bg-slate-950 border border-slate-800 text-slate-450 hover:text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          გაუქმება
                        </button>
                        <button
                          onClick={handleSaveEditConfig}
                          className="py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          შენახვა
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal card configuration listing view */
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200 font-sans">{conf.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-sans">
                          <span>სტანდ. ფასი: <b className="text-slate-300 font-mono">{conf.defaultPrice} ₾</b></span>
                          <span>•</span>
                          <span>
                            ხელოსნის წილი:{' '}
                            <b className="text-cyan-400 font-semibold font-sans">
                              {conf.rewardType === 'flat' ? `${conf.flatReward} ₾ ఫิกსური` : `${conf.percentageReward}%`}
                            </b>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEditConfig(conf)}
                          className="p-1.5 border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(conf.id)}
                          className="p-1.5 border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
