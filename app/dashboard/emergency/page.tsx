import EmergencySupportModule from '@/components/emergency-support';

export const metadata = {
  title: 'Emergency Support - MediCheck',
  description: 'Find nearby hospitals, doctors, and ambulance services',
};

export default function EmergencyPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <EmergencySupportModule />
      </div>
    </div>
  );
}
