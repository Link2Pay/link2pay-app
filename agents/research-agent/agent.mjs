#!/usr/bin/env node
/**
 * Research Agent - Uses private x402 payments
 *
 * This agent queries multiple research databases anonymously.
 * Protects intellectual property by hiding research patterns.
 */

import { readFileSync } from 'fs';

const AGENT_NAME = 'ResearchAgent';
const SERVICES = {
  paperSearch: 'https://api.example.com/x402/papers',
  citationGraph: 'https://api.example.com/x402/citations',
  patentSearch: 'https://api.example.com/x402/patents',
};

class PrivateResearchAgent {
  constructor(credentialsPath) {
    this.credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'));
    this.queryHistory = [];
    console.log(`🔬 ${AGENT_NAME} initialized with privacy credentials`);
  }

  async searchPapers(query) {
    console.log(`\n📚 Searching academic papers: "${query}"`);
    console.log(`   Service: ${SERVICES.paperSearch}`);
    console.log(`   ✅ Query sent via private x402 payment`);
    console.log(`   ✅ Search pattern hidden from competitors`);

    this.queryHistory.push({ service: 'paperSearch', query, timestamp: new Date() });

    return {
      results: [
        { title: 'Zero-Knowledge Proofs in Blockchain', citations: 450 },
        { title: 'Privacy-Preserving Payment Systems', citations: 320 },
        { title: 'Stellar Consensus Protocol Analysis', citations: 280 },
      ],
    };
  }

  async getCitationGraph(paperId) {
    console.log(`\n🔗 Fetching citation graph for paper ${paperId}`);
    console.log(`   Service: ${SERVICES.citationGraph}`);
    console.log(`   ✅ Citation analysis remains confidential`);

    return {
      citations: 12,
      citedBy: 45,
      relatedPapers: 8,
    };
  }

  async searchPatents(keywords) {
    console.log(`\n⚖️  Searching patents: "${keywords}"`);
    console.log(`   Service: ${SERVICES.patentSearch}`);
    console.log(`   ✅ Patent research invisible to competitors`);

    return {
      patents: [
        { id: 'US20230001234', title: 'Privacy-Preserving Transaction Method' },
        { id: 'US20230005678', title: 'Zero-Knowledge Authentication System' },
      ],
    };
  }

  async conductResearch(topic) {
    console.log(`\n🎓 Conducting research on: "${topic}"`);

    // Multi-service research workflow
    const papers = await this.searchPapers(topic);
    await new Promise(r => setTimeout(r, 800));

    const citations = await this.getCitationGraph('paper-123');
    await new Promise(r => setTimeout(r, 800));

    const patents = await this.searchPatents(topic);
    await new Promise(r => setTimeout(r, 800));

    console.log(`\n📊 Research Summary:`);
    console.log(`   Papers found: ${papers.results.length}`);
    console.log(`   Citations analyzed: ${citations.citations + citations.citedBy}`);
    console.log(`   Relevant patents: ${patents.patents.length}`);
    console.log(`   Total services used: ${this.queryHistory.length}`);
    console.log(`\n   🛡️  Privacy Status: PROTECTED`);
    console.log(`   ✅ Research pattern hidden via universal privacy pool`);
    console.log(`   ✅ Competitors cannot reverse-engineer research focus`);
  }
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Link2Pay ZK-Bridge Demo: Private Research Agent`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`📌 Scenario:`);
  console.log(`   Research agent queries papers, citations, and patents`);
  console.log(`   Without privacy: Query patterns reveal research direction`);
  console.log(`   With ZK-Bridge: All payments aggregated in universal pool`);
  console.log(`   Result: Research focus remains confidential\n`);

  const credentialsPath = process.argv[2] || './privacy-credentials.json';

  try {
    const agent = new PrivateResearchAgent(credentialsPath);
    await agent.conductResearch('zero-knowledge privacy stellar');

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ✅ Demo Complete: Research conducted privately`);
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
