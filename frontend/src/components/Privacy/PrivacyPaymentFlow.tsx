import { useState } from 'react';
import toast from 'react-hot-toast';
import { privacyPool } from '../../lib/privacyPool';
import type { Invoice } from '../../types';

interface PrivacyPaymentFlowProps {
  invoice: Invoice;
  onComplete: () => void;
}

export function PrivacyPaymentFlow({ invoice, onComplete }: PrivacyPaymentFlowProps) {
  const [step, setStep] = useState<'deposit' | 'download' | 'completed'>('deposit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);

  const handleDeposit = async () => {
    setIsProcessing(true);
    try {
      // 1. Generate credentials
      const creds = await privacyPool.createDepositCredentials(
        invoice.total,
        invoice.freelancerWallet
      );

      setCredentials(creds);

      toast.success('Privacy credentials generated!');
      setStep('download');

      // Auto-download credentials
      setTimeout(() => {
        privacyPool.downloadCredentials(creds, invoice.invoiceNumber);
      }, 500);

    } catch (error) {
      console.error('Error generating credentials:', error);
      toast.error('Failed to generate credentials');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    setStep('completed');
    onComplete();
  };

  if (step === 'deposit') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h3 className="font-semibold text-primary-900 mb-2">
            Private Payment
          </h3>
          <p className="text-sm text-primary-700">
            This invoice uses zero-knowledge proofs to hide payment details on-chain.
            Only you and the recipient will know the actual payment amount.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-ink-2">Amount to deposit:</span>
            <span className="font-semibold">{invoice.total} {invoice.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-2">Privacy level:</span>
            <span className="font-semibold text-green-600">Maximum</span>
          </div>
        </div>

        <button
          onClick={handleDeposit}
          disabled={isProcessing}
          className="w-full btn btn-primary"
        >
          {isProcessing ? 'Generating credentials...' : 'Generate Privacy Credentials'}
        </button>

        <p className="text-xs text-ink-3 text-center">
          Your credentials will be securely downloaded after generation
        </p>
      </div>
    );
  }

  if (step === 'download') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">
            ✓ Credentials Generated
          </h3>
          <p className="text-sm text-green-700">
            Your privacy credentials have been downloaded. Keep this file safe!
          </p>
        </div>

        <div className="p-3 bg-ink-11 rounded border border-ink-9 text-xs font-mono overflow-x-auto">
          <pre>{JSON.stringify(credentials, null, 2)}</pre>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => privacyPool.downloadCredentials(credentials, invoice.invoiceNumber)}
            className="w-full btn btn-secondary"
          >
            Download Again
          </button>

          <button
            onClick={handleComplete}
            className="w-full btn btn-primary"
          >
            Continue to Payment
          </button>
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-semibold text-yellow-900 mb-1">⚠️ Important</p>
          <p className="text-yellow-700 text-xs">
            Store this file safely. You'll need it to make the payment or withdraw funds.
            Without it, you won't be able to access your deposited funds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
      <h3 className="font-semibold text-green-900 mb-2">
        ✓ Ready for Private Payment
      </h3>
      <p className="text-sm text-green-700">
        Your invoice is configured for private payment. Share the invoice link with your client.
      </p>
    </div>
  );
}
