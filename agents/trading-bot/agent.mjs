#!/usr/bin/env node
/**
 * Trading Bot Agent - Uses private x402 payments
 *
 * This agent consumes price data APIs anonymously to avoid front-running.
 * Competitors cannot see which APIs it uses or when it queries them.
 */

import { readFileSync } from 'fs';

const AGENT_NAME = 'TradingBot';
const SERVICES = {
  priceData: 'https://api.example.com/x402/prices',
  marketDepth: 'https://api.example.com/x402/depth',
  liquidityData: 'https://api.example.com/x402/liquidity',
};

class PrivateTradingBot {
  constructor(credentialsPath) {
    // Load privacy credentials (downloaded from Link2Pay)
    this.credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'));
    console.log(`🤖 ${AGENT_NAME} initialized with privacy credentials`);
    console.log(`   Commitment: ${this.credentials.commitment.slice(0, 16)}...`);
  }

  async fetchPriceData() {
    console.log(`\n📊 Fetching price data privately...`);

    // In production, this would:
    // 1. Generate ZK proof using credentials
    // 2. Send proof + nullifier to privacy pool contract
    // 3. Contract verifies proof and pays service
    // 4. Service returns data via x402 response

    // Mock for demo
    console.log(`   Service: ${SERVICES.priceData}`);
    console.log(`   ✅ Payment sent via privacy pool (amount hidden)`);
    console.log(`   ✅ Response received`);

    return {
      BTC_USD: 45000 + Math.random() * 1000,
      ETH_USD: 2500 + Math.random() * 100,
      XLM_USD: 0.10 + Math.random() * 0.01,
    };
  }

  async fetchMarketDepth() {
    console.log(`\n📈 Fetching market depth privately...`);
    console.log(`   Service: ${SERVICES.marketDepth}`);
    console.log(`   ✅ Payment sent via privacy pool (service hidden)`);
    console.log(`   ✅ Response received`);

    return {
      bids: [[45000, 2.5], [44990, 3.2], [44980, 1.8]],
      asks: [[45010, 2.1], [45020, 3.5], [45030, 2.0]],
    };
  }

  async executeStrategy() {
    console.log(`\n🎯 Executing trading strategy...`);

    // Fetch data from multiple services
    const prices = await this.fetchPriceData();
    await new Promise(r => setTimeout(r, 1000));

    const depth = await this.fetchMarketDepth();
    await new Promise(r => setTimeout(r, 1000));

    console.log(`\n💡 Analysis:`);
    console.log(`   BTC Price: $${prices.BTC_USD.toFixed(2)}`);
    console.log(`   Spread: ${(depth.asks[0][0] - depth.bids[0][0]).toFixed(2)}`);
    console.log(`   ✅ Privacy maintained across all API calls`);
    console.log(`   ✅ Competitors cannot track our data sources`);
  }
}

// Demo execution
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Link2Pay ZK-Bridge Demo: Private Trading Bot`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`📌 Scenario:`);
  console.log(`   A trading bot needs to query multiple price APIs`);
  console.log(`   Without privacy: Competitors see which APIs → front-run trades`);
  console.log(`   With ZK-Bridge: All payments go through universal pool`);
  console.log(`   Result: Impossible to determine which APIs bot uses\n`);

  // Check for credentials file
  const credentialsPath = process.argv[2] || './privacy-credentials.json';

  try {
    const bot = new PrivateTradingBot(credentialsPath);
    await bot.executeStrategy();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ✅ Demo Complete: All payments made privately`);
    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.log(`\n💡 To run this demo:`);
    console.log(`   1. Create a private invoice on Link2Pay`);
    console.log(`   2. Download the privacy credentials JSON`);
    console.log(`   3. Run: node agent.mjs <path-to-credentials.json>\n`);
  }
}

main().catch(console.error);
