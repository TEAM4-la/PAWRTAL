import React from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Calendar, PawPrint, CheckCircle } from 'lucide-react';
import { format, subDays } from 'date-fns';

const COLORS = ['#7c3aed', '#0d9488', '#f59e0b', '#3b82f6', '#ec4899', '#6b7280'];

export default function AdminReports() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: appointments = [] } = useQuery({ queryKey: ['allAppts'], queryFn: () => api.entities.Appointment.list('-date', 300) });
  const { data: pets = [] } = useQuery({ queryKey: ['allPets'], queryFn: () => api.entities.Pet.list() });

  // Appointments by type
  const byType = appointments.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(byType).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  // Appointments last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      date: format(date, 'MMM d'),
      count: appointments.filter(a => a.date === dateStr).length,
    };
  });

  // Species breakdown
  const bySpecies = pets.reduce((acc, p) => {
    acc[p.species] = (acc[p.species] || 0) + 1;
    return acc;
  }, {});
  const speciesData = Object.entries(bySpecies).map(([name, value]) => ({ name, value }));

  const completionRate = appointments.length
    ? Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100)
    : 0;

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Clinic performance overview</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Total Pets', value: pets.length, icon: PawPrint, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'This Week', value: last7.reduce((s, d) => s + d.count, 0), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
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

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Appointments Last 7 Days */}
          <Card className="border-0 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Appointments — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last7}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Appointments by Type */}
          <Card className="border-0 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Appointments by Type</h2>
            <ResponsiveContainer width="100%" height={200}>
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
          <h2 className="font-semibold text-gray-900 mb-4">Pet Species Breakdown</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={speciesData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </AdminSidebar>
  );
}