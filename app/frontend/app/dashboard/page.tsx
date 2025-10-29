'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

function MetricCard({ title, value, icon, trend }: {
  title: string
  value: number
  icon: React.ReactNode
  trend?: number
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(value)}</div>
        {trend !== undefined && (
          <p className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: cashPulse, isLoading } = useQuery({
    queryKey: ['dashboard', 'cash-pulse'],
    queryFn: () => dashboardApi.cashPulse().then(res => res.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cash Pulse</h1>
        <p className="text-muted-foreground">
          Real-time financial overview and key metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Cash Position"
          value={cashPulse?.cash_position || 0}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={5.2}
        />
        <MetricCard
          title="Total AR"
          value={cashPulse?.total_ar || 0}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend={-2.1}
        />
        <MetricCard
          title="Overdue AR"
          value={cashPulse?.overdue_ar || 0}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          trend={-8.3}
        />
        <MetricCard
          title="AP Due (7d)"
          value={cashPulse?.ap_due_7d || 0}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          trend={1.5}
        />
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Net Cash Flow (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashPulse?.daily_net_cash || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-IN')}
                formatter={(value: number) => [formatCurrency(value), 'Net Cash']}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Create Quote</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate a new quote for customers
            </p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Record Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manually record a customer payment
            </p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Upload Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Process vendor invoice with OCR
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
