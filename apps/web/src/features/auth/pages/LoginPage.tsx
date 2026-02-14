import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user } = useAuth();

  // Redirect to dashboard if already authenticated (no spinner — show form immediately)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Lava lamp effect layer */}
      <div className="lava-container">
        <div className="lava-blob lava-blob-1" />
        <div className="lava-blob lava-blob-2" />
        <div className="lava-blob lava-blob-3" />
        <div className="lava-blob lava-blob-4" />
        <div className="lava-blob lava-blob-5" />
      </div>

      {/* Black semi-transparent overlay */}
      <div className="fixed inset-0 z-10 bg-black/50" />

      {/* Login card */}
      <div className="relative z-20 flex min-h-screen flex-col items-center px-4 py-12">
        <img src="/logo.png" alt="Plublista" className="mb-0 h-24" />
        <img src="/logo-qr.png" alt="QR Code" className="-mt-4 mb-5 h-24" />
        <div className="w-full max-w-lg">
          <div className="rounded-lg bg-black p-8 text-white shadow-lg">
            <h1 className="text-center text-3xl font-bold">Welcome back</h1>
            <p className="mt-2 text-center text-gray-300">Sign in to your Plublista account</p>
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
