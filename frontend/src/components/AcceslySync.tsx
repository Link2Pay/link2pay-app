import { useEffect } from 'react';
import { useAccesly } from 'accesly';
import { registerAcceslySigner, unregisterAcceslySigner } from '../services/acceslyAuth';
import { clearAcceslyAuthToken } from '../services/auth';

/**
 * Side-effect-only component that keeps the Accesly signer registry in sync
 * with the current wallet state. Must be rendered inside AcceslyProvider.
 *
 * - On connect: registers signTransaction so api.ts can sign auth nonces.
 * - On disconnect: unregisters the signer and clears the cached auth token.
 */
export default function AcceslySync() {
  const { wallet, signTransaction } = useAccesly();

  useEffect(() => {
    if (wallet && signTransaction) {
      registerAcceslySigner(signTransaction);
      // Only unregister on cleanup if we were the ones who registered.
      // This avoids a brief null window when deps change but wallet stays connected.
      return () => {
        unregisterAcceslySigner();
      };
    }
    // No wallet — clear auth state and leave no cleanup registered.
    unregisterAcceslySigner();
    clearAcceslyAuthToken();
    return undefined;
  }, [wallet, signTransaction]);

  return null;
}
