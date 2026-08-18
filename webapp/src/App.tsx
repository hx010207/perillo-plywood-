import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { SplashScreen } from './components/common/SplashScreen';
import { SmoothScrollProvider } from './components/reactbits/SmoothScrollProvider';
import { LoginSignupPage } from './pages/auth/LoginSignupPage';
import { CarpenterShell } from './pages/carpenter/CarpenterShell';
import { AdminShell } from './pages/admin/AdminShell';
import { AwaitingApprovalPage } from './pages/status/AwaitingApprovalPage';
import { RejectedPage } from './pages/status/RejectedPage';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginSignupPage />;
  }

  if (user.role === 'admin') {
    return <AdminShell />;
  }

  if (user.role === 'carpenter') {
    if (user.status === 'pending_approval') {
      return <AwaitingApprovalPage />;
    }

    if (user.status === 'rejected') {
      return <RejectedPage />;
    }

    return <CarpenterShell />;
  }

  return <LoginSignupPage />;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <SmoothScrollProvider>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </SmoothScrollProvider>
  );
}
