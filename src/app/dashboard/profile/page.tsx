/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import error from 'next/error';
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  adminPermissions?: {
    canUpdateUserInfo: boolean;
    canDeleteUsers: boolean;
  };
}
export default function ProfilePage() {
  const { status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetchUserProfile();
    }
  }, [status, router]);
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const userData = await response.json();
      setUserProfile(userData);
      setName(userData.name || '');
      setEmail(userData.email || '');
      setLoading(false);
    } catch {
      setErrorMsg('Failed to load profile data');
      setLoading(false);
    }
  };
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }
    const updateData: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    } = {};
    if (name && name !== userProfile?.name) updateData.name = name;
    if (email && email !== userProfile?.email) updateData.email = email;
    if (newPassword) {
      updateData.currentPassword = currentPassword;
      updateData.newPassword = newPassword;
    }
    if (Object.keys(updateData).length === 0) {
      setSuccessMsg('No changes to save');
      return;
    }
    try {
      setUpdating(true);
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      setSuccessMsg('Profile updated successfully');
      if (updateData.name || updateData.email) {
        await update();
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (_error) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    } finally {
      setUpdating(false);
    }
  };
  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMsg}
        </div>
      )}
      <div className="bg-card rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center mb-6">
          {userProfile?.image ? (
            <Image
              src={userProfile.image}
              alt={userProfile.name}
              width={64}
              height={64}
              className="rounded-full mr-4"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mr-4">
              <span className="text-xl font-bold">
                {userProfile?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{userProfile?.name}</h2>
            <p className="text-muted-foreground">{userProfile?.email}</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
              {userProfile?.role}
            </span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Your email"
              />
            </div>
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-medium mb-2">Change Password</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Leave blank if you don&apos;t want to change your password.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    placeholder="Your current password"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    placeholder="New password"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
