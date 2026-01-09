
export enum AssetStatus {
  ACTIVE = 'Active',
  MAINTENANCE = 'Maintenance',
  SPARE = 'Spare',
  DISPOSED = 'Disposed',
  OBSOLETE = 'Obsolete'
}

export enum TicketStatus {
  OPEN = 'Open',
  WIP = 'In Progress',
  RESOLVED = 'Resolved'
}

export enum TicketSeverity {
  MINOR = 'Minor',
  MAJOR = 'Major'
}

export interface Asset {
  id: number;
  tag: string;
  brand: string;
  location: string;
  status: AssetStatus;
  category?: string;
  capacity?: string;
  floor?: string;
  room?: string;
  campus?: string;
  zone?: 'A' | 'B' | 'C' | 'D';
}

export interface Ticket {
  rowIndex?: number;
  id: number;
  assetTag: string;
  assetId: number;
  location: string;
  details: string;
  status: TicketStatus;
  severity: TicketSeverity;
  assignedTo: string;
  timestamp: string;
  date?: string;
  category?: string;
  resolvedBy?: string;
  resolutionType?: 'Minor' | 'Major';
  faultType?: 'Compressor' | 'Gas Leakage' | 'Other';
  gasUsed?: string;
  gasAmount?: number;
}

export interface Technician {
  name: string;
  merit: number;
  demerit: number;
  isPresent: boolean;
  zone: 'A' | 'B' | 'C' | 'D';
  bonusPoints: number;
}

export interface InventoryItem {
  name: string;
  kg: number;
  type: 'AC' | 'Fridge';
}

export interface Tool {
  name: string;
  qty: number;
}
