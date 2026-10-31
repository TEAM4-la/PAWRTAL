import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import React, { useMemo } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  PawPrint,
  CheckCircle,
  ChevronLeft,
  Package,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

const COLORS = ['#7c3aed', '#0d9488', '#f59e0b', '#3b82f6', '#ec4899', '#6b7280'];

export default function AdminReports() {
  const navigate = useNavigate();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: appointments = [] } = useQuery({ queryKey: ['allAppts'], queryFn: () => api.entities.Appointment.list('-date', 300) });
  const { data: pets = [] } = useQuery({ queryKey: ['allPets'], queryFn: () => api.entities.Pet.list() });
  const { data: inventory = [] } = useQuery({
    queryKey: ['allInventoryReports'],
    queryFn: () => api.entities.InventoryItem.list('name', 500),
  });

  // Appointments by type
  const byType = appointments.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(byType).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  // Appointments last 7 days — broken down by status
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAppts = appointments.filter(a => a.date === dateStr);
    return {
      date: format(date, 'MMM d'),
      Completed: dayAppts.filter(a => a.status === 'completed').length,
      Cancelled: dayAppts.filter(a => a.status === 'cancelled').length,
      Expired: dayAppts.filter(a => a.status === 'expired').length,
      Active: dayAppts.filter(a => !['completed', 'cancelled', 'expired'].includes(a.status)).length,
    };
  });

  const STATUS_COLORS = {
    Completed: '#10b981',
    Active: '#7c3aed',
    Cancelled: '#ef4444',
    Expired: '#6b7280',
  };

  // Species breakdown (normalized casing so "Dog" and "dog" merge into one clean category)
  const speciesData = useMemo(() => {
    const bySpecies = pets.reduce((acc, p) => {
      if (!p.species) return acc;
      const raw = p.species.trim().toLowerCase();
      const label = raw.charAt(0).toUpperCase() + raw.slice(1);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(bySpecies)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [pets]);

  const completionRate = appointments.length
    ? Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100)
    : 0;

  // -------------------------------------------------------------
  // Inventory Calculations & Charts
  // -------------------------------------------------------------
  const totalStockUnits = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [inventory]);

  const totalInventoryValuation = useMemo(() => {
    return inventory.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  }, [inventory]);

  const lowStockItems = useMemo(() => inventory.filter(i => i.is_low_stock && !i.is_out_of_stock), [inventory]);
  const outOfStockItems = useMemo(() => inventory.filter(i => i.is_out_of_stock), [inventory]);
  const expiringSoonItems = useMemo(() => inventory.filter(i => i.is_expiring_soon && !i.is_out_of_stock && !i.is_expired), [inventory]);
  const expiredItems = useMemo(() => inventory.filter(i => i.is_expired), [inventory]);
  const attentionNeededItems = useMemo(() => {
    return inventory.filter(i => i.is_low_stock || i.is_out_of_stock || i.is_expiring_soon || i.is_expired);
  }, [inventory]);

  // Inventory Health Status Data for Donut Chart
  const healthyCount = inventory.length - attentionNeededItems.length;
  const inventoryStatusChartData = useMemo(() => {
    const list = [
      { name: 'Healthy / In Stock', value: Math.max(0, healthyCount), color: '#10b981' },
      { name: 'Low Stock', value: lowStockItems.length, color: '#f59e0b' },
      { name: 'Out of Stock', value: outOfStockItems.length, color: '#ef4444' },
      { name: 'Expiring Soon', value: expiringSoonItems.length, color: '#f97316' },
      { name: 'Expired', value: expiredItems.length, color: '#dc2626' },
    ];
    return list.filter(item => item.value > 0);
  }, [healthyCount, lowStockItems, outOfStockItems, expiringSoonItems, expiredItems]);

  // Stock Units by Category Data for Bar Chart
  const categoryChartData = useMemo(() => {
    const map = {};
    inventory.forEach(item => {
      const cat = item.category?.trim() || (item.item_type === 'Vaccine' ? 'Other Vaccine' : 'Other Medication');
      if (!map[cat]) {
        map[cat] = {
          name: cat,
          units: 0,
          items: 0,
          itemType: item.item_type,
        };
      }
      map[cat].units += Number(item.quantity) || 0;
      map[cat].items += 1;
    });
    return Object.values(map).sort((a, b) => b.units - a.units);
  }, [inventory]);

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-10">
        <div>
          <button
            onClick={() => navigate(createPageUrl('ClinicAdminDashboard'))}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500 mt-1">Clinical operations and medical supplies performance overview</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: CLINICAL OPERATIONS METRICS & CHARTS          */}
        {/* ========================================================= */}
        <section className="space-y-6">
          <div className="border-b border-gray-200 pb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-600" />
              Clinical Appointments & Patients
            </h2>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Pets', value: pets.length, icon: PawPrint, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'This Week', value: last7.reduce((s, d) => s + d.Completed + d.Active + d.Cancelled + d.Expired, 0), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map(m => (
              <Card key={m.label} className="border-0 shadow-sm p-5">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{m.label}</p>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Appointments Last 7 Days */}
            <Card className="border-0 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Appointments — Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={last7}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Active" stackId="a" fill={STATUS_COLORS.Active} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Completed" stackId="a" fill={STATUS_COLORS.Completed} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Cancelled" stackId="a" fill={STATUS_COLORS.Cancelled} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Expired" stackId="a" fill={STATUS_COLORS.Expired} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Appointments by Type */}
            <Card className="border-0 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Appointments by Type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Species Breakdown */}
          <Card className="border-0 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Pet Species Breakdown</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={speciesData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                <Tooltip />
                <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: INVENTORY & CLINICAL SUPPLIES REPORTS         */}
        {/* ========================================================= */}
        <section className="space-y-6 pt-2">
          <div className="border-b border-gray-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                Inventory & Medical Supplies Reports
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Live stock monitoring, categories breakdown, and supplies valuation</p>
            </div>
            <span className="text-xs text-gray-500 font-medium self-start sm:self-auto">
              Total {inventory.length} supply items cataloged
            </span>
          </div>

          {/* Inventory Overview Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalStockUnits.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-0.5">Total Units in Stock</p>
              <p className="text-xs text-gray-400 mt-1">Across {inventory.length} distinct supplies</p>
            </Card>

            <Card className="border-0 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₱{totalInventoryValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">Total Supplies Valuation</p>
              <p className="text-xs text-gray-400 mt-1">Estimated asset stock value</p>
            </Card>

            <Card className="border-0 shadow-sm p-5">
              <div className={`w-10 h-10 rounded-xl ${lowStockItems.length + outOfStockItems.length > 0 ? 'bg-amber-50' : 'bg-green-50'} flex items-center justify-center mb-3`}>
                <AlertTriangle className={`w-5 h-5 ${lowStockItems.length + outOfStockItems.length > 0 ? 'text-amber-600' : 'text-green-600'}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems.length + outOfStockItems.length}</p>
              <p className="text-sm text-gray-500 mt-0.5">Low / Depleted Stock</p>
              <p className="text-xs text-gray-400 mt-1">
                {outOfStockItems.length > 0 ? `${outOfStockItems.length} out of stock` : 'No depleted items'}
              </p>
            </Card>

            <Card className="border-0 shadow-sm p-5">
              <div className={`w-10 h-10 rounded-xl ${expiredItems.length + expiringSoonItems.length > 0 ? 'bg-rose-50' : 'bg-blue-50'} flex items-center justify-center mb-3`}>
                <Clock className={`w-5 h-5 ${expiredItems.length + expiringSoonItems.length > 0 ? 'text-rose-600' : 'text-blue-600'}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{expiredItems.length + expiringSoonItems.length}</p>
              <p className="text-sm text-gray-500 mt-0.5">Expiring / Expired</p>
              <p className="text-xs text-gray-400 mt-1">
                {expiringSoonItems.length} within 30 days{expiredItems.length > 0 ? `, ${expiredItems.length} expired` : ''}
              </p>
            </Card>
          </div>

          {/* Inventory Graphs */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Graph 1: Stock Health & Status Breakdown */}
            <Card className="border-0 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Stock Health & Status</h3>
                  <span className="text-xs text-gray-500">{inventory.length} items evaluated</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Distribution by stock level thresholds and expiration conditions</p>
              </div>

              {inventoryStatusChartData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-gray-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                  No inventory data available
                </div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={inventoryStatusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${value}`}
                        fontSize={11}
                      >
                        {inventoryStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val} items`, name]}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Graph 2: Stock Units by Category */}
            <Card className="border-0 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Stock Units by Clinical Category</h3>
                  <span className="text-xs text-gray-500">{categoryChartData.length} categories</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Total quantities available across vaccine and medication types</p>
              </div>

              {categoryChartData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-gray-400 text-sm">
                  <Package className="w-8 h-8 text-gray-300 mb-2" />
                  No categorized items found
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={categoryChartData.slice(0, 7)} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(val, name, props) => [`${val} units (${props.payload.items} items)`, 'Stock Level']}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey="units"
                      fill="#0d9488"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </section>
      </div>
    </AdminSidebar>
  );
}
