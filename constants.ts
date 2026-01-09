
import { InventoryItem, Tool, AssetStatus } from './types';

export const TECHS = ['Bilal', 'Asad', 'Taimoor', 'Saboor'];

export const DEFAULT_GAS: InventoryItem[] = [
    { name: 'R22', kg: 50, type: 'AC' },
    { name: 'R410A', kg: 50, type: 'AC' },
    { name: 'R32', kg: 50, type: 'AC' },
    { name: 'R134a', kg: 50, type: 'Fridge' },
    { name: 'R600a', kg: 50, type: 'Fridge' }
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

export const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzgb--GW4m8j9xFhki5HIp81dMaeM5jD2NFm1SBOiTZyG0gEnYR4mLO_lsA71tk55fp/exec";
