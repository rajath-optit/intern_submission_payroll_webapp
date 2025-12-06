import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MySalary() {
  const { user } = useAuth();
  const [salarySlips, setSalarySlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);

  useEffect(() => { if (user) fetchSalarySlips(); }, [user]);

  const fetchSalarySlips = async () => {
    try {
      const { data, error } = await supabase.from('salary_slips').select('*').eq('employee_id', user?.id).eq('status', 'published').order('year', { ascending: false }).order('month', { ascending: false });
      if (error) throw error;
      setSalarySlips(data || []);
    } catch (error) { console.error('Error:', error); toast.error('Failed to load salary slips'); } finally { setLoading(false); }
  };

  const getMonthName = (month: number) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month - 1];

  const handleDownloadPDF = (slip: any) => {
    const content = `SALARY SLIP\n===========\n\nPeriod: ${getMonthName(slip.month)} ${slip.year}\n\nBasic Salary:  $${Number(slip.basic_salary).toLocaleString()}\nAllowances:    $${Number(slip.allowances).toLocaleString()}\nDeductions:    $${Number(slip.deductions).toLocaleString()}\n-----------\nNet Salary:    $${Number(slip.net_salary).toLocaleString()}\n\nGenerated on: ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-slip-${getMonthName(slip.month)}-${slip.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Salary slip downloaded');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl lg:text-3xl font-bold mb-2">My Salary Slips</h1><p className="text-muted-foreground">View your monthly salary statements</p></div>
      {salarySlips.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">{salarySlips.map((slip) => (<button key={slip.id} onClick={() => setSelectedSlip(slip)} className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${selectedSlip?.id === slip.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div><div><p className="font-medium">{getMonthName(slip.month)} {slip.year}</p><p className="text-sm text-muted-foreground font-mono">${Number(slip.net_salary).toLocaleString()}</p></div></div></button>))}</div>
          <div className="lg:col-span-2">{selectedSlip ? (<div className="glass-card p-8"><div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-bold">Salary Slip</h2><p className="text-muted-foreground">{getMonthName(selectedSlip.month)} {selectedSlip.year}</p></div><Button onClick={() => handleDownloadPDF(selectedSlip)}><Download className="w-4 h-4 mr-2" />Download</Button></div><div className="space-y-6"><div className="grid grid-cols-2 gap-4"><div className="p-4 rounded-lg bg-muted/30"><p className="text-sm text-muted-foreground mb-1">Basic Salary</p><p className="text-2xl font-bold font-mono">${Number(selectedSlip.basic_salary).toLocaleString()}</p></div><div className="p-4 rounded-lg bg-success/10"><p className="text-sm text-muted-foreground mb-1">Allowances</p><p className="text-2xl font-bold font-mono text-success">+${Number(selectedSlip.allowances).toLocaleString()}</p></div></div><div className="p-4 rounded-lg bg-destructive/10"><p className="text-sm text-muted-foreground mb-1">Deductions</p><p className="text-2xl font-bold font-mono text-destructive">-${Number(selectedSlip.deductions).toLocaleString()}</p></div><div className="border-t border-border pt-6"><div className="p-6 rounded-xl bg-primary/10 border border-primary/20"><p className="text-sm text-muted-foreground mb-1">Net Salary</p><p className="text-4xl font-bold font-mono gradient-text">${Number(selectedSlip.net_salary).toLocaleString()}</p></div></div></div></div>) : (<div className="glass-card p-12 text-center"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Select a salary slip to view details</p></div>)}</div>
        </div>
      ) : (<div className="glass-card p-12 text-center"><FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No Salary Slips Yet</h3><p className="text-muted-foreground">Your salary slips will appear here once they're published by the admin.</p></div>)}
    </div>
  );
}
