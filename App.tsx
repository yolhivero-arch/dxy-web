import React, { useState, useEffect, useMemo } from 'react';
import { Product, AppView, DailySale, PurchaseInvoice, OrderItem, ClientInfo, Trainer, TrainerSale } from './types';
import { calculateProductMetrics, formatCurrency, exportInventoryToCSV } from './utils';
import { useToast } from './components/Toast';
import { useTheme } from './components/ThemeContext';
import DashboardHeader from './components/DashboardHeader';
import ProductForm from './components/ProductForm';
import InsightsPanel from './components/InsightsPanel';
import ExpenseManager from './components/ExpenseManager';
import CalculatorDXY from './components/CalculatorDXY';
import SalesManager from './components/SalesManager';
import PurchaseManager from './components/PurchaseManager';
import WholesaleManager from './components/WholesaleManager';
import PartnersManager from './components/PartnersManager';
import DashboardCharts from './components/DashboardCharts';
import CommandPalette from './components/CommandPalette';
import ComboCalculator from './components/ComboCalculator';

const INITIAL_INVENTORY: Product[] = [
  { id: '1', name: 'Salsa - Zero Calorías', brand: 'Mr Taste', flavors: ['Chocolate'], currentStock: 1, providerCost: 8158.6, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '2', name: 'Salsa - Zero Calorías', brand: 'Mr Taste', flavors: ['Caramelo'], currentStock: 1, providerCost: 8158.6, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '3', name: 'Maltodextrina Sport Plus', brand: 'Pulver', flavors: [], currentStock: 2, providerCost: 17500, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '4', name: 'Proteína Whey Concentrada - 453g', brand: 'Granger', flavors: ['Vainilla'], currentStock: 1, providerCost: 20333.81, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '5', name: 'Omelletes Proteicos', brand: 'Granger', flavors: [], currentStock: 0, providerCost: 9999.92, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '6', name: 'Cupcakes Proteicos', brand: 'Granger', flavors: [], currentStock: 0, providerCost: 9665.96, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '7', name: 'Proteína de Huevo', brand: 'Granger', flavors: [], currentStock: 0, providerCost: 24332.62, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '8', name: 'Keto Pancakes y Wafles', brand: 'Granger', flavors: [], currentStock: 0, providerCost: 7267.26, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '9', name: 'Creatina Micronizada 300 g', brand: 'Generation Fit', flavors: [], currentStock: 0, providerCost: 12649.99, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '10', name: 'Magnesio', brand: 'Natuliv', flavors: [], currentStock: 2, providerCost: 4710, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '11', name: 'Creatine - 300G', brand: 'MyProtein', flavors: ['Neutro'], currentStock: 0, providerCost: 17246.38, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '12', name: 'Beta Alanine x 300 g', brand: 'Ultratech', flavors: [], currentStock: 0, providerCost: 19485, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '13', name: 'Creatina 300g', brand: 'Ultratech', flavors: ['Neutro'], currentStock: 0, providerCost: 14399.99, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '14', name: 'Creatina 250g', brand: 'Gentech', flavors: ['Neutro'], currentStock: 0, providerCost: 22211.51, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '15', name: 'Amino 7600', brand: 'Gentech', flavors: [], currentStock: 1, providerCost: 14102.54, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '16', name: 'SHAKER FLIP 2 EN 1', brand: 'Flip', flavors: [], currentStock: 1, providerCost: 4912.6, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '17', name: 'Scoop 5g - Medida Creatina', brand: 'Flip', flavors: [], currentStock: 36, providerCost: 500, freightCost: 20, markupPercent: 50, cardSurchargePercent: 25, minStock: 10, unitsPerBox: 40 },
  { id: '18', name: 'SHAKER', brand: 'Gold', flavors: [], currentStock: 0, providerCost: 3603.53, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '19', name: 'Amino Gold BCAA', brand: 'Gold', flavors: [], currentStock: 1, providerCost: 17873.49, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '20', name: 'Vitamin', brand: 'Gold', flavors: [], currentStock: 2, providerCost: 11490.1, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '21', name: 'Creatina Micronizada 300g', brand: 'Gold', flavors: ['Neutro'], currentStock: 2, providerCost: 17853.68, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '22', name: 'Pre Work x 280 grs', brand: 'Gold', flavors: [], currentStock: 0, providerCost: 17873.48, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '23', name: 'Hair Complex', brand: 'Age Biologique', flavors: [], currentStock: 0, providerCost: 9183.84, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '24', name: 'Colágeno Hidrolizado', brand: 'Age Biologique', flavors: [], currentStock: 0, providerCost: 15320.13, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '25', name: 'Omega 3 Fsh Oil Gold', brand: 'Gold', flavors: [], currentStock: 2, providerCost: 22341.85, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '26', name: '100% Whey Protein 2 Lb Gourmet', brand: 'Gold', flavors: ['Frutilla'], currentStock: 0, providerCost: 39185.29, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '27', name: '100% Whey Protein 2 Lb Gourmet', brand: 'Gold', flavors: ['Chocolate'], currentStock: 0, providerCost: 39185.29, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '28', name: '100% Whey Protein 2 Lb Gourmet', brand: 'Gold', flavors: ['Vainilla'], currentStock: 2, providerCost: 39185.29, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '29', name: 'Vegetal Protein Isolate 2 lbs', brand: 'Gold', flavors: ['Neutro'], currentStock: 3, providerCost: 28086.91, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '30', name: 'Vegetal Protein Isolate 2 lbs', brand: 'Gold', flavors: ['Coco'], currentStock: 2, providerCost: 28086.91, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '31', name: 'Caja Sobre Hydromax Sport Drink (Caja 20 unidades)', brand: 'Nutremax', flavors: ['Naranja'], currentStock: 2, providerCost: 8675, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 20 },
  { id: '32', name: 'Caja Sobre Hydromax Sport Drink (Caja 20 unidades)', brand: 'Nutremax', flavors: ['Manzana'], currentStock: 0, providerCost: 8675, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 20 },
  { id: '33', name: 'Caja Sobre Hydromax Sport Drink (Caja 20 unidades)', brand: 'Nutremax', flavors: ['Pomelo'], currentStock: 2, providerCost: 8675, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 20 },
  { id: '34', name: 'Hidromax Sport Drink - 600g', brand: 'Nutremax', flavors: ['Naranja'], currentStock: 2, providerCost: 7391.06, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '35', name: 'Hidromax Sport Drink - 600g', brand: 'Nutremax', flavors: ['Manzana'], currentStock: 3, providerCost: 7391.06, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '36', name: 'Hidromax Sport Drink - 600g', brand: 'Nutremax', flavors: ['Pomelo'], currentStock: 0, providerCost: 7391.06, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '37', name: 'Hidromax Sport Drink - 1500 g', brand: 'Nutremax', flavors: ['Naranja'], currentStock: 0, providerCost: 13947.64, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '38', name: 'Hidromax Sport Drink - 1500 g', brand: 'Nutremax', flavors: ['Manzana'], currentStock: 0, providerCost: 13947.64, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '39', name: 'Hidromax Sport Drink - 1500 g', brand: 'Nutremax', flavors: ['Pomelo'], currentStock: 1, providerCost: 13947.64, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '40', name: 'Colágeno Hidrolizado BD', brand: 'Nutremax', flavors: ['Pomelo'], currentStock: 3, providerCost: 12746.37, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '41', name: 'Recovery Drink', brand: 'Nutremax', flavors: [], currentStock: 3, providerCost: 12434.58, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '42', name: 'Hydromax Sport Drink - Doypack 660g', brand: 'Nutremax', flavors: ['Pomelo'], currentStock: 3, providerCost: 8106.32, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '43', name: 'Hydromax Sport Drink - Doypack 660g', brand: 'Nutremax', flavors: ['Naranja'], currentStock: 2, providerCost: 8106.32, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '44', name: 'Hydromax Sport Drink - Doypack 660g', brand: 'Nutremax', flavors: ['Manzana'], currentStock: 0, providerCost: 8106.32, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '45', name: 'Bebida isotónica Hydromax - Doypack - 1320g', brand: 'Nutremax', flavors: ['Naranja'], currentStock: 0, providerCost: 12049.44, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '46', name: 'Bebida isotónica Hydromax - Doypack - 1320g', brand: 'Nutremax', flavors: ['Manzana'], currentStock: 0, providerCost: 12049.44, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '47', name: 'Bebida isotónica Hydromax - Doypack - 1320g', brand: 'Nutremax', flavors: ['Pomelo'], currentStock: 1, providerCost: 12049.44, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '48', name: 'Sobre Hydromax Sport Drink (1 unidad)', brand: 'Nutremax', flavors: ['Naranja'], currentStock: 0, providerCost: 433.75, freightCost: 40, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 20 },
  { id: '49', name: 'Sobre Hydromax Sport Drink (1 unidad)', brand: 'Nutremax', flavors: ['Manzana'], currentStock: 0, providerCost: 433.75, freightCost: 40, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 20 },
  { id: '50', name: 'Sobre Hydromax Sport Drink (1 unidad)', brand: 'Nutremax', flavors: ['Pomelo'], currentStock: 6, providerCost: 433.75, freightCost: 40, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 20 },
  { id: '51', name: 'Creatina - 200g', brand: 'Nutremax', flavors: ['Neutro'], currentStock: 1, providerCost: 12058.62, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '52', name: 'Pro salts Capsulas Electrolitos 60 Caps', brand: 'Nutremax', flavors: [], currentStock: 0, providerCost: 6721.64, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '53', name: 'Extreme Energy 560 gr Naranja Con Cafeína', brand: 'Nutremax', flavors: ['Naranja'], currentStock: 0, providerCost: 8473.12, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '54', name: 'Extreme Energy 560 gr Naranja Con Cafeína', brand: 'Nutremax', flavors: ['Ananá'], currentStock: 0, providerCost: 8473.12, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '55', name: 'Resveratrol', brand: 'Star Nutrition', flavors: [], currentStock: 4, providerCost: 14871, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '56', name: 'BCAA MTOR', brand: 'Star Nutrition', flavors: ['Fruit Punch'], currentStock: 0, providerCost: 21300, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '57', name: 'BCAA MTOR', brand: 'Star Nutrition', flavors: ['Grape'], currentStock: 1, providerCost: 21300, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '58', name: 'BCAA MTOR', brand: 'Star Nutrition', flavors: ['Lemon'], currentStock: 1, providerCost: 21300, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '59', name: 'Creatina 1 Kg 100% Puro Monohydrate', brand: 'Star Nutrition', flavors: [], currentStock: 0, providerCost: 59474, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '60', name: 'Vitamina C Suplemento Dietario 60 Capsulas 3c Sin Sabor', brand: 'Star Nutrition', flavors: [], currentStock: 5, providerCost: 5700, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '61', name: 'Arginina Gh 150g en Polvo', brand: 'Star Nutrition', flavors: [], currentStock: 1, providerCost: 12000, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '62', name: 'Pump V8 Pre Workout 285 Gr', brand: 'Star Nutrition', flavors: [], currentStock: 2, providerCost: 23000, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '63', name: 'Collagen Sport', brand: 'Star Nutrition', flavors: [], currentStock: 6, providerCost: 17059.52, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '64', name: 'Collagen Plus', brand: 'Star Nutrition', flavors: [], currentStock: 0, providerCost: 17059.52, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '65', name: 'Cafeina 200', brand: 'Star Nutrition', flavors: [], currentStock: 5, providerCost: 5600, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '66', name: 'ZMA x 90 Caps.', brand: 'Star Nutrition', flavors: [], currentStock: 2, providerCost: 13200, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '67', name: 'Omega 3 Fish Oil', brand: 'Star Nutrition', flavors: [], currentStock: 5, providerCost: 23600, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '68', name: 'Multivitamínico', brand: 'Star Nutrition', flavors: [], currentStock: 1, providerCost: 14905.16, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '69', name: 'Platinum Whey Protein - Doypack', brand: 'Star Nutrition', flavors: ['Banana'], currentStock: 3, providerCost: 33150, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '70', name: 'Platinum Whey Protein - Doypack', brand: 'Star Nutrition', flavors: ['Chocolate'], currentStock: 6, providerCost: 33150, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '71', name: 'Platinum Whey Protein - Doypack', brand: 'Star Nutrition', flavors: ['Cookies'], currentStock: 3, providerCost: 33150, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '72', name: 'Platinum Whey Protein - Doypack', brand: 'Star Nutrition', flavors: ['Frutilla'], currentStock: 0, providerCost: 33150, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '73', name: 'Platinum Whey Protein - Doypack', brand: 'Star Nutrition', flavors: ['Vainilla'], currentStock: 4, providerCost: 33150, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '74', name: 'Creatina Doypack - 300g', brand: 'Star Nutrition', flavors: ['Neutro'], currentStock: 31, providerCost: 19500, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 1 },
  { id: '75', name: 'Hydroplus Endurance', brand: 'Star Nutrition', flavors: ['Limón'], currentStock: 0, providerCost: 12750, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '76', name: 'Collagen Hidrolizado', brand: 'Star Nutrition', flavors: ['Limón'], currentStock: 0, providerCost: 14542.18, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '77', name: 'Collagen Hidrolizado', brand: 'Star Nutrition', flavors: ['Frutos Rojos'], currentStock: 3, providerCost: 14542.18, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '78', name: 'L-Glutamine- 150g', brand: 'Star Nutrition', flavors: [], currentStock: 1, providerCost: 13225, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '79', name: 'L-Glutamine- 300g', brand: 'Star Nutrition', flavors: [], currentStock: 2, providerCost: 22000, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '80', name: 'CITRATO DE MAGNESIO 500G', brand: 'Star Nutrition', flavors: ['Neutro'], currentStock: 4, providerCost: 21600, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '81', name: 'CITRATO DE MAGNESIO 500G', brand: 'Star Nutrition', flavors: ['Frutos rojos'], currentStock: 2, providerCost: 21600, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '82', name: 'CITRATO DE MAGNESIO', brand: 'Star Nutrition', flavors: [], currentStock: 3, providerCost: 10700, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '83', name: 'Thermo Fuel MAX x 120 Caps', brand: 'Star Nutrition', flavors: [], currentStock: 5, providerCost: 15120, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '84', name: 'PUMP 3D EVOLUTION RIPPED X 315 GRS.', brand: 'Star Nutrition', flavors: [], currentStock: 1, providerCost: 27300, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '85', name: 'Vitamina C- 150 g', brand: 'One Fit', flavors: [], currentStock: 3, providerCost: 6940, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '86', name: 'Creatina Micronizada 200 g', brand: 'One Fit', flavors: [], currentStock: 9, providerCost: 9200, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '87', name: 'Classic Whey Protein', brand: 'One Fit', flavors: ['Chocolate'], currentStock: 5, providerCost: 22880, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '88', name: 'Classic Whey Protein', brand: 'One Fit', flavors: ['Vainilla'], currentStock: 0, providerCost: 22880, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '89', name: 'Classic Whey Protein', brand: 'One Fit', flavors: ['Frutilla'], currentStock: 2, providerCost: 22880, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '90', name: 'CITRATO DE MAGNESIO', brand: 'One Fit', flavors: [], currentStock: 12, providerCost: 5590, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 1 },
  { id: '91', name: 'CITRATO DE POTASIO', brand: 'One Fit', flavors: [], currentStock: 0, providerCost: 5590, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '92', name: 'Omega 3 + Dha + Epa Fish Oil 60 Cápsulas', brand: 'ENA', flavors: [], currentStock: 2, providerCost: 19834.12, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '93', name: 'Creatina Micronizada - 1Kg - Neutra', brand: 'ENA', flavors: [], currentStock: 0, providerCost: 59400, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '94', name: 'Enargy Gel+ -Sin cafeína - Unidad', brand: 'ENA', flavors: ['Frutilla'], currentStock: 0, providerCost: 587.99, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '95', name: 'Enargy Gel+ -Sin cafeína - Unidad', brand: 'ENA', flavors: ['Uva'], currentStock: 7, providerCost: 587.99, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '96', name: 'Enargy Gel+ -Sin cafeína - Unidad', brand: 'ENA', flavors: ['Vainilla'], currentStock: 0, providerCost: 587.99, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '97', name: 'Enargy Gel+ -Con cafeína . Unidad', brand: 'ENA', flavors: ['Frutilla'], currentStock: 0, providerCost: 630, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '98', name: 'Enargy Gel+ -Con cafeína . Unidad', brand: 'ENA', flavors: ['Uva'], currentStock: 0, providerCost: 630, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '99', name: 'Enargy Gel+ -Con cafeína . Unidad', brand: 'ENA', flavors: ['Vainilla'], currentStock: 0, providerCost: 630, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '100', name: 'Caja Enargy Gel -Sin cafeína- (Caja x 12 unidades)', brand: 'ENA', flavors: ['Frutilla'], currentStock: 0, providerCost: 7055.95, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '101', name: 'Caja Enargy Gel -Sin cafeína- (Caja x 12 unidades)', brand: 'ENA', flavors: ['Uva'], currentStock: 0, providerCost: 7055.95, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '102', name: 'Caja Enargy Gel -Sin cafeína- (Caja x 12 unidades)', brand: 'ENA', flavors: ['Vainilla'], currentStock: 0, providerCost: 7055.95, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '103', name: 'Caja Enargy Gel+ -Con cafeína- (Caja x 12 unidades)', brand: 'ENA', flavors: ['Frutilla'], currentStock: 0, providerCost: 7560.07, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '104', name: 'Caja Enargy Gel+ -Con cafeína- (Caja x 12 unidades)', brand: 'ENA', flavors: ['Uva'], currentStock: 0, providerCost: 7560.07, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '105', name: 'Caja Enargy Gel+ -Con cafeína- (Caja x 12 unidades)', brand: 'ENA', flavors: ['Vainilla'], currentStock: 0, providerCost: 7560.07, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '106', name: 'Creatina - Electrolitos 302 g', brand: 'ENA', flavors: ['Blue'], currentStock: 0, providerCost: 23477.25, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '107', name: 'Creatina - Electrolitos 302 g', brand: 'ENA', flavors: ['Lemon'], currentStock: 0, providerCost: 23477.25, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '108', name: 'CITRATO DE MAGNESIO', brand: 'ENA', flavors: [], currentStock: 3, providerCost: 8606.93, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '109', name: 'Cafeína', brand: 'ENA', flavors: [], currentStock: 0, providerCost: 7267.5, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '110', name: 'Beta Alanine Pre Work Ena x 60 tabs', brand: 'ENA', flavors: [], currentStock: 2, providerCost: 9150, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '111', name: 'Muscle Max x 90 cap', brand: 'ENA', flavors: [], currentStock: 2, providerCost: 9900, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '112', name: 'Multivitamínico', brand: 'ENA', flavors: [], currentStock: 2, providerCost: 13499.99, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 3, unitsPerBox: 1 },
  { id: '113', name: 'Whey Protein True Made - 500g', brand: 'ENA', flavors: ['Neutro'], currentStock: 1, providerCost: 24299.99, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '114', name: 'Whey Protein True Made x 2 lb', brand: 'ENA', flavors: ['Chocolate'], currentStock: 0, providerCost: 43402.44, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '115', name: 'Whey Protein True Made x 2 lb', brand: 'ENA', flavors: ['Vainilla'], currentStock: 0, providerCost: 43402.44, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '116', name: 'Whey Protein True Made x 2 lb', brand: 'ENA', flavors: ['Frutilla'], currentStock: 0, providerCost: 43402.44, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '117', name: 'Whey Protein True Made x 2 lb', brand: 'ENA', flavors: ['Cookies'], currentStock: 0, providerCost: 43402.44, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '118', name: '100 % Whey', brand: 'ENA', flavors: ['Chocolate'], currentStock: 0, providerCost: 35400, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '119', name: '100 % Whey', brand: 'ENA', flavors: ['Vainilla'], currentStock: 0, providerCost: 35400, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '120', name: '100 % Whey', brand: 'ENA', flavors: ['Frutilla'], currentStock: 0, providerCost: 35400, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '121', name: '100 % Whey', brand: 'ENA', flavors: ['Neutro'], currentStock: 0, providerCost: 35400, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '122', name: 'Creatina Micronizada - 150 g', brand: 'ENA', flavors: ['Neutro'], currentStock: 1, providerCost: 13499.99, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '123', name: 'Creatina Micronizada - 300g', brand: 'ENA', flavors: ['Neutro'], currentStock: 0, providerCost: 19692.31, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '124', name: 'Creatina Micronizada - 300g', brand: 'ENA', flavors: ['Frutos Rojos'], currentStock: 0, providerCost: 19692.31, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '125', name: 'CARBO ENERGY', brand: 'ENA', flavors: ['Blueberry'], currentStock: 2, providerCost: 10200, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '126', name: 'CARBO ENERGY', brand: 'ENA', flavors: ['Frutos Rojos'], currentStock: 3, providerCost: 10200, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '127', name: 'Óxido Nítrico Prework', brand: 'ENA', flavors: [], currentStock: 1, providerCost: 11040, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '128', name: 'Pre War Pre', brand: 'ENA', flavors: ['Fruit Punch'], currentStock: 3, providerCost: 18990.75, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '129', name: 'Pre War Pre', brand: 'ENA', flavors: ['Lemonade'], currentStock: 3, providerCost: 18990.75, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '130', name: 'HIDROXY MAX NIGHT', brand: 'ENA', flavors: [], currentStock: 3, providerCost: 8370, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '131', name: 'RIPPED X', brand: 'ENA', flavors: [], currentStock: 0, providerCost: 7992, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '132', name: 'Glutamina 150g', brand: 'ENA', flavors: [], currentStock: 2, providerCost: 13800, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '133', name: 'ZMA', brand: 'ENA', flavors: [], currentStock: 2, providerCost: 8754.53, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '134', name: 'Carnitina', brand: 'ENA', flavors: [], currentStock: 0, providerCost: 10259.99, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '135', name: 'Energy Gel - Con Cafeína', brand: 'Mervick', flavors: ['Naranja'], currentStock: 3, providerCost: 846.25, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '136', name: 'Energy Gel - Con Cafeína', brand: 'Mervick', flavors: ['Frutos Rojos'], currentStock: 0, providerCost: 846.25, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '137', name: 'Energy Gel - Con Cafeína', brand: 'Mervick', flavors: ['Manzana'], currentStock: 0, providerCost: 846.25, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '138', name: 'Sobre Race Gel - Sin Cafeína', brand: 'Mervick', flavors: ['Naranja'], currentStock: 0, providerCost: 811.41, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '139', name: 'Sobre Race Gel - Sin Cafeína', brand: 'Mervick', flavors: ['Frutos Rojos'], currentStock: 0, providerCost: 811.41, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '140', name: 'Sobre Race Gel - Sin Cafeína', brand: 'Mervick', flavors: ['Manzana'], currentStock: 0, providerCost: 811.41, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 5, unitsPerBox: 12 },
  { id: '141', name: 'Caja Race Gel Sin Cafeína (Caja 12 Unidades)', brand: 'Mervick', flavors: ['Naranja'], currentStock: 3, providerCost: 9737.03, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '142', name: 'Caja Race Gel Sin Cafeína (Caja 12 Unidades)', brand: 'Mervick', flavors: ['Frutos Rojos'], currentStock: 0, providerCost: 9737.03, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '143', name: 'Caja Race Gel Sin Cafeína (Caja 12 Unidades)', brand: 'Mervick', flavors: ['Manzana'], currentStock: 0, providerCost: 9737.03, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '144', name: 'Protein Bar - Mervick 21g', brand: 'Mervick', flavors: ['Chocolate'], currentStock: 0, providerCost: 1378.6, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 10, unitsPerBox: 12 },
  { id: '145', name: 'Protein Bar - Mervick 21g', brand: 'Mervick', flavors: ['Frambuesa'], currentStock: 0, providerCost: 1378.6, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 10, unitsPerBox: 12 },
  { id: '146', name: 'Protein Bar - Mervick 21g', brand: 'Mervick', flavors: ['Banana'], currentStock: 0, providerCost: 1378.6, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 10, unitsPerBox: 12 },
  { id: '147', name: 'Protein Bar - Mervick 21g', brand: 'Mervick', flavors: ['Limón'], currentStock: 0, providerCost: 1378.6, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 10, unitsPerBox: 12 },
  { id: '148', name: 'Protein Bar - Mervick 15g', brand: 'Mervick', flavors: ['Chocolate'], currentStock: 0, providerCost: 1057.61, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 10, unitsPerBox: 12 },
  { id: '149', name: 'Protein Bar - Mervick 15g', brand: 'Mervick', flavors: ['Banana'], currentStock: 0, providerCost: 1057.61, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 10, unitsPerBox: 12 },
  { id: '150', name: 'Protein Bar - Mervick 15g', brand: 'Mervick', flavors: ['Frutos Rojos'], currentStock: 0, providerCost: 1057.61, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 10, unitsPerBox: 12 },
  { id: '151', name: 'Protein Bar - Mervick 15g', brand: 'Mervick', flavors: ['Lemon Pie'], currentStock: 0, providerCost: 1057.61, freightCost: 66.67, markupPercent: 50, cardSurchargePercent: 25, minStock: 10, unitsPerBox: 12 },
  { id: '152', name: 'Protein Bar - Caja Chica - 12 unidades', brand: 'Mervick', flavors: ['Chocolate'], currentStock: 0, providerCost: 12691.33, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '153', name: 'Protein Bar - Caja Chica - 12 unidades', brand: 'Mervick', flavors: ['Banana'], currentStock: 0, providerCost: 12691.33, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '154', name: 'Protein Bar - Caja Chica - 12 unidades', brand: 'Mervick', flavors: ['Frutos Rojos'], currentStock: 0, providerCost: 12691.33, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '155', name: 'Protein Bar - Caja Chica - 12 unidades', brand: 'Mervick', flavors: ['Lemon Pie'], currentStock: 0, providerCost: 12691.33, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '156', name: 'Protein Bar - Caja Grande - 12 unidades', brand: 'Mervick', flavors: ['Chocolate'], currentStock: 0, providerCost: 16543.21, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '157', name: 'Protein Bar - Caja Grande - 12 unidades', brand: 'Mervick', flavors: ['Frambuesa'], currentStock: 0, providerCost: 16543.21, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '158', name: 'Protein Bar - Caja Grande - 12 unidades', brand: 'Mervick', flavors: ['Banana'], currentStock: 0, providerCost: 16543.21, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '159', name: 'Protein Bar - Caja Grande - 12 unidades', brand: 'Mervick', flavors: ['Limón'], currentStock: 0, providerCost: 16543.21, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '160', name: 'Caja Sobre Energy Gel (Caja 12 Unidades) Con Cafeína', brand: 'Mervick', flavors: ['Naranja'], currentStock: 0, providerCost: 10155.03, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '161', name: 'Caja Sobre Energy Gel (Caja 12 Unidades) Con Cafeína', brand: 'Mervick', flavors: ['Frutos Rojos'], currentStock: 0, providerCost: 10155.03, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '162', name: 'Caja Sobre Energy Gel (Caja 12 Unidades) Con Cafeína', brand: 'Mervick', flavors: ['Manzana'], currentStock: 0, providerCost: 10155.03, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 1, unitsPerBox: 12 },
  { id: '163', name: 'Whey Protein', brand: 'Body Advance', flavors: ['Dulce de Leche'], currentStock: 0, providerCost: 19585.64, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '164', name: 'Whey Protein', brand: 'Body Advance', flavors: ['Vainilla'], currentStock: 0, providerCost: 19585.64, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '165', name: 'Whey Protein', brand: 'Body Advance', flavors: ['Chocolate'], currentStock: 0, providerCost: 19585.64, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 },
  { id: '166', name: 'Whey Protein', brand: 'Body Advance', flavors: ['Frutos Rojos'], currentStock: 1, providerCost: 19585.64, freightCost: 800, markupPercent: 50, cardSurchargePercent: 25, minStock: 2, unitsPerBox: 1 }
];

const App: React.FC = () => {
  const { showToast } = useToast();
  const { toggleTheme, isDark } = useTheme();
  
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('dxy_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_INVENTORY;
      }
      return INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  const [view, setView] = useState<AppView>('inventory');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDatabaseMode, setIsDatabaseMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [command, setCommand] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  const [dailySales, setDailySales] = useState<DailySale[]>(() => {
    try {
      const saved = localStorage.getItem('dxy_daily_sales');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });
  
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('dxy_purchases');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });
  
  const [activeOrder, setActiveOrder] = useState<OrderItem[]>([]);
  const [finalizedOrder, setFinalizedOrder] = useState<{order: OrderItem[], client: ClientInfo} | null>(null);

  const [trainers, setTrainers] = useState<Trainer[]>(() => {
    try {
      const saved = localStorage.getItem('dxy_trainers');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [trainerSales, setTrainerSales] = useState<TrainerSale[]>(() => {
    try {
      const saved = localStorage.getItem('dxy_trainer_sales');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem('dxy_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('dxy_purchases', JSON.stringify(purchaseInvoices));
  }, [purchaseInvoices]);
  
  useEffect(() => {
    localStorage.setItem('dxy_daily_sales', JSON.stringify(dailySales));
  }, [dailySales]);

  useEffect(() => {
    localStorage.setItem('dxy_trainers', JSON.stringify(trainers));
  }, [trainers]);

  useEffect(() => {
    localStorage.setItem('dxy_trainer_sales', JSON.stringify(trainerSales));
  }, [trainerSales]);
  
  const addToOrder = (product: Product, quantity: number) => {
    setActiveOrder(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      const metrics = calculateProductMetrics(product);
      if (existingItem) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, {
        id: product.id,
        name: `${product.brand} - ${product.name} ${product.flavors?.join(', ') || ''}`,
        quantity,
        price: metrics.wholesalePrice,
        currentStock: product.currentStock
      }];
    });
  };

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const lowerCommand = command.trim().toLowerCase();
      if (lowerCommand.startsWith('agregar:')) {
        e.preventDefault();
        const parts = command.replace(/agregar:/i, '').split(',').map(p => p.trim());
        
        if (parts.length < 4) {
          showToast('Error de formato. Usar: AGREGAR: Cantidad, Producto, Marca, Sabor', 'error');
          return;
        }

        const [quantityStr, name, brand, flavor] = parts;
        const quantity = parseInt(quantityStr, 10);
        if (isNaN(quantity) || quantity <= 0) {
          showToast('La cantidad debe ser un número válido', 'error');
          return;
        }

        const product = products.find(p => 
          p.name.toLowerCase().includes(name.toLowerCase()) &&
          (p.brand || '').toLowerCase().includes(brand.toLowerCase()) &&
          (!flavor || (p.flavors || []).some(f => f.toLowerCase().includes(flavor.toLowerCase())))
        );

        if (product) {
          addToOrder(product, quantity);
          setView('wholesale');
          showToast(`${quantity} x ${product.name} agregado al carrito`, 'success');
        } else {
          showToast('Producto no encontrado', 'error');
        }
        setCommand('');
      } else if (lowerCommand === 'cargar compra') {
        e.preventDefault();
        setView('purchases');
        setCommand('');
      }
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;

    return products.filter(p => 
      (p.name || '').toLowerCase().includes(term) ||
      (p.brand || '').toLowerCase().includes(term) ||
      (p.flavors || []).some(f => (f || '').toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => editingProduct 
      ? prev.map(p => p.id === newProduct.id ? newProduct : p)
      : [newProduct, ...prev]
    );
    setIsFormOpen(false);
    setEditingProduct(undefined);
  };
  
  const handleFinalizeOrder = (order: OrderItem[], client: ClientInfo, deductStock: boolean) => {
    if (deductStock) {
      const outOfStockAlerts: string[] = [];
      setProducts(currentProducts => {
        const productsMap: Map<string, Product> = new Map(currentProducts.map(p => [p.id, { ...p }]));
        order.forEach(item => {
          const product = productsMap.get(item.id);
          if (product) {
            const newStock = Math.max(0, product.currentStock - item.quantity);
            if (newStock === 0) {
              outOfStockAlerts.push(product.name);
            }
            product.currentStock = newStock;
            productsMap.set(item.id, product);
          }
        });
        return Array.from(productsMap.values());
      });
      if (outOfStockAlerts.length > 0) {
        showToast(`Productos agotados: ${outOfStockAlerts.join(', ')}`, 'warning');
      }
    }
    setFinalizedOrder({ order, client });
    setActiveOrder([]);
    return true;
  };

  const handleRegisterSale = (salesToRegister: DailySale[], deductStock: boolean) => {
    setDailySales(prev => [...salesToRegister, ...prev]);

    if (deductStock) {
      setProducts(currentProducts => {
        const productsMap: Map<string, Product> = new Map(currentProducts.map(p => [p.name.toLowerCase(), { ...p }]));
        salesToRegister.forEach(sale => {
          const productName = sale.productName.toLowerCase();
          const product = productsMap.get(productName);
          if (product) {
            product.currentStock = Math.max(0, product.currentStock - 1);
            productsMap.set(productName, product);
          }
        });
        return Array.from(productsMap.values());
      });
    }
    showToast(`${salesToRegister.length} venta(s) registrada(s)`, 'success');
  };
  
  const handleUpdateSale = (updatedSale: DailySale) => {
    setDailySales(prev => prev.map(sale => sale.id === updatedSale.id ? updatedSale : sale));
  };

  const handleDeleteSale = (saleId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
      setDailySales(prev => prev.filter(sale => sale.id !== saleId));
    }
  };

  const handleRegisterPurchase = (
    invoiceDetails: Omit<PurchaseInvoice, 'id'>,
    items: { id: string; quantity: number; providerCost?: number }[],
    updateCosts: boolean
  ) => {
    setPurchaseInvoices(prev => [
      { ...invoiceDetails, id: crypto.randomUUID() },
      ...prev,
    ]);

    setProducts(currentProducts => {
      const productsMap: Map<string, Product> = new Map(currentProducts.map(p => [p.id, { ...p }]));
      items.forEach(item => {
        const product = productsMap.get(item.id);
        if (product) {
          product.currentStock += item.quantity;
          if (updateCosts && item.providerCost !== undefined) {
            product.providerCost = item.providerCost;
          }
          productsMap.set(item.id, product);
        }
      });
      return Array.from(productsMap.values());
    });
    showToast('Compra registrada y stock actualizado', 'success');
  };

  const adjustStock = (id: string, delta: number) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, currentStock: Math.max(0, p.currentStock + delta) } : p
    ));
  };

  const handleAddTrainer = (trainerData: Omit<Trainer, 'id' | 'createdAt'>) => {
    const newTrainer: Trainer = {
      ...trainerData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setTrainers(prev => [...prev, newTrainer]);
  };

  const handleAddTrainerSale = (saleData: Omit<TrainerSale, 'id'>) => {
    const newSale: TrainerSale = {
      ...saleData,
      id: crypto.randomUUID()
    };
    setTrainerSales(prev => [...prev, newSale]);
  };

  const handleToggleTrainerStatus = (trainerId: string) => {
    setTrainers(prev => prev.map(t => 
      t.id === trainerId ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const navItems = [
    { id: 'inventory', label: 'Inventario', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
    { id: 'daily_log', label: 'Registro Diario', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'wholesale', label: 'Mayorista', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'combos', label: 'Combos DXY', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
    { id: 'purchases', label: 'Proveedores', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'partners', label: 'Partners DXY', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'expenses', label: 'Gastos', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'calculator', label: 'Calculadora', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  ];

  return (
    <div className={`flex min-h-screen print:bg-white transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`bg-brand-gray text-white flex flex-col fixed inset-y-0 z-50 shadow-2xl print:hidden transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'} ${mobileMenuOpen ? 'left-0' : '-left-64 lg:left-0'}`}>
        <div className={`p-6 text-center border-b border-white/5 ${sidebarCollapsed ? 'px-2' : 'p-8'}`}>
          <div className="flex items-baseline justify-center font-black text-3xl italic tracking-tighter">
            <span className="text-white">DX</span><span className="text-brand-yellow">Y</span>
          </div>
          {!sidebarCollapsed && (
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-1">Operations</p>
          )}
        </div>
        
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-brand-yellow rounded-full items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <svg className={`w-4 h-4 text-brand-dark transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <nav className="flex-1 px-2 space-y-1 mt-4 overflow-y-auto">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => { setView(item.id as AppView); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === item.id ? 'bg-brand-yellow text-brand-dark shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <svg className={`w-5 h-5 flex-shrink-0 ${view === item.id ? 'text-brand-dark' : 'text-brand-yellow'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
              </svg>
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={`px-2 mb-2 ${sidebarCollapsed ? '' : 'px-4'}`}>
          <button onClick={() => setCommandPaletteOpen(true)} className="w-full py-2.5 mb-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-white/10 text-white hover:bg-white/20" title={sidebarCollapsed ? 'Buscar (Ctrl+K)' : ''}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            {!sidebarCollapsed && <span>Buscar <kbd className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[9px]">⌘K</kbd></span>}
          </button>
          <button onClick={toggleTheme} className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-amber-400 text-slate-900 hover:bg-amber-300' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
            {!sidebarCollapsed && <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>
        </div>

        <div className={`p-4 ${sidebarCollapsed ? 'px-2' : 'p-6'}`}>
          <button onClick={() => exportInventoryToCSV(products)} className={`w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            {!sidebarCollapsed && <span>Exportar CSV</span>}
          </button>
        </div>
      </aside>

      <div className="fixed top-0 left-0 right-0 h-16 bg-brand-gray z-30 lg:hidden flex items-center justify-between px-4 shadow-lg print:hidden">
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="flex items-baseline font-black text-2xl italic tracking-tighter">
          <span className="text-white">DX</span><span className="text-brand-yellow">Y</span>
        </div>
        <button onClick={() => setCommandPaletteOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </div>

      <main className={`flex-1 p-4 lg:p-8 print:p-0 print:ml-0 transition-all duration-300 pt-20 lg:pt-8 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {view === 'inventory' && (
          <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
            <DashboardHeader products={products} />
            <InsightsPanel products={products} />
            <DashboardCharts products={products} dailySales={dailySales} />
            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 lg:p-6 bg-slate-50/80 border-b border-slate-200 space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="font-black text-brand-gray uppercase text-xs lg:text-sm tracking-widest">Base de Datos</h3>
                    <button onClick={() => setIsDatabaseMode(!isDatabaseMode)} className={`px-3 py-1 text-[9px] font-black rounded-full border transition-all ${isDatabaseMode ? 'bg-brand-dark text-brand-yellow' : 'bg-white text-slate-400'}`}>
                      {isDatabaseMode ? 'VISTA PRO' : 'VISTA SIMPLE'}
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-72">
                      <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-yellow" />
                      <svg className="w-4 h-4 absolute left-3 top-3 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button onClick={() => { setEditingProduct(undefined); setIsFormOpen(true); }} className="px-5 py-2.5 bg-brand-yellow text-brand-dark rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                      <span className="hidden sm:inline">Cargar Producto</span>
                    </button>
                  </div>
                </div>
                <div className="relative hidden lg:block">
                  <input type="text" placeholder='Comando Rápido → "AGREGAR:..." o "CARGAR COMPRA"' value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={handleCommand} className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-brand-yellow transition-all placeholder:text-slate-400" />
                  <svg className="w-4 h-4 absolute left-3 top-3.5 text-brand-yellow" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zM16 13a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-100/50 text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-2 lg:px-6 py-3">Marca</th>
                      <th className="px-2 lg:px-4 py-3">Producto</th>
                      <th className="px-2 lg:px-4 py-3 hidden sm:table-cell">Sabor</th>
                      <th className="px-2 lg:px-4 py-3 text-center">Stock</th>
                      <th className="px-2 lg:px-4 py-3 text-right">Efectivo</th>
                      <th className="px-2 lg:px-4 py-3 text-right hidden sm:table-cell">Tarjeta</th>
                      {isDatabaseMode && <th className="px-2 lg:px-4 py-3 text-right hidden lg:table-cell">Costo</th>}
                      {isDatabaseMode && <th className="px-2 lg:px-4 py-3 text-right text-emerald-600">Ganancia</th>}
                      <th className="px-2 lg:px-6 py-3 text-right">Acc.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => {
                      const m = calculateProductMetrics(p);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-2 lg:px-6 py-2.5 lg:py-4 text-[9px] lg:text-xs font-bold uppercase text-slate-500 max-w-[60px] lg:max-w-none truncate">{p.brand}</td>
                          <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-[10px] lg:text-sm font-black uppercase text-brand-gray max-w-[80px] lg:max-w-none truncate">{p.name}</td>
                          <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-[9px] lg:text-xs font-medium uppercase text-slate-600 hidden sm:table-cell">{p.flavors?.join(', ') || '-'}</td>
                          <td className="px-2 lg:px-4 py-2.5 lg:py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => adjustStock(p.id, -1)} className="w-5 h-5 lg:w-6 lg:h-6 rounded bg-slate-100 flex items-center justify-center font-black text-xs">-</button>
                              <span className={`w-6 lg:w-8 text-center font-black text-xs lg:text-sm ${p.currentStock <= p.minStock ? 'text-rose-500' : 'text-slate-700'}`}>{p.currentStock}</span>
                              <button onClick={() => adjustStock(p.id, 1)} className="w-5 h-5 lg:w-6 lg:h-6 rounded bg-brand-yellow flex items-center justify-center font-black text-xs">+</button>
                            </div>
                          </td>
                          <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-right font-black text-brand-gray text-[10px] lg:text-sm">{formatCurrency(m.cashPrice)}</td>
                          <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-right font-bold text-slate-500 text-[10px] lg:text-sm hidden sm:table-cell">{formatCurrency(m.listPriceTN)}</td>
                          {isDatabaseMode && <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-right font-medium text-slate-500 text-[10px] lg:text-sm hidden lg:table-cell">{formatCurrency(m.realCost)}</td>}
                          {isDatabaseMode && <td className="px-2 lg:px-4 py-2.5 lg:py-4 text-right font-black text-emerald-600 text-[10px] lg:text-sm">{formatCurrency(m.netProfit)}</td>}
                          <td className="px-2 lg:px-6 py-2.5 lg:py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => {setEditingProduct(p); setIsFormOpen(true);}} className="p-1 lg:p-2 text-slate-400 hover:text-brand-gray">
                                <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => setProducts(products.filter(pr => pr.id !== p.id))} className="p-1 lg:p-2 text-slate-400 hover:text-rose-600">
                                <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'daily_log' && <SalesManager dailySales={dailySales} onRegisterSale={handleRegisterSale} onUpdateSale={handleUpdateSale} onDeleteSale={handleDeleteSale} />}
        {view === 'wholesale' && <WholesaleManager products={products} activeOrder={activeOrder} setActiveOrder={setActiveOrder} onAddToOrder={addToOrder} onFinalizeOrder={handleFinalizeOrder} finalizedOrder={finalizedOrder} setFinalizedOrder={setFinalizedOrder} />}
        {view === 'combos' && <ComboCalculator products={products} />}
        {view === 'purchases' && <PurchaseManager products={products} purchaseInvoices={purchaseInvoices} onRegisterPurchase={handleRegisterPurchase} />}
        {view === 'partners' && <PartnersManager trainers={trainers} trainerSales={trainerSales} onAddTrainer={handleAddTrainer} onAddSale={handleAddTrainerSale} onToggleTrainerStatus={handleToggleTrainerStatus} />}
        {view === 'expenses' && <ExpenseManager />}
        {view === 'calculator' && <CalculatorDXY />}
      </main>

      {isFormOpen && <ProductForm initialProduct={editingProduct} onSubmit={handleAddProduct} onCancel={() => { setIsFormOpen(false); setEditingProduct(undefined); }} />}
      
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
        products={products} 
        onNavigate={(v) => { setView(v); setCommandPaletteOpen(false); }} 
        onSelectProduct={(p) => { setEditingProduct(p); setIsFormOpen(true); }} 
      />
    </div>
  );
};

export default App;
