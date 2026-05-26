/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, CarServiceOrder, ServiceItem, calculateMechanicEarning } from '../types';
import { hashPassword } from './crypto';

// Let's prepopulate 3 users: 1 Admin and 2 Mechanics
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    firstName: 'ლაშა',
    lastName: 'კალანდაძე',
    username: 'admin',
    passwordHash: hashPassword('admin'),
    role: 'admin',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'usr-mech-1',
    firstName: 'გიორგი',
    lastName: 'იმედაშვილი',
    username: 'giorgi',
    passwordHash: hashPassword('pass123'),
    role: 'mechanic',
    createdAt: '2026-05-02T12:00:00Z',
  },
  {
    id: 'usr-mech-2',
    firstName: 'თემო',
    lastName: 'შონია',
    username: 'temo',
    passwordHash: hashPassword('pass123'),
    role: 'mechanic',
    createdAt: '2026-05-02T12:30:00Z',
  },
];

// Pre-filled sample orders spanning some days
export const INITIAL_ORDERS: CarServiceOrder[] = [
  {
    id: 'ord-101',
    date: '2026-05-26',
    carBrand: 'Toyota Prius',
    carNumber: 'GE-777-ZZ',
    clientFullName: 'ირაკლი გელაშვილი',
    clientPhone: '599123456',
    problemDescription: 'სავალი ნაწილის შემოწმება და დიაგნოსტიკა, ჩეკის წაკითხვა',
    status: 'completed',
    odo: 145000,
    paymentStatus: 'paid',
    createdBy: 'usr-admin-1',
    createdAt: '2026-05-26T09:15:00Z',
    updatedAt: '2026-05-26T14:30:00Z',
  },
  {
    id: 'ord-102',
    date: '2026-05-26',
    carBrand: 'BMW X5',
    carNumber: 'X5-888-XX',
    clientFullName: 'ნიკოლოზ მჭედლიშვილი',
    clientPhone: '595987654',
    problemDescription: 'ძრავზე ზეთის გაჟონვა, ელექტროობის შემოწმება',
    status: 'pending',
    odo: 198200,
    paymentStatus: 'unpaid',
    createdBy: 'usr-admin-1',
    createdAt: '2026-05-26T10:45:00Z',
    updatedAt: '2026-05-26T11:00:00Z',
  },
  {
    id: 'ord-103',
    date: '2026-05-25',
    carBrand: 'Toyota Aqua',
    carNumber: 'AQ-010-QA',
    clientFullName: 'ნინო დევდარიანი',
    clientPhone: '555332211',
    problemDescription: 'კონდიციონერი არ უბერავს ცივ ჰაერს',
    status: 'completed',
    odo: 89000,
    paymentStatus: 'paid',
    createdBy: 'usr-admin-1',
    createdAt: '2026-05-25T11:00:00Z',
    updatedAt: '2026-05-25T16:20:00Z',
  },
  {
    id: 'ord-104',
    date: '2026-05-24',
    carBrand: 'Mercedes-Benz E-Class',
    carNumber: 'MB-400-EE',
    clientFullName: 'ლევან კაპანაძე',
    clientPhone: '591554433',
    problemDescription: 'წინა ფარები არ ინთება, ელექტროობის პრობლემაა',
    status: 'completed',
    odo: 210000,
    paymentStatus: 'paid',
    createdBy: 'usr-admin-1',
    createdAt: '2026-05-24T08:30:00Z',
    updatedAt: '2026-05-24T12:00:00Z',
  },
  {
    id: 'ord-105',
    date: '2026-05-23',
    carBrand: 'Honda Fit',
    carNumber: 'HF-987-AA',
    clientFullName: 'დავით კობახიძე',
    clientPhone: '577443322',
    problemDescription: 'ზეთის შეცვლა ძრავში, ფილტრების განახლება',
    status: 'completed',
    odo: 124500,
    paymentStatus: 'unpaid',
    createdBy: 'usr-admin-1',
    createdAt: '2026-05-23T14:20:00Z',
    updatedAt: '2026-05-23T15:30:00Z',
  },
  {
    id: 'ord-106',
    date: '2026-05-22',
    carBrand: 'Subaru Forester',
    carNumber: 'FU-555-UU',
    clientFullName: 'გიორგი გელაშვილი',
    clientPhone: '593445566',
    problemDescription: 'უკანა ამორტიზატორების შეცვლა',
    status: 'completed',
    odo: 167000,
    paymentStatus: 'paid',
    createdBy: 'usr-admin-1',
    createdAt: '2026-05-22T09:00:00Z',
    updatedAt: '2026-05-22T13:45:00Z',
  },
  {
    id: 'ord-107',
    date: '2026-05-20',
    carBrand: 'Hyundai Elantra',
    carNumber: 'HE-333-LA',
    clientFullName: 'ეკატერინე ჯავახიშვილი',
    clientPhone: '551987654',
    problemDescription: 'კომპიუტერული დიაგნოსტიკა და ელექტროობა',
    status: 'completed',
    odo: 95400,
    paymentStatus: 'paid',
    createdBy: 'usr-admin-1',
    createdAt: '2026-05-20T11:15:00Z',
    updatedAt: '2026-05-20T14:00:00Z',
  }
];

// Pre-filled services attached to orders
export const INITIAL_SERVICES: ServiceItem[] = [
  // Order 101: Prius (Today, completed)
  {
    id: 'srv-1',
    orderId: 'ord-101',
    serviceType: 'diagnostic',
    description: 'კომპიუტერული სრული დიაგნოსტიკა',
    price: 50,
    mechanicId: 'usr-mech-1', // Giorgi
    mechanicEarning: calculateMechanicEarning('diagnostic', 50), // 30
    createdAt: '2026-05-26T10:00:00Z',
  },
  {
    id: 'srv-2',
    orderId: 'ord-101',
    serviceType: 'electromechanics',
    description: 'აბს-ის (ABS) დაჩიკის გაწმენდა და გაყვანილობა',
    price: 120,
    mechanicId: 'usr-mech-1', // Giorgi
    mechanicEarning: calculateMechanicEarning('electromechanics', 120), // 60
    createdAt: '2026-05-26T12:00:00Z',
  },

  // Order 102: BMW X5 (Today, pending)
  {
    id: 'srv-3',
    orderId: 'ord-102',
    serviceType: 'diagnostic',
    description: 'ძრავის კოდების წაკითხვა',
    price: 60,
    mechanicId: 'usr-mech-2', // Temo
    mechanicEarning: calculateMechanicEarning('diagnostic', 60), // 30
    createdAt: '2026-05-26T11:15:00Z',
  },

  // Order 103: Aqua (Yesterday, completed)
  {
    id: 'srv-4',
    orderId: 'ord-103',
    serviceType: 'other',
    description: 'ფრეონის დამატება და მილების ჰერმეტულობა',
    price: 90,
    mechanicId: 'usr-mech-1', // Giorgi
    mechanicEarning: calculateMechanicEarning('other', 90), // 45
    createdAt: '2026-05-25T13:00:00Z',
  },

  // Order 104: Mercedes E-Class (Completed)
  {
    id: 'srv-5',
    orderId: 'ord-104',
    serviceType: 'electromechanics',
    description: 'ფარების ბლოკების რემონტი და კავშირის აღდგენა',
    price: 260,
    mechanicId: 'usr-mech-2', // Temo
    mechanicEarning: calculateMechanicEarning('electromechanics', 260), // 130
    createdAt: '2026-05-24T10:00:00Z',
  },

  // Order 105: Honda Fit (Completed)
  {
    id: 'srv-6',
    orderId: 'ord-105',
    serviceType: 'other',
    description: 'ძრავში ზეთისა და ფილტრების შეცვლა',
    price: 80,
    mechanicId: 'usr-mech-1', // Giorgi
    mechanicEarning: calculateMechanicEarning('other', 80), // 40
    createdAt: '2026-05-23T14:40:00Z',
  },

  // Order 106: Forester (Completed)
  {
    id: 'srv-7',
    orderId: 'ord-106',
    serviceType: 'other',
    description: 'უკანა წყვილი ამორტიზატორების შეცვლა',
    price: 180,
    mechanicId: 'usr-mech-2', // Temo
    mechanicEarning: calculateMechanicEarning('other', 180), // 90
    createdAt: '2026-05-22T11:00:00Z',
  },

  // Order 107: Hyundai Elantra (Completed)
  {
    id: 'srv-8',
    orderId: 'ord-107',
    serviceType: 'diagnostic',
    description: 'სრული ელექტრო დიაგნოსტიკა',
    price: 50,
    mechanicId: 'usr-mech-1', // Giorgi
    mechanicEarning: calculateMechanicEarning('diagnostic', 50), // 30
    createdAt: '2026-05-20T12:00:00Z',
  },
  {
    id: 'srv-9',
    orderId: 'ord-107',
    serviceType: 'electromechanics',
    description: 'ანთების სანთლებისა და ჩიბუხების შეცვლა',
    price: 150,
    mechanicId: 'usr-mech-2', // Temo
    mechanicEarning: calculateMechanicEarning('electromechanics', 150), // 75
    createdAt: '2026-05-20T13:00:00Z',
  }
];
