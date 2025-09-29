"use client";

import { useUserManagement } from '../hooks/use-user-management';
import { OrganizationSelector } from './OrganizationSelector';
import { Button } from '@workspace/ui/components/ui/button';
import { Settings, Plus, Users } from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const { currentUser, userOrganizationView } = useUserManagement();
  const [showSettings, setShowSettings] = useState(false);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* 사용자 프로필 섹션 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {currentUser.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentUser.email}
            </p>
          </div>
        </div>
      </div>

      {/* 조직 선택기 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          조직
        </h3>
        <OrganizationSelector
          value={userOrganizationView?.currentOrganization?.id}
          onValueChange={(orgId) => {
            // 조직 전환 로직
            console.log('조직 전환:', orgId);
          }}
        />
      </div>

      {/* 액션 버튼들 */}
      <div className="p-4 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          설정
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 워크스페이스
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          <Users className="w-4 h-4 mr-2" />
          멤버 관리
        </Button>
      </div>
    </div>
  );
}