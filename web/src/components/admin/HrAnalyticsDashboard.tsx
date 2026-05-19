import React, { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase'
import { useQuery } from '@tanstack/react-query'
import { format, subMonths, isAfter, startOfMonth } from 'date-fns'
import { Loader2 } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export function HrAnalyticsDashboard() {
  const { data: submissions = [], isLoading: isLoadingSubs } = useQuery({
    queryKey: ['hr_analytics_submissions'],
    queryFn: () => pb.collection('intake_submissions').getFullList({ expand: 'formId' })
  })

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['hr_analytics_tasks'],
    queryFn: () => pb.collection('approval_tasks').getFullList({ expand: 'assignedToId' })
  })

  // 1. Volume by Type (requestsByType)
  const requestsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sub of submissions) {
      const typeName = sub.expand?.formId?.name || sub.type || 'Unknown'
      counts[typeName] = (counts[typeName] || 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [submissions])

  // 2. Monthly Trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5))
    
    // Initialize last 6 months with 0
    const monthsMap: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      monthsMap[format(subMonths(new Date(), i), 'MMM yyyy')] = 0
    }

    for (const sub of submissions) {
      const date = new Date(sub.created)
      if (isAfter(date, sixMonthsAgo) || date.getTime() === sixMonthsAgo.getTime()) {
        const monthStr = format(date, 'MMM yyyy')
        if (monthsMap[monthStr] !== undefined) {
          monthsMap[monthStr]++
        }
      }
    }
    return Object.entries(monthsMap).map(([date, count]) => ({ date, count }))
  }, [submissions])

  // 3. Approver Speed
  const approverSpeed = useMemo(() => {
    const userTimes: Record<string, { totalHours: number; count: number; name: string }> = {}

    for (const task of tasks) {
      if (task.status === 'approved' || task.status === 'rejected' || task.status === 'completed') {
        if (task.completedAt && task.created) {
          const start = new Date(task.created).getTime()
          const end = new Date(task.completedAt).getTime()
          const hours = (end - start) / (1000 * 60 * 60)

          const userId = task.assignedToId
          const userName = task.expand?.assignedToId?.name || 'Unknown'
          
          if (!userTimes[userId]) {
            userTimes[userId] = { totalHours: 0, count: 0, name: userName }
          }
          userTimes[userId].totalHours += hours
          userTimes[userId].count += 1
        }
      }
    }

    return Object.values(userTimes).map(u => ({
      name: u.name,
      hours: Number((u.totalHours / u.count).toFixed(1))
    })).sort((a, b) => a.hours - b.hours)
  }, [tasks])

  if (isLoadingSubs || isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Monthly Trend - Area Chart */}
      <Card className="lg:col-span-8 border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Monthly Request Volume</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribution by Type - Pie Chart */}
      <Card className="lg:col-span-4 border-none shadow-sm flex flex-col">
        <CardHeader>
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Volume by Type</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px] w-full">
          {requestsByType.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs font-bold text-slate-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={requestsByType}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {requestsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Approver Performance - Bar Chart */}
      <Card className="lg:col-span-12 border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Avg. Approval Speed (Hours)</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] w-full">
          {approverSpeed.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs font-bold text-slate-400">Not enough data to calculate speed</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approverSpeed} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
