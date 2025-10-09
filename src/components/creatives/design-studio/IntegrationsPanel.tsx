import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Code, Send, FileDown, Globe, Palette, Type as TypeIcon, Mail, MessageSquare, Database, Link2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
interface IntegrationsPanelProps {
  onExport?: (format: string) => void;
  onIntegrationConnect?: (integration: string, config: any) => void;
}
export const IntegrationsPanel = ({
  onExport,
  onIntegrationConnect
}: IntegrationsPanelProps) => {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const handleExport = (format: 'html' | 'react' | 'json') => {
    onExport?.(format);
    toast.success(`Exporting as ${format.toUpperCase()}...`);
  };
  const handleZapierConnect = () => {
    if (!zapierWebhook) {
      toast.error('Please enter a Zapier webhook URL');
      return;
    }
    onIntegrationConnect?.('zapier', {
      webhookUrl: zapierWebhook
    });
    toast.success('Zapier integration connected!');
  };
  const integrations = [{
    id: 'email',
    name: 'Email Notifications',
    description: 'Send form submissions via email',
    icon: Mail,
    color: 'text-blue-600',
    enabled: emailEnabled,
    onToggle: setEmailEnabled
  }, {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5000+ apps',
    icon: Zap,
    color: 'text-amber-600',
    enabled: false,
    onToggle: () => {}
  }, {
    id: 'analytics',
    name: 'Analytics',
    description: 'Track visitor behavior',
    icon: Database,
    color: 'text-green-600',
    enabled: analyticsEnabled,
    onToggle: setAnalyticsEnabled
  }, {
    id: 'ai',
    name: 'AI Assistant',
    description: 'Natural language editing',
    icon: Sparkles,
    color: 'text-purple-600',
    enabled: true,
    onToggle: () => {}
  }];
  return <div className="h-full overflow-auto bg-white">
      
    </div>;
};