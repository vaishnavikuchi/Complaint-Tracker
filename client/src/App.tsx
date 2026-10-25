import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Dashboard } from './pages/Dashboard';
import { FileComplaint } from './pages/FileComplaint';
import { AllComplaints } from './pages/AllComplaints';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

export const AppContent: React.FC = () => {
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar onOpenAdminLogin={() => setIsAdminLoginOpen(true)} />

      {/* Main Pages Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/file" element={<FileComplaint />} />
          <Route
            path="/complaints"
            element={<AllComplaints onOpenAdminLogin={() => setIsAdminLoginOpen(true)} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>Complaint Tracker System</strong> &bull; Full-Stack Web Programming Project
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.775rem' }}>
            <span>TypeScript Strict</span>
            &bull;
            <span>JSON Persistence</span>
            &bull;
            <span>AJAX / Fetch</span>
            &bull;
            <span>XML Import/Export</span>
            &bull;
            <span>Node + Express</span>
          </div>
        </div>
      </footer>

      {/* Global Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
