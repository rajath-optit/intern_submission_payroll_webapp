import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Wallet, Shield, Users, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Secure admin and employee portals with granular permissions',
    },
    {
      icon: BarChart3,
      title: 'Salary Management',
      description: 'Create, update, and publish salary slips with ease',
    },
    {
      icon: Users,
      title: 'Expense Tracking',
      description: 'Submit and approve expense claims in real-time',
    },
  ];

  const benefits = [
    'Automated salary calculations',
    'Expense approval workflow',
    'Role-based authentication',
    'Real-time dashboard analytics',
    'Mobile-responsive design',
    'Secure data handling',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PayrollPro</span>
          </div>
          <Button onClick={() => navigate('/auth')}>
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Wallet className="w-4 h-4" />
              Modern Payroll Solution
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-slide-up">
              Streamline Your
              <span className="gradient-text block">Payroll Management</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up stagger-1">
              A comprehensive platform for managing salaries, expenses, and employee records with precision and ease.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2">
              <Button size="lg" onClick={() => navigate('/auth')} className="min-w-[200px]">
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="min-w-[200px]">
                View Demo
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative animate-scale-in stagger-3">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass-card p-4 rounded-2xl overflow-hidden">
              <div className="aspect-video bg-muted/30 rounded-xl flex items-center justify-center">
                <div className="text-center p-8">
                  <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Interactive Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to manage your organization's payroll efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className={`glass-card p-8 hover:border-primary/30 transition-all duration-300 opacity-0 animate-slide-up stagger-${index + 1}`}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose PayrollPro?
              </h2>
              <p className="text-muted-foreground mb-8">
                Built with modern technologies and designed for simplicity, PayrollPro helps you manage your organization's payroll without the complexity.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-8">
              <div className="space-y-4">
                <div className="h-4 bg-muted/50 rounded-full w-3/4" />
                <div className="h-4 bg-muted/50 rounded-full w-1/2" />
                <div className="h-32 bg-muted/30 rounded-xl mt-6" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="h-20 bg-primary/20 rounded-lg" />
                  <div className="h-20 bg-primary/10 rounded-lg" />
                  <div className="h-20 bg-muted/30 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.1) 0%, transparent 70%)' }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join organizations that trust PayrollPro for their payroll management needs.
              </p>
              <Button size="lg" onClick={() => navigate('/auth')}>
                Create Your Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">PayrollPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 PayrollPro. Built for the interview assignment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
