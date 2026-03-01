import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import SignIn from './pages/SignIn';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/sign-in" element={<SignIn />} />
      {/* Add more later: /dashboard, /vet-dashboard, etc. */}
    </Routes>
  );
}