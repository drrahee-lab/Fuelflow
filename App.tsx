
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  History as HistoryIcon, 
  Settings, 
  Camera, 
  Fuel, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Trash2,
  Edit,
  X,
  Check,
  Search,
  ListFilter,
  ArrowUp,
  ArrowDown,
  Lock,
  LockOpen
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, YAxis, CartesianGrid } from 'recharts';
import { FuelEntry, ViewState, VehicleStats } from './types';
import { IOSButton, IOSCard, IOSInput, IOSHeader, IOSSelectRow } from './components/IOSComponents';
import { parseReceiptImage } from './services/geminiService';

// --- Helper Functions ---

const calculateStats = (entries: FuelEntry[]): VehicleStats => {
  if (entries.length === 0) {
    return { totalCost: 0, totalDistance: 0, averageKml: 0, lastOdometer: 0 };
  }

  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalCost = sorted.reduce((sum, e) => sum + e.totalCost, 0);
  const lastOdometer = sorted[sorted.length - 1].odometer;
  
  // Need at least 2 entries for distance/Efficiency
  if (sorted.length < 2) {
    return { totalCost, totalDistance: 0, averageKml: 0, lastOdometer };
  }

  const firstOdometer = sorted[0].odometer;
  const totalDistance = lastOdometer - firstOdometer;
  
  // Calculate total liters consumed between first and last fill up
  // We exclude the first fill up volume because we don't know the distance driven *before* it
  let totalVolume = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalVolume += sorted[i].volume;
  }

  const averageKml = totalVolume > 0 ? totalDistance / totalVolume : 0;

  return {
    totalCost,
    totalDistance,
    averageKml,
    lastOdometer
  };
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-100 text-center min-w-[100px]">
        <p className="text-[11px] text-gray-500 font-medium mb-1 uppercase tracking-wide">{label}</p>
        <p className="text-[20px] font-bold text-ios-blue tracking-tight">
          ${Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

// --- Sub-Components ---

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={`w-[51px] h-[31px] rounded-full p-0.5 cursor-pointer transition-colors duration-300 ease-in-out ${checked ? 'bg-ios-green' : 'bg-[#E9E9EA]'}`}
  >
    <div className={`w-[27px] h-[27px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`} />
  </div>
);

const SwipeableStationRow: React.FC<{
  station: string;
  isSelected: boolean;
  onSelect: (station: string) => void;
  onDelete: (station: string) => void;
}> = ({ station, isSelected, onSelect, onDelete }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const startOffset = useRef(0);
  const isDragging = useRef(false);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    startX.current = clientX;
    startOffset.current = offset;
    isDragging.current = false;
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startX.current === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = clientX - startX.current;

    if (Math.abs(diff) > 5) isDragging.current = true;

    if (isDragging.current) {
        let newOffset = startOffset.current + diff;
        if (newOffset > 0) newOffset = 0; // capped at 0 (right)
        if (newOffset < -80) newOffset = -80; // capped at -80 (left max)
        setOffset(newOffset);
    }
  };

  const handleEnd = () => {
    if (startX.current === null) return;
    startX.current = null;
    
    if (isDragging.current) {
        // Snap logic
        if (offset < -40) setOffset(-80);
        else setOffset(0);
    } else {
        // Click logic
        if (offset === 0) onSelect(station);
        else setOffset(0); // Close if open and clicked
    }
    isDragging.current = false;
  };

  return (
    <div className="relative overflow-hidden w-full border-b border-gray-100 last:border-0 select-none h-[54px] touch-pan-y">
      {/* Background Actions */}
      <div className="absolute inset-y-0 right-0 w-[80px] bg-ios-red flex items-center justify-center text-white z-0">
         <button 
           onClick={(e) => {
             e.stopPropagation();
             onDelete(station);
           }}
           className="w-full h-full flex items-center justify-center active:opacity-80 transition-opacity"
         >
           <Trash2 size={20} />
         </button>
      </div>
      
      {/* Foreground Content */}
      <div 
         className="bg-white relative z-10 h-full w-full transition-transform duration-300 ease-out cursor-pointer"
         style={{ transform: `translateX(${offset}px)` }}
         onTouchStart={handleStart}
         onTouchMove={handleMove}
         onTouchEnd={handleEnd}
         onMouseDown={handleStart}
         onMouseMove={handleMove}
         onMouseUp={handleEnd}
         onMouseLeave={handleEnd}
      >
        <div className={`w-full h-full flex justify-between items-center px-4 active:bg-gray-50 transition-colors ${isSelected ? 'text-ios-blue font-semibold' : 'text-black'}`}>
            <span className="text-[17px]">{station}</span>
            {isSelected && <Check size={20} className="text-ios-blue" />}
        </div>
      </div>
    </div>
  );
};

const TabBar: React.FC<{ current: ViewState; onChange: (v: ViewState) => void }> = ({ current, onChange }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between z-50">
    <button 
      onClick={() => onChange(ViewState.DASHBOARD)}
      className={`flex flex-col items-center gap-1 ${current === ViewState.DASHBOARD ? 'text-ios-blue' : 'text-gray-400'}`}
    >
      <LayoutDashboard size={24} />
      <span className="text-[10px] font-medium">Dashboard</span>
    </button>
    <button 
      onClick={() => onChange(ViewState.ADD)}
      className={`flex flex-col items-center gap-1 ${current === ViewState.ADD ? 'text-ios-blue' : 'text-gray-400'}`}
    >
      <div className="bg-ios-blue text-white rounded-full p-2 -mt-4 shadow-lg border-4 border-white">
        <Plus size={24} />
      </div>
      <span className="text-[10px] font-medium">Add Fuel</span>
    </button>
    <button 
      onClick={() => onChange(ViewState.HISTORY)}
      className={`flex flex-col items-center gap-1 ${current === ViewState.HISTORY ? 'text-ios-blue' : 'text-gray-400'}`}
    >
      <HistoryIcon size={24} />
      <span className="text-[10px] font-medium">History</span>
    </button>
  </div>
);

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-2.5 rounded-xl shadow-sm flex-1 min-w-0 flex flex-col justify-center">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1.5 ${color} text-white`}>
      {icon}
    </div>
    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider truncate leading-tight">{label}</p>
    <p className="text-[15px] font-bold text-black mt-0.5 truncate">{value}</p>
  </div>
);

// --- Main App Component ---

// Define a dedicated interface for form state where numeric fields are strings to handle inputs gracefully
interface FuelFormState {
  date: string;
  time: string;
  odometer: string;
  pricePerUnit: string;
  volume: string;
  totalCost: string;
  stationName: string;
  fullTank: boolean;
  notes: string;
}

type SortOption = 'date-desc' | 'date-asc' | 'cost-desc' | 'cost-asc';

const DEFAULT_STATIONS = ['Oman Oil', 'Shell', 'Al Maha'];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  
  // Station State
  const [stations, setStations] = useState<string[]>(DEFAULT_STATIONS);
  const [isStationModalOpen, setStationModalOpen] = useState(false);
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [stationSearchQuery, setStationSearchQuery] = useState('');

  // Sorting State
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [isSortModalOpen, setSortModalOpen] = useState(false);

  // Fix Price State
  const [isPriceFixed, setIsPriceFixed] = useState(false);

  // Form State
  const [formData, setFormData] = useState<FuelFormState>({
    date: new Date().toISOString().split('T')[0],
    time: getCurrentTime(),
    odometer: '',
    pricePerUnit: '',
    volume: '',
    totalCost: '',
    stationName: '',
    fullTank: true,
    notes: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  useEffect(() => {
    const saved = localStorage.getItem('fuel_entries');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
    const savedStations = localStorage.getItem('fuel_stations');
    if (savedStations) {
      setStations(JSON.parse(savedStations));
    }
    const savedFixPrice = localStorage.getItem('fuel_fix_price');
    if (savedFixPrice === 'true') {
      setIsPriceFixed(true);
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem('fuel_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('fuel_stations', JSON.stringify(stations));
  }, [stations]);

  const resetForm = () => {
    let savedPrice = '';
    if (isPriceFixed) {
      savedPrice = localStorage.getItem('fuel_saved_price') || '';
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: getCurrentTime(),
      odometer: '',
      pricePerUnit: savedPrice,
      volume: '',
      totalCost: '',
      stationName: '',
      fullTank: true,
      notes: ''
    });
    setEditingEntryId(null);
  };

  const handleTabChange = (newView: ViewState) => {
    // If clicking Add Fuel tab, ensure we reset to a blank form
    if (newView === ViewState.ADD) {
      resetForm();
    } 
    // If navigating away from ADD view, reset form (discarding unsaved changes)
    else if (view === ViewState.ADD) {
      resetForm();
    }
    setView(newView);
  };

  // --- Auto-Calculation Handlers ---

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, pricePerUnit: val };
      if (val && prev.volume) {
        const p = parseFloat(val);
        const v = parseFloat(prev.volume);
        if (!isNaN(p) && !isNaN(v)) {
          newData.totalCost = (v * p).toFixed(2);
        }
      }
      return newData;
    });

    if (isPriceFixed) {
      localStorage.setItem('fuel_saved_price', val);
    }
  };

  const handleToggleFixPrice = () => {
    const newState = !isPriceFixed;
    setIsPriceFixed(newState);
    localStorage.setItem('fuel_fix_price', String(newState));
    if (newState) {
      localStorage.setItem('fuel_saved_price', formData.pricePerUnit);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, volume: val };
      if (val && prev.pricePerUnit) {
        const v = parseFloat(val);
        const p = parseFloat(prev.pricePerUnit);
        if (!isNaN(v) && !isNaN(p)) {
          newData.totalCost = (v * p).toFixed(2);
        }
      }
      return newData;
    });
  };

  const handleTotalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, totalCost: val };
      if (val && prev.pricePerUnit) {
        const c = parseFloat(val);
        const p = parseFloat(prev.pricePerUnit);
        if (!isNaN(c) && !isNaN(p) && p !== 0) {
          newData.volume = (c / p).toFixed(3);
        }
      }
      return newData;
    });
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.odometer || !formData.totalCost || !formData.volume || !formData.pricePerUnit) return;

    // Combine Date and Time
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    const finalDate = isNaN(dateTime.getTime()) 
      ? formData.date // Fallback if time invalid
      : dateTime.toISOString();

    // Convert strings to numbers for storage
    const payload = {
      date: finalDate,
      odometer: parseFloat(formData.odometer),
      pricePerUnit: parseFloat(formData.pricePerUnit),
      volume: parseFloat(formData.volume),
      totalCost: parseFloat(formData.totalCost),
      stationName: formData.stationName || 'Unknown Station',
      fullTank: formData.fullTank,
      notes: formData.notes
    };

    if (editingEntryId) {
      setEntries(prev => prev.map(entry => {
        if (entry.id === editingEntryId) {
          return { ...entry, ...payload };
        }
        return entry;
      }));
      resetForm();
      setView(ViewState.HISTORY);
    } else {
      const newEntry: FuelEntry = {
        id: Date.now().toString(),
        ...payload
      };

      setEntries(prev => [...prev, newEntry]);
      resetForm();
      setView(ViewState.DASHBOARD);
    }
  };

  const handleEdit = (entry: FuelEntry) => {
    let dateVal = '';
    let timeVal = '';

    if (entry.date.includes('T')) {
      // It's an ISO string
      const d = new Date(entry.date);
      // Construct local YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateVal = `${year}-${month}-${day}`;
      
      // Construct local HH:MM
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      timeVal = `${hours}:${mins}`;
    } else {
      // Legacy date string (YYYY-MM-DD)
      dateVal = entry.date;
      timeVal = getCurrentTime();
    }

    setFormData({
      date: dateVal,
      time: timeVal,
      odometer: entry.odometer.toString(),
      pricePerUnit: entry.pricePerUnit.toString(),
      volume: entry.volume.toString(),
      totalCost: entry.totalCost.toString(),
      stationName: entry.stationName || '',
      fullTank: entry.fullTank,
      notes: entry.notes || ''
    });
    setEditingEntryId(entry.id);
    setView(ViewState.ADD);
  };

  const handleCancel = () => {
    const wasEditing = !!editingEntryId;
    resetForm();
    if (wasEditing) {
      setView(ViewState.HISTORY);
    } else {
      setView(ViewState.DASHBOARD);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const data = await parseReceiptImage(base64Data);
          setFormData(prev => ({
            ...prev,
            totalCost: data.totalCost?.toString() || prev.totalCost,
            volume: data.volume?.toString() || prev.volume,
            pricePerUnit: data.pricePerUnit?.toString() || prev.pricePerUnit,
            stationName: data.stationName || prev.stationName,
            date: data.date || prev.date
            // Keep existing time or current time
          }));
        } catch (err) {
          alert('Failed to parse receipt. Please enter details manually.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if(confirm("Are you sure you want to delete this entry?")) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  // --- Station Handlers ---
  const handleStationSelect = (name: string) => {
    setFormData(prev => ({ ...prev, stationName: name }));
    setStationSearchQuery('');
    setStationModalOpen(false);
  };

  const handleAddStation = () => {
    if (!newStationName.trim()) return;
    const name = newStationName.trim();
    if (!stations.includes(name)) {
      setStations(prev => [...prev, name].sort());
    }
    setFormData(prev => ({ ...prev, stationName: name }));
    setNewStationName('');
    setStationSearchQuery('');
    setIsAddingStation(false);
    setStationModalOpen(false);
  };

  const handleDeleteStation = (stationToDelete: string) => {
    if (confirm(`Delete "${stationToDelete}"?`)) {
      setStations(prev => prev.filter(s => s !== stationToDelete));
      // If the deleted station was selected, clear the selection
      if (formData.stationName === stationToDelete) {
        setFormData(prev => ({ ...prev, stationName: '' }));
      }
    }
  };

  const filteredStations = stations
    .filter(s => s.toLowerCase().includes(stationSearchQuery.toLowerCase()))
    .slice(0, 20);

  // --- Sorting Logic ---
  const getSortedEntries = () => {
    return [...entries].sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'cost-asc':
          return a.totalCost - b.totalCost;
        case 'cost-desc':
          return b.totalCost - a.totalCost;
        default:
          return 0;
      }
    });
  };

  const sortedHistory = getSortedEntries();

  const stats = calculateStats(entries);
  
  const chartData = entries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: e.totalCost
    }));

  return (
    <div className="min-h-screen pb-24 font-sans text-gray-900 bg-ios-bg selection:bg-ios-blue selection:text-white">
      
      {/* Dashboard View */}
      {view === ViewState.DASHBOARD && (
        <>
          <IOSHeader title="Dashboard" />
          <div className="px-4 space-y-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2.5">
              <StatCard 
                label="Avg Km/L" 
                value={stats.averageKml.toFixed(1)} 
                icon={<TrendingUp size={14} />} 
                color="bg-ios-green" 
              />
              <StatCard 
                label="Total Spent" 
                value={`$${stats.totalCost.toFixed(2)}`} 
                icon={<Fuel size={14} />} 
                color="bg-ios-blue" 
              />
              <StatCard 
                label="Last Odo" 
                value={stats.lastOdometer.toLocaleString()} 
                icon={<HistoryIcon size={14} />} 
                color="bg-orange-500" 
              />
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Spending Trend</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#8E8E93'}} 
                      dy={10}
                    />
                    <YAxis 
                      hide
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#8E8E93', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#007AFF" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorCost)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity Mini List */}
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <button 
                  onClick={() => setView(ViewState.HISTORY)}
                  className="text-ios-blue text-xs font-medium flex items-center"
                >
                  See All <ChevronRight size={14} />
                </button>
              </div>
              <IOSCard>
                {entries.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-[10px]">No entries yet.</div>
                ) : (
                  entries.slice().reverse().slice(0, 3).map((entry, idx) => (
                    <div key={entry.id} className="flex items-center p-2 border-b border-gray-100 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-ios-blue flex items-center justify-center mr-2">
                        <Fuel size={12} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[10px] leading-tight">{entry.stationName}</h4>
                        <p className="text-gray-500 text-[10px] leading-tight">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[10px] text-black leading-tight">-${entry.totalCost.toFixed(2)}</p>
                        <p className="text-gray-500 text-[10px] leading-tight">{entry.volume} L</p>
                      </div>
                    </div>
                  ))
                )}
              </IOSCard>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Entry View */}
      {view === ViewState.ADD && (
        <div className="min-h-screen bg-ios-bg">
          <IOSHeader 
            title={editingEntryId ? "Edit Fuel" : "Add Fuel"} 
            action={
              <button onClick={handleCancel} className="text-ios-blue font-medium text-[17px]">
                Cancel
              </button>
            }
          />
          <div className="px-4 pt-4 space-y-4">
            
            {!editingEntryId && (
              <>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-ios-blue to-blue-500 text-white rounded-xl h-12 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
                >
                  {loading ? (
                    <span className="flex items-center animate-pulse text-[15px] font-semibold"><TrendingUp className="animate-spin mr-2" size={18}/> analyzing...</span>
                  ) : (
                    <>
                      <Camera size={20} />
                      <span className="font-semibold text-[15px]">Scan Receipt with AI</span>
                    </>
                  )}
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </>
            )}

            <form onSubmit={handleAddEntry} className="space-y-4">
              <IOSCard>
                {/* Date & Time Row */}
                <div className="flex flex-col py-3 border-b border-ios-separator last:border-0">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] text-black w-1/3 shrink-0">Date</label>
                    <div className="w-2/3 flex justify-end gap-2">
                      <input 
                        type="date" 
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})} 
                        required
                        className="bg-transparent text-[12px] text-ios-blue focus:outline-none text-right font-normal"
                      />
                      <input 
                        type="time" 
                        value={formData.time} 
                        onChange={e => setFormData({...formData, time: e.target.value})} 
                        required
                        className="bg-transparent text-[12px] text-ios-blue focus:outline-none text-right font-normal"
                      />
                    </div>
                  </div>
                </div>

                {/* Station */}
                <IOSSelectRow 
                  label="Station"
                  value={formData.stationName}
                  placeholder="Select"
                  onClick={() => { setStationModalOpen(true); setIsAddingStation(false); setStationSearchQuery(''); }}
                  labelClassName="text-[12px]"
                  valueClassName="text-[12px]"
                />

                {/* Odometer */}
                <IOSInput 
                  label="Odometer" 
                  helperText={stats.lastOdometer > 0 && !editingEntryId ? `Last: ${stats.lastOdometer.toLocaleString()}` : undefined}
                  type="number" 
                  placeholder="0" 
                  value={formData.odometer} 
                  onChange={e => setFormData({...formData, odometer: e.target.value})}
                  required
                  className="text-[12px]"
                  labelClassName="text-[12px]"
                />
              </IOSCard>

              {/* Calculation Group */}
              <IOSCard>
                 {/* Compact Price/L and Volume in one row */}
                 <div className="flex border-b border-ios-separator">
                    <div className="flex-1 border-r border-ios-separator p-3">
                         <div className="flex justify-between items-center mb-1">
                            <label className="text-[12px] text-gray-500">Price / L</label>
                            <button 
                              type="button"
                              onClick={handleToggleFixPrice}
                              className={`flex items-center gap-1 text-[10px] transition-colors ${isPriceFixed ? 'text-ios-blue font-medium' : 'text-gray-400'}`}
                            >
                              {isPriceFixed ? <Lock size={10} /> : <LockOpen size={10} />}
                              {isPriceFixed ? 'Fixed' : 'Fix'}
                            </button>
                         </div>
                         <input 
                            type="number" step="0.001" placeholder="0.000"
                            className="w-full text-[12px] focus:outline-none text-black bg-transparent"
                            value={formData.pricePerUnit} onChange={handlePriceChange} required
                         />
                    </div>
                    <div className="flex-1 p-3">
                         <label className="text-[12px] text-gray-500 block mb-1 text-right">Liters</label>
                         <input 
                            type="number" step="0.001" placeholder="0.00"
                            className="w-full text-[12px] focus:outline-none text-black bg-transparent text-right"
                            value={formData.volume} onChange={handleVolumeChange} required
                         />
                    </div>
                 </div>

                 {/* Total Cost Highlight */}
                 <div className="flex justify-between items-center p-3">
                     <label className="text-[12px] font-semibold text-black">Total Cost</label>
                     <div className="flex items-center text-ios-blue">
                         <span className="text-[16px] font-bold mr-1">$</span>
                         <input 
                            type="number" step="0.01" placeholder="0.00"
                            className="w-24 text-[16px] font-bold bg-transparent focus:outline-none text-right placeholder-blue-300"
                            value={formData.totalCost} onChange={handleTotalCostChange} required
                         />
                     </div>
                 </div>
              </IOSCard>

              {/* Settings Card */}
              <IOSCard>
                 <div className="flex justify-between items-center p-3">
                    <label className="text-[12px] text-black">Full Tank</label>
                    <ToggleSwitch 
                        checked={formData.fullTank} 
                        onChange={(val) => setFormData({...formData, fullTank: val})} 
                    />
                 </div>
              </IOSCard>

              <div className="pt-2">
                <IOSButton type="submit">
                    {editingEntryId ? "Update Entry" : "Save Entry"}
                </IOSButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History View */}
      {view === ViewState.HISTORY && (
        <>
          <IOSHeader 
            title="History" 
            action={
              <button 
                onClick={() => setSortModalOpen(true)}
                className="p-2 text-ios-blue active:opacity-60 transition-opacity"
              >
                <ListFilter size={22} />
              </button>
            }
          />
          <div className="px-4 pt-4 pb-24">
             {sortedHistory.length === 0 ? (
               <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
                 <Calendar size={48} className="mb-4 opacity-50"/>
                 <p>No history yet.</p>
               </div>
             ) : (
               <IOSCard className="overflow-hidden border border-gray-100/50 shadow-sm">
                 {sortedHistory.map((entry, idx) => {
                   const d = new Date(entry.date);
                   const day = d.getDate();
                   const month = d.toLocaleString('en-US', { month: 'short' });
                   const timeString = entry.date.includes('T') 
                      ? d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      : '';
                   
                   return (
                   <div key={entry.id} className="relative flex items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                     {/* Compact Date Box */}
                     <div className="w-10 h-10 bg-gray-50 rounded-[10px] flex flex-col items-center justify-center shrink-0 border border-gray-200 mr-3">
                         <span className="text-[9px] font-bold text-gray-400 uppercase leading-none tracking-wider mb-0.5">{month}</span>
                         <span className="text-[14px] font-bold text-gray-900 leading-none">{day}</span>
                     </div>

                     {/* Main Info */}
                     <div className="flex-1 min-w-0 flex flex-col gap-1">
                        {/* Top Row: Station & Cost */}
                        <div className="flex justify-between items-center leading-none">
                            <h4 className="font-semibold text-[13px] text-gray-900 truncate pr-2">{entry.stationName || 'Unknown'}</h4>
                            <span className="font-bold text-[13px] text-ios-blue">-${entry.totalCost.toFixed(2)}</span>
                        </div>
                        
                        {/* Bottom Row: Details & Actions */}
                        <div className="flex justify-between items-center">
                             {/* Left: Vol & Price */}
                             <div className="flex items-center text-[10px] text-gray-500 font-medium">
                                 <span>{entry.volume.toFixed(1)}L</span>
                                 <span className="mx-1.5 opacity-30">|</span>
                                 <span>{entry.pricePerUnit.toFixed(3)}</span>
                             </div>
                             
                             {/* Right: Time/Odo & Buttons */}
                             <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-gray-400 font-medium tabular-nums">
                                     {entry.odometer.toLocaleString()}
                                  </span>
                                  <div className="w-px h-2.5 bg-gray-200"></div>
                                  <div className="flex gap-2">
                                     <button onClick={(e) => { e.stopPropagation(); handleEdit(entry); }} className="text-gray-300 hover:text-ios-blue transition-colors">
                                         <Edit size={12} />
                                     </button>
                                     <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id)} } className="text-gray-300 hover:text-ios-red transition-colors">
                                         <Trash2 size={12} />
                                     </button>
                                  </div>
                             </div>
                        </div>
                     </div>
                   </div>
                   );
                 })}
               </IOSCard>
             )}
          </div>
        </>
      )}

      <TabBar current={view} onChange={handleTabChange} />

      {/* Station Selection Modal */}
      {isStationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setStationModalOpen(false)}
          ></div>
          
          {/* Content */}
          <div className="relative w-full max-w-md bg-ios-card rounded-t-[20px] p-4 pb-safe flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
              <div className="w-8"></div> {/* Spacer for centering */}
              <h3 className="text-[17px] font-bold text-center">
                {isAddingStation ? 'New Station' : 'Select Station'}
              </h3>
              <button 
                onClick={() => setStationModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            {isAddingStation ? (
              <div className="flex flex-col gap-4 pt-2 pb-6">
                <input 
                  autoFocus
                  className="w-full bg-gray-100 p-4 rounded-xl text-lg outline-none border border-transparent focus:border-ios-blue focus:bg-white transition-all"
                  placeholder="Enter station name"
                  value={newStationName}
                  onChange={e => setNewStationName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddStation()}
                />
                <div className="flex gap-3">
                  <IOSButton variant="secondary" onClick={() => setIsAddingStation(false)}>Back</IOSButton>
                  <IOSButton onClick={handleAddStation}>Add Station</IOSButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Search Bar */}
                <div className="mb-2 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={18} />
                  </div>
                  <input 
                    type="text"
                    className="w-full bg-gray-100 text-[17px] pl-10 pr-8 py-2 rounded-xl focus:outline-none focus:bg-gray-200/50 transition-colors placeholder-gray-500"
                    placeholder="Search stations"
                    value={stationSearchQuery}
                    onChange={(e) => setStationSearchQuery(e.target.value)}
                  />
                  {stationSearchQuery && (
                    <button 
                      onClick={() => setStationSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col overflow-y-auto -mx-4 px-4 flex-1 min-h-0">
                  {filteredStations.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-sm">No stations found</div>
                  ) : (
                    filteredStations.map(s => (
                      <SwipeableStationRow 
                        key={s}
                        station={s}
                        isSelected={formData.stationName === s}
                        onSelect={handleStationSelect}
                        onDelete={handleDeleteStation}
                      />
                    ))
                  )}
                </div>
                
                <div className="pt-4 pb-6 sticky bottom-0 bg-white border-t border-gray-100 mt-2 shrink-0">
                   <button 
                    onClick={() => { setIsAddingStation(true); setNewStationName(''); }}
                    className="w-full py-3 bg-ios-blue/10 text-ios-blue rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                   >
                     <Plus size={20} /> Add Station
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sorting Modal */}
      {isSortModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSortModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-ios-card rounded-t-[20px] p-4 pb-safe flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                  <div className="w-8"></div>
                  <h3 className="text-[17px] font-bold">Sort History</h3>
                  <button onClick={() => setSortModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                    <X size={18} />
                  </button>
              </div>
              <div className="flex flex-col gap-1">
                  {[
                      { label: 'Date: Newest First', value: 'date-desc', icon: <Calendar size={18} /> },
                      { label: 'Date: Oldest First', value: 'date-asc', icon: <Calendar size={18} /> },
                      { label: 'Cost: Highest First', value: 'cost-desc', icon: <div className="font-bold text-sm">$</div> },
                      { label: 'Cost: Lowest First', value: 'cost-asc', icon: <div className="font-bold text-sm">$</div> },
                  ].map(opt => (
                      <button 
                          key={opt.value}
                          onClick={() => { setSortOption(opt.value as any); setSortModalOpen(false); }}
                          className={`flex items-center justify-between p-4 rounded-xl active:bg-gray-50 transition-colors ${sortOption === opt.value ? 'bg-blue-50 text-ios-blue' : 'text-black'}`}
                      >
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${sortOption === opt.value ? 'bg-ios-blue text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {opt.icon}
                              </div>
                              <span className="text-[17px] font-medium">{opt.label}</span>
                          </div>
                          {sortOption === opt.value && <Check size={20} />}
                      </button>
                  ))}
              </div>
              <div className="pb-4"></div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
