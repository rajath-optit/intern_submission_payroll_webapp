import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Check, X, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const { data: expensesData, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const employeeIds = [...new Set((expensesData || []).map(e => e.employee_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', employeeIds);
      
      const expensesWithProfiles = (expensesData || []).map(exp => ({
        ...exp,
        profiles: profiles?.find(p => p.id === exp.employee_id)
      }));
      setExpenses(expensesWithProfiles);
    } catch (error) { console.error('Error:', error); toast.error('Failed to load expenses'); } finally { setLoading(false); }
  };

  const handleStatusUpdate = async (expenseId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('expenses').update({ status: newStatus, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', expenseId);
      if (error) throw error;
      toast.success(`Expense ${newStatus}`);
      fetchExpenses();
    } catch (error) { console.error('Error:', error); toast.error('Failed to update'); }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) || expense.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (statusFilter === 'all' || expense.status === statusFilter);
  });

  const getCategoryColor = (cat: string) => ({ travel: 'bg-blue-500/20 text-blue-400', meals: 'bg-orange-500/20 text-orange-400', supplies: 'bg-purple-500/20 text-purple-400', equipment: 'bg-green-500/20 text-green-400', other: 'bg-gray-500/20 text-gray-400' }[cat] || 'bg-gray-500/20 text-gray-400');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl lg:text-3xl font-bold mb-2">Expense Management</h1><p className="text-muted-foreground">Review and manage employee expense submissions</p></div>
      <div className="flex flex-col sm:flex-row gap-4"><div className="relative flex-1 max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-11" /></div><div className="flex items-center gap-2"><Filter className="w-4 h-4 text-muted-foreground" /><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40 form-input"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="glass-card p-4"><p className="text-sm text-muted-foreground mb-1">Pending Review</p><p className="text-2xl font-bold text-warning">{expenses.filter(e => e.status === 'pending').length}</p></div><div className="glass-card p-4"><p className="text-sm text-muted-foreground mb-1">Approved</p><p className="text-2xl font-bold text-success">{expenses.filter(e => e.status === 'approved').length}</p></div><div className="glass-card p-4"><p className="text-sm text-muted-foreground mb-1">Total Amount</p><p className="text-2xl font-bold">${expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()}</p></div></div>
      <div className="glass-card overflow-hidden"><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Employee</th><th>Title</th><th>Amount</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
          <tr key={expense.id}><td><div><p className="font-medium">{expense.profiles?.full_name}</p><p className="text-xs text-muted-foreground">{expense.profiles?.email}</p></div></td><td><div><p className="font-medium">{expense.title}</p>{expense.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{expense.description}</p>}</div></td><td className="font-mono font-bold">${Number(expense.amount).toLocaleString()}</td><td><span className={`status-badge ${getCategoryColor(expense.category)}`}>{expense.category}</span></td><td>{new Date(expense.expense_date).toLocaleDateString()}</td><td><span className={`status-badge status-${expense.status}`}>{expense.status}</span></td><td>{expense.status === 'pending' ? <div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={() => handleStatusUpdate(expense.id, 'approved')} className="hover:bg-success/20 hover:text-success"><Check className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleStatusUpdate(expense.id, 'rejected')} className="hover:bg-destructive/20 hover:text-destructive"><X className="w-4 h-4" /></Button></div> : <span className="text-xs text-muted-foreground">{expense.status}</span>}</td></tr>
        )) : <tr><td colSpan={7} className="text-center text-muted-foreground py-12">No expenses found</td></tr>}
      </tbody></table></div></div>
    </div>
  );
}
