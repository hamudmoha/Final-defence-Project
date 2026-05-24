import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { UserProvider, useUser } from "./context/UserContext";
import { SuccessPopup } from "./Component/Common/SuccessPopup.jsx";

/* ================= HOME COMPONENTS ================= */

import Navbar from "./Component/Home/Navbar";
import Footer from "./Component/Home/Footer";
import Home from "./Component/Home/Home";
import Hero from "./Component/Home/Hero";
import FeaturedCamps from "./Component/Home/FeaturedCamps";
import WhyChoose from "./Component/Home/WhyChoose";
import HowItWorks from "./Component/Home/HowItWorks";
import Testimonials from "./Component/Home/Testimonials";
import CTASection from "./Component/Home/CTASection";

/* ================= FEATURE PAGE ================= */

import PlatformFeatures from "./Component/Home/PlatformFeatures";
import Experience from "./Component/Home/Experience";
import BrowseCamps from "./Component/Home/BrowseCamps";

// Camps Page Components

// About Page Components
import About from "./Component/Home/About";
import CoreValues from "./Component/Home/CoreValues";
import { GrowingCommunity } from "./Component/Home/GrowingCommunity";

// Contact Page Components
import GetInTouch from "./Component/Home/Contact/GetIntouch";
import FormContact from "./Component/Home/Contact/FormContact2";

// Auth
import { Login } from "./Component/Auth/Login";
import SignUp from "./Component/Auth/SignUp";
import OTPVerification from "./Component/Auth/OTPVerification";
import { RequestPasswordReset } from "./Component/Auth/RequestPasswordReset";
import { ResetPassword } from "./Component/Auth/ResetPassword";
import ProtectedRoute from "./Component/Auth/ProtectedRoute";
import { BannedPage } from "./Component/Auth/BannedPage";

// Camp Admin Components
import { CampAdminLayout } from "./Component/CampAdmin/Sidebar/CampAdminLayout.jsx";
import { CampAdminDashboard } from "./Component/CampAdmin/Pages/AdminDashboard.jsx";
import { ReservationManagement } from "./Component/CampAdmin/Pages/ReservationManagement.jsx";

import { SystemSettings } from "./Component/CampAdmin/Pages/SystemSettings.jsx";
import { NotificationManagement } from "./Component/CampAdmin/Pages/NotificationManagement.jsx";
import { CampAdminUserManagement } from "./Component/CampAdmin/Pages/UserManagement.jsx";
import { TentManagement } from "./Component/CampAdmin/Pages/TentManagement.jsx";
import { AddTent } from "./Component/CampAdmin/Pages/AddTent.jsx";
import { PaymentMgmt } from "./Component/CampAdmin/Pages/PaymentMgmt.jsx";
import { ManagerSupport } from "./Component/CampAdmin/Pages/Support.jsx";
// CampAdminAnalyticsDashboard is missing, will use CampAdminDashboard for analytics

// Camper Dashboard Components
import { BookingCard } from "./Component/Camper/Bookings/BookingCard.jsx";

import { MyReservations } from "./Component/Camper/Bookings/MyReservations.jsx";
import { Booking } from "./Component/Camper/Bookings/Booking.jsx";
import { Payments } from "./Component/Camper/Bookings/Payments.jsx";
import { PaymentSuccess } from "./Component/Camper/Bookings/PaymentSuccess.jsx";

import { CampsiteDirectory } from "./Component/Camper/Bookings/CampsiteDirectory.jsx";
import { CamperDashboard } from "./Component/Camper/Main/CamperDashboard.jsx";
import { MyProfile } from "./Component/Camper/Main/MyProfile.jsx";
import { Notifications } from "./Component/Camper/UPDATES/Notifications.jsx";
import { AccountSetting } from "./Component/Camper/Activity/AccountSetting.jsx";
import { SettingsPage } from "./Component/Camper/Activity/SettingsPage.jsx";
import { SecurityPassword } from "./Component/Camper/Activity/SecurityPassword.jsx";
import { NotificationPreferences } from "./Component/Camper/UPDATES/NotificationPreferences.jsx";
import { ContactSupport } from "./Component/Camper/Support/ContactSupport.jsx";

import { DayVisitTickets } from "./Component/Camper/Bookings/DayVisitTickets.jsx";
import { CamperLayout } from "./Component/Camper/Sidebar/CamperLayout.jsx";
import { ListYourCampWizard } from "./Component/Camper/Onboarding/ListYourCampWizard.jsx";

// System Admin Components
import { SystemAdminLayout } from "./SystemAdmin/SystemAdminLayout.jsx";
import { Dashboard } from "./SystemAdmin/pages/Dashboard.jsx";
import { CampManagement } from "./SystemAdmin/pages/CampManagement.jsx";
import { UserManagement } from "./SystemAdmin/pages/UserManagement.jsx";
import { RoleRequests } from "./SystemAdmin/pages/RoleRequests.jsx";

import { SecurityManagement } from "./SystemAdmin/pages/SecurityManagement.jsx";
import { LogsMonitoring } from "./SystemAdmin/pages/LogsMonitoring.jsx";
import { ReportsAlerts } from "./SystemAdmin/pages/ReportsAlerts.jsx";
import { SystemConfiguration } from "./SystemAdmin/pages/SystemConfiguration.jsx";
import { FinancialManagement } from "./SystemAdmin/pages/FinancialManagement.jsx";
import { SupportManagement } from "./SystemAdmin/pages/SupportManagement.jsx";
import { FeatureManagement } from "./SystemAdmin/pages/FeatureManagement.jsx";

import CamperAICopilot from "./Component/Camper/CamperAICopilot";
import AICopilot from "./Component/CampAdmin/AICopilot";
import AnalyticsDashboard from "./Component/CampAdmin/Analytics/AnalyticsDashboard.jsx";

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

function AppContent() {
  const { user } = useUser();
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const triggerWelcome = urlParams.get('welcome') === 'true';

    // Role check: manager or camp_manager
    const isManager = user?.role === "manager" || user?.role === "camp_manager";
    
    if (isManager && user?.status === "active") {
      const wasPending = localStorage.getItem("wasPending");
      if (wasPending === "true" || triggerWelcome) {
        setShowWelcomePopup(true);
        localStorage.removeItem("wasPending");
        
        // Clear query param without full page reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [user]);

  return (
    <>
      <Toaster />
      <SuccessPopup 
        isOpen={showWelcomePopup} 
        onClose={() => setShowWelcomePopup(false)}
        title="Account Approved!"
        message="Congratulations! Your camp application has been reviewed and approved. You now have full access to your manager dashboard."
      />
      <CamperAICopilot />
      <AICopilot />

      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
              <Footer />
            </>
          }
        />

        {/* ================= CAMPS ================= */}

        <Route
          path="/camps"
          element={
            <>
              <Navbar />
              <BrowseCamps />
              <Footer />
            </>
          }
        />

        {/* ================= ABOUT ================= */}

        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <About />
              <CoreValues />
              <GrowingCommunity />
              <Footer />
            </>
          }
        />

        {/* ================= CONTACT ================= */}

        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <GetInTouch />
              <FormContact />
              <Footer />
            </>
          }
        />

        {/* ================= AUTH ================= */}

        <Route path="/login" element={<Login />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/verify" element={<OTPVerification />} />
        <Route path="/forgot" element={<Navigate to="/forgot-password" replace />} />
        <Route path="/forgot-password" element={<RequestPasswordReset />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/banned" element={<BannedPage />} />

       
        {/* ======================================================== */}
        {/* CAMP ADMIN ROUTES                      */}
        {/* ======================================================== */}
        <Route 
          path="/manager-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["manager", "camp_manager", "admin", "system_admin", "super_admin"]}>
              <CampAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CampAdminDashboard />} />
          <Route path="tent-management" element={<TentManagement />} />
          <Route path="add-tent" element={<AddTent />} />
          <Route path="reservations" element={<ReservationManagement />} />

          <Route path="settings" element={<SystemSettings />} />
          <Route path="notifications" element={<NotificationManagement />} />
          <Route path="users" element={<CampAdminUserManagement />} />
          <Route path="payments" element={<PaymentMgmt />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="support" element={<ManagerSupport />} />
        </Route>

        {/* ======================================================== */}
        {/* SYSTEM ADMINISTRATOR ROUTES              */}
        {/* ======================================================== */}
        <Route 
          path="/super-admin" 
          element={
            <ProtectedRoute allowedRoles={["admin", "system_admin", "super_admin"]}>
              <SystemAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="camps" element={<CampManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="role-requests" element={<RoleRequests />} />

          <Route path="security" element={<SecurityManagement />} />
          <Route path="logs" element={<LogsMonitoring />} />
          <Route path="reports" element={<ReportsAlerts />} />
          <Route path="configuration" element={<SystemConfiguration />} />
          <Route path="features" element={<FeatureManagement />} />
          <Route path="financial" element={<FinancialManagement />} />
          <Route path="support" element={<SupportManagement />} />
        </Route>


        {/* ======================================================== */}
        {/* CAMPER DASHBOARD ROUTES                */}
        {/* ======================================================== */}
        <Route
          path="/camper-dashboard"
          element={
            <ProtectedRoute allowedRoles={["camper", "admin", "system_admin", "super_admin"]}>
              <CamperLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CamperDashboard />} />
          <Route path="list-your-camp" element={<ListYourCampWizard />} />
          <Route path="reservations" element={<MyReservations />} />
          <Route path="campsite-directory" element={<CampsiteDirectory />} />
          <Route path="book/:id" element={<Booking />} />
          <Route path="payments" element={<Payments />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/security-password" element={<SecurityPassword />} />
          <Route path="settings/notification" element={<NotificationPreferences />} />
          <Route path="tickets" element={<DayVisitTickets />} />
          <Route path="support" element={<ContactSupport />} />
        </Route>

        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />

      </Routes>
    </>
  );
}


export default App;

