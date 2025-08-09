// 알림/작업 이력
// NotificationItem + CommentItem
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";
import { ScrollArea } from "@/components/atoms/ScrollArea/ScrollArea";
import { Badge } from "@/components/atoms/Badge/Badge";
import { cn } from "@/lib/utils";

export interface ActivityLog {
  id: string | number;
  action: string;
  user: string;
  timestamp: string; // ISO string or formatted text
  status?: "success" | "warning" | "error" | "info";
}

interface ActivityLogPanelProps {
  title?: string;
  logs: ActivityLog[];
  className?: string;
}

export function ActivityLogPanel({
  title = "Activity Log",
  logs,
  className,
}: ActivityLogPanelProps) {
  const getStatusVariant = (status?: ActivityLog["status"]) => {
    switch (status) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">활동 로그가 없습니다.</p>
        ) : (
          <ScrollArea className="h-64 pr-4">
            <ul className="space-y-3">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{log.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {log.user} • {log.timestamp}
                    </span>
                  </div>
                  {log.status && (
                    <Badge variant={getStatusVariant(log.status)}>
                      {log.status}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
