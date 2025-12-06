import { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminDashboard from './dashboard/AdminDashboard';
import EmployeeDashboard from './dashboard/EmployeeDashboard';
import SalarySlips from './dashboard/SalarySlips';
import Expenses from './dashboard/Expenses';
import Employees from './dashboard/Employees';
import MySalary from './dashboard/MySalary';
import MyExpenses from './dashboard/MyExpenses';

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />} />
        {/* Admin routes */}
        <Route path="/salary-slips" element={<SalarySlips />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/employees" element={<Employees />} />
        {/* Employee routes */}
        <Route path="/my-salary" element={<MySalary />} />
        <Route path="/my-expenses" element={<MyExpenses />} />
      </Routes>
    </DashboardLayout>
  );
}
