"use client";

import { useUserManagement } from '../hooks/use-user-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/ui/dialog';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/ui/tabs';
import { OrganizationForm } from './OrganizationForm';
import { OrganizationList } from './OrganizationList';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { currentUser, userOrganizationView } = useUserManagement();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">프로필</TabsTrigger>
            <TabsTrigger value="organization">조직</TabsTrigger>
            <TabsTrigger value="members">멤버</TabsTrigger>
            <TabsTrigger value="workspaces">워크스페이스</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" defaultValue={currentUser?.name || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" defaultValue={currentUser?.email || ''} disabled />
            </div>
            <Button>프로필 저장</Button>
          </TabsContent>

          <TabsContent value="organization" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">조직 생성</h3>
                <OrganizationForm />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">조직 목록</h3>
                <OrganizationList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              멤버 관리 기능 (추후 구현)
            </div>
          </TabsContent>

          <TabsContent value="workspaces" className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              워크스페이스 관리 기능 (추후 구현)
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}