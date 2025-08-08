"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Plus, Trash2, Calendar } from "lucide-react";
import {
  getUserWorkspaces,
  deleteWorkspace,
} from "../actions/workspace.action";

interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const result = await getUserWorkspaces();

      if (result.success) {
        setWorkspaces(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("워크스페이스를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm("정말로 이 워크스페이스를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const result = await deleteWorkspace(workspaceId);
      if (result.success) {
        setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("워크스페이스 삭제에 실패했습니다");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">워크스페이스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadWorkspaces} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">내 캔버스</h1>
          <p className="text-muted-foreground">
            워크스페이스를 관리하고 새로운 캔버스를 만들어보세요
          </p>
        </div>
        <Link href="/canvas/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />새 워크스페이스
          </Button>
        </Link>
      </div>

      {/* 워크스페이스 목록 */}
      {workspaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            워크스페이스가 없습니다
          </h3>
          <p className="text-muted-foreground mb-4">
            첫 번째 워크스페이스를 만들어 캔버스를 시작해보세요
          </p>
          <Link href="/canvas/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              워크스페이스 만들기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{workspace.name}</CardTitle>
                    {workspace.description && (
                      <CardDescription className="text-sm">
                        {workspace.description}
                      </CardDescription>
                    )}
                    <Badge className="bg-blue-100 text-blue-800">
                      워크스페이스
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWorkspace(workspace.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(workspace.created_at)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link href={`/canvas/${workspace.id}/workflow`}>
                    <Button size="sm" className="w-full">
                      캔버스 열기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
