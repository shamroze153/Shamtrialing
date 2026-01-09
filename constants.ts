
import { InventoryItem, Tool } from './types';

export const TECHS = ['Bilal', 'Asad', 'Taimoor', 'Saboor'];

export const ZONE_MAP: Record<string, 'A' | 'B' | 'C' | 'D'> = {
  'Bilal': 'A',
  'Asad': 'B',
  'Taimoor': 'C',
  'Saboor': 'D'
};

export const ZONE_LABELS = {
  'A': 'Ground & Basement',
  'B': 'First Floor',
  'C': 'Second Floor',
  'D': 'Third Floor & Roof'
};

export const DEFAULT_GAS: InventoryItem[] = [
    { name: 'R22', kg: 45, type: 'AC' },
    { name: 'R410A', kg: 38, type: 'AC' },
    { name: 'R32', kg: 50, type: 'AC' },
    { name: 'R134a', kg: 22, type: 'Fridge' },
    { name: 'R600a', kg: 12, type: 'Fridge' }
];

export const DEFAULT_TOOLS: Tool[] = [
    { name: "Adjustable Wrench", qty: 4 },
    { name: "Pliers Set", qty: 2 },
    { name: "Screwdriver Set (+/-)", qty: 2 },
    { name: "Ampere Meter", qty: 2 },
    { name: "High Pressure Gauge", qty: 2 },
    { name: "Charging Line", qty: 6 },
    { name: "Flaring Tool", qty: 2 },
    { name: "Allen Key Set", qty: 2 },
    { name: "Swaging Tool", qty: 1 },
    { name: "File", qty: 2 },
    { name: "Tube Bender", qty: 1 },
    { name: "Tool Bag", qty: 2 }
];

export const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw6yuSq4mqX42HeSFVGbvlZF7RtN8lyIt1zHqw-kM-cViJuu2NTCvUZ4rBedeOCOtQP/exec";
