import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Receipt, TrendingUp, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalEarned: 0, pendingExpenses: 0, approvedExpenses: 0, lastPaycheck: 0 });
  const [recentSlips, setRecentSlips] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchDashboardData(); }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: salarySlips } = await supabase.from('salary_slips').select('*').eq('employee_id', user?.id).eq('status', 'published').order('year', { ascending: false }).order('month', { ascending: false });
      const { data: expenses } = await supabase.from('expenses').select('*').eq('employee_id', user?.id).order('created_at', { ascending: false });

      const totalEarned = salarySlips?.reduce((sum, s) => sum + Number(s.net_salary || 0), 0) || 0;
      const lastPaycheck = salarySlips?.[0]?.net_salary ? Number(salarySlips[0].net_salary) : 0;
      const pendingExpenses = expenses?.filter(e => e.status === 'pending').length || 0;
      const approvedExpenses = expenses?.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({ totalEarned, pendingExpenses, approvedExpenses, lastPaycheck });
      setRecentSlips(salarySlips?.slice(0, 3) || []);
      setRecentExpenses(expenses?.slice(0, 5) || []);
      setEarningsData(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => ({ month, earnings: Math.floor(Math.random() * 2000) + 4000 })));
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const getMonthName = (month: number) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month - 1];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div><h1 className="text-2xl lg:text-3xl font-bold mb-2">My Dashboard</h1><p className="text-muted-foreground">Track your salary and expense submissions.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ title: 'Total Earned', value: `$${stats.totalEarned.toLocaleString()}`, icon: DollarSign, desc: 'All time earnings' },
          { title: 'Last Paycheck', value: `$${stats.lastPaycheck.toLocaleString()}`, icon: Calendar, desc: 'Most recent salary' },
          { title: 'Pending Expenses', value: stats.pendingExpenses, icon: Receipt, desc: 'Awaiting approval' },
          { title: 'Approved Expenses', value: `$${stats.approvedExpenses.toLocaleString()}`, icon: TrendingUp, desc: 'Total reimbursed' }
        ].map((stat, i) => (
          <div key={stat.title} className={`stat-card opacity-0 animate-slide-up stagger-${i + 1}`}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><stat.icon className="w-6 h-6 text-primary" /></div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.title}</p><p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>
      <div className="glass-card p-6"><h3 className="text-lg font-semibold mb-6">Earnings Overview</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={earningsData}><defs><linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorEarnings)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card overflow-hidden"><div className="p-6 border-b border-border"><h3 className="text-lg font-semibold">Recent Salary Slips</h3></div><div className="p-4 space-y-3">{recentSlips.length > 0 ? recentSlips.map((slip) => (<div key={slip.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"><div><p className="font-medium">{getMonthName(slip.month)} {slip.year}</p><p className="text-sm text-muted-foreground">Net Salary</p></div><p className="text-lg font-bold font-mono">${Number(slip.net_salary).toLocaleString()}</p></div>)) : <div className="text-center py-8 text-muted-foreground">No salary slips available yet</div>}</div></div>
        <div className="glass-card overflow-hidden"><div className="p-6 border-b border-border"><h3 className="text-lg font-semibold">Recent Expenses</h3></div><div className="p-4 space-y-3">{recentExpenses.length > 0 ? recentExpenses.map((expense) => (<div key={expense.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"><div><p className="font-medium">{expense.title}</p><p className="text-sm text-muted-foreground capitalize">{expense.category}</p></div><div className="text-right"><p className="font-mono">${Number(expense.amount).toLocaleString()}</p><span className={`status-badge status-${expense.status}`}>{expense.status}</span></div></div>)) : <div className="text-center py-8 text-muted-foreground">No expenses submitted yet</div>}</div></div>
      </div>
    </div>
  );
}
