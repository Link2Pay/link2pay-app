import { useEffect, useState } from 'react';
import { privacyApi } from '../../services/privacyApi';
import type { PrivacyDeposit, PrivacyScore } from '../../services/privacyApi';
import { Shield, Lock, Eye, Database } from 'lucide-react';

export function PrivacyDashboard() {
  const [deposits, setDeposits] = useState<PrivacyDeposit[]>([]);
  const [score, setScore] = useState<PrivacyScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [depositsData, scoreData] = await Promise.all([
        privacyApi.getDeposits(),
        privacyApi.getPrivacyScore(),
      ]);

      setDeposits(depositsData.deposits);
      setScore(scoreData);
    } catch (error) {
      console.error('Error loading privacy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 75) return 'GOOD';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-ink-2">Loading privacy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Score Card */}
      {score && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Shield className="w-5 h-5 mr-2 text-primary-600" />
              Privacy Score
            </h2>
            <span className={`text-3xl font-bold ${getScoreColor(score.score)}`}>
              {score.score}/100
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-ink-2">Level:</span>
              <span className={`font-semibold ${getScoreColor(score.score)}`}>
                {getScoreLevel(score.score)}
              </span>
            </div>
            <div className="w-full bg-ink-10 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  score.score >= 75 ? 'bg-green-600' :
                  score.score >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${score.score}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start">
              <Eye className="w-4 h-4 mr-2 text-ink-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Anonymity Set Size</p>
                <p className="text-xs text-ink-2">{score.anonymitySetSize} active depositors</p>
              </div>
            </div>

            <div className="flex items-start">
              <Lock className="w-4 h-4 mr-2 text-ink-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Recommendation</p>
                <p className="text-xs text-ink-2">{score.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposits List */}
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2 text-primary-600" />
          Privacy Deposits ({deposits.length})
        </h2>

        {deposits.length === 0 ? (
          <div className="text-center py-8 text-ink-3">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No privacy deposits yet</p>
            <p className="text-sm">Create a private invoice to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deposits.map((deposit) => (
              <div
                key={deposit.id}
                className="p-4 border border-ink-9 rounded-lg hover:border-primary-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">Invoice #{deposit.invoiceNumber}</p>
                    <p className="text-sm text-ink-2">
                      {deposit.amount} {deposit.currency}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    deposit.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    deposit.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    deposit.status === 'WITHDRAWN' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {deposit.status}
                  </span>
                </div>

                {deposit.leafIndex !== null && (
                  <p className="text-xs text-ink-3">
                    Merkle Index: {deposit.leafIndex}
                  </p>
                )}

                {deposit.depositTxHash && (
                  <p className="text-xs text-ink-3 font-mono truncate">
                    TX: {deposit.depositTxHash.slice(0, 16)}...
                  </p>
                )}

                {deposit.withdrawnAt && (
                  <p className="text-xs text-green-600">
                    ✓ Withdrawn on {new Date(deposit.withdrawnAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card p-4 bg-ink-12 border-ink-10">
        <h3 className="font-semibold text-sm mb-2">How Privacy Pools Work</h3>
        <ul className="text-xs text-ink-2 space-y-1">
          <li>• Deposits are hidden using zero-knowledge proofs</li>
          <li>• On-chain observers cannot link deposits to withdrawals</li>
          <li>• Larger anonymity sets provide stronger privacy</li>
          <li>• Your credentials are stored locally and encrypted</li>
        </ul>
      </div>
    </div>
  );
}
