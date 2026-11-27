import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "@/components/app-shell";
import PublicLayout from "@/layouts/public-layout";

import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import PublicCheckPage from "@/pages/check";
import VerifyPage from "@/pages/verify";
import SharedPage from "@/pages/shared";

import DashboardPage from "@/pages/dashboard";
import RegistryPage from "@/pages/assets";
import AnalyzePage from "@/pages/analyze";
import ComparePage from "@/pages/compare";
import SettingsPage from "@/pages/settings";
import ExtensionPage from "@/pages/extension";

/**
 * Public pages get the slim header/footer; the signed-in pages get the sidebar
 * shell. Login and sign-up deliberately sit in neither, because they are their
 * own full-screen centred layout.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/check" element={<PublicCheckPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/shared/:token" element={<SharedPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assets" element={<RegistryPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/compare/:evidenceId" element={<ComparePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/extension" element={<ExtensionPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
