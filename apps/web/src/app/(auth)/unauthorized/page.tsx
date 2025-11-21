'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">권한이 없습니다</CardTitle>
          <CardDescription>
            이 페이지에 접근할 권한이 없습니다. 로그인이 필요하거나 접근 권한이
            없는 페이지입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            onClick={() => router.back()}
            variant="default"
            className="w-full"
          >
            돌아가기
          </Button>
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="w-full"
          >
            로그인 페이지로 이동
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
