'use strict';

const bcrypt = require('bcryptjs');

// Initial Database / In-Memory Mock Store with Full Seed Data
let USERS = [
  {
    id: 'usr-01',
    name: 'Dr. Tariq Mahmood (Super Admin)',
    email: 'superadmin@dragcare.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'super-admin',
    phone: '+92 300 1112233',
    createdAt: new Date('2026-01-01')
  },
  {
    id: 'usr-02',
    name: 'Pharm-D Ayesha Khan (Admin)',
    email: 'admin@dragcare.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    phone: '+92 300 4445566',
    createdAt: new Date('2026-01-15')
  },
  {
    id: 'usr-03',
    name: 'Ali Raza',
    email: 'user@dragcare.com',
    passwordHash: bcrypt.hashSync('user123', 10),
    role: 'user',
    phone: '+92 300 7778899',
    createdAt: new Date('2026-02-01')
  }
];

let MEDICINES = [
  {
    id: 'med-01',
    name: 'Panadol Extra Tablets (500mg/65mg)',
    category: 'otc',
    categoryName: 'OTC & Pain Relief',
    genericSalt: 'Paracetamol 500mg + Caffeine 65mg',
    manufacturer: 'GSK Consumer Healthcare',
    packSize: 'Pack of 100 Tablets',
    price: 3.50,
    originalPrice: 4.50,
    discountPercent: 22,
    rating: 4.8,
    reviewsCount: 142,
    isRxRequired: false,
    isColdChain: false,
    expiryDate: '11/2027',
    stockCount: 85,
    inStock: true,
    isFlashDeal: true,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'med-02',
    name: 'Augmentin 625mg Tablets',
    category: 'antibiotics',
    categoryName: 'Antibiotic',
    genericSalt: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    manufacturer: 'GlaxoSmithKline (GSK)',
    packSize: 'Strip of 10 Tablets',
    price: 12.80,
    originalPrice: 15.00,
    discountPercent: 15,
    rating: 4.9,
    reviewsCount: 89,
    isRxRequired: true,
    isColdChain: false,
    expiryDate: '09/2026',
    stockCount: 42,
    inStock: true,
    isFlashDeal: false,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'med-03',
    name: 'Lantus SoloStar Insulin 100 Units/ml',
    category: 'diabetes',
    categoryName: 'Diabetes & Blood Sugar',
    genericSalt: 'Insulin Glargine 100 IU/ml',
    manufacturer: 'Sanofi-Aventis',
    packSize: '5 x 3ml Pens',
    price: 45.00,
    originalPrice: 52.00,
    discountPercent: 13,
    rating: 5.0,
    reviewsCount: 64,
    isRxRequired: true,
    isColdChain: true,
    expiryDate: '08/2026',
    stockCount: 18,
    inStock: true,
    isFlashDeal: true,
    image: 'https://images.unsplash.com/photo-1579165466791-788226ab77b6?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'med-04',
    name: 'Accu-Chek Instant Blood Glucose Meter Kit',
    category: 'devices',
    categoryName: 'Medical Devices & Kits',
    genericSalt: 'Electrochemical Biosensor Monitor',
    manufacturer: 'Roche Diabetes Care',
    packSize: 'Kit with 25 Strips',
    price: 24.50,
    originalPrice: 32.00,
    discountPercent: 23,
    rating: 4.7,
    reviewsCount: 215,
    isRxRequired: false,
    isColdChain: false,
    expiryDate: '12/2028',
    stockCount: 50,
    inStock: true,
    isFlashDeal: true,
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'med-05',
    name: 'Nexum (Esomeprazole) 40mg Capsules',
    category: 'prescription',
    categoryName: 'Prescription Drugs (Rx)',
    genericSalt: 'Esomeprazole Magnesium Trihydrate 40mg',
    manufacturer: 'Getz Pharma',
    packSize: 'Box of 14 Delayed-release Capsules',
    price: 6.20,
    originalPrice: 7.50,
    discountPercent: 17,
    rating: 4.8,
    reviewsCount: 93,
    isRxRequired: true,
    isColdChain: false,
    expiryDate: '01/2027',
    stockCount: 65,
    inStock: true,
    isFlashDeal: false,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'med-06',
    name: 'Centrum Silver Multivitamins + Lutein',
    category: 'supplements',
    categoryName: 'Vitamins & Nutrition',
    genericSalt: '24 Essential Micronutrients with Lutein',
    manufacturer: 'Pfizer / Haleon',
    packSize: 'Bottle of 100 Tablets',
    price: 18.50,
    originalPrice: 22.00,
    discountPercent: 16,
    rating: 4.9,
    reviewsCount: 310,
    isRxRequired: false,
    isColdChain: false,
    expiryDate: '10/2027',
    stockCount: 95,
    inStock: true,
    isFlashDeal: false,
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'med-07',
    name: 'Omron HEM-7120 Blood Pressure Monitor',
    category: 'devices',
    categoryName: 'Medical Devices & Kits',
    genericSalt: 'Oscillometric Upper Arm Digital Monitor',
    manufacturer: 'Omron Healthcare Japan',
    packSize: 'Monitor Unit + Standard Arm Cuff',
    price: 38.00,
    originalPrice: 48.00,
    discountPercent: 21,
    rating: 4.9,
    reviewsCount: 184,
    isRxRequired: false,
    isColdChain: false,
    expiryDate: 'Warranty 3 Years',
    stockCount: 30,
    inStock: true,
    isFlashDeal: true,
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'med-08',
    name: 'Glucophage 500mg Tablets',
    category: 'diabetes',
    categoryName: 'Diabetes & Blood Sugar',
    genericSalt: 'Metformin Hydrochloride 500mg',
    manufacturer: 'Merck Healthcare',
    packSize: 'Pack of 50 Tablets',
    price: 4.80,
    originalPrice: 5.80,
    discountPercent: 17,
    rating: 4.8,
    reviewsCount: 77,
    isRxRequired: true,
    isColdChain: false,
    expiryDate: '06/2027',
    stockCount: 110,
    inStock: true,
    isFlashDeal: false,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All Categories', count: 48 },
  { id: 'prescription', name: 'Prescription Drugs (Rx)', count: 18 },
  { id: 'antibiotics', name: 'Antibiotic', count: 1 },
  { id: 'otc', name: 'OTC & Pain Relief', count: 12 },
  { id: 'cold-flu', name: 'Cold, Cough & Flu', count: 9 },
  { id: 'diabetes', name: 'Diabetes & Blood Sugar', count: 8 },
  { id: 'heart', name: 'Heart & Blood Pressure', count: 7 },
  { id: 'supplements', name: 'Vitamins & Nutrition', count: 14 },
  { id: 'devices', name: 'Medical Devices & Kits', count: 10 }
];

let PRESCRIPTIONS = [];

let ORDERS = [
  {
    id: 'DRAG-ORD-519283',
    items: [
      { name: 'Panadol Extra Tablets', quantity: 2, price: 3.50 },
      { name: 'Augmentin 625mg Tablets', quantity: 1, price: 12.80 }
    ],
    customer: {
      name: 'Usman Ghani',
      phone: '+92 333 4567890',
      address: 'House 14, F-8/2',
      city: 'Islamabad'
    },
    deliverySpeed: 'express',
    paymentMethod: 'Cash on Delivery',
    total: 22.30,
    status: 'Dispatched (Out for Delivery)',
    createdAt: new Date('2026-10-23T06:00:00Z')
  },
  {
    id: 'DRAG-ORD-420915',
    items: [
      { name: 'Lantus SoloStar Insulin 100 Units/ml', quantity: 2, price: 45.00 }
    ],
    customer: {
      name: 'Salma Begum',
      phone: '+92 301 8889999',
      address: 'Sector B, Bahria Town',
      city: 'Lahore'
    },
    deliverySpeed: 'express',
    paymentMethod: 'Credit / Debit Card',
    total: 92.50,
    status: 'Processing in Cold-Chain Facility',
    createdAt: new Date('2026-10-23T07:20:00Z')
  }
];

module.exports = { USERS, MEDICINES, CATEGORIES, PRESCRIPTIONS, ORDERS };
