import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MyExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', amount: '', category: 'other', expense_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { if (user) fetchExpenses(); }, [user]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase.from('expenses').select('*').eq('employee_id', user?.id).order('created_at', { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) { console.error('Error:', error); toast.error('Failed to load expenses'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) { toast.error('Please fill in all required fields'); return; }
    try {
      const { error } = await supabase.from('expenses').insert({ employee_id: user?.id, title: formData.title.trim(), description: formData.description.trim(), amount: parseFloat(formData.amount), category: formData.category, expense_date: formData.expense_date });
      if (error) throw error;
      toast.success('Expense submitted successfully');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', amount: '', category: 'other', expense_date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (error: any) { console.error('Error:', error); toast.error(error.message || 'Failed to submit'); }
  };

  const getCategoryColor = (cat: string) => ({ travel: 'bg-blue-500/20 text-blue-400', meals: 'bg-orange-500/20 text-orange-400', supplies: 'bg-purple-500/20 text-purple-400', equipment: 'bg-green-500/20 text-green-400', other: 'bg-gray-500/20 text-gray-400' }[cat] || 'bg-gray-500/20 text-gray-400');

  const stats = { total: expenses.length, pending: expenses.filter(e => e.status === 'pending').length, approved: expenses.filter(e => e.status === 'approved').length, totalAmount: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0) };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl lg:text-3xl font-bold mb-2">My Expenses</h1><p className="text-muted-foreground">Submit and track your expense claims</p></div><Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Submit Expense</Button></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><div className="glass-card p-4"><p className="text-sm text-muted-foreground mb-1">Total Submitted</p><p className="text-2xl font-bold">{stats.total}</p></div><div className="glass-card p-4"><p className="text-sm text-muted-foreground mb-1">Pending</p><p className="text-2xl font-bold text-warning">{stats.pending}</p></div><div className="glass-card p-4"><p className="text-sm text-muted-foreground mb-1">Approved</p><p className="text-2xl font-bold text-success">{stats.approved}</p></div><div className="glass-card p-4"><p className="text-sm text-muted-foreground mb-1">Total Reimbursed</p><p className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</p></div></div>
      {expenses.length > 0 ? (<div className="glass-card overflow-hidden"><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Title</th><th>Amount</th><th>Category</th><th>Date</th><th>Status</th></tr></thead><tbody>{expenses.map((expense) => (<tr key={expense.id}><td><div><p className="font-medium">{expense.title}</p>{expense.description && <p className="text-xs text-muted-foreground truncate max-w-[250px]">{expense.description}</p>}</div></td><td className="font-mono font-bold">${Number(expense.amount).toLocaleString()}</td><td><span className={`status-badge ${getCategoryColor(expense.category)}`}>{expense.category}</span></td><td>{new Date(expense.expense_date).toLocaleDateString()}</td><td><span className={`status-badge status-${expense.status}`}>{expense.status}</span></td></tr>))}</tbody></table></div></div>) : (<div className="glass-card p-12 text-center"><Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No Expenses Yet</h3><p className="text-muted-foreground mb-6">Start by submitting your first expense claim.</p><Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Submit Expense</Button></div>)}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}><DialogContent className="sm:max-w-lg bg-card border-border"><DialogHeader><DialogTitle>Submit Expense</DialogTitle></DialogHeader><form onSubmit={handleSubmit} className="space-y-5 mt-4"><div><label className="form-label">Title *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="form-input" placeholder="e.g., Business lunch" required /></div><div><label className="form-label">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-input min-h-[80px] resize-none" placeholder="Additional details..." /></div><div className="grid grid-cols-2 gap-4"><div><label className="form-label">Amount ($) *</label><input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="form-input" placeholder="150.00" step="0.01" min="0.01" required /></div><div><label className="form-label">Category</label><Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}><SelectTrigger className="form-input"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="travel">Travel</SelectItem><SelectItem value="meals">Meals</SelectItem><SelectItem value="supplies">Supplies</SelectItem><SelectItem value="equipment">Equipment</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div></div><div><label className="form-label">Expense Date</label><input type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} className="form-input" required /></div><div className="flex gap-3 pt-4"><Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" className="flex-1">Submit</Button></div></form></DialogContent></Dialog>
    </div>
  );
}
