import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Copy,
  Globe,
  KeyRound,
  ListChecks,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react';
import { useActorWallet } from '../hooks/useActorWallet';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { config } from '../config';
import { tierAtLeast } from '../lib/plans';
import { usePlanStore } from '../store/planStore';

type SnippetType = 'curl' | 'js';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    gateTitle: string;
    gateDescription: string;
    gateWhatYouGet: string;
    gateHeaderExample: string;
    gateCta: string;
    authModelTitle: string;
    authModelDesc: string;
    walletTitle: string;
    walletLabel: string;
    modeLabel: string;
    modeValue: string;
    envLabel: string;
    noWallet: string;
    baseUrlsTitle: string;
    apiBase: string;
    checkoutBase: string;
    headersTitle: string;
    headerWallet: string;
    headerNonce: string;
    headerSignature: string;
    checklistTitle: string;
    checklist1: string;
    checklist2: string;
    checklist3: string;
    checklist4: string;
    endpointsTitle: string;
    colMethod: string;
    colPath: string;
    colPurpose: string;
    purposeListLinks: string;
    purposeCreateLink: string;
    purposePayIntent: string;
    purposeConfirm: string;
    sampleTitle: string;
    sampleDesc: string;
    tabCurl: string;
    tabJs: string;
    copied: string;
    copySnippet: string;
  }
> = {
  en: {
    title: 'API Keys',
    subtitle: 'Integration setup and authenticated request flow',
    gateTitle: 'API keys are used for server-side link creation and webhooks.',
    gateDescription: 'Upgrade to Pro to generate live keys and unlock webhook delivery.',
    gateWhatYouGet: 'Pro unlocks live API keys, key rotation, and webhook signing.',
    gateHeaderExample: 'Authorization: Bearer l2p_sk_live_xxxxx',
    gateCta: 'Upgrade to Pro',
    authModelTitle: 'Authentication Model',
    authModelDesc:
      'Link2Pay supports wallet-signed headers and API key auth patterns for backend integrations.',
    walletTitle: 'Primary Access Identity',
    walletLabel: 'Wallet address',
    modeLabel: 'Access mode',
    modeValue: 'Wallet signature (nonce + signed message)',
    envLabel: 'Network',
    noWallet: 'Connect your wallet to view your authenticated API profile.',
    baseUrlsTitle: 'Base URLs',
    apiBase: 'API base',
    checkoutBase: 'Checkout base',
    headersTitle: 'Required Headers',
    headerWallet: 'Wallet public key for account scoping.',
    headerNonce: 'Nonce issued by /api/auth/nonce endpoint.',
    headerSignature: 'Hex signature from wallet-signed nonce message.',
    checklistTitle: 'Quick Start Checklist',
    checklist1: 'Fetch nonce from the auth endpoint.',
    checklist2: 'Sign the nonce message in Freighter.',
    checklist3: 'Send authenticated API request with the 3 auth headers.',
    checklist4: 'Store only public identifiers, never private keys.',
    endpointsTitle: 'Endpoint Quick Reference',
    colMethod: 'Method',
    colPath: 'Path',
    colPurpose: 'Purpose',
    purposeListLinks: 'List payment links for authenticated wallet/project.',
    purposeCreateLink: 'Create a new payment link.',
    purposePayIntent: 'Build transaction payload for checkout payment.',
    purposeConfirm: 'Confirm submitted transaction and settlement status.',
    sampleTitle: 'Integration Snippet',
    sampleDesc: 'Reference request shape for your backend or SDK wrapper.',
    tabCurl: 'cURL',
    tabJs: 'JavaScript',
    copied: 'Copied',
    copySnippet: 'Copy snippet',
  },
  es: {
    title: 'API Keys',
    subtitle: 'Configuracion de integracion y flujo autenticado',
    gateTitle: 'API keys se usan para crear links y webhooks desde backend.',
    gateDescription: 'Mejora a Pro para generar llaves live y habilitar webhooks.',
    gateWhatYouGet: 'Pro habilita API keys live, rotacion y firma de webhooks.',
    gateHeaderExample: 'Authorization: Bearer l2p_sk_live_xxxxx',
    gateCta: 'Mejorar a Pro',
    authModelTitle: 'Modelo de autenticacion',
    authModelDesc:
      'Link2Pay soporta headers firmados por wallet y patrones con API key para backend.',
    walletTitle: 'Identidad principal de acceso',
    walletLabel: 'Direccion wallet',
    modeLabel: 'Modo de acceso',
    modeValue: 'Firma de wallet (nonce + mensaje firmado)',
    envLabel: 'Red',
    noWallet: 'Conecta tu wallet para ver tu perfil autenticado.',
    baseUrlsTitle: 'URLs base',
    apiBase: 'Base API',
    checkoutBase: 'Base checkout',
    headersTitle: 'Headers requeridos',
    headerWallet: 'Clave publica de wallet para alcance de cuenta.',
    headerNonce: 'Nonce emitido por /api/auth/nonce.',
    headerSignature: 'Firma hex del mensaje nonce firmado.',
    checklistTitle: 'Checklist rapido',
    checklist1: 'Solicita nonce en auth.',
    checklist2: 'Firma nonce en Freighter.',
    checklist3: 'Envia request autenticado con 3 headers.',
    checklist4: 'Guarda solo identificadores publicos.',
    endpointsTitle: 'Referencia de endpoints',
    colMethod: 'Metodo',
    colPath: 'Ruta',
    colPurpose: 'Uso',
    purposeListLinks: 'Lista links de la wallet/proyecto autenticado.',
    purposeCreateLink: 'Crea un nuevo link de pago.',
    purposePayIntent: 'Construye payload de transaccion.',
    purposeConfirm: 'Confirma transaccion y estado de liquidacion.',
    sampleTitle: 'Snippet de integracion',
    sampleDesc: 'Forma de referencia para backend o SDK wrapper.',
    tabCurl: 'cURL',
    tabJs: 'JavaScript',
    copied: 'Copiado',
    copySnippet: 'Copiar snippet',
  },
  pt: {
    title: 'API Keys',
    subtitle: 'Configuracao de integracao e fluxo autenticado',
    gateTitle: 'API keys sao usadas para criar links e webhooks no backend.',
    gateDescription: 'Faca upgrade para Pro para gerar chaves live e habilitar webhooks.',
    gateWhatYouGet: 'Pro libera API keys live, rotacao e assinatura de webhooks.',
    gateHeaderExample: 'Authorization: Bearer l2p_sk_live_xxxxx',
    gateCta: 'Fazer upgrade para Pro',
    authModelTitle: 'Modelo de autenticacao',
    authModelDesc:
      'Link2Pay suporta headers assinados por wallet e padrao com API key para backend.',
    walletTitle: 'Identidade principal de acesso',
    walletLabel: 'Endereco da wallet',
    modeLabel: 'Modo de acesso',
    modeValue: 'Assinatura de wallet (nonce + mensagem assinada)',
    envLabel: 'Rede',
    noWallet: 'Conecte sua wallet para ver o perfil autenticado.',
    baseUrlsTitle: 'URLs base',
    apiBase: 'Base API',
    checkoutBase: 'Base checkout',
    headersTitle: 'Headers obrigatorios',
    headerWallet: 'Chave publica da wallet para escopo da conta.',
    headerNonce: 'Nonce emitido por /api/auth/nonce.',
    headerSignature: 'Assinatura hex do nonce assinado.',
    checklistTitle: 'Checklist rapido',
    checklist1: 'Busque nonce no auth.',
    checklist2: 'Assine nonce no Freighter.',
    checklist3: 'Envie request autenticada com 3 headers.',
    checklist4: 'Armazene apenas identificadores publicos.',
    endpointsTitle: 'Referencia de endpoints',
    colMethod: 'Metodo',
    colPath: 'Rota',
    colPurpose: 'Uso',
    purposeListLinks: 'Lista links da wallet/projeto autenticado.',
    purposeCreateLink: 'Cria novo link de pagamento.',
    purposePayIntent: 'Monta payload de transacao.',
    purposeConfirm: 'Confirma transacao e status de liquidacao.',
    sampleTitle: 'Snippet de integracao',
    sampleDesc: 'Formato de referencia para backend ou SDK wrapper.',
    tabCurl: 'cURL',
    tabJs: 'JavaScript',
    copied: 'Copiado',
    copySnippet: 'Copiar snippet',
  },
};

const shortAddress = (value: string) => `${value.slice(0, 8)}...${value.slice(-8)}`;

export default function ApiKeys() {
  const actorWallet = useActorWallet();
  const tier = usePlanStore((state) => state.tier);
  const { language } = useI18n();
  const copy = COPY[language];

  const canUseApiKeys = tierAtLeast(tier, 'pro');
  const [copied, setCopied] = useState(false);
  const [snippetType, setSnippetType] = useState<SnippetType>('curl');

  const checkoutBase = useMemo(() => {
    if (typeof window === 'undefined') return '/pay/:id';
    return `${window.location.origin}/pay/:id`;
  }, []);

  const curlSnippet = useMemo(
    () => `# 1) Obtain nonce\ncurl -X POST "${config.apiUrl}/api/auth/nonce" \\\n  -H "Content-Type: application/json" \\\n  -d "{\\"walletAddress\\": \\\"${actorWallet || 'G...YOUR_WALLET'}\\\"}"\n\n# 2) Sign nonce in wallet and call API\ncurl "${config.apiUrl}/api/invoices?limit=20&offset=0" \\\n  -H "x-wallet-address: ${actorWallet || 'G...YOUR_WALLET'}" \\\n  -H "x-auth-nonce: <nonce>" \\\n  -H "x-auth-signature: <hex_signature>"`,
    [actorWallet]
  );

  const jsSnippet = useMemo(
    () => `const walletAddress = '${actorWallet || 'G...YOUR_WALLET'}';\n\nconst nonceRes = await fetch('${config.apiUrl}/api/auth/nonce', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ walletAddress }),\n});\nconst { nonce } = await nonceRes.json();\n\nconst signature = await signNonceWithFreighter(nonce);\n\nconst linksRes = await fetch('${config.apiUrl}/api/invoices?limit=20&offset=0', {\n  headers: {\n    'x-wallet-address': walletAddress,\n    'x-auth-nonce': nonce,\n    'x-auth-signature': signature,\n  },\n});\nconst links = await linksRes.json();`,
    [actorWallet]
  );

  const snippet = snippetType === 'curl' ? curlSnippet : jsSnippet;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard errors.
    }
  };

  const endpoints = [
    { method: 'GET', path: '/api/invoices', purpose: copy.purposeListLinks },
    { method: 'POST', path: '/api/invoices', purpose: copy.purposeCreateLink },
    { method: 'POST', path: '/api/payments/:invoiceId/pay-intent', purpose: copy.purposePayIntent },
    { method: 'POST', path: '/api/payments/confirm', purpose: copy.purposeConfirm },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
        <p className="text-sm text-ink-3">{copy.subtitle}</p>
      </div>

      {!canUseApiKeys && (
        <div className="card p-5">
          <div className="mb-2 inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-primary">
            Pro
          </div>
          <h3 className="text-sm font-semibold text-ink-0">{copy.gateTitle}</h3>
          <p className="mt-1 text-sm text-ink-3">{copy.gateDescription}</p>
          <p className="mt-2 text-xs text-ink-2">{copy.gateWhatYouGet}</p>
          <code className="mt-3 block rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 text-xs text-ink-1">
            {copy.gateHeaderExample}
          </code>
          <Link to="/plans" className="btn-primary mt-4 text-sm">
            {copy.gateCta}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {copy.authModelTitle}
          </h3>
          <p className="text-sm text-ink-3">{copy.authModelDesc}</p>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <KeyRound className="h-4 w-4 text-primary" />
            {copy.walletTitle}
          </h3>

          {actorWallet ? (
            <div className="space-y-2">
              <p className="text-xs text-ink-3">{copy.walletLabel}</p>
              <p className="rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 font-mono text-xs text-ink-1">
                {shortAddress(actorWallet)}
              </p>
              <p className="pt-1 text-xs text-ink-3">
                {copy.modeLabel}: <span className="text-ink-1">{copy.modeValue}</span>
              </p>
              <p className="text-xs text-ink-3">
                {copy.envLabel}: <span className="text-ink-1">{config.stellarNetwork}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-3">{copy.noWallet}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <Globe className="h-4 w-4 text-primary" />
            {copy.baseUrlsTitle}
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <p className="text-ink-3">{copy.apiBase}</p>
              <p className="mt-1 rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 font-mono text-ink-1">
                {config.apiUrl}/api
              </p>
            </div>
            <div>
              <p className="text-ink-3">{copy.checkoutBase}</p>
              <p className="mt-1 rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 font-mono text-ink-1">
                {checkoutBase}
              </p>
            </div>
          </div>

          <h4 className="mt-5 text-xs font-semibold uppercase tracking-wider text-ink-2">{copy.headersTitle}</h4>
          <ul className="mt-2 space-y-2 text-xs text-ink-3">
            <li>
              <span className="font-mono text-ink-1">x-wallet-address</span>: {copy.headerWallet}
            </li>
            <li>
              <span className="font-mono text-ink-1">x-auth-nonce</span>: {copy.headerNonce}
            </li>
            <li>
              <span className="font-mono text-ink-1">x-auth-signature</span>: {copy.headerSignature}
            </li>
          </ul>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <ListChecks className="h-4 w-4 text-primary" />
            {copy.checklistTitle}
          </h3>
          <ul className="space-y-2 text-sm text-ink-2">
            <li>1. {copy.checklist1}</li>
            <li>2. {copy.checklist2}</li>
            <li>3. {copy.checklist3}</li>
            <li>4. {copy.checklist4}</li>
          </ul>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-surface-3 px-5 py-3">
          <h3 className="text-sm font-semibold text-ink-0">{copy.endpointsTitle}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-surface-3 bg-surface-1">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colMethod}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colPath}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colPurpose}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {endpoints.map((endpoint) => (
                <tr key={`${endpoint.method}-${endpoint.path}`}>
                  <td className="px-4 py-3">
                    <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-1">{endpoint.path}</td>
                  <td className="px-4 py-3 text-sm text-ink-2">{endpoint.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-0">
            <TerminalSquare className="h-4 w-4 text-ink-3" />
            {copy.sampleTitle}
          </h3>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs text-stellar-600 hover:underline"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? copy.copied : copy.copySnippet}
          </button>
        </div>
        <p className="mb-3 text-xs text-ink-3">{copy.sampleDesc}</p>

        <div className="mb-3 inline-flex items-center rounded-lg border border-surface-3 bg-surface-1 p-1">
          <button
            type="button"
            onClick={() => setSnippetType('curl')}
            className={`rounded-md px-2.5 py-1 text-xs ${
              snippetType === 'curl' ? 'bg-primary/15 text-primary' : 'text-ink-3 hover:text-ink-1'
            }`}
          >
            {copy.tabCurl}
          </button>
          <button
            type="button"
            onClick={() => setSnippetType('js')}
            className={`rounded-md px-2.5 py-1 text-xs ${
              snippetType === 'js' ? 'bg-primary/15 text-primary' : 'text-ink-3 hover:text-ink-1'
            }`}
          >
            {copy.tabJs}
          </button>
        </div>

        <pre className="max-h-[360px] overflow-auto rounded-lg border border-surface-3 bg-surface-1 p-3 text-[11px] leading-relaxed text-ink-1">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
