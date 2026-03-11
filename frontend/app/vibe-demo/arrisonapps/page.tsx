'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ShoppingBag, X, Search, SlidersHorizontal,
  MapPin, ChevronDown, Flame, Star, Package, ArrowUpRight,
  Send, Globe, Shield
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  sku: string;
  brand_name: string;
  series: string;
  vitola: string;
  packaging_qty: number;
  packaging_type: string;
  strength: 'mild' | 'medium' | 'full';
  is_limited_edition: boolean;
  is_travel_humidor: boolean;
  tags: string[];
  short_description: string;
  display_price: number | null;
  currency_symbol: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'enquiry_only';
  enquiry_only: boolean;
}

interface CartItem extends Product {
  qty: number;
}

// ─── Mock data (used when backend is unavailable) ─────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  // ── Bolivar ──────────────────────────────────────────────────────────────────
  {
    id: 'bol-ham-25', sku: 'BOL-HAM-25', brand_name: 'Bolivar', series: 'Hamaki', vitola: 'Hamaki',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['LE'],
    short_description: 'A bold limited-edition Bolivar of remarkable construction — deep earth, dark leather and a pronounced spice on the retrohale.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  {
    id: 'bol-bel-25', sku: 'BOL-BEL-25', brand_name: 'Bolivar', series: 'Belicosos Finos', vitola: 'Belicoso',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'One of Havana\'s most celebrated figurados — the Belicoso Fino delivers full-bodied complexity with roasted coffee and dark wood.',
    display_price: 2680, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  // ── Cohiba ───────────────────────────────────────────────────────────────────
  {
    id: 'coh-s6t-15', sku: 'COH-S6T-15', brand_name: 'Cohiba', series: 'Siglo VI Tubos', vitola: 'Gran Corona',
    packaging_qty: 15, packaging_type: 'tubos', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Tubos'],
    short_description: 'The Siglo VI presented in elegant individual aluminium tubes — preserving freshness and offering a refined gifting format.',
    display_price: 3200, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'coh-rob-25', sku: 'COH-ROB-25', brand_name: 'Cohiba', series: 'Robustos', vitola: 'Robusto',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The Cohiba Robusto — an enduring benchmark of Cuban craftsmanship. Creamy cedar, honey and a long, satisfying finish.',
    display_price: 2980, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'coh-s6-10', sku: 'COH-S6-10', brand_name: 'Cohiba', series: 'Siglo VI', vitola: 'Gran Corona',
    packaging_qty: 10, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The iconic Siglo VI in a 10-count box — rich, complex and impeccably balanced with notes of cedar, cocoa and sweet spice.',
    display_price: 1480, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'coh-s6-25', sku: 'COH-S6-25', brand_name: 'Cohiba', series: 'Siglo VI', vitola: 'Gran Corona',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Best Seller'],
    short_description: 'The flagship Siglo VI in the full 25-count box — a cornerstone of any serious humidor.',
    display_price: 3480, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'coh-sht-10', sku: 'COH-SHT-10', brand_name: 'Cohiba', series: 'Short', vitola: 'Perla',
    packaging_qty: 10, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The Cohiba Short — a concentrated expression of the house blend in a compact format. Ideal for a focused, unhurried smoke.',
    display_price: 980, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'coh-mad-25', sku: 'COH-MAD-25', brand_name: 'Cohiba', series: 'Maduro 5 Mágicos', vitola: 'Mágicos',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Maduro'],
    short_description: 'Cohiba\'s unique maduro — five years of fermentation yield an extraordinarily smooth smoke of dark chocolate, espresso and sweet earth.',
    display_price: 3680, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'coh-50th-8', sku: 'COH-50TH-TH8', brand_name: 'Cohiba', series: '50th Aniversario Travel Humidor', vitola: 'Assorted',
    packaging_qty: 8, packaging_type: 'travel-humidor', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: true,
    tags: ['Limited', 'Humidor', 'Collector'],
    short_description: 'The crown jewel of Cohiba\'s golden anniversary — 8 hand-selected vitolas presented in a lacquered travel humidor of museum quality. 8 boxes available at Central.',
    display_price: 22000, currency_symbol: 'HK$', stock_status: 'low_stock', enquiry_only: false,
  },
  {
    id: 'coh-55th-10', sku: 'COH-55TH-10', brand_name: 'Cohiba', series: '55th Aniversario', vitola: 'Gran Corona',
    packaging_qty: 10, packaging_type: 'box', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['LE', 'Collector'],
    short_description: 'A momentous limited edition marking 55 years of Cohiba — profound depth, silken draw and an extraordinary length of finish.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  // ── Cuaba ────────────────────────────────────────────────────────────────────
  {
    id: 'cua-pir-10', sku: 'CUA-PIR-10', brand_name: 'Cuaba', series: 'Pirámides', vitola: 'Pirámide',
    packaging_qty: 10, packaging_type: 'box', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['LE'],
    short_description: 'The double figurado from Cuaba — an elegant limited edition with a pointed foot and head, producing a fascinating evolving smoke.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  // ── El Rey del Mundo ──────────────────────────────────────────────────────────
  {
    id: 'erd-cs-25', sku: 'ERD-CS-25', brand_name: 'El Rey del Mundo', series: 'Choix Supreme', vitola: 'Demi Tasse',
    packaging_qty: 25, packaging_type: 'box', strength: 'mild',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'A rare and refined Cuban — delicate floral notes with gentle wood and a smooth creaminess throughout. The king\'s choice.',
    display_price: 1680, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  // ── Hoyo de Monterrey ────────────────────────────────────────────────────────
  {
    id: 'hoy-ep2-25', sku: 'HOY-EP2-25', brand_name: 'Hoyo de Monterrey', series: 'Epicure No.2', vitola: 'Robusto',
    packaging_qty: 25, packaging_type: 'box', strength: 'mild',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'Perhaps the finest Robusto in Havana\'s canon — silky and nuanced with floral hay, cedar and a gentle sweetness.',
    display_price: 2180, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'hoy-ep1-25', sku: 'HOY-EP1-25', brand_name: 'Hoyo de Monterrey', series: 'Epicure No.1', vitola: 'Corona Gorda',
    packaging_qty: 25, packaging_type: 'box', strength: 'mild',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'A longer, equally refined expression of the Epicure blend — extra smoking time to savour its evolving herbal and floral complexity.',
    display_price: 2380, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  // ── H. Upmann ────────────────────────────────────────────────────────────────
  {
    id: 'upm-mag-25', sku: 'UPM-MAG54-25', brand_name: 'H. Upmann', series: 'Magnum 54', vitola: 'Toro',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The H. Upmann Magnum 54 — a generous ring gauge delivering rich creaminess, roasted nuts and a long, smooth finale.',
    display_price: 2480, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'upm-magfin-25', sku: 'UPM-MAGFIN-25', brand_name: 'H. Upmann', series: 'Magnum Fino', vitola: 'Laguito No.1',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['EL'],
    short_description: 'An Edición Limitada Magnum in slender Laguito format — refined, elegant and rare. Cedar, cream and white pepper in perfect balance.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  {
    id: 'upm-col-bk', sku: 'UPM-COL-BOOK', brand_name: 'H. Upmann', series: 'Colección Habanos', vitola: 'Book Set',
    packaging_qty: 0, packaging_type: 'collection', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['Book', 'Collection', 'Collector'],
    short_description: 'A Colección Habanos book set — a curated library of H. Upmann\'s finest expressions presented as a collector\'s art object.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  // ── Juan Lopez ────────────────────────────────────────────────────────────────
  {
    id: 'jlo-sn2-25', sku: 'JLO-SN2-25', brand_name: 'Juan Lopez', series: 'Selección No.2', vitola: 'Robusto',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'An underrated Havana gem — the Juan Lopez Selección No.2 rewards the patient smoker with layered cedar, dried fruit and a refined earthiness.',
    display_price: 1780, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  // ── Montecristo ───────────────────────────────────────────────────────────────
  {
    id: 'mon-n2-25', sku: 'MON-N2-25', brand_name: 'Montecristo', series: 'No.2', vitola: 'Torpedo',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Best Seller'],
    short_description: 'The most celebrated torpedo in the world — a masterclass in Cuban construction with wood, earth and a creamy, prolonged finish.',
    display_price: 2480, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'mon-n2-10', sku: 'MON-N2-10', brand_name: 'Montecristo', series: 'No.2', vitola: 'Torpedo',
    packaging_qty: 10, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The iconic No.2 torpedo in a 10-count format — ideal for collectors seeking a compact entry to the Montecristo cellar.',
    display_price: 1080, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'mon-or-20', sku: 'MON-OR-20', brand_name: 'Montecristo', series: 'Open Regata', vitola: 'Short Robusto',
    packaging_qty: 20, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'A modern, accessible Montecristo — smooth and consistent with cedar, mild spice and a clean finish. Perfect for everyday indulgence.',
    display_price: 1280, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'mon-sup-25', sku: 'MON-SUP-25', brand_name: 'Montecristo', series: 'Supremos', vitola: 'Gran Corona',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['LE'],
    short_description: 'A distinguished Edición Limitada from the Montecristo house — rich medium-bodied complexity with roasted nuts, dried figs and cedar spice.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  {
    id: 'mon-pe-10', sku: 'MON-PE-10', brand_name: 'Montecristo', series: 'Petit Edmundo', vitola: 'Short Robusto',
    packaging_qty: 10, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The compact sibling of the Edmundo — a short, wide robusto that concentrates Montecristo\'s signature flavour profile beautifully.',
    display_price: 920, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  // ── Partagás ──────────────────────────────────────────────────────────────────
  {
    id: 'par-mad-25', sku: 'PAR-MAD2-25', brand_name: 'Partagás', series: 'Maduro No.2', vitola: 'Torpedo',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Maduro'],
    short_description: 'Partagás\'s powerful house character amplified by extended maduro fermentation — dark cocoa, black pepper and leather in a bold torpedo.',
    display_price: 2680, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'par-sd4-25', sku: 'PAR-SD4-25', brand_name: 'Partagás', series: 'Serie D No.4', vitola: 'Robusto',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Classic'],
    short_description: 'Arguably Cuba\'s definitive robusto — intensely flavoured with earthy tobacco, dark spice and a pungent, satisfying strength.',
    display_price: 2380, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'par-se2-25', sku: 'PAR-SE2-25', brand_name: 'Partagás', series: 'Serie E No.2', vitola: 'Gran Robusto',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'A supersized expression of the Partagás character — larger ring gauge, richer delivery and the same commanding full-bodied presence.',
    display_price: 2980, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'par-sp2-25', sku: 'PAR-SP2-25', brand_name: 'Partagás', series: 'Serie P No.2', vitola: 'Pirámide',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'Partagás power in a pirámide — the tapering shape focuses intensity at each draw, revealing layers of dark earth, pepper and roasted coffee.',
    display_price: 2780, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  // ── Por Larrañaga ─────────────────────────────────────────────────────────────
  {
    id: 'pla-pc-50', sku: 'PLA-PC-50', brand_name: 'Por Larrañaga', series: 'Petit Coronas', vitola: 'Petit Corona',
    packaging_qty: 50, packaging_type: 'box', strength: 'mild',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'One of Havana\'s oldest and most understated marques — delicate, floral and consistently enjoyable. A gentleman\'s afternoon smoke.',
    display_price: 1980, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  // ── Quai d'Orsay ─────────────────────────────────────────────────────────────
  {
    id: 'qdo-50-10', sku: 'QDO-N50-10', brand_name: "Quai d'Orsay", series: 'No.50', vitola: 'Corona Gorda',
    packaging_qty: 10, packaging_type: 'box', strength: 'mild',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The French-influenced Havana — extraordinarily smooth and light with creamy vanilla, hay and a whisper of white pepper.',
    display_price: 880, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  // ── Ramon Allones ─────────────────────────────────────────────────────────────
  {
    id: 'ra-an3-10', sku: 'RA-AN3-10', brand_name: 'Ramon Allones', series: 'Allones No.3', vitola: 'Corona',
    packaging_qty: 10, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'A classic Ramon Allones corona — rich, robust and characterful. Deep earth, leather and a satisfying Cuban strength.',
    display_price: 880, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'ra-ax-25', sku: 'RA-AX-25', brand_name: 'Ramon Allones', series: 'Allones Extra', vitola: 'Demi Tasse',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'Intense Ramon Allones character in a petite format — a concentrated blast of spice, earth and dark tobacco.',
    display_price: 1480, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'ra-ss-25', sku: 'RA-SS-25', brand_name: 'Ramon Allones', series: 'Specially Selected', vitola: 'Robusto',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Best Seller'],
    short_description: 'The definitive Ramon Allones experience — the Specially Selected robusto is powerful, complex and consistently excellent.',
    display_price: 1980, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'ra-abs-20', sku: 'RA-ABS-20', brand_name: 'Ramon Allones', series: 'Absolutos', vitola: 'Julieta',
    packaging_qty: 20, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'An elongated Churchill-class vitola in the Ramon Allones mould — full and commanding with dark wood, spice and a long peppery finish.',
    display_price: 2480, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  // ── Romeo y Julieta ───────────────────────────────────────────────────────────
  {
    id: 'ryj-sc-25', sku: 'RYJ-SC-25', brand_name: 'Romeo y Julieta', series: 'Short Churchill', vitola: 'Short Robusto',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'All the character of the Churchill in a compact robusto format — Cedar, dried fruits and a smooth, dependable draw.',
    display_price: 1980, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'ryj-sc-10', sku: 'RYJ-SC-10', brand_name: 'Romeo y Julieta', series: 'Short Churchill', vitola: 'Short Robusto',
    packaging_qty: 10, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The Short Churchill in a 10-count box — an excellent introduction to the Romeo y Julieta house style.',
    display_price: 880, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'ryj-n2-25', sku: 'RYJ-N2-25', brand_name: 'Romeo y Julieta', series: 'No.2', vitola: 'Torpedo',
    packaging_qty: 25, packaging_type: 'tubos', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Tubos'],
    short_description: 'The Romeo y Julieta No.2 torpedo in aluminium tubos — a classic Cuban figurado of silken draw, cedar and subtle spice.',
    display_price: 2880, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'ryj-gch-hum', sku: 'RYJ-GCH-HUM', brand_name: 'Romeo y Julieta', series: 'Gran Churchill Humidor', vitola: 'Assorted',
    packaging_qty: 0, packaging_type: 'humidor', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['Humidor', 'Limited'],
    short_description: 'A prestige humidor celebrating the iconic Churchill vitola — a collector\'s piece housing a curated selection of the finest Romeo y Julieta expressions.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  // ── San Cristóbal ─────────────────────────────────────────────────────────────
  {
    id: 'san-25a-hum', sku: 'SAN-25A-HUM', brand_name: 'San Cristóbal de la Habana', series: '25 Aniversario Humidor', vitola: 'Assorted',
    packaging_qty: 0, packaging_type: 'humidor', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['Humidor', 'Limited', 'Collector'],
    short_description: 'A rare anniversary humidor from San Cristóbal — commemorating 25 years of one of Havana\'s most refined, city-inspired marques.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  // ── Trinidad ──────────────────────────────────────────────────────────────────
  {
    id: 'tri-esm-12', sku: 'TRI-ESM-12', brand_name: 'Trinidad', series: 'Esmeralda', vitola: 'Laguito No.1',
    packaging_qty: 12, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'An exceptionally refined Laguito — long, slender and elegant with floral tobacco, cedar and a creamy sweetness that evolves beautifully.',
    display_price: 1680, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'tri-lt-12', sku: 'TRI-LT-LCDH-12', brand_name: 'Trinidad', series: 'La Trova LCDH', vitola: 'Hermoso No.4',
    packaging_qty: 12, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['LCDH'],
    short_description: 'An exclusive La Casa del Habano release — the La Trova showcases Trinidad\'s signature silkiness with added complexity and depth.',
    display_price: 2180, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'tri-fun-24', sku: 'TRI-FUN-24', brand_name: 'Trinidad', series: 'Fundadores', vitola: 'Laguito No.1',
    packaging_qty: 24, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The Trinidad founding expression — a long, elegant cigar of exceptional finesse. Floral, creamy and deeply satisfying.',
    display_price: 4880, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'tri-ing-12', sku: 'TRI-ING-12', brand_name: 'Trinidad', series: 'Ingenios', vitola: 'Hermoso No.4',
    packaging_qty: 12, packaging_type: 'box', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['EL'],
    short_description: 'An Edición Limitada from Trinidad — the Ingenios delivers the marque\'s characteristic refinement with added complexity from extended ageing.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  {
    id: 'tri-ml-12', sku: 'TRI-ML-12', brand_name: 'Trinidad', series: 'Media Luna', vitola: 'Campana',
    packaging_qty: 12, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The half-moon — a graceful bellicoso expressing Trinidad\'s gentle complexity with cedar, cream and a lingering floral note.',
    display_price: 1480, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'tri-top-12', sku: 'TRI-TOP-12', brand_name: 'Trinidad', series: 'Topes', vitola: 'Gran Corona',
    packaging_qty: 12, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The summit of the Trinidad range in standard production — a full-length gran corona of immense elegance and staying power.',
    display_price: 2380, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'tri-cab-12', sku: 'TRI-CAB-12', brand_name: 'Trinidad', series: 'Cabildos', vitola: 'Corona Gorda',
    packaging_qty: 12, packaging_type: 'box', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['EL'],
    short_description: 'A Trinidad Edición Limitada of considerable prestige — the Cabildos presents the house at its most complex and rewarding.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  {
    id: 'tri-rey-12', sku: 'TRI-REY-12', brand_name: 'Trinidad', series: 'Reyes', vitola: 'Laguito No.3',
    packaging_qty: 12, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'A short, slender laguito from Trinidad — refined and concentrated with the signature floral and cedar qualities of the house.',
    display_price: 980, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'tri-vig-12', sku: 'TRI-VIG-12', brand_name: 'Trinidad', series: 'Vigia', vitola: 'Short Robusto',
    packaging_qty: 12, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The watchman — a compact robusto delivering Trinidad finesse in a shorter smoke. Cedar, cream and light spice.',
    display_price: 1080, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: 'tri-col-bk', sku: 'TRI-COL-BOOK', brand_name: 'Trinidad', series: 'Colección Habanos Cazadores', vitola: 'Book Set',
    packaging_qty: 0, packaging_type: 'collection', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['Book', 'Collection', 'Collector'],
    short_description: 'A Colección Habanos book set — rare Trinidad expressions presented as an exquisite collector\'s edition for the most discerning humidors.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
];

const REGIONS = [
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', symbol: 'HK$' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$' },
  { code: 'EU', name: 'Europe', currency: 'EUR', symbol: '€' },
];

const BRANDS = [
  'All',
  'Bolivar',
  'Cohiba',
  'Cuaba',
  'El Rey del Mundo',
  'Hoyo de Monterrey',
  'H. Upmann',
  'Juan Lopez',
  'Montecristo',
  'Partagás',
  'Por Larrañaga',
  "Quai d'Orsay",
  'Ramon Allones',
  'Romeo y Julieta',
  'San Cristóbal de la Habana',
  'Trinidad',
];
const STRENGTHS = ['All', 'mild', 'medium', 'full'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ArrisonappsPage() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [products, setProducts]  = useState<Product[]>(MOCK_PRODUCTS);
  const [cart, setCart]          = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]  = useState(false);
  const [search, setSearch]      = useState('');
  const [filterBrand, setFilterBrand]    = useState('All');
  const [filterStrength, setFilterStrength] = useState('All');
  const [filterOpen, setFilterOpen]      = useState(false);
  const [enquiryOpen, setEnquiryOpen]    = useState(false);
  const [submitted, setSubmitted]        = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Filter products
  const filtered = products.filter(p => {
    const matchBrand    = filterBrand === 'All'    || p.brand_name === filterBrand;
    const matchStrength = filterStrength === 'All' || p.strength === filterStrength;
    const matchSearch   = !search ||
      p.brand_name.toLowerCase().includes(search.toLowerCase()) ||
      p.series.toLowerCase().includes(search.toLowerCase()) ||
      p.vitola.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchBrand && matchStrength && matchSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
        .filter(i => i.qty > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) =>
    sum + ((item.display_price || 0) * item.qty), 0
  );

  const strengthLabel = (s: string) => ({ mild: 'Mild', medium: 'Medium', full: 'Full' }[s] || s);
  const stockBadge = (status: string, enquiry_only: boolean) => {
    if (enquiry_only) return { label: 'Enquiry Only', cls: 'text-amber-400 border-amber-400/30 bg-amber-400/10' };
    if (status === 'in_stock')  return { label: 'In Stock',  cls: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' };
    if (status === 'low_stock') return { label: 'Low Stock', cls: 'text-amber-400 border-amber-400/30 bg-amber-400/10' };
    return { label: 'Unavailable', cls: 'text-slate-500 border-slate-500/30 bg-slate-500/10' };
  };

  return (
    <div className="min-h-screen" style={{ background: '#0f0d0b', color: '#e8dcc8', fontFamily: "'Georgia', serif" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300"
        style={{
          borderColor: scrollY > 40 ? 'rgba(212,175,55,0.15)' : 'transparent',
          background: scrollY > 40 ? 'rgba(15,13,11,0.95)' : 'transparent',
          backdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Back */}
          <Link
            href="/vibe-demo"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          {/* Logo */}
          <div className="text-center">
            <div className="text-xs tracking-[0.35em] uppercase mb-0.5" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '10px' }}>
              Est. 2010
            </div>
            <div className="text-xl tracking-[0.2em] font-light" style={{ color: '#D4AF37' }}>
              ARRISONAPPS
            </div>
            <div className="text-xs tracking-[0.3em] uppercase" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '9px' }}>
              Fine Cigars & Humidors
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Region Selector */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs tracking-widest uppercase transition-colors"
                style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {region.code}
                <ChevronDown className="w-3 h-3" />
              </button>
              {filterOpen && (
                <div
                  className="absolute right-0 top-8 rounded border py-1 z-50 min-w-[140px]"
                  style={{ background: '#1a1612', borderColor: 'rgba(212,175,55,0.15)' }}
                >
                  {REGIONS.map(r => (
                    <button
                      key={r.code}
                      onClick={() => { setRegion(r); setFilterOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs tracking-wider transition-colors hover:text-amber-300"
                      style={{
                        color: region.code === r.code ? '#D4AF37' : '#9b8c72',
                        fontFamily: 'sans-serif',
                      }}
                    >
                      {r.name} ({r.symbol})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(v => !v)}
              className="relative flex items-center gap-1.5 transition-colors"
              style={{ color: '#e8dcc8' }}
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs flex items-center justify-center"
                  style={{ background: '#D4AF37', color: '#0f0d0b', fontFamily: 'sans-serif' }}
                >
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex items-end overflow-hidden"
        style={{ height: '90vh', minHeight: '560px' }}
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a0f08 0%, #2a1a0e 40%, #1a1209 70%, #0f0d0b 100%)',
            transform: `translateY(${scrollY * 0.25}px)`,
          }}
        />
        {/* Texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gold gradient accent */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 70% 60%, rgba(212,175,55,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Hero Content */}
        <div
          className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        >
          <div className="max-w-2xl">
            <div
              className="text-xs tracking-[0.5em] uppercase mb-6"
              style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}
            >
              {region.name} Collection · {new Date().getFullYear()}
            </div>
            <h1
              className="font-light mb-6"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.1, color: '#e8dcc8', letterSpacing: '0.02em' }}
            >
              The Art of the<br />
              <span style={{ color: '#D4AF37', fontStyle: 'italic' }}>Perfect Smoke</span>
            </h1>
            <p
              className="mb-10 leading-relaxed font-light"
              style={{ color: '#9b8c72', fontSize: '1.05rem', maxWidth: '480px', fontFamily: 'sans-serif' }}
            >
              A curated selection of the world's most distinguished cigars,
              sourced directly from master torcedores across Cuba, Nicaragua and the Dominican Republic.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-3 px-8 py-4 text-sm tracking-widest uppercase transition-all duration-300 hover:gap-4"
                style={{
                  background: '#D4AF37',
                  color: '#0f0d0b',
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.15em',
                }}
              >
                Explore Catalogue
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEnquiryOpen(true)}
                className="text-sm tracking-widest uppercase transition-colors border-b pb-0.5"
                style={{ color: '#9b8c72', fontFamily: 'sans-serif', borderColor: '#9b8c72', letterSpacing: '0.12em' }}
              >
                Private Enquiry
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '10px', letterSpacing: '0.2em' }}
        >
          <span className="uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 animate-pulse" style={{ background: 'linear-gradient(to bottom, #D4AF37, transparent)' }} />
        </div>
      </section>

      {/* ── VALUES BAR ─────────────────────────────────────────────────────────── */}
      <section
        className="border-y py-8"
        style={{ borderColor: 'rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.03)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield, label: 'Authenticity Guaranteed', sub: 'Direct-source provenance documentation' },
              { icon: Globe, label: 'Multi-Region Service', sub: `${REGIONS.length} regions · ${region.symbol} pricing available` },
              { icon: Star, label: 'Private Client Membership', sub: 'Exclusive allocations for VIP members' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <Icon className="w-5 h-5 mb-1" style={{ color: '#D4AF37' }} />
                <div className="text-sm tracking-wider" style={{ color: '#e8dcc8', fontFamily: 'sans-serif' }}>{label}</div>
                <div className="text-xs" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATALOGUE ──────────────────────────────────────────────────────────── */}
      <section id="catalogue" className="py-20 max-w-7xl mx-auto px-6">

        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div
              className="text-xs tracking-[0.4em] uppercase mb-2"
              style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}
            >
              Current Selection
            </div>
            <h2 className="text-3xl font-light" style={{ color: '#e8dcc8', letterSpacing: '0.05em' }}>
              {region.name} Catalogue
            </h2>
          </div>
          <div style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '13px' }}>
            {filtered.length} {filtered.length === 1 ? 'cigar' : 'cigars'} available
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9b8c72' }} />
            <input
              type="text"
              placeholder="Search by brand, series, or vitola…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-transparent border text-sm outline-none transition-colors"
              style={{
                borderColor: 'rgba(212,175,55,0.2)',
                color: '#e8dcc8',
                fontFamily: 'sans-serif',
                letterSpacing: '0.02em',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
            />
          </div>

          {/* Brand filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9b8c72' }} />
            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              className="pl-9 pr-8 py-3 bg-transparent border appearance-none text-sm cursor-pointer outline-none min-w-[160px]"
              style={{ borderColor: 'rgba(212,175,55,0.2)', color: '#e8dcc8', fontFamily: 'sans-serif' }}
            >
              {BRANDS.map(b => <option key={b} value={b} style={{ background: '#1a1612' }}>{b}</option>)}
            </select>
          </div>

          {/* Strength filter */}
          <div className="relative">
            <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9b8c72' }} />
            <select
              value={filterStrength}
              onChange={e => setFilterStrength(e.target.value)}
              className="pl-9 pr-8 py-3 bg-transparent border appearance-none text-sm cursor-pointer outline-none"
              style={{ borderColor: 'rgba(212,175,55,0.2)', color: '#e8dcc8', fontFamily: 'sans-serif' }}
            >
              {STRENGTHS.map(s => (
                <option key={s} value={s} style={{ background: '#1a1612' }}>
                  {s === 'All' ? 'All Strengths' : strengthLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
            No cigars match your current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => {
              const badge = stockBadge(product.stock_status, product.enquiry_only);
              return (
                <article
                  key={product.id}
                  className="group relative flex flex-col cursor-pointer transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.08)' }}
                  onClick={() => setActiveProduct(product)}
                >
                  {/* Image placeholder — rich tobacco brown gradient */}
                  <div
                    className="relative overflow-hidden"
                    style={{ height: '200px', background: 'linear-gradient(135deg, #2a1a0e 0%, #1a1209 100%)' }}
                  >
                    {/* Decorative cigar silhouette */}
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-40 transition-opacity duration-500"
                      style={{ transform: 'rotate(-5deg)' }}
                    >
                      <div
                        className="rounded-full"
                        style={{
                          width: '180px', height: '28px',
                          background: 'linear-gradient(90deg, #5c3a1e, #8b5c2e, #6b4520, #3a2010)',
                          boxShadow: '0 4px 20px rgba(212,175,55,0.15)',
                        }}
                      />
                    </div>

                    {/* Gold shimmer on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)' }}
                    />

                    {/* Tags */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      {product.is_limited_edition && (
                        <span
                          className="px-2 py-0.5 text-xs tracking-wider"
                          style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', fontFamily: 'sans-serif', border: '1px solid rgba(212,175,55,0.3)' }}
                        >
                          LE
                        </span>
                      )}
                      {product.is_travel_humidor && (
                        <span
                          className="px-2 py-0.5 text-xs tracking-wider"
                          style={{ background: 'rgba(147,112,71,0.15)', color: '#9b7347', fontFamily: 'sans-serif', border: '1px solid rgba(147,112,71,0.3)' }}
                        >
                          Travel
                        </span>
                      )}
                    </div>

                    {/* Stock badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-0.5 text-xs tracking-wider border rounded-full ${badge.cls}`}
                        style={{ fontFamily: 'sans-serif' }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-5">
                    {/* Brand */}
                    <div
                      className="text-xs tracking-[0.25em] uppercase mb-1"
                      style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}
                    >
                      {product.brand_name}
                    </div>

                    {/* Name */}
                    <h3
                      className="font-light mb-1 leading-tight"
                      style={{ fontSize: '1.05rem', color: '#e8dcc8', letterSpacing: '0.02em' }}
                    >
                      {product.series}
                    </h3>
                    <div
                      className="text-sm mb-3"
                      style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
                    >
                      {product.vitola} · {product.packaging_qty}s
                    </div>

                    {/* Description */}
                    <p
                      className="text-xs leading-relaxed flex-1 mb-4"
                      style={{ color: '#7a6d5a', fontFamily: 'sans-serif', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {product.short_description}
                    </p>

                    {/* Strength indicator */}
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="w-3.5 h-3.5" style={{ color: product.strength === 'full' ? '#D4AF37' : '#9b8c72' }} />
                      <div className="flex gap-1">
                        {['mild','medium','full'].map((s, i) => (
                          <div
                            key={s}
                            className="w-8 h-1 rounded-full transition-all duration-300"
                            style={{
                              background: ['mild','medium','full'].indexOf(product.strength) >= i
                                ? '#D4AF37' : 'rgba(212,175,55,0.15)',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                        {strengthLabel(product.strength)}
                      </span>
                    </div>

                    {/* Footer: price + CTA */}
                    <div className="flex items-end justify-between pt-4" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
                      <div>
                        {product.display_price ? (
                          <>
                            <div className="text-xs mb-0.5" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>
                              From
                            </div>
                            <div style={{ color: '#D4AF37', fontSize: '1.1rem', letterSpacing: '0.03em' }}>
                              {product.currency_symbol}{product.display_price.toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                            Price on Request
                          </div>
                        )}
                      </div>

                      <button
                        onClick={e => { e.stopPropagation(); product.enquiry_only ? setEnquiryOpen(true) : addToCart(product); }}
                        className="px-4 py-2 text-xs tracking-widest uppercase transition-all duration-300"
                        style={{
                          background: product.enquiry_only ? 'transparent' : '#D4AF37',
                          color: product.enquiry_only ? '#D4AF37' : '#0f0d0b',
                          border: '1px solid rgba(212,175,55,0.4)',
                          fontFamily: 'sans-serif',
                          letterSpacing: '0.1em',
                        }}
                        onMouseEnter={e => {
                          if (!product.enquiry_only) return;
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.1)';
                        }}
                        onMouseLeave={e => {
                          if (!product.enquiry_only) return;
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        {product.enquiry_only ? 'Enquire' : 'Add'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── CART DRAWER ────────────────────────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setCartOpen(false)} />
          <div
            className="relative flex flex-col w-full max-w-md h-full overflow-y-auto"
            style={{ background: '#1a1612', borderLeft: '1px solid rgba(212,175,55,0.15)' }}
          >
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
              <div>
                <div className="text-xs tracking-[0.35em] uppercase mb-0.5" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                  Enquiry
                </div>
                <h3 className="text-lg font-light" style={{ color: '#e8dcc8' }}>Your Selection</h3>
              </div>
              <button onClick={() => setCartOpen(false)}>
                <X className="w-5 h-5" style={{ color: '#9b8c72' }} />
              </button>
            </div>

            <div className="flex-1 p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '14px' }}>
                  Your selection is empty.
                </div>
              ) : (
                <div className="space-y-5">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-5"
                      style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}
                    >
                      <div
                        className="w-16 h-16 flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}
                      >
                        <Package className="w-6 h-6" style={{ color: '#D4AF37', opacity: 0.5 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs tracking-wider uppercase mb-0.5" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                          {item.brand_name}
                        </div>
                        <div className="font-light" style={{ color: '#e8dcc8', fontSize: '0.9rem' }}>{item.series}</div>
                        <div className="text-xs mb-2" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>{item.vitola}</div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-sm transition-colors hover:text-amber-300"
                              style={{ color: '#9b8c72', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'sans-serif' }}
                            >
                              −
                            </button>
                            <span style={{ color: '#e8dcc8', fontFamily: 'sans-serif', fontSize: '13px', minWidth: '20px', textAlign: 'center' }}>
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-sm transition-colors hover:text-amber-300"
                              style={{ color: '#9b8c72', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'sans-serif' }}
                            >
                              +
                            </button>
                          </div>
                          {item.display_price && (
                            <span style={{ color: '#D4AF37', fontFamily: 'sans-serif', fontSize: '13px' }}>
                              {item.currency_symbol}{(item.display_price * item.qty).toLocaleString()}
                            </span>
                          )}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto transition-colors hover:text-red-400"
                            style={{ color: '#7a6d5a' }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                {cartTotal > 0 && (
                  <div className="flex justify-between mb-4">
                    <span style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '13px' }}>Indicative Total</span>
                    <span style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                      {region.symbol}{cartTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => { setCartOpen(false); setEnquiryOpen(true); }}
                  className="w-full py-4 text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    background: '#D4AF37',
                    color: '#0f0d0b',
                    fontFamily: 'sans-serif',
                    letterSpacing: '0.15em',
                  }}
                >
                  Submit Enquiry
                  <Send className="w-4 h-4" />
                </button>
                <p className="text-center text-xs mt-3" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>
                  Our team will contact you within 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAIL MODAL ───────────────────────────────────────────────── */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setActiveProduct(null)} />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: '#1a1612', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            <div className="p-8">
              <button
                onClick={() => setActiveProduct(null)}
                className="absolute top-6 right-6 transition-colors hover:text-amber-300"
                style={{ color: '#9b8c72' }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-xs tracking-[0.35em] uppercase mb-1" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                {activeProduct.brand_name}
              </div>
              <h2
                className="font-light mb-1"
                style={{ fontSize: '1.8rem', color: '#e8dcc8', letterSpacing: '0.03em' }}
              >
                {activeProduct.series}
              </h2>
              <p className="mb-6" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '14px' }}>
                {activeProduct.vitola} · {activeProduct.packaging_qty} cigars per box · {activeProduct.packaging_type}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Strength', value: strengthLabel(activeProduct.strength) },
                  { label: 'Packaging', value: `${activeProduct.packaging_qty}'s ${activeProduct.packaging_type}` },
                  { label: 'SKU', value: activeProduct.sku },
                  { label: 'Region', value: region.name },
                ].map(({ label, value }) => (
                  <div key={label} style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: '12px' }}>
                    <div className="text-xs tracking-wider uppercase mb-1" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                      {label}
                    </div>
                    <div style={{ color: '#e8dcc8', fontFamily: 'sans-serif', fontSize: '14px' }}>{value}</div>
                  </div>
                ))}
              </div>

              <p className="leading-relaxed mb-6" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '14px' }}>
                {activeProduct.short_description}
              </p>

              {activeProduct.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {activeProduct.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs tracking-wider"
                      style={{ border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontFamily: 'sans-serif' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                <div>
                  {activeProduct.display_price ? (
                    <div style={{ color: '#D4AF37', fontSize: '1.3rem' }}>
                      {activeProduct.currency_symbol}{activeProduct.display_price.toLocaleString()}
                    </div>
                  ) : (
                    <div style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '13px' }}>Price on Request</div>
                  )}
                </div>
                <button
                  onClick={() => {
                    activeProduct.enquiry_only ? setEnquiryOpen(true) : addToCart(activeProduct);
                    setActiveProduct(null);
                  }}
                  className="px-8 py-3 text-xs tracking-widest uppercase transition-all duration-300"
                  style={{
                    background: activeProduct.enquiry_only ? 'transparent' : '#D4AF37',
                    color: activeProduct.enquiry_only ? '#D4AF37' : '#0f0d0b',
                    border: '1px solid rgba(212,175,55,0.4)',
                    fontFamily: 'sans-serif',
                    letterSpacing: '0.12em',
                  }}
                >
                  {activeProduct.enquiry_only ? 'Private Enquiry' : 'Add to Selection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ENQUIRY MODAL ──────────────────────────────────────────────────────── */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setEnquiryOpen(false)} />
          <div
            className="relative w-full max-w-lg"
            style={{ background: '#1a1612', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            <div className="p-8">
              <button
                onClick={() => setEnquiryOpen(false)}
                className="absolute top-6 right-6 transition-colors"
                style={{ color: '#9b8c72' }}
              >
                <X className="w-5 h-5" />
              </button>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4" style={{ color: '#D4AF37' }}>✦</div>
                  <h3 className="text-xl font-light mb-3" style={{ color: '#e8dcc8' }}>Enquiry Received</h3>
                  <p style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '14px', lineHeight: 1.7 }}>
                    Our private client advisor will be in touch within 24 hours
                    to discuss your selection and arrange delivery to {region.name}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                    Private Client Enquiry
                  </div>
                  <h3 className="text-xl font-light mb-6" style={{ color: '#e8dcc8' }}>
                    Begin Your Consultation
                  </h3>

                  <form
                    onSubmit={e => { e.preventDefault(); setSubmitted(true); setCart([]); }}
                    className="space-y-4"
                  >
                    {[
                      { label: 'Full Name', type: 'text', placeholder: 'Your name', name: 'name' },
                      { label: 'Email Address', type: 'email', placeholder: 'email@example.com', name: 'email' },
                      { label: 'Phone (optional)', type: 'tel', placeholder: '+852 xxxx xxxx', name: 'phone' },
                    ].map(({ label, type, placeholder, name }) => (
                      <div key={name}>
                        <label
                          className="block text-xs tracking-wider uppercase mb-2"
                          style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
                        >
                          {label}
                        </label>
                        <input
                          type={type}
                          name={name}
                          placeholder={placeholder}
                          required={name !== 'phone'}
                          className="w-full px-4 py-3 bg-transparent border text-sm outline-none transition-colors"
                          style={{
                            borderColor: 'rgba(212,175,55,0.2)',
                            color: '#e8dcc8',
                            fontFamily: 'sans-serif',
                          }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
                          onBlur={e  => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                        />
                      </div>
                    ))}

                    <div>
                      <label
                        className="block text-xs tracking-wider uppercase mb-2"
                        style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
                      >
                        Notes / Preferences
                      </label>
                      <textarea
                        name="notes"
                        rows={3}
                        placeholder="Budget range, preferred brands, occasion, delivery address…"
                        className="w-full px-4 py-3 bg-transparent border text-sm outline-none transition-colors resize-none"
                        style={{ borderColor: 'rgba(212,175,55,0.2)', color: '#e8dcc8', fontFamily: 'sans-serif' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
                        onBlur={e  => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                      />
                    </div>

                    {cart.length > 0 && (
                      <div className="py-3 px-4" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
                        <div className="text-xs tracking-wider uppercase mb-2" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                          Selected items ({cart.reduce((s, i) => s + i.qty, 0)})
                        </div>
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between text-xs" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                            <span>{item.brand_name} {item.series} × {item.qty}</span>
                            {item.display_price && (
                              <span>{item.currency_symbol}{(item.display_price * item.qty).toLocaleString()}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-4 mt-2 text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ background: '#D4AF37', color: '#0f0d0b', fontFamily: 'sans-serif', letterSpacing: '0.15em' }}
                    >
                      Submit Enquiry
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────────────── */}
      <footer
        className="py-16"
        style={{ borderTop: '1px solid rgba(212,175,55,0.1)', marginTop: '80px' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="text-lg tracking-[0.2em] font-light mb-3" style={{ color: '#D4AF37' }}>
                ARRISONAPPS
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>
                For over a decade, Arrisonapps has been the trusted partner for
                discerning collectors and connoisseurs seeking the world's finest cigars.
              </p>
            </div>
            <div>
              <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                Regions
              </div>
              <ul className="space-y-2">
                {REGIONS.map(r => (
                  <li key={r.code}>
                    <button
                      onClick={() => setRegion(r)}
                      className="text-sm transition-colors hover:text-amber-300"
                      style={{ color: region.code === r.code ? '#D4AF37' : '#7a6d5a', fontFamily: 'sans-serif' }}
                    >
                      {r.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                Contact
              </div>
              <ul className="space-y-2 text-sm" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>
                <li>enquiries@arrisonapps.com</li>
                <li>Private client line: +852 3xxx xxxx</li>
                <li>By appointment only</li>
              </ul>
            </div>
          </div>
          <div
            className="flex flex-col sm:flex-row items-center justify-between pt-8 text-xs gap-4"
            style={{ borderTop: '1px solid rgba(212,175,55,0.08)', color: '#7a6d5a', fontFamily: 'sans-serif' }}
          >
            <div>© {new Date().getFullYear()} Arrisonapps. All rights reserved.</div>
            <div>
              Built on{' '}
              <Link href="/vibe-demo" className="transition-colors hover:text-amber-300" style={{ color: '#9b8c72' }}>
                5ML Agentic Platform
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
