'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Shield, User } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { Badge } from '@workspace/ui/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/ui/avatar';
import { Card } from '@workspace/ui/components/ui/card';
import {
  RadioGroup,
  RadioGroupItem,
} from '@workspace/ui/components/ui/radio-group';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from '@workspace/ui/components/ui/field';
import { useMemberManagement } from '../../hooks/use-member-management';
import { inviteMemberAction } from '../../../actions/organization-management.actions';
import { UserProfile } from '../../../shared/dtos';
import { cn } from '@workspace/ui/lib/utils';

interface MemberInvitationFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export function MemberInvitationForm({
  organizationId,
  onSuccess,
}: MemberInvitationFormProps) {
  const [email, setEmail] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [role, setRole] = useState<'admin' | 'member'>('admin');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    searchUserByEmail,
    isMember,
    hasPendingInvitation,
    canInviteMembers,
  } = useMemberManagement();

  // Email search (debouncing)
  useEffect(() => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUserByEmail(email);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [email, searchUserByEmail]);

  const handleUserSelect = (user: UserProfile) => {
    if (isMember(user.email)) {
      return;
    }

    if (hasPendingInvitation(user.email)) {
      return;
    }

    // Duplicate check
    if (selectedUsers.some(u => u.userId === user.userId)) {
      return;
    }

    setSelectedUsers(prev => [...prev, user]);
    setEmail('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.userId !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      return;
    }

    if (!canInviteMembers) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Invite multiple users (sequential processing)
      for (const user of selectedUsers) {
        await inviteMemberAction({
          organizationId,
          inviteeEmail: user.email,
          role,
        });
      }

      // Reset form
      setSelectedUsers([]);
      setRole('admin');
      onSuccess?.();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Search users by email</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="pl-9"
            disabled={isSubmitting}
          />
        </div>

        {/* Search results preview */}
        {searchResults.length > 0 && (
          <Card className="mt-2 p-2 max-h-[200px] overflow-y-auto">
            <div className="space-y-1">
              {searchResults.map(user => {
                const isAlreadyMember = isMember(user.email);
                const isPending = hasPendingInvitation(user.email);
                const isAlreadySelected = selectedUsers.some(
                  u => u.userId === user.userId
                );
                const isDisabled =
                  isAlreadyMember || isPending || isAlreadySelected;

                return (
                  <button
                    key={user.userId}
                    type="button"
                    onClick={() => !isDisabled && handleUserSelect(user)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
                      isDisabled && 'opacity-50 cursor-not-allowed bg-muted'
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    {isAlreadyMember && (
                      <Badge variant="secondary" className="text-xs">
                        Member
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant="outline" className="text-xs">
                        Invited
                      </Badge>
                    )}
                    {isAlreadySelected && (
                      <Badge variant="outline" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {isSearching && (
          <p className="text-sm text-muted-foreground">Searching...</p>
        )}
      </div>

      {/* Selected member list (Badge) - Workspace style */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <Label>Members to invite ({selectedUsers.length})</Label>
          <div className="flex flex-wrap gap-2 p-3 border border-border/30 rounded-md bg-muted/30">
            {selectedUsers.map(user => (
              <Badge
                key={user.userId}
                variant="secondary"
                className="flex items-center gap-1 py-1.5 pr-1"
              >
                <Avatar className="h-4 w-4 mr-1">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback className="text-[8px]">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{user.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.userId)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <FieldGroup>
        <FieldSet>
          <FieldLabel htmlFor="role">Select Role</FieldLabel>
          <FieldDescription>
            Choose the role for the invited members.
          </FieldDescription>
          <RadioGroup
            value={role}
            onValueChange={(v: 'admin' | 'member') => setRole(v)}
          >
            <FieldLabel htmlFor="admin-role">
              <Field orientation="horizontal">
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <FieldTitle>Admin</FieldTitle>
                  </div>
                  <FieldDescription>
                    Can invite and manage members. Has permission to change
                    organization settings.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="admin" id="admin-role" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="member-role">
              <Field orientation="horizontal">
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <FieldTitle>Member</FieldTitle>
                  </div>
                  <FieldDescription>
                    Can create and edit organization content. Has general
                    collaboration permissions.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="member" id="member-role" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </FieldSet>
      </FieldGroup>

      <Button
        type="submit"
        className="w-full"
        disabled={selectedUsers.length === 0 || isSubmitting}
      >
        {isSubmitting
          ? 'Inviting...'
          : `Send ${selectedUsers.length} invitation${selectedUsers.length > 1 ? 's' : ''}`}
      </Button>
    </form>
  );
}
