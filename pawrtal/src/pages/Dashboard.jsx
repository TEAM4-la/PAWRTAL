import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/shared/StatsCard";
import PetCard from "@/components/shared/PetCard";
import AppointmentCard from "@/components/shared/AppointmentCard";
import EmptyState from "@/components/shared/EmptyState";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import { 
  PawPrint, 
  Calendar, 
  Syringe, 
  Pill, 
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['pets', user?.email],
    queryFn: () => base44.entities.Pet.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', user?.email],
    queryFn: () => base44.entities.Appointment.filter({ owner_email: user?.email }, '-date', 10),
    enabled: !!user?.email,
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', pets],
    queryFn: async () => {
      const allVaccinations = await Promise.all(
        pets.map(pet => base44.entities.Vaccination.filter({ pet_id: pet.id }))
      );
      return allVaccinations.flat();
    },
    enabled: pets.length > 0,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', pets],
    queryFn: async () => {
      const allMeds = await Promise.all(
        pets.map(pet => base44.entities.Medication.filter({ pet_id: pet.id, is_active: true }))
      );
      return allMeds.flat();
    },
    enabled: pets.length > 0,
  });

  useEffect(() => {
    if (!userLoading && user && !user.user_type) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [user, userLoading, navigate]);

  if (userLoading || petsLoading) {
    return (
      <OwnerSidebar user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerSidebar>
    );
  }

  const upcomingAppointments = appointments.filter(
    apt => apt.status !== 'cancelled' && apt.status !== 'completed' && isAfter(new Date(apt.date), new Date())
  ).slice(0, 3);

  const upcomingVaccinations = vaccinations.filter(
    vax => vax.next_due_date && isBefore(new Date(vax.next_due_date), addDays(new Date(), 30))
  );

  return (
    <OwnerSidebar user={user}>
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Pet Parent'}! 
            <span className="ml-2">👋</span>
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your pets today</p>
        </div>
        <NotificationPanel userEmail={user?.email} accentColor="amber" />
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Pets"
          value={pets.length}
          icon={PawPrint}
          color="teal"
        />
        <StatsCard
          title="Upcoming Appointments"
          value={upcomingAppointments.length}
          icon={Calendar}
          color="orange"
        />
        <StatsCard
          title="Due Vaccinations"
          value={upcomingVaccinations.length}
          icon={Syringe}
          color="blue"
        />
        <StatsCard
          title="Active Medications"
          value={medications.length}
          icon={Pill}
          color="purple"
        />
      </div>

      {/* Alerts Section */}
      {(upcomingVaccinations.length > 0 || medications.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {upcomingVaccinations.length > 0 && (
            <Card className="border-l-4 border-l-purple-500 bg-purple-50/50 border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Syringe className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Vaccinations Due Soon</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {upcomingVaccinations.length} vaccination(s) due in the next 30 days
                    </p>
                    <Link to={createPageUrl('HealthRecords')}>
                      <Button variant="link" className="p-0 h-auto text-purple-600 mt-2">
                        View details <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {medications.length > 0 && (
            <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 border-orange-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Pill className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Active Medications</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {medications.length} active medication(s) to track
                    </p>
                    <Link to={createPageUrl('HealthRecords')}>
                      <Button variant="link" className="p-0 h-auto text-orange-600 mt-2">
                        View all <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pets Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Pets</h2>
            <Link to={createPageUrl('MyPets')}>
              <Button variant="ghost" className="text-amber-700 gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {pets.length === 0 ? (
            <Card className="border-dashed border-2">
              <EmptyState
                icon={PawPrint}
                title="No pets yet"
                description="Add your first pet to start tracking their health journey"
                actionLabel="Add Your First Pet"
                onAction={() => navigate(createPageUrl('AddPet'))}
              />
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {pets.slice(0, 4).map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}
        </div>

        {/* Appointments Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming</h2>
            <Link to={createPageUrl('Appointments')}>
              <Button variant="ghost" className="text-amber-700 gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <Card className="border-dashed border-2">
              <EmptyState
                icon={Calendar}
                title="No appointments"
                description="Book your next vet visit"
                actionLabel="Book Appointment"
                onAction={() => navigate(createPageUrl('BookAppointment'))}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => {
                const pet = pets.find(p => p.id === appointment.pet_id);
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-amber-700 to-amber-900 border-0 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Heart className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Need to schedule a visit?</h3>
                <p className="text-amber-200">Book an appointment with our veterinary team</p>
              </div>
            </div>
            <Link to={createPageUrl('BookAppointment')}>
              <Button className="bg-white text-amber-800 hover:bg-amber-50 gap-2">
                <Calendar className="w-5 h-5" />
                Book Now
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
    </OwnerSidebar>
  );
}