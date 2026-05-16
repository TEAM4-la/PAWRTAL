import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import SignIn from './pages/SignIn';
import CreateAccount from './pages/CreateAccount';
import StaffCreateAccount from './pages/StaffCreateAccount';
import Dashboard from './pages/Dashboard';
import MyPets from './pages/MyPets';
import HealthRecords from './pages/HealthRecords';
import Medications from './pages/Medications';
import Journal from './pages/Journal';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';
import PetProfile from './pages/PetProfile';
import PetQR from './pages/PetQR';
import PublicPetProfile from './pages/PublicPetProfile';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import VetDashboard from './pages/VetDashboard';
import VetAppointments from './pages/VetAppointments';
import Patients from './pages/Patients';
import VetRecords from './pages/VetRecords';
import VetAddRecord from './pages/VetAddRecord';
import VetPatientDetail from './pages/VetPatientDetail';
import ClinicAdminDashboard from './pages/ClinicAdminDashboard';
import AdminAppointments from './pages/AdminAppointments';
import AdminStaff from './pages/AdminStaff';
import AdminPatients from './pages/AdminPatients';
import AdminReports from './pages/AdminReports';
import Messages from './pages/Messages';

// Optional: 404 page (you can create this later)
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/create-account" element={<CreateAccount />} />
      <Route path="/staff/create-account" element={<StaffCreateAccount />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/my-pets" element={<MyPets />} />
      <Route path="/add-pet" element={<AddPet />} />
      <Route path="/edit-pet" element={<EditPet />} />
      <Route path="/pet-profile" element={<PetProfile />} />
      <Route path="/pet-qr" element={<PetQR />} />
      <Route path="/public-pet-profile" element={<PublicPetProfile />} />
      <Route path="/health-records" element={<HealthRecords />} />
      <Route path="/medications" element={<Medications />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/book-appointment" element={<BookAppointment />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/messages" element={<Messages />} />
      {/* Owner dashboards */}
      <Route path="/petowner-dashboard" element={<Dashboard />} />
      {/* Vet routes */}
      <Route path="/vet-dashboard" element={<VetDashboard />} />
      <Route path="/vet-appointments" element={<VetAppointments />} />
      <Route path="/patients" element={<Patients />} />
      <Route path="/vet-records" element={<VetRecords />} />
      <Route path="/vet-add-record" element={<VetAddRecord />} />
      <Route path="/vet-patient-detail" element={<VetPatientDetail />} />
      {/* Clinic Admin routes */}
      <Route path="/clinic-admin-dashboard" element={<ClinicAdminDashboard />} />
      <Route path="/admin-appointments" element={<AdminAppointments />} />
      <Route path="/admin-staff" element={<AdminStaff />} />
      <Route path="/admin-patients" element={<AdminPatients />} />
      <Route path="/admin-reports" element={<AdminReports />} />
      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}