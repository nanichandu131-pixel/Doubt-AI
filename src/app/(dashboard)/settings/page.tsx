import { SettingsForm } from '@/components/dashboard/settings-form';

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
        <SettingsForm />
      </div>
    </div>
  );
}
