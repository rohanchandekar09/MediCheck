import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pill, Bell, BarChart3, Smartphone, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Pill,
      title: 'Smart Inventory',
      description: 'Organize all your medicines in one place with automatic expiry tracking',
    },
    {
      icon: Bell,
      title: 'Medication Reminders',
      description: 'Never miss a dose with intelligent reminder notifications',
    },
    {
      icon: Zap,
      title: 'AI Scanning',
      description: 'Add medicines instantly using barcode or OCR scanning technology',
    },
    {
      icon: BarChart3,
      title: 'Health Analytics',
      description: 'Track your medication adherence and view detailed statistics',
    },
    {
      icon: Shield,
      title: 'Drug Interactions',
      description: 'Automatically check for potential drug interactions',
    },
    {
      icon: Smartphone,
      title: 'Offline Mode',
      description: 'Access your medicines anytime, anywhere - even without internet',
    },
  ];

  return (
    <div className="w-full">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">MediCheck</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance">
            Smart Healthcare at Your Fingertips
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-balance">
            MediCheck is your personal medicine manager. Track, organize, and never miss a medication again with intelligent reminders and AI-powered scanning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">Everything you need to manage your health</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <Icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to take control of your health?</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of users managing their medications with MediCheck
          </p>
          <Link href="/signup">
            <Button size="lg">Get Started Now</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 lg:px-8 py-12 bg-muted">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 MediCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
