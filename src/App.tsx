import { useState, useEffect, useRef } from 'react';
import {
  User, CarServiceOrder, ServiceItem, OrderStatus, PaymentStatus,
  ServiceTypeConfig, Product, ProductSale, DailyClosing, CarBrand,
  DEFAULT_SERVICE_CONFIGS, DEFAULT_CAR_BRANDS, hasModule, isAdminRole, isOwnerLike, isAssignableMechanic,
} from './types';
import { INITIAL_USERS, INITIAL_ORDERS, INITIAL_SERVICES } from './utils/initialData';
import { db } from './firebase';
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc,
  writeBatch, getDocs, deleteField,
} from 'firebase/firestore';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import OrderFormView from './components/OrderFormView';
import OrderDetailsView from './components/OrderDetailsView';
import HistoryView from './components/HistoryView';
import EmployeesView from './components/EmployeesView';
import ReportsView from './components/ReportsView';
import MechanicPanelView from './components/MechanicPanelView';
import StoreView from './components/StoreView';
import DayClosingSection from './components/DayClosingSection';
import SettingsView from './components/SettingsView';

import { motion, AnimatePresence } from 'motion/react';

/** Firestore rejects documents with `undefined` values — strip them recursively before every write */
function stripUndefined(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return obj;
}

function normalizePaidToName(paidTo?: string): string | undefined {
  const name = paidTo?.trim();
  if (!name) return undefined;
  if (['imedo', 'იმედო', 'გიორგი იმედაშვილი'].includes(name.toLowerCase())) return 'ზვიადი';
  if (name === 'გიორგი') return 'გიორგი მენეჯერი';
  return name;
}

function sanitizeServiceConfig(config: ServiceTypeConfig, allUsers: User[]): ServiceTypeConfig {
  const assignableWorkerIds = new Set(allUsers.filter(isAssignableMechanic).map(u => u.id));
  const employeeRewards = config.employeeRewards
    ? Object.fromEntries(
        Object.entries(config.employeeRewards)
          .filter(([employeeId]) => assignableWorkerIds.has(employeeId))
          .map(([employeeId, reward]) => {
            if (!reward.coMechanicId || assignableWorkerIds.has(reward.coMechanicId)) {
              return [employeeId, reward];
            }
            const { coMechanicId: _coId, coMechanicRewardType: _coType, coMechanicEarning: _coEarn, ...safeReward } = reward;
            return [employeeId, safeReward];
          })
      )
    : undefined;
  const configHasSafeCoMechanic = !config.coMechanicId || assignableWorkerIds.has(config.coMechanicId);
  return stripUndefined({
    ...config,
    employeeRewards: employeeRewards && Object.keys(employeeRewards).length > 0 ? employeeRewards : undefined,
    coMechanicId: configHasSafeCoMechanic ? config.coMechanicId : undefined,
    coMechanicRewardType: configHasSafeCoMechanic ? config.coMechanicRewardType : undefined,
    coMechanicEarning: configHasSafeCoMechanic ? config.coMechanicEarning : undefined,
  });
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<CarServiceOrder[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [serviceConfigs, setServiceConfigs] = useState<ServiceTypeConfig[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [carBrands, setCarBrands] = useState<CarBrand[]>([]);
  const [initialized, setInitialized] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const s = localStorage.getItem('auto_service_current_user');
    return s ? JSON.parse(s) : null;
  });
  const [activeView, setActiveView] = useState<'regular-tab' | 'register-car' | 'order-detail'>('regular-tab');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const initDone = useRef(false);

  // Initialize Firestore data once
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const batch = writeBatch(db);
        if (usersSnap.empty) {
          INITIAL_USERS.forEach(u => batch.set(doc(db, 'users', u.id), u));
          INITIAL_ORDERS.forEach(o => batch.set(doc(db, 'orders', o.id), o));
          INITIAL_SERVICES.forEach(s => batch.set(doc(db, 'services', s.id), s));
          DEFAULT_SERVICE_CONFIGS.forEach(c => batch.set(doc(db, 'serviceConfigs', c.id), c));
          DEFAULT_CAR_BRANDS.forEach(b => batch.set(doc(db, 'carBrands', b.id), b));
        } else {
          // Ensure Zviadi is the only real owner account and credentials are up-to-date.
          const ownerDoc = usersSnap.docs.find(d => {
            const data = d.data() as User;
            return data.username === 'zviad' || data.username === 'zviadi' || data.firstName === 'ზვიადი';
          });
          if (!ownerDoc) {
            await setDoc(doc(db, 'users', INITIAL_USERS[0].id), INITIAL_USERS[0]);
          } else {
            await updateDoc(doc(db, 'users', ownerDoc.id), {
              username: INITIAL_USERS[0].username,
              passwordHash: INITIAL_USERS[0].passwordHash,
              role: 'owner',
            });
          }
          // Ensure technical super admin account (imedo) exists with correct role.
          const devUser = INITIAL_USERS.find(u => u.username === 'imedo')!;
          const devDoc = usersSnap.docs.find(d => d.data().username === 'imedo');
          if (!devDoc) {
            await setDoc(doc(db, 'users', devUser.id), devUser);
          } else if (devDoc.data().role !== 'super_admin') {
            await updateDoc(doc(db, 'users', devDoc.id), { role: 'super_admin' });
          }

          const nonWorkerIds = new Set<string>();
          usersSnap.docs.forEach(userDoc => {
            const u = userDoc.data() as User;
            if (u.role === 'owner' && userDoc.id !== ownerDoc?.id) {
              batch.update(doc(db, 'users', userDoc.id), { role: u.username?.toLowerCase() === 'imedo' ? 'super_admin' : 'manager' });
            }
            if (u.role === 'accountant' || u.username?.toLowerCase() === 'imedo') nonWorkerIds.add(userDoc.id);
          });
          nonWorkerIds.add(devDoc?.id || devUser.id);

          const ordersSnap = await getDocs(collection(db, 'orders'));
          ordersSnap.docs.forEach(orderDoc => {
            const orderData = orderDoc.data() as CarServiceOrder;
            const normalizedPaidTo = normalizePaidToName(orderData.paidTo);
            const updates: Record<string, unknown> = {};
            if (orderData.paidTo && orderData.paidTo !== normalizedPaidTo) {
              updates.paidTo = normalizedPaidTo || 'ზვიადი';
            }
            const safeAssignedEmployeeIds = (orderData.assignedEmployeeIds || []).filter(id => !nonWorkerIds.has(id));
            if ((orderData.assignedEmployeeIds || []).length !== safeAssignedEmployeeIds.length) {
              updates.assignedEmployeeIds = safeAssignedEmployeeIds.length > 0 ? safeAssignedEmployeeIds : deleteField();
            }
            if (Object.keys(updates).length > 0) {
              batch.update(doc(db, 'orders', orderDoc.id), updates);
            }
          });

          const servicesSnap = await getDocs(collection(db, 'services'));
          servicesSnap.docs.forEach(serviceDoc => {
            const serviceData = serviceDoc.data() as ServiceItem;
            const updates: Record<string, unknown> = {};
            if (nonWorkerIds.has(serviceData.mechanicId)) {
              updates.mechanicId = 'usr-mech-1';
            }
            if (serviceData.coMechanicId && nonWorkerIds.has(serviceData.coMechanicId)) {
              updates.coMechanicId = deleteField();
              updates.coMechanicEarning = deleteField();
            }
            if (Object.keys(updates).length > 0) {
              batch.update(doc(db, 'services', serviceDoc.id), updates);
            }
          });

          const allUserData = usersSnap.docs.map(userDoc => ({ ...(userDoc.data() as User), id: userDoc.id }));
          const configsSnap = await getDocs(collection(db, 'serviceConfigs'));
          configsSnap.docs.forEach(configDoc => {
            const configData = configDoc.data() as ServiceTypeConfig;
            const safeConfig = sanitizeServiceConfig(configData, allUserData);
            if (JSON.stringify(stripUndefined(configData)) !== JSON.stringify(safeConfig)) {
              batch.set(doc(db, 'serviceConfigs', configDoc.id), safeConfig);
            }
          });
        }
        await batch.commit();
      } catch (e) {
        console.error('Firestore init error:', e);
      } finally {
        setInitialized(true);
      }
    };
    init();
  }, []);

  // Real-time Firestore listeners (start after init)
  useEffect(() => {
    if (!initialized) return;
    const unsubs = [
      onSnapshot(collection(db, 'users'), s => setUsers(s.docs.map(d => d.data() as User))),
      onSnapshot(collection(db, 'orders'), s => setOrders(s.docs.map(d => d.data() as CarServiceOrder))),
      onSnapshot(collection(db, 'services'), s => setServices(s.docs.map(d => d.data() as ServiceItem))),
      onSnapshot(collection(db, 'serviceConfigs'), s => setServiceConfigs(s.docs.map(d => d.data() as ServiceTypeConfig))),
      onSnapshot(collection(db, 'products'), s => setProducts(s.docs.map(d => d.data() as Product))),
      onSnapshot(collection(db, 'productSales'), s => setProductSales(s.docs.map(d => d.data() as ProductSale))),
      onSnapshot(collection(db, 'dailyClosings'), s => setDailyClosings(s.docs.map(d => d.data() as DailyClosing))),
      onSnapshot(collection(db, 'carBrands'), s => setCarBrands(s.docs.map(d => d.data() as CarBrand))),
    ];
    return () => unsubs.forEach(u => u());
  }, [initialized]);

  // Keep currentUser in sync with users list (real-time role/modules updates)
  useEffect(() => {
    if (!currentUser) return;
    const updated = users.find(u => u.id === currentUser.id);
    if (updated) setCurrentUser(updated);
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('auto_service_current_user', JSON.stringify(currentUser));
      if (isAdminRole(currentUser.role)) {
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('all-orders');
      }
      setActiveView('regular-tab');
    } else {
      localStorage.removeItem('auto_service_current_user');
    }
  }, [currentUser?.id]);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => { setCurrentUser(null); setSelectedOrderId(null); setActiveView('regular-tab'); };
  const handleOpenAddOrder = () => setActiveView('register-car');

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
    setActiveView('order-detail');
  };

  const handleChangeTab = (tab: string) => {
    setCurrentTab(tab);
    setActiveView('regular-tab');
  };

  const handleAddOrder = async (fields: Omit<CarServiceOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const id = `ord-${Date.now()}`;
    const ts = new Date().toISOString();
    const assignableWorkerIds = new Set(users.filter(isAssignableMechanic).map(u => u.id));
    const safeAssignedEmployeeIds = (fields.assignedEmployeeIds || []).filter(id => assignableWorkerIds.has(id));
    const o: CarServiceOrder = {
      ...fields,
      assignedEmployeeIds: safeAssignedEmployeeIds.length > 0 ? safeAssignedEmployeeIds : undefined,
      id,
      createdBy: currentUser?.id || 'unknown',
      createdAt: ts,
      updatedAt: ts,
    };
    await setDoc(doc(db, 'orders', id), stripUndefined(o));
    setActiveView('regular-tab');
    setCurrentTab('dashboard');
  };

  const handleSaveOrderTransaction = async (
    orderId: string,
    updatedOrder: CarServiceOrder,
    updatedServices: ServiceItem[]
  ) => {
    const batch = writeBatch(db);
    const assignableWorkerIds = users.filter(isAssignableMechanic).map(u => u.id);
    const sanitizedServices = updatedServices.filter(s =>
      assignableWorkerIds.includes(s.mechanicId) &&
      (!s.coMechanicId || assignableWorkerIds.includes(s.coMechanicId))
    );
    const safeOrder: CarServiceOrder = {
      ...updatedOrder,
      assignedEmployeeIds: (updatedOrder.assignedEmployeeIds || []).filter(id => assignableWorkerIds.includes(id)),
      paidTo: updatedOrder.paymentStatus === 'paid' ? normalizePaidToName(updatedOrder.paidTo) || 'ზვიადი' : undefined,
    };

    batch.set(doc(db, 'orders', orderId), stripUndefined({ ...safeOrder, updatedAt: new Date().toISOString() }));
    const oldSrvs = services.filter(s => s.orderId === orderId);
    oldSrvs.forEach(s => batch.delete(doc(db, 'services', s.id)));
    sanitizedServices.forEach(s => batch.set(doc(db, 'services', s.id), stripUndefined(s)));
    await batch.commit();
    setActiveView('regular-tab');
  };

  const handleAddUser = async (fields: Omit<User, 'id' | 'createdAt'>) => {
    const id = `usr-${Date.now()}`;
    const u: User = { ...fields, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', id), stripUndefined(u));
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    await updateDoc(doc(db, 'users', userId), stripUndefined(updates) as any);
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
  };

  const handleSaveServiceConfigs = async (configs: ServiceTypeConfig[]) => {
    const batch = writeBatch(db);
    configs.forEach(c => batch.set(doc(db, 'serviceConfigs', c.id), sanitizeServiceConfig(c, users)));
    const toDelete = serviceConfigs.filter(sc => !configs.find(c => c.id === sc.id));
    toDelete.forEach(c => batch.delete(doc(db, 'serviceConfigs', c.id)));
    await batch.commit();
  };

  const handleSaveCarBrands = async (brands: CarBrand[]) => {
    const batch = writeBatch(db);
    brands.forEach(b => batch.set(doc(db, 'carBrands', b.id), stripUndefined(b)));
    const toDelete = carBrands.filter(cb => !brands.find(b => b.id === cb.id));
    toDelete.forEach(b => batch.delete(doc(db, 'carBrands', b.id)));
    await batch.commit();
  };

  const handleAddProduct = async (prod: Omit<Product, 'id' | 'soldQuantity' | 'createdAt'>) => {
    const id = `prod-${Date.now()}`;
    const p: Product = { ...prod, id, soldQuantity: 0, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'products', id), stripUndefined(p));
  };

  const handleEditProduct = async (productId: string, updates: Partial<Product>) => {
    await updateDoc(doc(db, 'products', productId), stripUndefined(updates) as any);
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteDoc(doc(db, 'products', productId));
  };

  const handleRefillStock = async (productId: string, qty: number, price: number, note: string) => {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    await updateDoc(doc(db, 'products', productId), { stock: p.stock + qty, purchasePrice: price });
  };

  const handleAddSale = async (sale: Omit<ProductSale, 'id' | 'createdAt'>) => {
    const id = `sale-${Date.now()}`;
    const s: ProductSale = { ...sale, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'productSales', id), stripUndefined(s));
    const batch = writeBatch(db);
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        batch.update(doc(db, 'products', item.productId), {
          stock: Math.max(0, prod.stock - item.quantity),
          soldQuantity: (prod.soldQuantity || 0) + item.quantity,
        });
      }
    });
    await batch.commit();
  };

  const handleConfirmCloseDay = async (closing: Omit<DailyClosing, 'id' | 'createdAt'>) => {
    const id = `close-${Date.now()}`;
    const c: DailyClosing = { ...closing, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'dailyClosings', id), stripUndefined(c));
  };

  const handleDeleteOrder = async (orderId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'orders', orderId));
    services.filter(s => s.orderId === orderId).forEach(s => batch.delete(doc(db, 'services', s.id)));
    await batch.commit();
    setActiveView('regular-tab');
    setCurrentTab('dashboard');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">მონაცემები იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

  const currentSelectedOrder = orders.find(o => o.id === selectedOrderId);
  const executorsList = users.filter(isAssignableMechanic);
  const isAdminLike = isAdminRole(currentUser.role);
  const serviceTypeNames = serviceConfigs.map(c => ({ id: c.id, name: c.name }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Header currentUser={currentUser} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          {activeView === 'register-car' ? (
            <motion.div key="register-car" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <OrderFormView
                carBrands={carBrands}
                allUsers={users}
                serviceTypeNames={serviceTypeNames}
                onAddOrder={handleAddOrder}
                onCancel={() => { setActiveView('regular-tab'); setCurrentTab('dashboard'); }}
              />
            </motion.div>
          ) : activeView === 'order-detail' && currentSelectedOrder ? (
            <motion.div key="order-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <OrderDetailsView
                order={currentSelectedOrder}
                services={services}
                mechanics={executorsList}
                allUsers={users}
                currentUser={currentUser}
                serviceConfigs={serviceConfigs}
                onSaveTransaction={handleSaveOrderTransaction}
                onBack={() => setActiveView('regular-tab')}
                onDeleteOrder={handleDeleteOrder}
              />
            </motion.div>
          ) : (
            <motion.div key={currentTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="py-1">
              {isAdminLike && (
                <>
                  {currentTab === 'dashboard' && (
                    <DashboardView
                      orders={orders}
                      currentUser={currentUser}
                      allUsers={users}
                      onSelectOrder={handleSelectOrder}
                      onOpenAddOrder={handleOpenAddOrder}
                    />
                  )}
                  {currentTab === 'history' && (
                    <HistoryView
                      orders={orders}
                      services={services}
                      mechanics={executorsList}
                      serviceConfigs={serviceConfigs}
                      onSelectOrder={handleSelectOrder}
                    />
                  )}
                  {currentTab === 'employees' && (
                    <EmployeesView
                      users={users}
                      currentUser={currentUser}
                      onAddUser={handleAddUser}
                      onUpdateUser={handleUpdateUser}
                      onDeleteUser={handleDeleteUser}
                    />
                  )}
                  {currentTab === 'reports' && (
                    <ReportsView
                      orders={orders}
                      services={services}
                      mechanics={executorsList}
                      allUsers={users}
                    />
                  )}
                  {currentTab === 'shop' && hasModule(currentUser, 'shop') && (
                    <StoreView currentUser={currentUser} orders={orders} services={services} />
                  )}
                  {currentTab === 'day-closing' && hasModule(currentUser, 'day_closing') && (
                    <DayClosingSection
                      orders={orders}
                      services={services}
                      productSales={productSales}
                      dailyClosings={dailyClosings}
                      currentUser={currentUser}
                      onConfirmCloseDay={handleConfirmCloseDay}
                    />
                  )}
                  {currentTab === 'settings' && (isOwnerLike(currentUser.role) || currentUser.role === 'admin') && (
                    <SettingsView
                      serviceConfigs={serviceConfigs}
                      carBrands={carBrands}
                      users={users}
                      currentUser={currentUser}
                      onSaveServiceConfigs={handleSaveServiceConfigs}
                      onSaveCarBrands={handleSaveCarBrands}
                      onUpdateUser={handleUpdateUser}
                    />
                  )}
                  {currentTab === 'earnings' && (
                    <MechanicPanelView
                      orders={orders}
                      services={services}
                      currentUser={currentUser}
                      allUsers={users}
                      serviceConfigs={serviceConfigs}
                      onSelectOrder={handleSelectOrder}
                    />
                  )}
                </>
              )}
              {currentUser.role === 'mechanic' && (
                <>
                  {currentTab === 'mechanic-dashboard' && (
                    <MechanicPanelView
                      orders={orders}
                      services={services}
                      currentUser={currentUser}
                      allUsers={users}
                      serviceConfigs={serviceConfigs}
                      onSelectOrder={handleSelectOrder}
                    />
                  )}
                  {currentTab === 'all-orders' && (
                    <DashboardView
                      orders={orders}
                      currentUser={currentUser}
                      allUsers={users}
                      onSelectOrder={handleSelectOrder}
                      onOpenAddOrder={handleOpenAddOrder}
                    />
                  )}
                  {currentTab === 'history' && (
                    <HistoryView
                      orders={orders}
                      services={services}
                      mechanics={executorsList}
                      serviceConfigs={serviceConfigs}
                      onSelectOrder={handleSelectOrder}
                    />
                  )}
                  {currentTab === 'shop' && hasModule(currentUser, 'shop') && (
                    <StoreView currentUser={currentUser} orders={orders} services={services} />
                  )}
                  {currentTab === 'day-closing' && hasModule(currentUser, 'day_closing') && (
                    <DayClosingSection
                      orders={orders}
                      services={services}
                      productSales={productSales}
                      dailyClosings={dailyClosings}
                      currentUser={currentUser}
                      onConfirmCloseDay={handleConfirmCloseDay}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav currentTab={currentTab} onChangeTab={handleChangeTab} currentUser={currentUser} />
    </div>
  );
}
