export interface FuelEntry {
  id: string;
  date: string;
  odometer: number;
  pricePerUnit: number;
  volume: number;
  totalCost: number;
  stationName?: string;
  fullTank: boolean;
  notes?: string;
}

export interface VehicleStats {
  totalCost: number;
  totalDistance: number;
  averageKml: number;
  lastOdometer: number;
}

export interface ReceiptData {
  totalCost: number | null;
  volume: number | null;
  pricePerUnit: number | null;
  stationName: string | null;
  date: string | null;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  ADD = 'ADD',
  SETTINGS = 'SETTINGS'
}