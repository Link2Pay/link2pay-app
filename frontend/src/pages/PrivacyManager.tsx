import { PrivacyDashboard } from '../components/Privacy/PrivacyDashboard';
import { Shield } from 'lucide-react';

export function PrivacyManager() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center mb-2">
          <Shield className="w-8 h-8 mr-3 text-primary-600" />
          Privacy Manager
        </h1>
        <p className="text-ink-2">
          Manage your private payments and monitor your privacy score
        </p>
      </div>

      <PrivacyDashboard />
    </div>
  );
}
