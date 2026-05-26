/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User, CarServiceOrder, ServiceItem, OrderStatus, PaymentStatus, ServiceTypeConfig, DEFAULT_SERVICE_CONFIGS } from './types';
import { INITIAL_USERS, INITIAL_ORDERS, INITIAL_SERVICES } from './utils/initialData';

// Component imports
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

import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --- Persistent Storage State Synced ---
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('auto_service_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [orders, setOrders] = useState<CarServiceOrder[]>(() => {
    const saved = localStorage.getItem('auto_service_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('auto_service_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [serviceConfigs, setServiceConfigs] = useState<ServiceTypeConfig[]>(() => {
    const saved = localStorage.getItem('auto_service_configs');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICE_CONFIGS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auto_service_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Active view routing state
  // Can be 'regular-tab', 'register-car', 'order-detail'
  const [activeView, setActiveView] = useState<'regular-tab' | 'register-car' | 'order-detail'>('regular-tab');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Active Tab navigation inside 'regular-tab' view
  // Admins default to 'dashboard', mechanics default to 'mechanic-dashboard'
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Sync state to localStorage when values change
  useEffect(() => {
    localStorage.setItem('auto_service_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('auto_service_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('auto_service_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('auto_service_configs', JSON.stringify(serviceConfigs));
  }, [serviceConfigs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('auto_service_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('auto_service_current_user');
    }
  }, [currentUser]);

  // Handle active navigation based on user role login
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('all-orders');
      }
      setActiveView('regular-tab');
    }
  }, [currentUser]);

  // --- Handlers & Actions ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedOrderId(null);
    setActiveView('regular-tab');
  };

  const handleOpenAddOrder = () => {
    setActiveView('register-car');
  };

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
    setActiveView('order-detail');
  };

  // 1. Add new car registration entry
  const handleAddOrder = (
    newFields: Omit<CarServiceOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => {
    const id = `ord-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newOrder: CarServiceOrder = {
      ...newFields,
      id,
      createdBy: currentUser?.id || 'unknown',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveView('regular-tab');
    setCurrentTab('dashboard');
  };

  // 2. Update status of the general repair job
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
  };

  // 3. Update status of the invoice payment
  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o))
    );
  };

  // 4. Update order core fields (Admins only)
  const handleUpdateOrderDetails = (orderId: string, updatedFields: Partial<CarServiceOrder>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updatedFields, updatedAt: new Date().toISOString() } : o))
    );
  };

  // 5. Append new service detailing
  const handleAddService = (srvFields: Omit<ServiceItem, 'id' | 'createdAt'>) => {
    const id = `srv-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newService: ServiceItem = {
      ...srvFields,
      id,
      createdAt: timestamp,
    };

    setServices((prev) => [...prev, newService]);

    // Automatically ensure the order status updates to 'pending' as a work began on it
    const parentOrder = orders.find((o) => o.id === srvFields.orderId);
    if (parentOrder && parentOrder.status === 'new') {
      handleUpdateOrderStatus(srvFields.orderId, 'pending');
    }
  };

  // 6. Delete a service detailing
  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  // 7. Manage Staff: Register Employee
  const handleAddUser = (userFields: Omit<User, 'id' | 'createdAt'>) => {
    const id = `usr-${Date.now()}`;
    const newUser: User = {
      ...userFields,
      id,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
  };

  // 8. Manage Staff: Fire Employee
  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // 9. Save all changes including order status, payment paidTo and service items list in one transaction save
  const handleSaveOrderTransaction = (
    orderId: string,
    updatedOrder: CarServiceOrder,
    updatedServices: ServiceItem[]
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...updatedOrder, updatedAt: new Date().toISOString() } : o))
    );

    setServices((prev) => {
      const rest = prev.filter((s) => s.orderId !== orderId);
      return [...rest, ...updatedServices];
    });

    setActiveView('regular-tab');
  };

  // 10. Update/Save overall service configurations
  const handleSaveServiceConfigs = (newConfigs: ServiceTypeConfig[]) => {
    setServiceConfigs(newConfigs);
  };

  // --- Rendering engine router mapping ---

  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

  // Find currently selected order object
  const currentSelectedOrder = orders.find((o) => o.id === selectedOrderId);
  
  // Isolate normal mechanic-only filter list
  const mechanicsList = users.filter((u) => u.role === 'mechanic');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top sticky bar */}
      <Header currentUser={currentUser} onLogout={handleLogout} />

      {/* Main viewport segment */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeView === 'register-car' ? (
            <motion.div
              key="register-car"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <OrderFormView
                onAddOrder={handleAddOrder}
                onCancel={() => {
                  setActiveView('regular-tab');
                  setCurrentTab('dashboard');
                }}
              />
            </motion.div>
          ) : activeView === 'order-detail' && currentSelectedOrder ? (
            <motion.div
              key="order-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <OrderDetailsView
                order={currentSelectedOrder}
                services={services}
                mechanics={mechanicsList}
                allUsers={users}
                currentUser={currentUser}
                serviceConfigs={serviceConfigs}
                onSaveTransaction={handleSaveOrderTransaction}
                onBack={() => setActiveView('regular-tab')}
              />
            </motion.div>
          ) : (
            /* Standard Bottom Navigation tabs router mapping */
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="py-1"
            >
              {/* ADMIN Views */}
              {currentUser.role === 'admin' && (
                <>
                  {currentTab === 'dashboard' && (
                    <DashboardView
                      orders={orders}
                      currentUser={currentUser}
                      onSelectOrder={handleSelectOrder}
                      onOpenAddOrder={handleOpenAddOrder}
                    />
                  )}
                  {currentTab === 'history' && (
                    <HistoryView
                      orders={orders}
                      services={services}
                      mechanics={mechanicsList}
                      serviceConfigs={serviceConfigs}
                      onSelectOrder={handleSelectOrder}
                    />
                  )}
                  {currentTab === 'employees' && (
                    <EmployeesView
                      users={users}
                      currentUser={currentUser}
                      onAddUser={handleAddUser}
                      onDeleteUser={handleDeleteUser}
                      serviceConfigs={serviceConfigs}
                      onSaveServiceConfigs={handleSaveServiceConfigs}
                    />
                  )}
                  {currentTab === 'reports' && (
                    <ReportsView orders={orders} services={services} mechanics={mechanicsList} allUsers={users} />
                  )}
                </>
              )}

              {/* MECHANIC Views */}
              {currentUser.role === 'mechanic' && (
                <>
                  {currentTab === 'mechanic-dashboard' && (
                    <MechanicPanelView
                      orders={orders}
                      services={services}
                      currentUser={currentUser}
                      serviceConfigs={serviceConfigs}
                      onSelectOrder={handleSelectOrder}
                    />
                  )}
                  {currentTab === 'all-orders' && (
                    <DashboardView
                      orders={orders}
                      currentUser={currentUser}
                      onSelectOrder={handleSelectOrder}
                      onOpenAddOrder={handleOpenAddOrder}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Bottom Mobile Navigation (only visible when not in sub-modal form displays on mobile) */}
      {activeView === 'regular-tab' && (
        <BottomNav currentTab={currentTab} onChangeTab={setCurrentTab} role={currentUser.role} />
      )}
    </div>
  );
}
