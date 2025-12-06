import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SalarySlips() {
  const { user } = useAuth();
  const [salarySlips, setSalarySlips] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<any>(null);
  const [formData, setFormData] = useState({ employee_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basic_salary: '', allowances: '', deductions: '', status: 'draft' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: slips } = await supabase.from('salary_slips').select('*').order('year', { ascending: false }).order('month', { ascending: false });
      const { data: emps } = await supabase.from('profiles').select('id, full_name, email');
      
      const slipsWithProfiles = (slips || []).map(slip => ({
        ...slip,
        profiles: emps?.find(e => e.id === slip.employee_id)
      }));
      setSalarySlips(slipsWithProfiles);
      setEmployees(emps || []);
    } catch (error) { console.error('Error:', error); toast.error('Failed to load data'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { employee_id: formData.employee_id, month: formData.month, year: formData.year, basic_salary: parseFloat(formData.basic_salary) || 0, allowances: parseFloat(formData.allowances) || 0, deductions: parseFloat(formData.deductions) || 0, status: formData.status, created_by: user?.id };
      if (editingSlip) {
        const { error } = await supabase.from('salary_slips').update(payload).eq('id', editingSlip.id);
        if (error) throw error;
        toast.success('Salary slip updated');
      } else {
        const { error } = await supabase.from('salary_slips').insert(payload);
        if (error) throw error;
        toast.success('Salary slip created');
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) { console.error('Error:', error); toast.error(error.message || 'Failed to save'); }
  };

  const handleEdit = (slip: any) => { setEditingSlip(slip); setFormData({ employee_id: slip.employee_id, month: slip.month, year: slip.year, basic_salary: String(slip.basic_salary), allowances: String(slip.allowances), deductions: String(slip.deductions), status: slip.status }); setIsModalOpen(true); };
  const handleDelete = async (id: string) => { if (!confirm('Delete this salary slip?')) return; try { const { error } = await supabase.from('salary_slips').delete().eq('id', id); if (error) throw error; toast.success('Deleted'); fetchData(); } catch (error) { console.error('Error:', error); toast.error('Failed to delete'); } };
  const resetForm = () => { setEditingSlip(null); setFormData({ employee_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basic_salary: '', allowances: '', deductions: '', status: 'draft' }); };
  const getMonthName = (month: number) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month - 1];
  const filteredSlips = salarySlips.filter(slip => slip.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || slip.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl lg:text-3xl font-bold mb-2">Salary Slips</h1><p className="text-muted-foreground">Manage employee salary slips</p></div><Button onClick={() => { resetForm(); setIsModalOpen(true); }}><Plus className="w-4 h-4 mr-2" />Create Salary Slip</Button></div>
      <div className="relative max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-11" />{searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}</div>
      <div className="glass-card overflow-hidden"><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Basic Salary</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filteredSlips.length > 0 ? filteredSlips.map((slip) => (
          <tr key={slip.id}><td><div><p className="font-medium">{slip.profiles?.full_name}</p><p className="text-xs text-muted-foreground">{slip.profiles?.email}</p></div></td><td>{getMonthName(slip.month)} {slip.year}</td><td className="font-mono">${Number(slip.basic_salary).toLocaleString()}</td><td className="font-mono text-success">+${Number(slip.allowances).toLocaleString()}</td><td className="font-mono text-destructive">-${Number(slip.deductions).toLocaleString()}</td><td className="font-mono font-bold">${Number(slip.net_salary).toLocaleString()}</td><td><span className={`status-badge status-${slip.status}`}>{slip.status}</span></td><td><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={() => handleEdit(slip)}><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(slip.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div></td></tr>
        )) : <tr><td colSpan={8} className="text-center text-muted-foreground py-12">No salary slips found</td></tr>}
      </tbody></table></div></div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}><DialogContent className="sm:max-w-lg bg-card border-border"><DialogHeader><DialogTitle>{editingSlip ? 'Edit Salary Slip' : 'Create Salary Slip'}</DialogTitle></DialogHeader><form onSubmit={handleSubmit} className="space-y-5 mt-4"><div><label className="form-label">Employee</label><Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}><SelectTrigger className="form-input"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((emp) => (<SelectItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.email})</SelectItem>))}</SelectContent></Select></div><div className="grid grid-cols-2 gap-4"><div><label className="form-label">Month</label><Select value={formData.month.toString()} onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}><SelectTrigger className="form-input"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, i) => (<SelectItem key={i + 1} value={(i + 1).toString()}>{getMonthName(i + 1)}</SelectItem>))}</SelectContent></Select></div><div><label className="form-label">Year</label><input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="form-input" min={2020} required /></div></div><div><label className="form-label">Basic Salary ($)</label><input type="number" value={formData.basic_salary} onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })} className="form-input" placeholder="5000" step="0.01" min="0" required /></div><div className="grid grid-cols-2 gap-4"><div><label className="form-label">Allowances ($)</label><input type="number" value={formData.allowances} onChange={(e) => setFormData({ ...formData, allowances: e.target.value })} className="form-input" placeholder="500" step="0.01" min="0" /></div><div><label className="form-label">Deductions ($)</label><input type="number" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: e.target.value })} className="form-input" placeholder="200" step="0.01" min="0" /></div></div><div><label className="form-label">Status</label><Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}><SelectTrigger className="form-input"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select></div><div className="flex gap-3 pt-4"><Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" className="flex-1">{editingSlip ? 'Update' : 'Create'}</Button></div></form></DialogContent></Dialog>
    </div>
  );
}
