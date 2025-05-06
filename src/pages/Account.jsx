import AccountInfo from '../components/AccountInfo';
import AccountOptions from '../components/AccountOptions';
import BottomNavBar from '../components/BottomNavBar';

export default function Account() {
  return (
    <div className="flex flex-col min-h-screen bg-white pb-16">
      <div className="p-4">
        <AccountInfo />
        <AccountOptions />
      </div>
      <BottomNavBar />
    </div>
  );
}