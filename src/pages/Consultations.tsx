import ConsultationScheduler from '../components/ConsultationScheduler';
import BottomNavBar from '../components/BottomNavBar';

export default function Consultations() {
  return (
    <div className="flex flex-col min-h-screen bg-white pb-16">
      <ConsultationScheduler />
      <BottomNavBar />
    </div>
  );
}