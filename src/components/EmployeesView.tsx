import React, { useState } from 'react';
import { User, Role, ROLE_LABELS, hasModule } from '../types';
import { hashPassword } from '../utils/crypto';
import { Users, UserPlus, Trash2, Shield, Wrench, AlertCircle, Edit, Save, X } from 'lucide-react';
import { motion } from 'motion/react';

interface EmployeesViewProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

export default function EmployeesView({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser }: EmployeesViewProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('mechanic');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<Role>('mechanic');
  const [editModules, setEditModules] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !password.trim()) {
      setError('გთხოვთ შეავსოთ ყველა ველი');
      return;
    }
    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError('ეს იუზერნეიმი უკვე დაკავებულია');
      return;
    }
    onAddUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      role,
      enabledModules: [],
    });
    setSuccess('თანამშრომელი დაემატა!');
    setFirstName(''); setLastName(''); setUsername(''); setPassword('');
    setRole('mechanic'); setShowAddForm(false);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setEditFirst(u.firstName);
    setEditLast(u.lastName);
    setEditPassword('');
    setEditRole(u.role);
    setEditModules(u.enabledModules ?? []);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    const updates: Partial<User> = {
      firstName: editFirst.trim(),
      lastName: editLast.trim(),
      role: editRole,
      enabledModules: editModules,
    };
    if (editPassword.trim()) {
      (updates as any).passwordHash = hashPassword(editPassword.trim());
    }
    onUpdateUser(editingUser.id, updates);
    setEditingUser(null);
    setSuccess('ცვლილებები შენახულია!');
  };

  const toggleModule = (mod: string) => {
    setEditModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  const allModules = [
    { id: 'shop', label: 'მაღაზია' },
    { id: 'day_closing', label: 'დღის დახურვა' },
    { id: 'reports', label: 'ფინანსური ანგარიში' },
  ];

  return (
    <div className="max-w-lg mx-auto p-4 pb-28 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-300">პერსონალის მართვა ({users.length})</h3>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setError(''); setSuccess(''); }}
          className="flex items-center gap-1 text-[11px] text-slate-950 bg-amber-500 hover:bg-amber-600 font-bold px-3 py-1.5 rounded-xl cursor-pointer">
          <UserPlus className="w-3.5 h-3.5" />
          {showAddForm ? 'დახურვა' : 'თანამშრომლის დამატება'}
        </button>
      </div>

      {success && <div className="p-3 bg-green-950/40 border border-green-500/20 text-green-400 text-xs rounded-xl mb-3">{success}</div>}
      {error && <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-500 text-xs rounded-xl mb-3 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</div>}

      {showAddForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-amber-500">ახალი თანამშრომლის რეგისტრაცია</h3>
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">სახელი *</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="სახელი"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">გვარი *</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="გვარი"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">იუზერნეიმი *</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">პაროლი *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="პაროლი"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">როლი *</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                <button type="button" onClick={() => setRole('mechanic')}
                  className={`py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${role === 'mechanic' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                  ხელოსანი
                </button>
                <button type="button" onClick={() => setRole('admin')}
                  className={`py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${role === 'admin' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                  ადმინი
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer">
              შენახვა და დამატება
            </button>
          </form>
        </motion.div>
      )}

      <div className="space-y-2.5">
        {users.map(user => {
          const isOwn = user.id === currentUser.id;
          return (
            <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border ${
                  user.role === 'super_admin' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                  : user.role === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                  {user.role === 'mechanic' ? <Wrench className="w-4 h-4" /> : <Shield className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    {user.firstName} {user.lastName}
                    {isOwn && <span className="text-[10px] text-slate-500 ml-1">(თქვენ)</span>}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 mt-0.5">
                    <span>@{user.username}</span>
                    <span>•</span>
                    <span>{ROLE_LABELS[user.role]}</span>
                    {(user.enabledModules ?? []).length > 0 && (
                      <span className="text-[9px] text-amber-500/70">• {(user.enabledModules ?? []).length} მოდული</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {(isSuperAdmin || isOwn) && (
                  <button onClick={() => openEdit(user)}
                    className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-amber-400 rounded-xl cursor-pointer">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
                {!isOwn && isSuperAdmin && (
                  <button onClick={() => { if (confirm(`წაიშალოს ${user.firstName}?`)) onDeleteUser(user.id); }}
                    className="p-2.5 bg-red-950/25 hover:bg-red-950/45 border border-red-500/25 text-red-400 rounded-xl cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-100">თანამშრომლის რედაქტირება</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-slate-200 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">სახელი</label>
                  <input type="text" value={editFirst} onChange={e => setEditFirst(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">გვარი</label>
                  <input type="text" value={editLast} onChange={e => setEditLast(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">ახალი პაროლი (სურვილისამებრ)</label>
                <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)}
                  placeholder="ცარიელი = არ შეიცვლება"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none" />
              </div>

              {isSuperAdmin && editingUser.id !== currentUser.id && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">როლი</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                      <button type="button" onClick={() => setEditRole('mechanic')}
                        className={`py-1.5 text-[11px] font-bold rounded-lg cursor-pointer ${editRole === 'mechanic' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                        ხელოსანი
                      </button>
                      <button type="button" onClick={() => setEditRole('admin')}
                        className={`py-1.5 text-[11px] font-bold rounded-lg cursor-pointer ${editRole === 'admin' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                        ადმინი
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2">ჩართული მოდულები:</label>
                    <div className="space-y-2">
                      {allModules.map(mod => (
                        <label key={mod.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                          <div onClick={() => toggleModule(mod.id)}
                            className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${editModules.includes(mod.id) ? 'bg-amber-500' : 'bg-slate-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${editModules.includes(mod.id) ? 'left-5' : 'left-0.5'}`} />
                          </div>
                          <span className={`text-[11px] font-semibold ${editModules.includes(mod.id) ? 'text-amber-400' : 'text-slate-400'}`}>{mod.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="py-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer">
                  გაუქმება
                </button>
                <button type="button" onClick={handleSaveEdit}
                  className="py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-1">
                  <Save className="w-3.5 h-3.5" /> შენახვა
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
