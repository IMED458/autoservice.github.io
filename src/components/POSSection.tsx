// ფაილი მდებარეობს: /src/components/POSSection.tsx
import React, { useState } from 'react';
import { Product, ProductSale, CarServiceOrder, PaymentStatus } from '../types';
import { Search, ShoppingCart, Trash2, Plus, Minus, Percent, AlertCircle, Sparkles } from 'lucide-react';

interface POSSectionProps {
  products: Product[];
  orders: CarServiceOrder[];
  onAddSale: (sale: Omit<ProductSale, 'id' | 'createdAt'>) => void;
  currentUser: any;
}

export default function POSSection({ products, orders, onAddSale, currentUser }: POSSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ყველა');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [clientType, setClientType] = useState<'existing' | 'new'>('new');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newCarBrand, setNewCarBrand] = useState('');
  const [newCarNumber, setNewCarNumber] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [successSale, setSuccessSale] = useState<any>(null);

  const categories = ['ყველა', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    if (p.status !== 'active') return false;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ყველა' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const nextQty = item.quantity + delta;
          if (nextQty > item.product.stock) return item;
          return { ...item, quantity: nextQty };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  let calculatedDiscount = 0;
  if (discountType === 'flat') {
    calculatedDiscount = Math.min(discountValue, cartSubtotal);
  } else {
    calculatedDiscount = Number(((cartSubtotal * Math.min(discountValue, 100)) / 100).toFixed(2));
  }
  const cartTotal = Math.max(0, cartSubtotal - calculatedDiscount);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    let clientName = '';
    let clientPhone = '';
    let carBrand = '';
    let carNumber = '';

    if (clientType === 'existing') {
      const matchedOrder = orders.find((o) => o.id === selectedOrderId);
      if (matchedOrder) {
        clientName = matchedOrder.clientFullName;
        clientPhone = matchedOrder.clientPhone;
        carBrand = matchedOrder.carBrand;
        carNumber = matchedOrder.carNumber;
      } else {
        clientName = 'გავლითი კლიენტი';
      }
    } else {
      clientName = newClientName.trim() || 'გავლითი კლიენტი';
      clientPhone = newClientPhone.trim();
      carBrand = newCarBrand.trim();
      carNumber = newCarNumber.trim();
    }

    const items = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      purchasePrice: item.product.purchasePrice,
      salePrice: item.product.salePrice,
    }));

    const salePayload = {
      clientName,
      clientPhone,
      carBrand,
      carNumber,
      date: new Date().toISOString().split('T')[0],
      totalAmount: cartSubtotal,
      discount: calculatedDiscount,
      finalAmount: cartTotal,
      paymentStatus,
      paymentMethod,
      items,
      createdBy: `${currentUser.firstName} ${currentUser.lastName}`,
    };

    onAddSale(salePayload as any);
    setSuccessSale(salePayload);
    setCart([]);
    setNewClientName('');
    setNewClientPhone('');
    setNewCarBrand('');
    setNewCarNumber('');
    setDiscountValue(0);
    setPaymentMethod('cash');
    setPaymentStatus('paid');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-1 font-sans">
      {/* მარცხენა ბლოკი: პროდუქტების შერჩევა */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-lg flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="მოძებნე სახელით, ბრენდით ან კოდით..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-[10.5px] font-bold rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === cat ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-4 text-center py-12 bg-slate-900 border border-dashed border-slate-800 rounded-xl space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-xs">აქტიური პროდუქტები არ მოიძებნა</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const inStock = p.stock > 0;
              const cartItem = cart.find((item) => item.product.id === p.id);
              const qtyInCart = cartItem ? cartItem.quantity : 0;
              const isFullySelected = qtyInCart >= p.stock;

              return (
                <div
                  key={p.id}
                  onClick={() => inStock && !isFullySelected && addToCart(p)}
                  className={`bg-slate-900 border rounded-lg overflow-hidden flex flex-col justify-between transition-all cursor-pointer relative ${
                    qtyInCart > 0 ? 'ring-2 ring-amber-500 border-amber-500/50' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="h-16 w-full bg-slate-950 flex items-center justify-center border-b border-slate-850 relative">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="p" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-700 font-bold">IMAGE</span>
                    )}
                    {qtyInCart > 0 && (
                      <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                        {qtyInCart}
                      </div>
                    )}
                    {!inStock && <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-rose-500 text-[8px] font-bold">ამოიწურა</div>}
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <h4 className="text-[10.5px] font-bold text-slate-200 line-clamp-1">{p.name}</h4>
                    <div className="mt-1 pt-1 border-t border-slate-850 flex items-center justify-between">
                      <span className="text-[11px] font-black text-emerald-400">{p.salePrice} ₾</span>
                      <span className="text-[9px] text-slate-500 font-mono">ნაშთი: {p.stock}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* მარჯვენა ბლოკი: კალათა და გამოწერა */}
      <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-xl h-[70vh] justify-between overflow-hidden">
        <div className="p-3 bg-slate-950/80 border-b border-slate-850 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">POS კალათა</span>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-[10px] text-rose-500 hover:underline">
              კალათის დაცლა
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-slate-500 text-xs my-auto">კალათა ცარიელია</p>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="bg-slate-950 p-2 rounded-lg flex justify-between items-center border border-slate-850">
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-slate-200 truncate">{item.product.name}</h5>
                  <span className="text-[9.5px] text-slate-500">{item.product.salePrice}₾</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => updateCartQuantity(item.product.id, -1)} className="p-1 text-slate-400 bg-slate-900 rounded"><Minus className="w-3" /></button>
                  <span className="font-mono text-xs text-slate-100">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.product.id, 1)} className="p-1 text-slate-400 bg-slate-900 rounded"><Plus className="w-3" /></button>
                  <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"><Trash2 className="w-3" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <form onSubmit={handleCheckout} className="border-t border-slate-850 bg-slate-950 p-3 space-y-2.5">
            <div className="bg-slate-900/60 p-2 rounded border border-slate-850 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase">კლიენტი</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setClientType('new')} className={`text-[9.5px] px-2 py-0.5 rounded ${clientType === 'new' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-500'}`}>ახალი</button>
                  <button type="button" onClick={() => setClientType('existing')} className={`text-[9.5px] px-2 py-0.5 rounded ${clientType === 'existing' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-500'}`}>არსებულიდან</button>
                </div>
              </div>
              {clientType === 'new' ? (
                <div className="grid grid-cols-2 gap-2">
                  <input required placeholder="კლიენტის სახელი" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[11px] text-slate-100 placeholder-slate-700 focus:outline-none" />
                  <input placeholder="ტელეფონი" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[11px] text-slate-100 placeholder-slate-700 focus:outline-none" />
                </div>
              ) : (
                <select required value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none">
                  <option value="">-- აირჩიეთ კლიენტი სიიდან --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>{o.clientFullName} - {o.carBrand} [{o.carNumber}]</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                <span className="text-[9px] text-slate-500 uppercase font-black block mb-1">სტატუსი:</span>
                <div className="grid grid-cols-2 gap-1 font-mono text-[9px]">
                  <button type="button" onClick={() => setPaymentStatus('paid')} className={`py-1 rounded font-bold ${paymentStatus === 'paid' ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-slate-500'}`}>გადახდილი</button>
                  <button type="button" onClick={() => setPaymentStatus('unpaid')} className={`py-1 rounded font-bold ${paymentStatus === 'unpaid' ? 'bg-rose-500 text-white' : 'bg-slate-950 text-slate-500'}`}>გადაუხდელი</button>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                <span className="text-[9px] text-slate-500 uppercase font-black block mb-1">გადახდის ტიპი:</span>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-[11px] text-slate-300 focus:outline-none">
                  <option value="cash">💵 ნაღდი ფული</option>
                  <option value="transfer">📇 თბს / სოლო გადარიცხვა</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-850 space-y-1 text-right">
              <div className="flex justify-between text-xs text-slate-400">
                <span>ჯამი:</span>
                <span className="font-mono">{cartSubtotal.toLocaleString()} ₾</span>
              </div>
              <div className="flex justify-between font-sans text-sm font-black text-slate-100 border-t border-slate-850 pt-1">
                <span>საბოლოო დასტური:</span>
                <span className="text-emerald-400 font-mono text-base">{cartTotal.toLocaleString()} ₾</span>
              </div>
              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-[11.5px] rounded-lg tracking-wider cursor-pointer mt-1">
                შეკვეთის დაფიქსირება
              </button>
            </div>
          </form>
        )}
      </div>

      {/* POS ჩეკი */}
      {successSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-xl p-5 shadow-2xl space-y-3 relative select-text font-mono text-xs">
            <div className="text-center space-y-1">
              <Sparkles className="w-6 h-6 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold uppercase tracking-wider">ავტოსერვისი / მაღაზია</h3>
              <p className="text-[10px] text-slate-500">მისამართი: თბილისი, საქართველო</p>
              <p className="text-[9px] text-slate-400">მოლარე: {successSale.createdBy}</p>
            </div>
            <div className="border-b border-dashed border-slate-300 py-1" />
            <div className="space-y-1 font-sans text-[11px]">
              <p className="font-bold">მყიდველი: {successSale.clientName}</p>
              {successSale.carBrand && <p>ტრანსპორტი: {successSale.carBrand} [{successSale.carNumber}]</p>}
              <p>თარიღი: {successSale.date}</p>
            </div>
            <div className="border-b border-dashed border-slate-300 py-1" />
            <div className="space-y-1">
              {successSale.items.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{it.productName} (x{it.quantity})</span>
                  <span>{it.salePrice * it.quantity} ₾</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-slate-300 pt-2 font-bold flex justify-between text-xs">
              <span>სულ გადასახდელი:</span>
              <span>{successSale.finalAmount} ₾</span>
            </div>
            <div className="flex gap-2 pt-4 select-none">
              <button onClick={() => window.print()} className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] rounded font-bold">ბეჭდვა</button>
              <button onClick={() => setSuccessSale(null)} className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] rounded font-bold">დახურვა</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
