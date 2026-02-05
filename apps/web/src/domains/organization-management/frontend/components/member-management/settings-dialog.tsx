'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  Users,
  UserCircle,
  Building2,
  UserPlus,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { Button } from '@workspace/ui/components/ui/button';
import { Label } from '@workspace/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { Separator } from '@workspace/ui/components/ui/separator';
import { Slider } from '@workspace/ui/components/ui/slider';
import { Input } from '@workspace/ui/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/ui/avatar';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { toast } from '@workspace/ui/components/ui/sonner';
import { MemberList } from './member-list';
import { InviteMemberDialog } from './invite-member-dialog';
import { useMemberManagementContext } from '../../contexts/member-management-context';
import { useMemberManagement } from '../../hooks/use-member-management';
import { useUIPreferences } from '@/contexts/ui-preferences-context';
import { cn } from '@workspace/ui/lib/utils';
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/domains/youtube-app-space/shared/value-objects/language-code.vo';
import { useMyProfile } from '@/domains/user-management/frontend/hooks/use-my-profile';
import { useUpdateMyProfile } from '@/domains/user-management/frontend/hooks/use-update-my-profile';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';
import { useOrganization } from '../../hooks/use-organization';
import { useOrganizationQuery } from '../../hooks/use-organization-query';
import { useUpdateOrganization } from '../../hooks/use-update-organization';

const PREFERRED_LANGUAGE_KEY = 'ssota_language';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

type SettingsTab = 'general' | 'members' | 'profile' | 'preferences';

export function SettingsDialog({
  open,
  onOpenChange,
  organizationId,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('members');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');
  const [localProfileName, setLocalProfileName] = useState('');
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const [localOrgName, setLocalOrgName] = useState('');
  const [localOrgIconUrl, setLocalOrgIconUrl] = useState<string | null>(null);
  const orgFileInputRef = useRef<HTMLInputElement>(null);
  const { refreshOrganizationMembers } = useMemberManagementContext();
  const { refreshOrganizations } = useOrganization();
  const { canInviteMembers } = useMemberManagement();
  const { mouseSensitivity, setMouseSensitivity } = useUIPreferences();

  const profileEnabled = open && activeTab === 'profile';
  const { data: profile, isLoading: profileLoading, isError: profileError, error: profileErrorDetail } = useMyProfile(profileEnabled);
  const { updateProfile, isUpdating: profileSaving } = useUpdateMyProfile({
    onSuccess: () => {
      toast.success('Profile updated');
      refreshOrganizationMembers(organizationId);
    },
  });
  const { upload, isUploading: profileUploading } = useSupabaseStorage();

  const generalEnabled = open && activeTab === 'general';
  const { data: org, isLoading: orgLoading } = useOrganizationQuery(
    organizationId,
    generalEnabled
  );
  const { updateOrganization, isUpdating: orgSaving } = useUpdateOrganization({
    onSuccess: () => {
      toast.success('Organization settings saved');
      refreshOrganizations();
    },
  });
  const { upload: uploadOrgIcon, isUploading: orgIconUploading } =
    useSupabaseStorage();

  // Sync local name from profile when profile loads
  useEffect(() => {
    if (profile?.name != null) setLocalProfileName(profile.name);
    else if (profile && profile.name === null) setLocalProfileName('');
  }, [profile?.name, profile]);

  // Sync preferred language from localStorage when dialog opens
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const stored = localStorage.getItem(PREFERRED_LANGUAGE_KEY);
      if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
        setPreferredLanguage(stored as SupportedLanguage);
      }
    }
  }, [open]);

  const handlePreferredLanguageChange = (value: string) => {
    setPreferredLanguage(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREFERRED_LANGUAGE_KEY, value);
    }
  };

  // Load member data when dialog opens
  useEffect(() => {
    if (open && organizationId) {
      refreshOrganizationMembers(organizationId);
    }
  }, [open, organizationId, refreshOrganizationMembers]);

  const handleSaveProfile = useCallback(async () => {
    try {
      await updateProfile({ name: localProfileName.trim() || undefined });
    } catch {
      toast.error('Failed to update profile');
    }
  }, [updateProfile, localProfileName]);

  const handleProfileAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !profile?.userId) return;
      e.target.value = '';
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `users/${profile.userId}/${Date.now()}.${ext}`;
        const result = await upload({
          bucket: StorageBucket.USER_AVATARS,
          file,
          path,
        });
        // upload() throws on failure; result is always success here
        await updateProfile({ avatarUrl: result.url });
        toast.success('Profile photo updated');
      } catch {
        toast.error('Failed to update profile photo');
      }
    },
    [profile?.userId, upload, updateProfile]
  );

  // Sync General tab form from org when org loads
  useEffect(() => {
    if (org) {
      setLocalOrgName(org.name);
      setLocalOrgIconUrl(org.iconUrl ?? null);
    }
  }, [org]);

  const handleSaveGeneral = useCallback(async () => {
    try {
      await updateOrganization({
        organizationId,
        name: localOrgName.trim() || undefined,
        iconUrl: localOrgIconUrl,
      });
    } catch {
      toast.error('Failed to save organization settings');
    }
  }, [updateOrganization, organizationId, localOrgName, localOrgIconUrl]);

  const handleOrgIconUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `organizations/${organizationId}/${Date.now()}.${ext}`;
        const result = await uploadOrgIcon({
          bucket: StorageBucket.USER_AVATARS,
          file,
          path,
        });
        setLocalOrgIconUrl(result.url);
      } catch {
        toast.error('Upload failed');
      }
    },
    [organizationId, uploadOrgIcon]
  );

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Building2 },
    { id: 'preferences' as const, label: 'Preferences', icon: SlidersHorizontal },
    { id: 'members' as const, label: 'Members', icon: Users },
    { id: 'profile' as const, label: 'Profile', icon: UserCircle },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-0 top-0 right-0 bottom-0 w-full max-w-[100vw] h-dvh p-0 gap-0 overflow-hidden rounded-none translate-x-0 translate-y-0 md:left-1/2 md:top-1/2 md:right-auto md:bottom-auto md:max-w-6xl md:h-[85vh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-md"
        overlayClassName="backdrop-blur-sm"
      >
        <div className="flex flex-col md:flex-row h-full min-h-0 min-w-0">
          {/* Left Sidebar - desktop only */}
          <div className="hidden md:flex w-56 shrink-0 border-r border-border/30 bg-muted/30 p-4 flex-col">
            <DialogHeader className="mb-4 shrink-0">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                Settings
              </DialogTitle>
            </DialogHeader>
            <nav className="space-y-1 shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                    activeTab === tab.id
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {/* Mobile tab bar - visible only on small screens, horizontal scroll */}
            <div className="relative md:hidden shrink-0 min-w-0 w-full max-w-full border-b bg-background overflow-hidden">
              <div
                className="flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden px-3 py-2 sticky top-0 z-10 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 w-full max-w-full min-w-0"
                style={{ WebkitOverflowScrolling: 'touch' }}
                role="tablist"
                aria-label="Settings sections"
              >
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <tab.icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <ScrollArea className="h-full w-full min-w-0">
              <div className="p-4 pb-8 md:p-6 md:pb-8 min-h-full min-w-0">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Organization Settings
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Manage your organization&apos;s name and icon.
                      </p>
                    </div>
                    <Separator />
                    {orgLoading ? (
                      <div className="space-y-6 max-w-sm">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Avatar className="size-24">
                            <AvatarFallback asChild>
                              <Skeleton className="size-full rounded-full" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 max-w-sm">
                        <div className="grid gap-2">
                          <Label htmlFor="org-name">Organization Name</Label>
                          <Input
                            id="org-name"
                            value={localOrgName}
                            onChange={e => setLocalOrgName(e.target.value)}
                            disabled={orgSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Organization Icon</Label>
                          <div className="flex flex-wrap items-center gap-3">
                            <Avatar className="size-24">
                              {localOrgIconUrl ? (
                                <AvatarImage
                                  src={localOrgIconUrl}
                                  alt="Organization"
                                  className="object-cover"
                                />
                              ) : null}
                              <AvatarFallback className="text-2xl bg-muted">
                                <Building2 className="size-12 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <input
                              type="file"
                              accept="image/*"
                              ref={orgFileInputRef}
                              onChange={handleOrgIconUpload}
                              className="hidden"
                              aria-hidden
                            />
                            <Button
                              variant="outline"
                              onClick={() => orgFileInputRef.current?.click()}
                              disabled={orgIconUploading || orgSaving}
                            >
                              {orgIconUploading ? 'Uploading...' : 'Change Icon'}
                            </Button>
                            {localOrgIconUrl && (
                              <Button
                                variant="ghost"
                                onClick={() => setLocalOrgIconUrl(null)}
                                disabled={orgSaving}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={handleSaveGeneral}
                          disabled={orgSaving}
                        >
                          {orgSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6 max-w-sm">
                    <div>
                      <h2 className="text-lg font-semibold">Preferences</h2>
                      <p className="text-sm text-muted-foreground">
                        Customize your interface experience.
                      </p>
                    </div>
                    <Separator />

                    {/* Preferred Language */}
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="preferred-language">
                          Preferred Language
                        </Label>
                        <Select
                          value={preferredLanguage}
                          onValueChange={handlePreferredLanguageChange}
                        >
                          <SelectTrigger id="preferred-language" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_LANGUAGES.map(code => (
                              <SelectItem key={code} value={code}>
                                {LANGUAGE_NAMES[code] || code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[0.8rem] text-muted-foreground">
                          Interface language. Same as the one chosen during onboarding.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Canvas Pan Sensitivity */}
                    <div className="space-y-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 shrink-0">
                          Canvas Pan Sensitivity
                        </label>
                        <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
                          {mouseSensitivity.toFixed(1)}x
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="text-xs text-muted-foreground shrink-0">
                          Static
                        </span>
                        <Slider
                          value={[mouseSensitivity]}
                          min={0.1}
                          max={2}
                          step={0.1}
                          onValueChange={([val]) => val !== undefined && setMouseSensitivity(val)}
                          className="flex-1 min-w-0"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">
                          Dynamic
                        </span>
                      </div>

                      <p className="text-[0.8rem] text-muted-foreground">
                        Adjusts the speed of canvas panning when using trackpad or
                        scroll gestures.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="space-y-6 min-w-0 w-full">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold">
                          Member Management
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Invite and manage organization members.
                        </p>
                      </div>
                      {canInviteMembers && (
                        <Button
                          onClick={() => setIsInviteDialogOpen(true)}
                          className="gap-2 w-full sm:w-auto sm:shrink-0"
                        >
                          <UserPlus className="h-4 w-4" />
                          Invite Member
                        </Button>
                      )}
                    </div>
                    <Separator />

                    {/* Member List */}
                    <MemberList />
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold">Profile Settings</h2>
                      <p className="text-sm text-muted-foreground">
                        Manage your user profile. This name was set during onboarding and can be changed here.
                      </p>
                    </div>
                    <Separator />
                    {profileLoading ? (
                      <div className="space-y-6 max-w-sm">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Avatar className="size-24">
                            <AvatarFallback asChild>
                              <Skeleton className="size-full rounded-full" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    ) : profileError ? (
                      <p className="text-sm text-destructive">
                        {profileErrorDetail?.message ?? 'Failed to load profile'}
                      </p>
                    ) : (
                      <div className="space-y-6 max-w-sm">
                        <div className="grid gap-2">
                          <Label htmlFor="profile-name">Display name</Label>
                          <Input
                            id="profile-name"
                            value={localProfileName}
                            onChange={e => setLocalProfileName(e.target.value)}
                            placeholder="Your name"
                            disabled={profileSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Profile photo</Label>
                          <div className="flex flex-wrap items-center gap-3">
                            <Avatar className="size-24">
                              {profile?.profileImageUrl ? (
                                <AvatarImage
                                  src={profile.profileImageUrl}
                                  alt="Profile"
                                  className="object-cover"
                                />
                              ) : null}
                              <AvatarFallback className="text-2xl bg-muted">
                                {localProfileName
                                  ? localProfileName
                                    .trim()
                                    .split(/\s+/)
                                    .map(s => s[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase() || '?'
                                  : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <input
                              type="file"
                              accept="image/*"
                              ref={profileFileInputRef}
                              onChange={handleProfileAvatarUpload}
                              className="hidden"
                              aria-hidden
                            />
                            <Button
                              variant="outline"
                              onClick={() => profileFileInputRef.current?.click()}
                              disabled={profileUploading || profileSaving}
                            >
                              {profileUploading ? 'Uploading...' : 'Change photo'}
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={profileSaving || localProfileName.trim() === ''}
                        >
                          {profileSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      {/* Member Invite Dialog */}
      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        organizationId={organizationId}
        onSuccess={() => {
          refreshOrganizationMembers(organizationId);
        }}
      />
    </Dialog>
  );
}
