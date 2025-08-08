"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ArrowLeft } from "lucide-react";
import {
  createWorkspace,
  type CreateWorkspaceInput,
} from "../actions/workspace.action";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateWorkspaceInput>({
    name: "",
    description: "",
    template: "blank",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("워크스페이스 이름을 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await createWorkspace(formData);

      if (result.success) {
        // 생성된 워크스페이스로 이동
        router.push(`/canvas/${result.data.id}/workflow`);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("워크스페이스 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateWorkspaceInput,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            새 워크스페이스 만들기
          </h1>
          <p className="text-muted-foreground">
            새로운 캔버스를 시작할 워크스페이스를 만들어보세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>
              워크스페이스의 이름을 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">워크스페이스 이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="예: 마케팅 캠페인 워크플로우"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택사항)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="워크스페이스에 대한 간단한 설명을 입력해주세요"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            취소
          </Button>
          <Button type="submit" disabled={loading || !formData.name.trim()}>
            {loading ? "생성 중..." : "워크스페이스 만들기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
