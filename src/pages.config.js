import AddPet from './pages/AddPet';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import EditPet from './pages/EditPet';
import HealthRecords from './pages/HealthRecords';
import Journal from './pages/Journal';
import MyPets from './pages/MyPets';
import Onboarding from './pages/Onboarding';
import Patients from './pages/Patients';
import PetProfile from './pages/PetProfile';
import PetQR from './pages/PetQR';
import PublicPetProfile from './pages/PublicPetProfile';
import Settings from './pages/Settings';
import SignIn from './pages/SignIn';
import VetAddRecord from './pages/VetAddRecord';
import VetAppointments from './pages/VetAppointments';
import VetDashboard from './pages/VetDashboard';
import VetPatientDetail from './pages/VetPatientDetail';
import VetRecords from './pages/VetRecords';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';


export const PAGES = {
    "AddPet": AddPet,
    "Appointments": Appointments,
    "BookAppointment": BookAppointment,
    "EditPet": EditPet,
    "HealthRecords": HealthRecords,
    "Journal": Journal,
    "MyPets": MyPets,
    "Onboarding": Onboarding,
    "Patients": Patients,
    "PetProfile": PetProfile,
    "PetQR": PetQR,
    "PublicPetProfile": PublicPetProfile,
    "Settings": Settings,
    "SignIn": SignIn,
    "VetAddRecord": VetAddRecord,
    "VetAppointments": VetAppointments,
    "VetDashboard": VetDashboard,
    "VetPatientDetail": VetPatientDetail,
    "VetRecords": VetRecords,
    "Dashboard": Dashboard,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
};