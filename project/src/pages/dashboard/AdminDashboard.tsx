import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Users, Receipt, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Stats {
  totalEmployees: number;
  totalSalaryPaid: number;
  pendingExpenses: number;
  approvedExpenses: number;
}

interface MonthlyData {
  month: string;
  salary: number;
  expenses: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    totalSalaryPaid: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { count: employeeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: salarySlips } = await supabase
        .from('salary_slips')
        .select('net_salary, month, year')
        .eq('status', 'published');

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      const pendingExpenses = expenses?.filter(e => e.status === 'pending').length || 0;
      const approvedExpenses = expenses?.filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalSalaryPaid = salarySlips?.reduce((sum, s) => sum + Number(s.net_salary || 0), 0) || 0;

      setStats({
        totalEmployees: employeeCount || 0,
        totalSalaryPaid,
        pendingExpenses,
        approvedExpenses,
      });

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const mockMonthlyData = monthNames.map((month) => ({
        month,
        salary: Math.floor(Math.random() * 50000) + 30000,
        expenses: Math.floor(Math.random() * 10000) + 5000,
      }));
      setMonthlyData(mockMonthlyData);
      setRecentExpenses(expenses?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Employees', value: stats.totalEmployees, icon: Users, change: '+12%', positive: true },
    { title: 'Salary Paid', value: `$${stats.totalSalaryPaid.toLocaleString()}`, icon: DollarSign, change: '+8%', positive: true },
    { title: 'Pending Expenses', value: stats.pendingExpenses, icon: Receipt, change: stats.pendingExpenses > 0 ? 'Needs review' : 'All clear', positive: stats.pendingExpenses === 0 },
    { title: 'Approved Expenses', value: `$${stats.approvedExpenses.toLocaleString()}`, icon: TrendingUp, change: '+5%', positive: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your payroll system.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={stat.title} className={`stat-card opacity-0 animate-slide-up stagger-${index + 1}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.positive ? 'text-success' : 'text-warning'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-6">Salary Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="salary" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-6">Expense Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Recent Expense Submissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Amount</th><th>Category</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {recentExpenses.length > 0 ? recentExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="font-medium">{expense.title}</td>
                  <td className="font-mono">${Number(expense.amount).toLocaleString()}</td>
                  <td className="capitalize">{expense.category}</td>
                  <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td><span className={`status-badge status-${expense.status}`}>{expense.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No expenses submitted yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
