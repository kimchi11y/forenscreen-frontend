import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SideNavBar from './components/SideNavBar';
import EvidenceSubmission from './pages/EvidenceSubmission';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/evidence-submission" replace />} />
          <Route path="evidence-submission" element={<EvidenceSubmission />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedLayout() {
  return (
    <div className="flex">
      <SideNavBar />
      <main className="ml-[280px] flex-1 min-h-screen bg-gray-50">
        <Routes>
          <Route index element={<Navigate to="/evidence-submission" replace />} />
          <Route path="evidence-submission" element={<EvidenceSubmission />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
