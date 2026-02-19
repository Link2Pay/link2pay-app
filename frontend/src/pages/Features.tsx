import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Clock,
  CreditCard,
  FileText,
  Globe2,
  Link2,
  Receipt,
  RefreshCw,
  Shield,
  Smartphone,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const CORE_FEATURE_ICONS = [Link2, Wallet, Zap, Globe2, Shield, RefreshCw] as const;
const INVOICE_FEATURE_ICONS = [FileText, Users, Receipt, BarChart3] as const;
const UPCOMING_FEATURE_ICONS = [Bell, CreditCard, Smartphone] as const;

type Item = { title: string; description: string };
type ComparisonRow = { feature: string; stellarPay: string; traditional: string };

type FeaturesCopy = {
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroDescription: string;
  coreTitle: string;
  coreSubtitle: string;
  managementTitle: string;
  managementSubtitle: string;
  comparisonTitle: string;
  comparisonSubtitle: string;
  colFeature: string;
  colTraditional: string;
  comingSoon: string;
  comingTitle: string;
  comingSubtitle: string;
  finalTitle: string;
  finalDescription: string;
  finalCta: string;
};

const COPY: Record<Language, FeaturesCopy> = {
  en: {
    heroTitleStart: 'Everything you need to',
    heroTitleHighlight: 'get paid faster',
    heroDescription:
      'Link2Pay gives you simple tools to create invoices, share payment links, and receive money from anywhere in the world in seconds.',
    coreTitle: 'Core Features',
    coreSubtitle: 'Everything you need to invoice clients and collect payments without friction.',
    managementTitle: 'Manage your business with ease',
    managementSubtitle: 'More than payments. Link2Pay helps you stay organized and professional.',
    comparisonTitle: 'Link2Pay vs traditional payments',
    comparisonSubtitle: 'See why freelancers are switching to blockchain-powered invoicing.',
    colFeature: 'Feature',
    colTraditional: 'Traditional',
    comingSoon: 'Coming Soon',
    comingTitle: "We're just getting started",
    comingSubtitle: 'New features are on the way to make invoicing even better.',
    finalTitle: 'Ready to try it yourself?',
    finalDescription: 'Create your free account and send your first invoice in under 2 minutes.',
    finalCta: 'Get Started Free',
  },
  es: {
    heroTitleStart: 'Todo lo que necesitas para',
    heroTitleHighlight: 'cobrar mas rapido',
    heroDescription:
      'Link2Pay te da herramientas simples para crear facturas, compartir links de pago y recibir dinero desde cualquier lugar en segundos.',
    coreTitle: 'Funciones principales',
    coreSubtitle: 'Lo esencial para facturar clientes y cobrar sin friccion.',
    managementTitle: 'Gestiona tu negocio con facilidad',
    managementSubtitle: 'Mas que pagos. Link2Pay te ayuda a mantener orden y profesionalismo.',
    comparisonTitle: 'Link2Pay vs pagos tradicionales',
    comparisonSubtitle: 'Mira por que freelancers se cambian a facturacion con blockchain.',
    colFeature: 'Caracteristica',
    colTraditional: 'Tradicional',
    comingSoon: 'Proximamente',
    comingTitle: 'Recien estamos empezando',
    comingSubtitle: 'Nuevas funciones vienen en camino para mejorar la experiencia.',
    finalTitle: 'Listo para probarlo?',
    finalDescription: 'Crea tu cuenta gratis y envia tu primera factura en menos de 2 minutos.',
    finalCta: 'Comenzar gratis',
  },
  pt: {
    heroTitleStart: 'Tudo o que voce precisa para',
    heroTitleHighlight: 'receber mais rapido',
    heroDescription:
      'Link2Pay oferece ferramentas simples para criar faturas, compartilhar links de pagamento e receber de qualquer lugar em segundos.',
    coreTitle: 'Recursos principais',
    coreSubtitle: 'O essencial para faturar clientes e receber pagamentos sem atrito.',
    managementTitle: 'Gerencie seu negocio com facilidade',
    managementSubtitle: 'Mais do que pagamentos. Link2Pay ajuda voce a manter organizacao e profissionalismo.',
    comparisonTitle: 'Link2Pay vs pagamentos tradicionais',
    comparisonSubtitle: 'Veja por que freelancers estao migrando para faturamento em blockchain.',
    colFeature: 'Recurso',
    colTraditional: 'Tradicional',
    comingSoon: 'Em breve',
    comingTitle: 'Estamos apenas comecando',
    comingSubtitle: 'Novos recursos estao chegando para melhorar ainda mais sua experiencia.',
    finalTitle: 'Pronto para testar?',
    finalDescription: 'Crie sua conta gratis e envie sua primeira fatura em menos de 2 minutos.',
    finalCta: 'Comecar gratis',
  },
};

const CORE_FEATURES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Shareable payment links',
      description: 'Generate a unique link for every invoice and share it anywhere. Client clicks and pays.',
    },
    {
      title: 'Connect any Stellar wallet',
      description: 'Works with Freighter and compatible Stellar wallets. Your keys never leave your device.',
    },
    {
      title: '5-second payments',
      description: 'Payments confirm on Stellar in about 5 seconds. No more waiting days for bank transfers.',
    },
    {
      title: 'Multi-currency support',
      description: 'Accept XLM, USDC, or EURC so clients can pay in what works best for them.',
    },
    {
      title: 'Your money, your control',
      description: 'Link2Pay never holds funds. Payments go directly from your client wallet to yours.',
    },
    {
      title: 'Real-time status tracking',
      description: 'See when clients view, pay, and confirm payment, all in real time.',
    },
  ],
  es: [
    {
      title: 'Links de pago compartibles',
      description: 'Genera un link unico por factura y compartelo donde quieras. El cliente hace clic y paga.',
    },
    {
      title: 'Conecta cualquier wallet Stellar',
      description: 'Funciona con Freighter y wallets Stellar compatibles. Tus llaves no salen de tu dispositivo.',
    },
    {
      title: 'Pagos en 5 segundos',
      description: 'Los pagos se confirman en Stellar en unos 5 segundos. Sin esperar dias de transferencia.',
    },
    {
      title: 'Soporte multi-moneda',
      description: 'Acepta XLM, USDC o EURC para que tu cliente pague en la moneda que prefiera.',
    },
    {
      title: 'Tu dinero bajo tu control',
      description: 'Link2Pay nunca retiene fondos. El pago va directo de la wallet del cliente a la tuya.',
    },
    {
      title: 'Seguimiento en tiempo real',
      description: 'Mira cuando el cliente ve la factura, paga y confirma, todo en tiempo real.',
    },
  ],
  pt: [
    {
      title: 'Links de pagamento compartilhaveis',
      description: 'Gere um link unico por fatura e compartilhe em qualquer canal. Cliente clica e paga.',
    },
    {
      title: 'Conecte qualquer wallet Stellar',
      description: 'Funciona com Freighter e wallets Stellar compativeis. Suas chaves nao saem do dispositivo.',
    },
    {
      title: 'Pagamentos em 5 segundos',
      description: 'Pagamentos confirmam na Stellar em cerca de 5 segundos. Sem esperar dias.',
    },
    {
      title: 'Suporte multi-moeda',
      description: 'Aceite XLM, USDC ou EURC para seu cliente pagar na moeda que preferir.',
    },
    {
      title: 'Seu dinheiro, seu controle',
      description: 'Link2Pay nunca segura fundos. O pagamento vai direto da wallet do cliente para a sua.',
    },
    {
      title: 'Acompanhamento em tempo real',
      description: 'Veja quando cliente abre, paga e confirma a fatura, tudo em tempo real.',
    },
  ],
};

const INVOICE_FEATURES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Professional invoices',
      description: 'Create clean invoices with custom line items, descriptions, tax rates, and due dates.',
    },
    {
      title: 'Client management',
      description: 'Save favorite clients for quick invoicing. No need to re-enter details every time.',
    },
    {
      title: 'Invoice history',
      description: 'Access complete invoice history and filter by status, client, or date.',
    },
    {
      title: 'Dashboard and analytics',
      description: 'See earnings, pending payments, and trends at a glance.',
    },
  ],
  es: [
    {
      title: 'Facturas profesionales',
      description: 'Crea facturas limpias con lineas personalizadas, descripciones, impuestos y vencimiento.',
    },
    {
      title: 'Gestion de clientes',
      description: 'Guarda clientes favoritos para facturar rapido sin reingresar datos.',
    },
    {
      title: 'Historial de facturas',
      description: 'Accede al historial completo y filtra por estado, cliente o fecha.',
    },
    {
      title: 'Panel y analitica',
      description: 'Visualiza ingresos, pagos pendientes y tendencias de un vistazo.',
    },
  ],
  pt: [
    {
      title: 'Faturas profissionais',
      description: 'Crie faturas com itens personalizados, descricoes, impostos e vencimento.',
    },
    {
      title: 'Gestao de clientes',
      description: 'Salve clientes favoritos para faturar rapido sem preencher tudo novamente.',
    },
    {
      title: 'Historico de faturas',
      description: 'Acesse historico completo e filtre por status, cliente ou data.',
    },
    {
      title: 'Painel e analitica',
      description: 'Veja ganhos, pagamentos pendentes e tendencias rapidamente.',
    },
  ],
};

const COMPARISON: Record<Language, ComparisonRow[]> = {
  en: [
    { feature: 'Payment speed', stellarPay: '~5 seconds', traditional: '3-7 business days' },
    { feature: 'Transaction fees', stellarPay: 'Under $0.01', traditional: '$15-50 per transfer' },
    { feature: 'International payments', stellarPay: 'No restrictions', traditional: 'Bank-dependent' },
    { feature: 'Setup time', stellarPay: 'Under 2 minutes', traditional: 'Days to weeks' },
    { feature: 'Payment tracking', stellarPay: 'Real-time on blockchain', traditional: 'Manual / delayed' },
    { feature: 'Intermediaries', stellarPay: 'None, direct to you', traditional: 'Banks, processors, etc.' },
  ],
  es: [
    { feature: 'Velocidad de pago', stellarPay: '~5 segundos', traditional: '3-7 dias habiles' },
    { feature: 'Comisiones', stellarPay: 'Menos de $0.01', traditional: '$15-50 por transferencia' },
    { feature: 'Pagos internacionales', stellarPay: 'Sin restricciones', traditional: 'Depende del banco' },
    { feature: 'Tiempo de configuracion', stellarPay: 'Menos de 2 minutos', traditional: 'Dias o semanas' },
    { feature: 'Seguimiento de pago', stellarPay: 'Tiempo real en blockchain', traditional: 'Manual / retrasado' },
    { feature: 'Intermediarios', stellarPay: 'Ninguno, directo para ti', traditional: 'Bancos, procesadores, etc.' },
  ],
  pt: [
    { feature: 'Velocidade de pagamento', stellarPay: '~5 segundos', traditional: '3-7 dias uteis' },
    { feature: 'Taxas de transacao', stellarPay: 'Abaixo de $0.01', traditional: '$15-50 por transferencia' },
    { feature: 'Pagamentos internacionais', stellarPay: 'Sem restricoes', traditional: 'Dependente de banco' },
    { feature: 'Tempo de configuracao', stellarPay: 'Menos de 2 minutos', traditional: 'Dias ou semanas' },
    { feature: 'Rastreamento de pagamento', stellarPay: 'Tempo real na blockchain', traditional: 'Manual / atrasado' },
    { feature: 'Intermediarios', stellarPay: 'Nenhum, direto para voce', traditional: 'Bancos, processadores, etc.' },
  ],
};

const UPCOMING: Record<Language, Item[]> = {
  en: [
    { title: 'Email notifications', description: 'Get notified when clients view or pay your invoices.' },
    { title: 'Recurring invoices', description: 'Set up automatic invoicing for retainer clients.' },
    { title: 'Mobile app', description: 'Manage invoices and track payments on the go.' },
  ],
  es: [
    { title: 'Notificaciones por email', description: 'Recibe avisos cuando clientes vean o paguen facturas.' },
    { title: 'Facturas recurrentes', description: 'Configura facturacion automatica para clientes recurrentes.' },
    { title: 'App movil', description: 'Gestiona facturas y pagos desde cualquier lugar.' },
  ],
  pt: [
    { title: 'Notificacoes por email', description: 'Receba alertas quando clientes visualizarem ou pagarem faturas.' },
    { title: 'Faturas recorrentes', description: 'Configure faturamento automatico para clientes recorrentes.' },
    { title: 'App mobile', description: 'Gerencie faturas e acompanhe pagamentos em qualquer lugar.' },
  ],
};

export default function Features() {
  const { language } = useI18n();

  const copy = COPY[language];
  const coreFeatures = CORE_FEATURES[language];
  const invoiceFeatures = INVOICE_FEATURES[language];
  const comparisonRows = COMPARISON[language];
  const upcomingFeatures = UPCOMING[language];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.10),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {copy.heroTitleStart}{' '}
              <span className="text-gradient">{copy.heroTitleHighlight}</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{copy.heroDescription}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.coreTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.coreSubtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feature, index) => {
            const Icon = CORE_FEATURE_ICONS[index];
            return (
              <article key={feature.title} className="card hover-glow p-8 animate-fade-in" style={{ animationDelay: `${0.05 + index * 0.07}s` }}>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.managementTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.managementSubtitle}</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {invoiceFeatures.map((feature, index) => {
              const Icon = INVOICE_FEATURE_ICONS[index];
              return (
                <article
                  key={feature.title}
                  className="group rounded-xl border border-border bg-background p-8 transition-all hover:border-primary/30 animate-fade-in"
                  style={{ animationDelay: `${0.05 + index * 0.08}s` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.comparisonTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.comparisonSubtitle}</p>
        </div>
        <div className="mt-14 overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{copy.colFeature}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-primary">Link2Pay</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{copy.colTraditional}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr key={row.feature} className={`border-b border-border last:border-0 ${index % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{row.feature}</td>
                    <td className="px-6 py-4 text-sm text-primary font-medium">{row.stellarPay}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{row.traditional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Clock className="h-3.5 w-3.5" />
              {copy.comingSoon}
            </span>
            <h2 className="mt-6 text-3xl font-semibold text-foreground">{copy.comingTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.comingSubtitle}</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {upcomingFeatures.map((feature, index) => {
              const Icon = UPCOMING_FEATURE_ICONS[index];
              return (
                <article
                  key={feature.title}
                  className="rounded-xl border border-dashed border-border bg-background p-8 text-center animate-fade-in"
                  style={{ animationDelay: `${0.05 + index * 0.08}s` }}
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-3xl font-semibold text-primary-foreground">{copy.finalTitle}</h3>
              <p className="mt-4 text-base text-primary-foreground/80">{copy.finalDescription}</p>
              <div className="mt-8">
                <Link to="/get-started" className="btn bg-background text-primary hover:bg-muted font-semibold px-6 py-3">
                  {copy.finalCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
