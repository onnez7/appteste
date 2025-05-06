import HomeHeader from '../components/HomeHeader';
import HomeBanner from '../components/HomeBanner';
import HomeCategories from '../components/HomeCategories';
import HomeHighlights from '../components/HomeHighlights';
import BottomNavBar from '../components/BottomNavBar';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white pb-16">
      <HomeHeader />
      <HomeBanner />
      <HomeCategories />
      <HomeHighlights />
      <BottomNavBar />
    </div>
  );
}