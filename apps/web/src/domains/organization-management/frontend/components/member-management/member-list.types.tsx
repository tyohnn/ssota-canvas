'use client';

import React from 'react';
import { Crown, Shield, User } from 'lucide-react';

export type MemberRow = {
  id: string;
  type: 'member' | 'pending';
  userId?: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  role: 'owner' | 'admin' | 'member';
  dateLabel: string;
  inviterName?: string;
};

export function getRoleIcon(
  role: 'owner' | 'admin' | 'member'
): React.ReactElement {
  switch (role) {
    case 'owner':
      return <Crown className="h-4 w-4" />;
    case 'admin':
      return <Shield className="h-4 w-4" />;
    case 'member':
      return <User className="h-4 w-4" />;
  }
}

export function getRoleLabel(role: 'owner' | 'admin' | 'member'): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'member':
      return 'Member';
  }
}
