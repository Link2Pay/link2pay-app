import HomeAssets from '../components/marketing/home/HomeAssets';
import HomeFinalCta from '../components/marketing/home/HomeFinalCta';
import HomeHero from '../components/marketing/home/HomeHero';
import HomeProblem from '../components/marketing/home/HomeProblem';
import HomeProductTour from '../components/marketing/home/HomeProductTour';
import HomeProofStrip from '../components/marketing/home/HomeProofStrip';
import HomeStellarProof from '../components/marketing/home/HomeStellarProof';
import HomeTrust from '../components/marketing/home/HomeTrust';
import HomeTwoSteps from '../components/marketing/home/HomeTwoSteps';

export default function Home() {
  return (
    <div>
      <HomeHero />
      <HomeProofStrip />
      <HomeProblem />
      <HomeTwoSteps />
      <HomeStellarProof />
      <HomeProductTour />
      <HomeAssets />
      <HomeTrust />
      <HomeFinalCta />
    </div>
  );
}
