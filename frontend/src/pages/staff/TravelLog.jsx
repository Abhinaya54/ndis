import DashboardLayout from '../../components/layout/DashboardLayout';
import LogTravelTab from '../../components/staff/LogTravelTab';

export default function TravelLog() {
  return (
    <DashboardLayout
      title="Travel Log"
      subtitle="Log and manage your travel entries"
    >
      <LogTravelTab />
    </DashboardLayout>
  );
}
