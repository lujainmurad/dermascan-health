import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Settings from "./pages/Settings";
import PatientDashboard from "./pages/patient/Dashboard";
import PatientAnalyze from "./pages/patient/Analyze";
import FindSpecialist from "./pages/patient/FindSpecialist";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientAppointments from "./pages/patient/Appointments";
import ClinicianDashboard from "./pages/clinician/Dashboard";
import ClinicianAnalyze from "./pages/clinician/Analyze";
import PatientCases from "./pages/clinician/PatientCases";
import CaseDetail from "./pages/clinician/CaseDetail";
import ClinicianAppointments from "./pages/clinician/Appointments";
import PatientHistory from "./pages/clinician/PatientHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Patient Routes */}
            <Route path="/patient/dashboard" element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} />
            <Route path="/patient/analyze" element={<ProtectedRoute requiredRole="patient"><PatientAnalyze /></ProtectedRoute>} />
            <Route path="/patient/find-specialist" element={<ProtectedRoute requiredRole="patient"><FindSpecialist /></ProtectedRoute>} />
            <Route path="/patient/book-appointment" element={<ProtectedRoute requiredRole="patient"><BookAppointment /></ProtectedRoute>} />
            <Route path="/patient/appointments" element={<ProtectedRoute requiredRole="patient"><PatientAppointments /></ProtectedRoute>} />

            {/* Clinician Routes */}
            <Route path="/clinician/dashboard" element={<ProtectedRoute requiredRole="clinician"><ClinicianDashboard /></ProtectedRoute>} />
            <Route path="/clinician/analyze" element={<ProtectedRoute requiredRole="clinician"><ClinicianAnalyze /></ProtectedRoute>} />
            <Route path="/clinician/cases" element={<ProtectedRoute requiredRole="clinician"><PatientCases /></ProtectedRoute>} />
            <Route path="/clinician/cases/:id" element={<ProtectedRoute requiredRole="clinician"><CaseDetail /></ProtectedRoute>} />
            <Route path="/clinician/appointments" element={<ProtectedRoute requiredRole="clinician"><ClinicianAppointments /></ProtectedRoute>} />
            <Route path="/clinician/patient/:patientId" element={<ProtectedRoute requiredRole="clinician"><PatientHistory /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
