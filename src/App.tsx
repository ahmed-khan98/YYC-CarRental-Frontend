import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CarsPage from "./pages/cars/page.tsx";
import CarDetailPage from "./pages/cars/[id]/page.tsx";
import BookPage from "./pages/book/[id]/page.tsx";
import DashboardPage from "./pages/dashboard/page.tsx";
import ProfilePage from "./pages/profile/page.tsx";
import AboutPage from "./pages/about/page.tsx";
import PrivacyPage from "./pages/privacy/page.tsx";
import TermsPage from "./pages/terms/page.tsx";
import FAQPage from "./pages/faq/page.tsx";
import AdminLayout from "./pages/admin/layout.tsx";
import AdminOverview from "./pages/admin/page.tsx";
import AdminCarsPage from "./pages/admin/cars/page.tsx";
import AdminBookingsPage from "./pages/admin/bookings/page.tsx";
import AdminCheckInOutPage from "./pages/admin/checkinout/page.tsx";
import AdminCustomersPage from "./pages/admin/customers/page.tsx";
import AdminLocationsPage from "./pages/admin/locations/page.tsx";
import AdminServicesPage from "./pages/admin/services/page.tsx";
import AdminMaintenancePage from "./pages/admin/maintenance/page.tsx";
import AdminBookingDetailPage from "./pages/admin/bookings/[id]/page.tsx";
import BookingDetailPage from "./pages/bookings/[id]/page.tsx";

export default function App() {
  return (
    <DefaultProviders defaultTheme="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cars" element={<CarsPage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />
          <Route path="/book/:id" element={<BookPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/faq" element={<FAQPage />} />

          {/* Admin routes with sidebar layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="cars" element={<AdminCarsPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
            <Route path="checkinout" element={<AdminCheckInOutPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="locations" element={<AdminLocationsPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="maintenance" element={<AdminMaintenancePage />} />
          </Route>

          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
