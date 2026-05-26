/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'mechanic';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  passwordHash: string; // MD5/SHA256 mock hash
  role: Role;
  createdAt: string;
}

export type OrderStatus = 'new' | 'pending' | 'completed'; // ახალი, პროცესშია, დასრულებულია
export type PaymentStatus = 'paid' | 'unpaid'; // გადახდილია, გადაუხდელია

export interface CarServiceOrder {
  id: string;
  date: string; // YYYY-MM-DD
  carBrand: string; // მანქანის მარკა
  carNumber: string; // სახელმწიფო ნომერი
  clientFullName: string; // კლიენტის სახელი და გვარი
  clientPhone: string; // კლიენტის ტელეფონი
  problemDescription: string; // პრობლემის აღწერა
  status: OrderStatus;
  odo: number; // ODO / გარბენი
  paymentStatus: PaymentStatus;
  paidTo?: string; // ვისთან გადაიხადა (მაგ. 'ზვიადი' ან სხვა პირი)
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
}

export type ServiceType = string; // დინამიური გახდა

export interface ServiceTypeConfig {
  id: string; // e.g. 'diagnostic', 'electromechanics'
  name: string; // e.g. 'დიაგნოსტიკა'
  defaultPrice: number; // e.g. 100
  percentageReward: number; // e.g. 50 (for 50%), or 0 if flat
  flatReward: number; // e.g. 30 (for flat Diagnostic Reward)
  rewardType: 'percentage' | 'flat'; // reward calculation mode
}

export interface ServiceItem {
  id: string;
  orderId: string;
  serviceType: string; // config id
  description: string; // შესრულებული სამუშაოს აღწერა
  price: number; // ფასი
  mechanicId: string; // მომსახურების შემსრულებელი ხელოსნის ID
  mechanicEarning: number; // ავტომატურად დათვლილი გამომუშავება
  createdAt: string;
}

// Translations and helpers
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'ადმინისტრატორი',
  mechanic: 'ხელოსანი',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'ახალი',
  pending: 'პროცესშია',
  completed: 'დასრულებულია',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'გადახდილია',
  unpaid: 'გადაუხდელია',
};

// Default configs in case none are in localStorage
export const DEFAULT_SERVICE_CONFIGS: ServiceTypeConfig[] = [
  {
    id: 'diagnostic',
    name: 'დიაგნოსტიკა',
    defaultPrice: 100,
    percentageReward: 0,
    flatReward: 30,
    rewardType: 'flat',
  },
  {
    id: 'electromechanics',
    name: 'ელექტრო მექანიკა',
    defaultPrice: 80,
    percentageReward: 50,
    flatReward: 0,
    rewardType: 'percentage',
  },
  {
    id: 'other',
    name: 'სხვა სამუშაოები',
    defaultPrice: 50,
    percentageReward: 50,
    flatReward: 0,
    rewardType: 'percentage',
  },
];

/**
 * Calculates mechanic earnings automatically based on dynamic configs or defaults.
 */
export function calculateMechanicEarning(
  serviceType: string,
  price: number,
  configs?: ServiceTypeConfig[]
): number {
  const activeConfigs = configs || DEFAULT_SERVICE_CONFIGS;
  const conf = activeConfigs.find((c) => c.id === serviceType);
  if (conf) {
    if (conf.rewardType === 'flat') {
      return conf.flatReward;
    } else {
      return Number(((price * conf.percentageReward) / 100).toFixed(2));
    }
  }

  // Fallback defaults
  if (serviceType === 'diagnostic') {
    return 30; // 30 ლარი flat
  } else {
    return Number((price * 0.5).toFixed(2)); // 50%
  }
}
