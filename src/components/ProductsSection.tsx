// ფაილი მდებარეობს: /src/components/ProductsSection.tsx
import React, { useState } from 'react';
import { Product, Role } from '../types';
import { Plus, Edit3, Trash2, RefreshCw, X, Sparkles, Search } from 'lucide-react';

interface ProductsSectionProps {
  products: Product[];
  currentUser: { role: Role; firstName: string; lastName: string };
  onAddProduct: (prod: Omit<Product, 'id' | 'soldQuantity' | 'createdAt'>) => void;
  onEditProduct: (productId: string, prod: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
  onRefillStock: (productId: string, refillQty: number, refillPrice: number, refillNote: string) => void;
}

export default function ProductsSection({
  products,
  currentUser,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRefillStock,
}: ProductsSectionProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ყველა');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [refillTarget, setRefillTarget] = useState<Product | null>(null);
  const [refillQuantity, setRefillQuantity] = useState<number>(0);
  const [refillPrice, setRefillPrice] = useState<number>(0);
  const [refillNote, setRefillNote] = useState('მარაგის დაგეგმილი შევსება და საწყობის განახლება');

  // პროდუქტის დამატების ველები
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ზეთები / ფილტრები');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('ცალი');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const isPrivileged = ['super_admin', 'admin', 'manager'].includes(currentUser.role);

  const categories = ['ყველა', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCat === 'ყველა' || p.category === selectedCat;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.stock > 0 && p.stock <= p.minStock;
    } else if (stockFilter === 'out') {
      matchesStock = p.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenAdd = () => {
    setCode(`P-${100 + products.length + 1}`);
    setName('');
    setCategory('ზეთები / ფილტრები');
    setBrand('');
    setDescription('');
    setUnit('ცალი');
    setPurchasePrice(0);
    setSalePrice(0);
    setStock(10);
    setMinStock(5);
    setPhotoUrl('');
    setStatus('active');
    setIsCustomCategory(false);
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setCode(p.code);
    setName(p.name);
    setCategory(p.category);
    setBrand(p.brand);
    setDescription(p.description);
    setUnit(p.unit);
    setPurchasePrice(p.purchasePrice);
    setSalePrice(p.salePrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setPhotoUrl(p.photoUrl);
    setStatus(p.status);
    setIsCustomCategory(false);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim(),
      description: description.trim(),
      unit: unit.trim(),
      purchasePrice: Number(purchasePrice),
      salePrice: Number(salePrice),
      stock: Number(stock),
      minStock: Number(minStock),
      photoUrl: photoUrl.trim(),
      status,
    };

    if (editingProduct) {
      onEditProduct(editingProduct.id, payload);
    } else {
      onAddProduct(payload);
    }
    setShowAddModal(false);
  };

  const handleRefillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillTarget) return;
    onRefillStock(refillTarget.id, refillQuantity, refillPrice, refillNote);
    setRefillTarget(null);
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="md:col-span-2 relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="მოძებნე სახელით, ბრენდით, კოდით..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-slate-100"
          />
        </div>
        <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none px-2 font-bold">
          {categories.map((c) => <option key={c} value={c}>{c === 'ყველა' ? '📁 ყველა კატეგორია' : `📁 ${c}`}</option>)}
        </select>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button onClick={() => setStockFilter('all')} className={`flex-1 text-[10px] font-bold rounded ${stockFilter === 'all' ? 'bg-amber-400 text-slate-950 px-2' : 'text-slate-400'}`}>ყველა</button>
          <button onClick={() => setStockFilter('low')} className={`flex-1 text-[10px] font-bold rounded ${stockFilter === 'low' ? 'bg-amber-400 text-slate-950 px-2' : 'text-slate-400'}`}>მცირე</button>
        </div>
      </div>

      <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800">
        <span className="text-slate-400">ჯამური ასორტიმენტი: <b>{products.length} პროდუქტი</b></span>
        {isPrivileged && (
          <button onClick={handleOpenAdd} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4 font-black" /> პროდუქტის დამატება
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredProducts.map((p) => {
          const isLow = p.stock <= p.minStock && p.stock > 0;
          const isOut = p.stock === 0;

          return (
            <div key={p.id} className={`bg-slate-900 border rounded-xl overflow-hidden p-3 flex flex-col justify-between ${isOut ? 'border-red-500/25' : isLow ? 'border-amber-500/25' : 'border-slate-800'}`}>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-100 uppercase">{p.name}</h4>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>SKU: {p.code}</span>
                  {p.brand && <span className="text-amber-500 font-mono italic">{p.brand}</span>}
                </div>
                <div className="bg-slate-950 p-2 rounded-lg text-center flex justify-between font-bold">
                  <span className="text-slate-400">საწყისი ნაშთი:</span>
                  <span className={isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-400'}>{p.stock} {p.unit}</span>
                </div>
              </div>

              {isPrivileged && (
                <div className="flex gap-2 pt-3 border-t border-slate-800 mt-3 select-none">
                  <button onClick={() => { setRefillTarget(p); setRefillQuantity(10); setRefillPrice(p.purchasePrice); setRefillNote('მარაგის დაგეგმილი შევსება და საწყობის განახლება'); }} className="flex-1 py-1 px-1.5 bg-slate-950 text-cyan-400 font-bold border border-slate-800 rounded flex items-center justify-center gap-1">
                    <RefreshCw className="w-3" /> შევსება
                  </button>
                  <button onClick={() => handleOpenEdit(p)} className="p-1 px-2.5 bg-slate-950 text-amber-500 border border-slate-800 rounded"><Edit3 className="w-3.5" /></button>
                  <button onClick={() => { if(confirm('დარწმუნებული ხართ პროდუქტის წაშლაში?')) onDeleteProduct(p.id); }} className="p-1 px-2.5 bg-red-950/20 text-red-400 border border-slate-800 rounded"><Trash2 className="w-3.5" /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Refill Modal */}
      {refillTarget && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-cyan-400" /> მარაგის შევსება
              </h3>
              <button onClick={() => setRefillTarget(null)} className="text-slate-500 hover:text-slate-200 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-slate-400 text-xs">{refillTarget.name} <span className="text-amber-500">({refillTarget.stock} {refillTarget.unit} ამჟამად)</span></p>
            <form onSubmit={handleRefillSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">რაოდენობა ({refillTarget.unit})</label>
                <input type="number" min={1} value={refillQuantity} onChange={e => setRefillQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">შესყიდვის ფასი ₾</label>
                <input type="number" min={0} step="0.01" value={refillPrice} onChange={e => setRefillPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">შენიშვნა</label>
                <input type="text" value={refillNote} onChange={e => setRefillNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button type="button" onClick={() => setRefillTarget(null)}
                  className="py-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl font-semibold cursor-pointer">გაუქმება</button>
                <button type="submit"
                  className="py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 rounded-xl font-black cursor-pointer">შევსება</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {editingProduct ? 'პროდუქტის რედაქტირება' : 'ახალი ნაწილის დამატება'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="კოდი / SKU" value={code} onChange={(e) => setCode(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none" />
                <input required placeholder="პროდუქტის სახელი" value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1 text-[9px]">
                    <span className="text-slate-400">კატეგორია</span>
                    <button type="button" onClick={() => setIsCustomCategory(!isCustomCategory)} className="text-amber-400 underline">ახალი +</button>
                  </div>
                  {isCustomCategory ? (
                    <input required placeholder="ახალი კატეგორია" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100" />
                  ) : (
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100">
                      {categories.filter(c => c !== 'ყველა').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
                <input placeholder="ბრენდი" value={brand} onChange={(e) => setBrand(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none mt-4" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="შესასყიდი ფასი ₾" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} className="bg-slate-950 border border-slate-800 rounded p-2 text-red-400" />
                <input required type="number" placeholder="გასაყიდი ფასი ₾" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} className="bg-slate-950 border border-slate-800 rounded p-2 text-emerald-400" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 rounded">გაუქმება</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 text-slate-950 font-black rounded">შენახვა</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
