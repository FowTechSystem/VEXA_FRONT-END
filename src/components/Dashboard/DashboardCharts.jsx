import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/** Sparkline com gradiente (cards de KPI) */
export function DashboardStatSparkline({ data, color, height = 59 }) {
  const gradId = React.useId().replace(/:/g, "");
  const chartData = useMemo(
    () => (Array.isArray(data) ? data : []).map((v, i) => ({ i, v: Number(v) || 0 })),
    [data],
  );
  if (chartData.length === 0) return null;
  const vals = chartData.map((d) => d.v);
  const maxV = Math.max(...vals, 1);
  const minV = Math.min(...vals, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.42} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="i" hide />
        <YAxis hide domain={[minV * 0.92, maxV * 1.08]} />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2.2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={false}
          isAnimationActive
          animationDuration={700}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TooltipCard({ title, subtitle, theme }) {
  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
        px: 1.25,
        py: 0.85,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 10px 28px rgba(0,0,0,0.45)"
            : `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", display: "block", fontSize: 12 }}>
        {title}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, display: "block", mt: 0.25 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

/** Barras arredondadas — vendas por categoria */
export function DashboardCategoriaBarChart({ items, height, isMobile }) {
  const theme = useTheme();
  const chartData = useMemo(
    () =>
      (Array.isArray(items) ? items : []).map((item) => ({
        name: item.categoria,
        value: Number(item.quantidade ?? item.valor ?? 0) || 0,
        fill: item.cor,
      })),
    [items],
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 12, left: isMobile ? 4 : 8, bottom: 8 }} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={alpha(theme.palette.divider, 0.85)} />
        <XAxis
          dataKey="name"
          tick={{ fill: theme.palette.text.secondary, fontSize: isMobile ? 10 : 11, fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: theme.palette.divider }}
        />
        <YAxis
          tick={{ fill: theme.palette.text.secondary, fontSize: isMobile ? 10 : 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K` : String(v))}
        />
        <Tooltip
          cursor={{ fill: alpha(theme.palette.primary.main, 0.08) }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload;
            const item = items.find((x) => x.categoria === row.name);
            const sub =
              item?.quantidade != null
                ? `${item.quantidade} un. · ${item.percentual ?? 0}%`
                : `R$ ${Number(item?.valor ?? 0).toLocaleString("pt-BR")} · ${item?.percentual ?? 0}%`;
            return <TooltipCard title={row.name} subtitle={sub} theme={theme} />;
          }}
        />
        <Bar dataKey="value" radius={[10, 10, 4, 4]} maxBarSize={52} isAnimationActive animationDuration={800}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donut minimalista com cantos suaves nas fatias */
export function DashboardDonutChart({
  data,
  height,
  dataKey = "value",
  nameKey = "name",
  innerRadius = "62%",
  outerRadius = "88%",
  padAngle = 1.2,
  cornerRadius = 3,
  strokeWidth = 2,
  tooltipFormatter,
}) {
  const theme = useTheme();
  const list = Array.isArray(data) ? data : [];
  const stroke = theme.palette.background.paper;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={list}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={padAngle}
          cornerRadius={cornerRadius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
        >
          {list.map((entry, i) => (
            <Cell key={i} fill={entry.fill ?? entry.color ?? theme.palette.primary.main} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0];
            const raw = p.payload;
            const title = raw[nameKey] ?? p.name;
            const subtitle = tooltipFormatter ? tooltipFormatter(raw, p) : `${p.value}%`;
            return <TooltipCard title={title} subtitle={subtitle} theme={theme} />;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
