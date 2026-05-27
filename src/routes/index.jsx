import { Routes, Route } from "react-router-dom"

import AuthLayout from "@/layouts/auth-layout"
import LoginPage from "@/pages/auth/login"

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
