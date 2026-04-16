import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Profile" };

// This page is a placeholder — profile is managed via /profile/create.
// A full edit flow will be added in a later phase.
export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your public profile and preferences.
        </p>
      </div>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Profile management</CardTitle>
          <CardDescription>
            Full profile editing will be available in a later phase. For now,
            create or view your profile from the dashboard.
          </CardDescription>
        </CardHeader>
        <div className="flex gap-3">
          <Link href="/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
          <Link href="/profile/create">
            <Button variant="secondary">Create / Edit Profile</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
