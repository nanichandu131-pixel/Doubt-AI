'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarUploader } from './avatar-uploader';
import type { Profile } from '@/types/database.types';

export function ProfileForm({ profile, userId, email }: { profile: Profile | null; userId: string; email: string | undefined }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  const fallback = (profile?.full_name?.trim()?.[0] || email?.[0] || '?').toUpperCase();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      });
      if (!res.ok) throw new Error();
      toast.success('Profile updated');
      router.refresh();
    } catch {
      toast.error('Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>This information is visible only to you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AvatarUploader
          userId={userId}
          initialAvatarUrl={profile?.avatar_url ?? null}
          fallback={fallback}
          onUploaded={() => router.refresh()}
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email ?? ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={profile?.role ?? 'student'} disabled className="capitalize" />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
