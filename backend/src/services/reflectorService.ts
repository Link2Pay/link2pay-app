import {
  rpc,
  Contract,
  Account,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { config } from '../config';
import { log } from '../utils/logger';

/**
 * Reads a foreign-exchange rate from the Reflector SEP-40 oracle (read-only
 * simulate — no fees, no signing). Used for a LIVE ESTIMATE only; firm pricing
 * always comes from the SEP-38 / adapter quote.
 *
 * Returns null when the symbol isn't in the feed (e.g. COP may not be listed),
 * so the UI simply omits the estimate rather than showing a wrong number.
 */
export interface FxRate {
  symbol: string;
  rate: string;
  asOf: string; // ISO timestamp from the oracle
  source: 'reflector';
}

// A throwaway source account for simulate-only calls (never submitted).
const SIM_ACCOUNT = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

class ReflectorService {
  async getFxRate(symbol: string): Promise<FxRate | null> {
    if (!config.reflector.fxContract) return null;
    try {
      const server = new rpc.Server(config.stellar.sorobanRpcUrl, {
        allowHttp: config.stellar.sorobanRpcUrl.startsWith('http://'),
      });
      const contract = new Contract(config.reflector.fxContract);

      // Reflector Asset enum variant Other(Symbol) → ScVal vec [Symbol, Symbol].
      const asset = xdr.ScVal.scvVec([
        nativeToScVal('Other', { type: 'symbol' }),
        nativeToScVal(symbol, { type: 'symbol' }),
      ]);

      const tx = new TransactionBuilder(new Account(SIM_ACCOUNT, '0'), {
        fee: BASE_FEE,
        networkPassphrase: config.stellar.networkPassphrase,
      })
        .addOperation(contract.call('lastprice', asset))
        .setTimeout(30)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim) || !sim.result?.retval) return null;

      // Option<PriceData> — None decodes to null/undefined.
      const decoded: any = scValToNative(sim.result.retval);
      if (!decoded || decoded.price === undefined) return null;

      const price = BigInt(decoded.price);
      const rate = (Number(price) / 10 ** config.reflector.decimals).toString();
      const ts = decoded.timestamp ? Number(decoded.timestamp) : Date.now() / 1000;

      return { symbol, rate, asOf: new Date(ts * 1000).toISOString(), source: 'reflector' };
    } catch (error: any) {
      log.warn('[ReflectorService] FX read failed', { symbol, error: error?.message });
      return null;
    }
  }
}

export const reflectorService = new ReflectorService();
