"use client";

import * as React from "react";
import { Button } from "@/components/atoms/Button/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";
import { Separator } from "@/components/atoms/Separator/Separator";
import { Badge } from "@/components/atoms/Badge/Badge";
import { cn } from "@/lib/utils";
import { MapPin, Star, Users } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl p-6 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          NoteMap에 오신 것을 환영합니다
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          지도에 원하는 위치를 저장하고, 메모를 남기고, 다른 사람들과
          공유하세요.
        </p>
        <div className="flex justify-center gap-3">
          <Button size="lg">시작하기</Button>
          <Button size="lg" variant="outline">
            더 알아보기
          </Button>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">주요 기능</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-col items-center text-center space-y-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>핀 저장</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-center">
              지도를 탐색하며 마음에 드는 장소를 핀으로 저장하세요.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col items-center text-center space-y-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>즐겨찾기</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-center">
              자주 찾는 장소나 특별한 장소를 즐겨찾기로 관리하세요.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col items-center text-center space-y-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>공유와 협업</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-center">
              저장한 핀과 메모를 다른 사람과 공유하고 함께 편집할 수 있습니다.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Badges or Highlights */}
      <section className="flex flex-wrap justify-center gap-3">
        <Badge variant="secondary">무료로 시작</Badge>
        <Badge variant="secondary">지도 기반</Badge>
        <Badge variant="secondary">팀 협업 지원</Badge>
      </section>
    </main>
  );
}
