import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import SignIn from './pages/SignIn';

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
      

      
      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}