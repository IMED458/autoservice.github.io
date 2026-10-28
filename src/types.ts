export type Role = 'owner' | 'super_admin' | 'admin' | 'manager' | 'mechanic' | 'developer' | 'accountant';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  passwordHash: string;
  role: Role;
  enabledModules?: string[]; // e.g. ['shop', 'day_closing', 'reports']
  createdAt: string;
}

export type OrderStatus = 'new' | 'pending' | 'completed';
export type PaymentStatus = 'paid' | 'unpaid';

export interface CarServiceOrder {
  id: string;
  date: string;
  carBrand: string;
  carNumber: string;
  clientFullName: string;
  clientPhone: string;
  problemDescription: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidTo?: string;
  paidAt?: string;                  // ISO timestamp when payment was recorded — wages are accrued on this date
  completedAt?: string;             // ISO timestamp when work was marked completed
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignedEmployeeIds?: string[];   // employees assigned to this order
  assignedServiceType?: string;     // optional service type hint at registration
}

export type ServiceType = string;

export interface ServiceTypeConfig {
  id: string;
  name: string;
  percentageReward: number;
  flatReward: number;
  rewardType: 'percentage' | 'flat';
  employeeRewards?: Record<string, {
    rewardType: 'percentage' | 'flat';
    percentageReward: number;
    flatReward: number;
    coMechanicId?: string;
    coMechanicRewardType?: 'flat' | 'percentage';
    coMechanicEarning?: number;
  }>;
  coMechanicId?: string;            // permanently assigned second executor for this service
  coMechanicRewardType?: 'flat' | 'percentage'; // how the co-executor earning is calculated
  coMechanicEarning?: number;       // flat amount OR percentage value (depending on rewardType)
}

export interface ServiceItem {
  id: string;
  orderId: string;
  serviceType: string;
  description: string;
  price: number;
  mechanicId: string;
  mechanicEarning: number;
  coMechanicId?: string;
  coMechanicEarning?: number;
  helpers?: ServiceHelper[];        // all additional executors (supersedes coMechanicId)
  createdAt: string;
}

export interface ServiceHelper {
  mechanicId: string;
  earning: number;
  fixed?: boolean;                  // assigned from settings — mechanics cannot change it
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  photoUrl: string;
  status: 'active' | 'inactive';
  soldQuantity: number;
  createdAt: string;
}

export interface ProductSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
}

export interface ProductSale {
  id: string;
  clientName: string;
  clientPhone: string;
  carBrand: string;
  carNumber: string;
  date: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: 'cash' | 'card' | 'tbc' | 'bog' | 'transfer' | 'mixed';
  mixedPaymentDetails?: { cash: number; card: number; tbc: number; bog: number; transfer: number };
  items: ProductSaleItem[];
  createdBy: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'refill' | 'sale' | 'adjustment';
  quantity: number;
  purchasePrice: number;
  date: string;
  note: string;
  operatorName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userFullName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  startTime: string;
  closingTime: string;
  totalReceived: number;
  totalOutstanding: number;
  productSalesCount: number;
  servicesCount: number;
  productRevenue: number;
  serviceRevenue: number;
  productProfit: number;
  totalCash: number;
  totalCard: number;
  totalTbc: number;
  totalBog: number;
  totalTransfer: number;
  itemsSold: any[];
  servicesDone: any[];
  closedBy: string;
  note: string;
  createdAt: string;
}

export interface CarBrand {
  id: string;
  name: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'მფლობელი',
  super_admin: 'სუპერ ადმინი',
  admin: 'ადმინისტრატორი',
  manager: 'მენეჯერი',
  mechanic: 'ხელოსანი',
  developer: 'პროგ. ადმინი',
  accountant: 'ბუღალტერი',
};

export const NON_WORKER_USERNAMES = ['imedo'];

export function isAssignableMechanic(user: Pick<User, 'role' | 'username'>): boolean {
  return user.role !== 'accountant' && !NON_WORKER_USERNAMES.includes(user.username.toLowerCase());
}

export function getUserRoleLabel(user: Pick<User, 'role' | 'username' | 'firstName'>): string {
  if (isOwnerUser(user)) return 'მფლობელი';
  return ROLE_LABELS[user.role];
}

export function isOwnerUser(user: Pick<User, 'role' | 'username' | 'firstName'>): boolean {
  return user.role === 'owner' || user.username.toLowerCase() === 'zviadi' || user.firstName === 'ზვიადი';
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'ახალი',
  pending: 'პროცესშია',
  completed: 'დასრულებულია',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'გადახდილია',
  unpaid: 'გადაუხდელია',
};

export const DEFAULT_SERVICE_CONFIGS: ServiceTypeConfig[] = [
  { id: 'diagnostic', name: 'დიაგნოსტიკა', percentageReward: 0, flatReward: 30, rewardType: 'flat' },
  { id: 'electromechanics', name: 'ელექტრო მექანიკა', percentageReward: 50, flatReward: 0, rewardType: 'percentage' },
  { id: 'other', name: 'სხვა სამუშაოები', percentageReward: 50, flatReward: 0, rewardType: 'percentage' },
];

export const DEFAULT_CAR_BRANDS: CarBrand[] = [
  { id: 'cb-mb', name: 'MERCEDES-BENZ' },
  { id: 'cb-daf', name: 'DAF' },
  { id: 'cb-scania', name: 'SCANIA' },
  { id: 'cb-man', name: 'MAN' },
  { id: 'cb-iveco', name: 'IVECO' },
  { id: 'cb-volvo', name: 'VOLVO' },
  { id: 'cb-renault', name: 'RENAULT' },
];

export function calculateMechanicEarning(
  serviceType: string,
  price: number,
  configs?: ServiceTypeConfig[],
  employeeId?: string
): number {
  const activeConfigs = configs || DEFAULT_SERVICE_CONFIGS;
  const conf = activeConfigs.find((c) => c.id === serviceType);
  if (conf) {
    if (employeeId && conf.employeeRewards?.[employeeId]) {
      const er = conf.employeeRewards[employeeId];
      return er.rewardType === 'flat'
        ? er.flatReward
        : Number(((price * er.percentageReward) / 100).toFixed(2));
    }
    return conf.rewardType === 'flat'
      ? conf.flatReward
      : Number(((price * conf.percentageReward) / 100).toFixed(2));
  }
  if (serviceType === 'diagnostic') return 30;
  return Number((price * 0.5).toFixed(2));
}

export function hasModule(user: User, mod: string): boolean {
  return user.role === 'owner' || user.role === 'super_admin' || user.role === 'developer' || user.role === 'manager' || (user.enabledModules ?? []).includes(mod);
}

export function hasAdminAccess(user: Pick<User, 'role'>): boolean {
  return user.role === 'owner' || user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager' || user.role === 'developer';
}

export function hasFullSystemAccess(user: Pick<User, 'role'>): boolean {
  return isOwnerLike(user.role) || user.role === 'developer';
}

/** Returns true for roles that have dashboard/admin-like access */
export function isAdminRole(role: Role): boolean {
  return role === 'owner' || role === 'super_admin' || role === 'admin' || role === 'manager' || role === 'developer' || role === 'accountant';
}

/** Returns true for roles that have OWNER-level business access. Only `owner` is the ownership role. */
export function isOwnerLike(role: Role): boolean {
  return role === 'owner' || role === 'super_admin' || role === 'manager';
}

export const PAID_TO_OPTIONS = ['ზვიადი', 'გიორგი მენეჯერი'];

const round2 = (n: number) => Math.round(n * 100) / 100;

export function findOwnerId(users: Pick<User, 'id' | 'role' | 'username' | 'firstName'>[]): string | undefined {
  return (users.find(u => u.role === 'owner') || users.find(isOwnerUser))?.id;
}

/** Second executor permanently assigned in settings for this service + main executor */
export function getFixedCoMechanic(serviceType: string, mainId: string, configs: ServiceTypeConfig[]) {
  const er = configs.find(c => c.id === serviceType)?.employeeRewards?.[mainId];
  if (!er?.coMechanicId) return null;
  return {
    mechanicId: er.coMechanicId,
    rewardType: (er.coMechanicRewardType || 'flat') as 'flat' | 'percentage',
    value: er.coMechanicEarning ?? 0,
  };
}

export function getFixedCoEarning(fixed: { rewardType: 'flat' | 'percentage'; value: number }, price: number): number {
  return fixed.rewardType === 'percentage' ? round2((price * fixed.value) / 100) : fixed.value;
}

export interface HelperDraft {
  mechanicId: string;
  earning?: number | null; // null/undefined → automatic equal split
  fixed?: boolean;
}

/**
 * Distributes a service's worker pool:
 * - fixed (settings) co-executor gets its configured amount on top of the main executor's share;
 * - manually added executors split the main executor's share equally (or take an explicit amount out of it);
 * - the owner as main executor keeps everything that is not paid to helpers.
 * The owner's remaining share is never reduced by manually added helpers.
 */
export function buildServiceShares(params: {
  serviceType: string;
  price: number;
  configs: ServiceTypeConfig[];
  mainId: string;
  ownerId?: string;
  helpers: HelperDraft[];
}): { mechanicEarning: number; helpers: ServiceHelper[]; error?: string } {
  const { serviceType, price, configs, mainId, ownerId } = params;
  const pool = calculateMechanicEarning(serviceType, price, configs, mainId);
  const fixedCfg = getFixedCoMechanic(serviceType, mainId, configs);
  const seen = new Set<string>([mainId]);
  const valid = params.helpers.filter(h => h.mechanicId && !seen.has(h.mechanicId) && seen.add(h.mechanicId));

  const fixed: ServiceHelper[] = valid
    .filter(h => h.fixed && fixedCfg && h.mechanicId === fixedCfg.mechanicId)
    .map(h => ({ mechanicId: h.mechanicId, earning: getFixedCoEarning(fixedCfg!, price), fixed: true }));
  const manualDrafts = valid.filter(h => !(h.fixed && fixedCfg && h.mechanicId === fixedCfg.mechanicId));
  const auto = round2(pool / (manualDrafts.length + 1));
  const manual: ServiceHelper[] = manualDrafts.map(h => ({
    mechanicId: h.mechanicId,
    earning: h.earning != null && !Number.isNaN(h.earning) ? round2(h.earning) : auto,
  }));
  const manualSum = round2(manual.reduce((s, h) => s + h.earning, 0));
  const helpers = [...fixed, ...manual];
  const helpersSum = round2(helpers.reduce((s, h) => s + h.earning, 0));

  if (ownerId && mainId === ownerId) {
    if (helpersSum > price) return { mechanicEarning: 0, helpers, error: 'დამხმარეების თანხა აღემატება ფასს' };
    return { mechanicEarning: round2(price - helpersSum), helpers };
  }
  if (manualSum > pool + 0.001) {
    return { mechanicEarning: 0, helpers, error: `დამხმარეების თანხა (${manualSum} ₾) აღემატება შემსრულებლის წილს (${pool} ₾)` };
  }
  return { mechanicEarning: round2(pool - manualSum), helpers };
}

export function getServiceHelpers(srv: ServiceItem): ServiceHelper[] {
  if (srv.helpers && srv.helpers.length > 0) return srv.helpers;
  if (srv.coMechanicId) return [{ mechanicId: srv.coMechanicId, earning: srv.coMechanicEarning || 0 }];
  return [];
}

/** Every executor's share of a service. The owner as main executor gets the whole price minus helpers. */
export function getServiceShares(srv: ServiceItem, ownerId?: string): { mechanicId: string; earning: number; isMain: boolean }[] {
  const helpers = getServiceHelpers(srv);
  const helpersSum = helpers.reduce((s, h) => s + h.earning, 0);
  const mainEarning = ownerId && srv.mechanicId === ownerId ? round2(Math.max(0, srv.price - helpersSum)) : srv.mechanicEarning;
  return [
    { mechanicId: srv.mechanicId, earning: mainEarning, isMain: true },
    ...helpers.map(h => ({ mechanicId: h.mechanicId, earning: h.earning, isMain: false })),
  ];
}

export function getUserServiceEarning(srv: ServiceItem, userId: string, ownerId?: string): number {
  return round2(getServiceShares(srv, ownerId).filter(s => s.mechanicId === userId).reduce((sum, s) => sum + s.earning, 0));
}

export function isServiceParticipant(srv: ServiceItem, userId: string): boolean {
  return srv.mechanicId === userId || getServiceHelpers(srv).some(h => h.mechanicId === userId);
}

/** Splits a service into: wages paid to non-owner workers, owner's earning as executor, owner's profit as owner */
export function splitServiceMoney(srv: ServiceItem, ownerId?: string) {
  const shares = getServiceShares(srv, ownerId);
  const ownerExecutor = round2(shares.filter(s => ownerId && s.mechanicId === ownerId).reduce((a, s) => a + s.earning, 0));
  const wages = round2(shares.filter(s => !ownerId || s.mechanicId !== ownerId).reduce((a, s) => a + s.earning, 0));
  const ownerProfit = round2(srv.price - wages - ownerExecutor);
  return { wages, ownerExecutor, ownerProfit, ownerTotal: round2(ownerExecutor + ownerProfit) };
}

export function formatSharePct(earning: number, price: number): string {
  if (!price) return '';
  const pct = (earning / price) * 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

/** Wages accrue only once the order is paid, on the payment date (legacy paid orders fall back to the order date) */
export function getPaidDate(order: Pick<CarServiceOrder, 'paymentStatus' | 'paidAt' | 'date'>): string | null {
  if (order.paymentStatus !== 'paid') return null;
  return (order.paidAt || order.date || '').slice(0, 10) || null;
}

export function getCompletedDate(order: Pick<CarServiceOrder, 'status' | 'completedAt' | 'updatedAt'>): string | null {
  if (order.status !== 'completed') return null;
  return (order.completedAt || order.updatedAt || '').slice(0, 10) || null;
}
