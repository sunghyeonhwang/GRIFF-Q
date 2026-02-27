"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RetroSubmitChartProps {
  data: { project: string; submitted: number; total: number }[];
}

export function RetroSubmitChart({ data }: RetroSubmitChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">회고 제출률</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis
                type="number"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="project"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--popover-foreground)",
                }}
                formatter={(value, name) => [
                  `${value}명`,
                  name === "submitted" ? "제출" : "전체",
                ]}
              />
              <Bar
                dataKey="total"
                fill="var(--secondary)"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="submitted"
                fill="var(--brand)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            회고 데이터 없음
          </p>
        )}
      </CardContent>
    </Card>
  );
}
