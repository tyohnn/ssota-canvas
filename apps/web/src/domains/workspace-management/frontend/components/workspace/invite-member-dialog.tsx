'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X, UserPlus, Mail } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from '@workspace/ui/components/ui/sonner';
import { useWorkspace } from '../../hooks/use-workspace';
import type { OrganizationMemberSearchResultDTO } from '../../../shared/dtos';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  onSuccess?: () => void;
  showSkipButton?: boolean; // Whether to show skip button
}

/**
 * InviteMemberDialog component (Scenario 3)
 *
 * Workspace member invitation modal
 * - Email search and preview
 * - Multi-selection (Badge list)
 * - Invite multiple members at once
 * - Toast feedback
 */
export function InviteMemberDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  onSuccess,
  showSkipButton = false,
}: InviteMemberDialogProps) {
  const { inviteMembers, searchOrganizationMembers, isLoading } =
    useWorkspace();
  const [email, setEmail] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<
    OrganizationMemberSearchResultDTO[]
  >([]);
  const [searchResults, setSearchResults] = useState<
    OrganizationMemberSearchResultDTO[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email search (debouncing 300ms)
  useEffect(() => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchOrganizationMembers(workspaceId, email);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [email, workspaceId, searchOrganizationMembers]);

  const handleMemberSelect = (member: OrganizationMemberSearchResultDTO) => {
    if (member.isAlreadyMember) {
      toast.error('Already a member', {
        description: 'This user is already a workspace member.',
      });
      return;
    }

    if (member.hasPendingInvitation) {
      toast.error('Invitation pending', {
        description: 'This user already has a pending invitation.',
      });
      return;
    }

    // Duplicate check
    if (selectedMembers.some(m => m.userId === member.userId)) {
      toast.error('Member already selected');
      return;
    }

    setSelectedMembers(prev => [...prev, member]);
    setEmail('');
    setSearchResults([]);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.userId !== userId));
  };

  const handleSubmit = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setIsSubmitting(true);
    const emails = selectedMembers.map(m => m.email);
    const result = await inviteMembers(workspaceId, emails);
    setIsSubmitting(false);

    if (result !== null) {
      setSelectedMembers([]);
      setEmail('');
      onSuccess?.(); // Call success callback
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setEmail('');
    setSearchResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] rounded-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Member
          </DialogTitle>
          <DialogDescription>
            Invite members to{' '}
            <span className="font-medium">{workspaceName}</span> workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email search field */}
          <div className="space-y-2">
            <Label htmlFor="email">Search organization members by email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-9"
                disabled={isSubmitting || isLoading}
              />
            </div>

            {/* Search results preview */}
            {searchResults.length > 0 && (
              <Card className="mt-2 p-2 max-h-[200px] overflow-y-auto">
                <div className="space-y-1">
                  {searchResults.map(member => {
                    const isAlreadySelected = selectedMembers.some(
                      m => m.userId === member.userId
                    );
                    const isDisabled =
                      member.isAlreadyMember ||
                      member.hasPendingInvitation ||
                      isAlreadySelected;

                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() =>
                          !isDisabled && handleMemberSelect(member)
                        }
                        disabled={isDisabled}
                        className={cn(
                          'w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
                          isDisabled && 'opacity-50 cursor-not-allowed bg-muted'
                        )}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback>
                            {member.name?.[0]?.toUpperCase() ||
                              member.email[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">
                            {member.name || member.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                        {member.isAlreadyMember && (
                          <Badge variant="secondary" className="text-xs">
                            Member
                          </Badge>
                        )}
                        {member.hasPendingInvitation && (
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

            {!isSearching &&
              email.length >= 3 &&
              searchResults.length === 0 && (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  <p>No members found matching "{email}"</p>
                </div>
              )}
          </div>

          {/* Selected member list (Badge) */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Members to invite ({selectedMembers.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 border border-border/30 rounded-md bg-muted/30">
                {selectedMembers.map(member => (
                  <Badge
                    key={member.userId}
                    variant="secondary"
                    className="flex items-center gap-1 py-1.5 pr-1"
                  >
                    <Avatar className="h-4 w-4 mr-1">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {member.name?.[0]?.toUpperCase() ||
                          member.email[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">
                      {member.name || member.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.userId)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                      disabled={isSubmitting || isLoading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
          >
            {showSkipButton ? 'Skip' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || selectedMembers.length === 0}
          >
            {isSubmitting
              ? 'Inviting...'
              : selectedMembers.length > 0
                ? `Invite ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''}`
                : 'Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
