import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch roles separately
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      const employeesWithRoles = (data || []).map(emp => ({
        ...emp,
        role: roles?.find(r => r.user_id === emp.id)?.role || 'employee'
      }));
      setEmployees(employeesWithRoles);
    } catch (error) { console.error('Error:', error); toast.error('Failed to load employees'); } finally { setLoading(false); }
  };

  const filteredEmployees = employees.filter(emp => emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl lg:text-3xl font-bold mb-2">Employees</h1><p className="text-muted-foreground">View and manage team members</p></div>
      <div className="relative max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-11" /></div>
      <div className="glass-card p-6 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div><div><p className="text-2xl font-bold">{employees.length}</p><p className="text-sm text-muted-foreground">Total Employees</p></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length > 0 ? filteredEmployees.map((employee) => (
          <div key={employee.id} className="glass-card p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0"><span className="text-lg font-semibold">{employee.full_name?.charAt(0).toUpperCase() || 'U'}</span></div><div className="min-w-0 flex-1"><p className="font-semibold truncate">{employee.full_name}</p><p className="text-sm text-muted-foreground truncate">{employee.email}</p><div className="mt-2"><span className={`status-badge ${employee.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{employee.role}</span></div></div></div>
            <div className="mt-4 pt-4 border-t border-border"><p className="text-xs text-muted-foreground">Joined {new Date(employee.created_at).toLocaleDateString()}</p></div>
          </div>
        )) : <div className="col-span-full text-center py-12 text-muted-foreground">{searchTerm ? 'No employees found' : 'No employees registered yet'}</div>}
      </div>
    </div>
  );
}
