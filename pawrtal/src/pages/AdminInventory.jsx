import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Package,
  Syringe,
  Pill,
  AlertTriangle,
  AlertCircle,
  Plus,
  Search,
  ChevronLeft,
  ChevronDown,
  Edit2,
  Trash2,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  X,
  Layers,
  Calendar,
  Building,
  Hash,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

// Common unit options for veterinary inventory
const UNIT_OPTIONS = [
  'vials',
  'doses',
  'tablets',
  'capsules',
  'bottles',
  'chewables',
  'tubes',
  'boxes',
  'units',
];

// Specific categories requested
export const VACCINE_CATEGORIES = [
  'Core Vaccine',
  'Non-Core Vaccine',
  'Rabies',
  'Canine Multivalent',
  'Feline Multivalent',
  'Other Vaccine',
];

export const MEDICATION_CATEGORIES = [
  'Antibiotic',
  'NSAID / Pain Relief',
  'Antiparasitic',
  'Corticosteroid',
  'Sedative / Anxiety',
  'Antihistamine',
  'Ophthalmic / Ear',
  'Nutritional / Supplement',
  'Other Medication',
];

export default function AdminInventory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status') || 'all';

  // Filters & State
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'Vaccine' | 'Medication'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlStatus); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired'
  const [sortBy, setSortBy] = useState('name'); // 'name' | '-name' | 'quantity' | '-quantity' | 'expiry' | '-created_date'

  React.useEffect(() => {
    const s = searchParams.get('status');
    if (s) {
      setStatusFilter(s);
    }
  }, [searchParams]);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustMode, setAdjustMode] = useState('add'); // 'add' | 'subtract' | 'set'
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [adjustReason, setAdjustReason] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    item_type: 'Vaccine',
    name: '',
    category: '',
    sku: '',
    batch_number: '',
    quantity: 10,
    unit: 'vials',
    min_stock_level: 5,
    unit_price: '',
    expiration_date: '',
    manufacturer: '',
    storage_location: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Queries
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory', activeTab, searchTerm, statusFilter, sortBy],
    queryFn: () =>
      api.entities.InventoryItem.filter({
        type: activeTab === 'all' ? undefined : activeTab,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        order: sortBy,
      }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.entities.InventoryItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Supply item added successfully!');
      setIsAddEditOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.InventoryItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Supply item updated successfully!');
      setIsAddEditOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update item');
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, mode, amount, reason }) =>
      api.entities.InventoryItem.adjustStock(id, { mode, amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock adjusted successfully!');
      setIsAdjustOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to adjust stock');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.InventoryItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Supply item removed.');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to remove item');
    },
  });

  // Metrics computation
  const metrics = useMemo(() => {
    const total = inventory.length;
    const vaccinesCount = inventory.filter((i) => i.item_type === 'Vaccine').length;
    const medicationsCount = inventory.filter((i) => i.item_type === 'Medication').length;
    const lowStockCount = inventory.filter((i) => i.is_low_stock || i.is_out_of_stock).length;
    const expiryAlertsCount = inventory.filter((i) => i.is_expiring_soon || i.is_expired).length;

    return {
      total,
      vaccinesCount,
      medicationsCount,
      lowStockCount,
      expiryAlertsCount,
    };
  }, [inventory]);

  function resetForm() {
    const defaultType = activeTab === 'Medication' ? 'Medication' : 'Vaccine';
    setEditingItem(null);
    setErrors({});
    setFormData({
      item_type: defaultType,
      name: '',
      category: defaultType === 'Medication' ? MEDICATION_CATEGORIES[0] : VACCINE_CATEGORIES[0],
      sku: '',
      batch_number: '',
      quantity: 10,
      unit: defaultType === 'Medication' ? 'tablets' : 'vials',
      min_stock_level: 5,
      unit_price: '',
      expiration_date: '',
      manufacturer: '',
      notes: '',
    });
  }

  function openAddModal() {
    resetForm();
    setErrors({});
    setIsAddEditOpen(true);
  }

  function openEditModal(item) {
    const itemType = item.item_type || 'Vaccine';
    const fallbackCategory = itemType === 'Medication' ? MEDICATION_CATEGORIES[0] : VACCINE_CATEGORIES[0];
    setEditingItem(item);
    setErrors({});
    setFormData({
      item_type: itemType,
      name: item.name || '',
      category: item.category || fallbackCategory,
      sku: item.sku || '',
      batch_number: item.batch_number || '',
      quantity: item.quantity ?? 0,
      unit: item.unit || 'units',
      min_stock_level: item.min_stock_level ?? 5,
      unit_price: item.unit_price != null ? String(item.unit_price) : '',
      expiration_date: item.expiration_date || '',
      manufacturer: item.manufacturer || '',
      notes: item.notes || '',
    });
    setIsAddEditOpen(true);
  }

  function openAdjustModal(item) {
    setAdjustItem(item);
    setAdjustMode('add');
    setAdjustAmount(5);
    setAdjustReason('');
    setIsAdjustOpen(true);
  }

  function handleSave(e) {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.expiration_date) newErrors.expiration_date = true;
    if (formData.unit_price === '' || formData.unit_price === undefined || formData.unit_price === null || isNaN(parseFloat(formData.unit_price)) || parseFloat(formData.unit_price) < 0) {
      newErrors.unit_price = true;
    }
    if (formData.quantity === '' || formData.quantity === undefined || isNaN(parseInt(formData.quantity, 10)) || parseInt(formData.quantity, 10) < 0) {
      newErrors.quantity = true;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const payload = {
      item_type: formData.item_type,
      name: formData.name.trim(),
      category: formData.category ? formData.category.trim() : undefined,
      sku: formData.sku.trim() || undefined,
      batch_number: formData.batch_number.trim() || undefined,
      quantity: parseInt(formData.quantity, 10) || 0,
      unit: formData.unit.trim() || 'units',
      min_stock_level: parseInt(formData.min_stock_level, 10) || 0,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
      expiration_date: formData.expiration_date || undefined,
      manufacturer: formData.manufacturer.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleStockAdjust(e) {
    e.preventDefault();
    if (!adjustItem) return;
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    adjustMutation.mutate({
      id: adjustItem.id,
      mode: adjustMode,
      amount,
      reason: adjustReason.trim() || undefined,
    });
  }

  // Stock status pill helper
  function renderStockBadge(item) {
    if (item.is_out_of_stock) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 gap-1 font-medium">
          <AlertCircle className="w-3 h-3 text-red-600" /> Out of Stock
        </Badge>
      );
    }
    if (item.is_low_stock) {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1 font-medium animate-pulse">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock ({item.quantity} left)
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 gap-1 font-medium">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Stock
      </Badge>
    );
  }

  // Expiry badge helper
  function renderExpiryBadge(item) {
    if (!item.expiration_date) {
      return <span className="text-gray-400 text-xs">—</span>;
    }
    if (item.is_expired) {
      return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
          <AlertCircle className="w-3 h-3 shrink-0" />
          Expired: {item.expiration_date}
        </div>
      );
    }
    if (item.is_expiring_soon) {
      return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
          <Clock className="w-3 h-3 shrink-0" />
          Expiring: {item.expiration_date}
        </div>
      );
    }
    return (
      <span className="text-xs text-gray-600 flex items-center gap-1">
        <Calendar className="w-3 h-3 text-gray-400" />
        {item.expiration_date}
      </span>
    );
  }

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Back navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/clinic-admin-dashboard')}
              className="inline-flex items-center gap-1 text-sm text-violet-700 hover:text-violet-900 font-medium transition-colors mb-1 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 shadow-sm">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clinical Supplies & Inventory</h1>
                <p className="text-sm text-gray-500">
                  Manage vaccines, medications, reorder thresholds, and expiration lots.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={openAddModal}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-sm rounded-xl px-4 py-2.5 h-auto transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Supply Item
          </Button>
        </div>

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-violet-100 shadow-sm bg-gradient-to-br from-white to-violet-50/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Items</p>
                <p className="text-2xl font-extrabold text-violet-950 mt-0.5">{metrics.total}</p>
                <p className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Catalog size
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-teal-100 shadow-sm bg-gradient-to-br from-white to-teal-50/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vaccines</p>
                <p className="text-2xl font-extrabold text-teal-950 mt-0.5">{metrics.vaccinesCount}</p>
                <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                  <Syringe className="w-3 h-3" /> Active lines
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Syringe className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-indigo-100 shadow-sm bg-gradient-to-br from-white to-indigo-50/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medications</p>
                <p className="text-2xl font-extrabold text-indigo-950 mt-0.5">{metrics.medicationsCount}</p>
                <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                  <Pill className="w-3 h-3" /> Active lines
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Pill className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border shadow-sm ${
              metrics.lowStockCount > 0
                ? 'border-amber-200 bg-gradient-to-br from-white to-amber-50/60'
                : 'border-gray-200 bg-white'
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reorder Alerts
                </p>
                <p
                  className={`text-2xl font-extrabold mt-0.5 ${
                    metrics.lowStockCount > 0 ? 'text-amber-800' : 'text-gray-800'
                  }`}
                >
                  {metrics.lowStockCount}
                </p>
                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Below threshold
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  metrics.lowStockCount > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab & Filter Controls */}
        <Card className="border border-gray-200/80 shadow-sm bg-white overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl border border-gray-200/60 self-start">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-violet-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-violet-600" />
                All Supplies
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('Vaccine')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'Vaccine'
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Syringe className="w-3.5 h-3.5 text-teal-600" />
                Vaccines
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('Medication')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'Medication'
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-indigo-600" />
                Medications
              </button>
            </div>

            {/* Quick Actions / Results Count */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Showing <strong>{inventory.length}</strong> items</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50/50">
            {/* Search */}
            <div className="sm:col-span-8 md:col-span-8 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by name, SKU, lot #, manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white border-gray-200 rounded-xl text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-4 md:col-span-4">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none cursor-pointer"
                >
                  <option value="all">Stock: All Statuses</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock Alert</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="expiring_soon">Expiring Soon (&le;30d)</option>
                  <option value="expired">Expired</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table / List View */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading inventory catalog...
              </div>
            ) : inventory.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">No inventory items found</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No supplies match your active filter criteria. Try clearing filters.'
                    : 'Get started by adding your first vaccine or medication supply to the clinic inventory.'}
                </p>
                <Button
                  onClick={openAddModal}
                  variant="outline"
                  className="mt-4 gap-2 text-violet-700 border-violet-200 hover:bg-violet-50 rounded-xl"
                >
                  <Plus className="w-4 h-4" /> Add Item Now
                </Button>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 text-gray-600 font-semibold border-y border-gray-200/80">
                  <tr>
                    <th className="py-3 px-4">Supply Item</th>
                    <th className="py-3 px-4">Category & SKU</th>
                    <th className="py-3 px-4">Stock Level</th>
                    <th className="py-3 px-4">Lot & Expiry</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventory.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-violet-50/30 transition-colors ${
                        item.is_out_of_stock
                          ? 'bg-red-50/20'
                          : item.is_low_stock
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      {/* Name & Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              item.item_type === 'Vaccine'
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {item.item_type === 'Vaccine' ? (
                              <Syringe className="w-4 h-4" />
                            ) : (
                              <Pill className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{item.name}</span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  item.item_type === 'Vaccine'
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {item.item_type}
                              </span>
                            </div>
                            {item.manufacturer && (
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <Building className="w-3 h-3 text-gray-400" />
                                {item.manufacturer}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & SKU */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-medium text-gray-800">{item.category || 'General'}</p>
                          {item.sku ? (
                            <p className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
                              <Hash className="w-3 h-3 text-gray-300" />
                              {item.sku}
                            </p>
                          ) : (
                            <p className="text-gray-400 italic">No SKU</p>
                          )}
                        </div>
                      </td>

                      {/* Stock Level & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`text-base font-extrabold font-mono ${
                                item.is_out_of_stock
                                  ? 'text-red-600'
                                  : item.is_low_stock
                                  ? 'text-amber-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {item.quantity}
                            </span>
                            <span className="text-xs text-gray-500">{item.unit || 'units'}</span>
                            <span className="text-xs text-gray-400">
                              (min: {item.min_stock_level})
                            </span>
                          </div>
                          <div>{renderStockBadge(item)}</div>
                        </div>
                      </td>

                      {/* Lot & Expiry */}
                      <td className="py-3.5 px-4 space-y-1">
                        {item.batch_number && (
                          <div className="text-xs font-mono text-gray-600 flex items-center gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1 py-0.5 rounded">
                              LOT
                            </span>
                            {item.batch_number}
                          </div>
                        )}
                        <div>{renderExpiryBadge(item)}</div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-800">
                        {item.unit_price != null ? (
                          <span className="font-semibold text-gray-900">
                            ₱{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Stock adjustment button */}
                          <button
                            type="button"
                            onClick={() => openAdjustModal(item)}
                            title="Quick Stock Adjust"
                            className="p-1.5 rounded-lg text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors border border-violet-200"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit Item Details"
                            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Remove Supply"
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* ─── ADD / EDIT MODAL ──────────────────────────────────────────────────────── */}
      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Package className="w-5 h-5 text-violet-600" />
              {editingItem ? 'Edit Supply Item' : 'Add New Supply Item'}
            </DialogTitle>
            <DialogDescription>
              Enter supply specifications, storage details, lot numbering, and stock threshold alerts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} noValidate className="space-y-4 pt-2">
            {/* Supply Type Toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Supply Classification *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((p) => {
                      const isNewType = p.item_type !== 'Vaccine';
                      const newCategory = isNewType || !VACCINE_CATEGORIES.includes(p.category) ? VACCINE_CATEGORIES[0] : p.category;
                      return { ...p, item_type: 'Vaccine', category: newCategory, unit: p.unit || 'vials' };
                    });
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                    formData.item_type === 'Vaccine'
                      ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-400/40'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Syringe className="w-4 h-4 text-teal-600" />
                  Vaccine
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((p) => {
                      const isNewType = p.item_type !== 'Medication';
                      const newCategory = isNewType || !MEDICATION_CATEGORIES.includes(p.category) ? MEDICATION_CATEGORIES[0] : p.category;
                      return { ...p, item_type: 'Medication', category: newCategory, unit: p.unit || 'tablets' };
                    });
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                    formData.item_type === 'Medication'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-400/40'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Pill className="w-4 h-4 text-indigo-600" />
                  Medication
                </button>
              </div>
            </div>

            {/* Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Product / Supply Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="e.g. Rabies Vaccine (Defensor 3)"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, name: e.target.value }));
                      setErrors((p) => ({ ...p, name: false }));
                    }}
                    className={cn("rounded-xl", errors.name ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-10" : "")}
                  />
                  {errors.name && (
                    <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">Please enter a product name.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none cursor-pointer"
                  >
                    {(formData.item_type === 'Vaccine' ? VACCINE_CATEGORIES : MEDICATION_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    {formData.category &&
                      !(formData.item_type === 'Vaccine' ? VACCINE_CATEGORIES : MEDICATION_CATEGORIES).includes(formData.category) && (
                        <option value={formData.category}>{formData.category} (Custom)</option>
                      )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quantity, Unit & Min Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Current Stock Count <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, quantity: e.target.value }));
                      setErrors((p) => ({ ...p, quantity: false }));
                    }}
                    className={cn("rounded-xl font-mono", errors.quantity ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-10" : "")}
                  />
                  {errors.quantity && (
                    <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {errors.quantity && (
                  <p className="text-xs text-red-600 mt-1">Please enter a valid stock count.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Packaging Unit
                </label>
                <div className="relative">
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData((p) => ({ ...p, unit: e.target.value }))}
                    className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none cursor-pointer"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Min Stock Alert Threshold
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData((p) => ({ ...p, min_stock_level: e.target.value }))}
                  className="rounded-xl font-mono"
                />
              </div>
            </div>

            {/* SKU, Lot / Batch Number & Unit Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  SKU / Barcode ID
                </label>
                <Input
                  placeholder="e.g. VAC-RAB-001"
                  value={formData.sku}
                  onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Batch / Lot Number
                </label>
                <Input
                  placeholder="e.g. RB-2026-09A"
                  value={formData.batch_number}
                  onChange={(e) => setFormData((p) => ({ ...p, batch_number: e.target.value }))}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Unit Price (₱) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.unit_price}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, unit_price: e.target.value }));
                      setErrors((p) => ({ ...p, unit_price: false }));
                    }}
                    className={cn("rounded-xl font-mono", errors.unit_price ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-10" : "")}
                  />
                  {errors.unit_price && (
                    <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {errors.unit_price && (
                  <p className="text-xs text-red-600 mt-1">Please enter a unit price.</p>
                )}
              </div>
            </div>

            {/* Expiration Date & Manufacturer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Expiration Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, expiration_date: e.target.value }));
                      setErrors((p) => ({ ...p, expiration_date: false }));
                    }}
                    className={cn("rounded-xl text-xs", errors.expiration_date ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-16" : "")}
                  />
                  {errors.expiration_date && (
                    <AlertTriangle className="w-5 h-5 text-red-500 absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {errors.expiration_date && (
                  <p className="text-xs text-red-600 mt-1">Please select an expiration date.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Manufacturer
                </label>
                <Input
                  placeholder="e.g. Zoetis, Boehringer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData((p) => ({ ...p, manufacturer: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Notes & Clinical Instructions */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Clinical Notes / Handling Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Storage temperature conditions, reconstitution directions, prescription warnings..."
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  'Saving...'
                ) : editingItem ? (
                  'Update Supply Item'
                ) : (
                  'Add Supply Item'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddEditOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── QUICK STOCK ADJUSTMENT MODAL ────────────────────────────────────────── */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <ArrowUpDown className="w-5 h-5 text-violet-600" />
              Adjust Stock: {adjustItem?.name}
            </DialogTitle>
            <DialogDescription>
              Current stock:{' '}
              <strong className="text-gray-900">
                {adjustItem?.quantity} {adjustItem?.unit}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStockAdjust} className="space-y-4 pt-2">
            {/* Mode selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Adjustment Action
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustMode('add')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    adjustMode === 'add'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/40 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 text-emerald-600 mb-1" />
                  + Receive Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('subtract')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    adjustMode === 'subtract'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-400/40 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <TrendingDown className="w-5 h-5 text-rose-600 mb-1" />
                  - Dispense / Use
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                {adjustMode === 'add' ? 'Quantity to Receive (+)' : 'Quantity to Dispense (-)'}{' '}
                ({adjustItem?.unit || 'units'}) *
              </label>
              <Input
                type="number"
                min="0"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="rounded-xl font-mono text-base"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Reason / Note (Optional)
              </label>
              <Input
                placeholder="e.g. New supplier shipment, physical audit count..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={adjustMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
              >
                {adjustMutation.isPending ? 'Adjusting...' : 'Confirm Stock Adjustment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdjustOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION DIALOG ────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              Remove Supply Item?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from clinical
              inventory? This action can be soft-deleted and records can be restored by system
              administrators if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              Remove Item
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSidebar>
  );
}
