import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Download, FileText, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Reports() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-01-13');

  const handleExport = (type: string, format: string) => {
    toast({
      title: `Exporting ${type} Report`,
      description: `Generating ${format.toUpperCase()} report for selected period`,
    });
  };

  const ReportCard = ({ title, icon: Icon, data }: any) => (
    <Card className="hover-elevate">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {data.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleExport(title, 'csv')}
            data-testid={`button-export-${title.toLowerCase().replace(' ', '-')}-csv`}
          >
            <FileText className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleExport(title, 'pdf')}
            data-testid={`button-export-${title.toLowerCase().replace(' ', '-')}-pdf`}
          >
            <Download className="h-3 w-3 mr-1" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and export comprehensive reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap items-end">
            <div className="space-y-2 flex-1 min-w-40">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2 flex-1 min-w-40">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <Button data-testid="button-apply-date-filter">Apply Filter</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="attendance">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="attendance" data-testid="tab-attendance-report">Attendance</TabsTrigger>
          <TabsTrigger value="membership" data-testid="tab-membership-report">Membership</TabsTrigger>
          <TabsTrigger value="payment" data-testid="tab-payment-report">Payment</TabsTrigger>
          <TabsTrigger value="expense" data-testid="tab-expense-report">Expense</TabsTrigger>
          <TabsTrigger value="freeze" data-testid="tab-freeze-report">Freeze</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReportCard
              title="Member Attendance"
              icon={Users}
              data={[
                { label: 'Total Check-ins', value: '1,245' },
                { label: 'Unique Members', value: '186' },
                { label: 'Avg Daily', value: '96' },
                { label: 'Peak Hours', value: '6-9 AM' },
              ]}
            />
            <ReportCard
              title="Staff Attendance"
              icon={Users}
              data={[
                { label: 'Total Days', value: '65' },
                { label: 'Avg Attendance', value: '95%' },
                { label: 'Late Arrivals', value: '3' },
                { label: 'Absences', value: '2' },
              ]}
            />
            <ReportCard
              title="Attendance Trends"
              icon={TrendingUp}
              data={[
                { label: 'Growth Rate', value: '+12%' },
                { label: 'Best Day', value: 'Monday' },
                { label: 'Worst Day', value: 'Sunday' },
                { label: 'Overall Rate', value: '75%' },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="membership" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReportCard
              title="Active Memberships"
              icon={Users}
              data={[
                { label: 'Total Active', value: '248' },
                { label: 'New This Month', value: '23' },
                { label: 'Renewals', value: '45' },
                { label: 'Expiring Soon', value: '12' },
              ]}
            />
            <ReportCard
              title="Plan Distribution"
              icon={BarChart3}
              data={[
                { label: 'Basic Monthly', value: '98' },
                { label: 'Premium Monthly', value: '87' },
                { label: 'Quarterly', value: '42' },
                { label: 'Annual', value: '21' },
              ]}
            />
            <ReportCard
              title="Member Growth"
              icon={TrendingUp}
              data={[
                { label: 'Growth Rate', value: '+15%' },
                { label: 'Retention Rate', value: '92%' },
                { label: 'Churn Rate', value: '8%' },
                { label: 'Avg Lifetime', value: '14 months' },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReportCard
              title="Revenue Summary"
              icon={DollarSign}
              data={[
                { label: 'Total Revenue', value: '₹3,20,000' },
                { label: 'Membership Fees', value: '₹2,80,000' },
                { label: 'Other Income', value: '₹40,000' },
                { label: 'Avg Payment', value: '₹1,742' },
              ]}
            />
            <ReportCard
              title="Payment Methods"
              icon={DollarSign}
              data={[
                { label: 'Cash', value: '₹1,20,000' },
                { label: 'Card', value: '₹1,50,000' },
                { label: 'UPI', value: '₹50,000' },
                { label: 'Pending', value: '₹0' },
              ]}
            />
            <ReportCard
              title="Payment Trends"
              icon={TrendingUp}
              data={[
                { label: 'Growth', value: '+18.7%' },
                { label: 'On-time Rate', value: '94%' },
                { label: 'Late Payments', value: '6%' },
                { label: 'Defaulters', value: '3' },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="expense" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReportCard
              title="Total Expenses"
              icon={DollarSign}
              data={[
                { label: 'Total', value: '₹1,45,000' },
                { label: 'Salaries', value: '₹1,00,000' },
                { label: 'Equipment', value: '₹25,000' },
                { label: 'Utilities', value: '₹20,000' },
              ]}
            />
            <ReportCard
              title="Category Breakdown"
              icon={BarChart3}
              data={[
                { label: 'Payroll', value: '69%' },
                { label: 'Maintenance', value: '17%' },
                { label: 'Marketing', value: '8%' },
                { label: 'Other', value: '6%' },
              ]}
            />
            <ReportCard
              title="Expense Trends"
              icon={TrendingUp}
              data={[
                { label: 'Change', value: '+5.2%' },
                { label: 'Budget Used', value: '72%' },
                { label: 'Remaining', value: '₹55,000' },
                { label: 'Savings', value: '₹15,000' },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="freeze" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReportCard
              title="Freeze Requests"
              icon={BarChart3}
              data={[
                { label: 'Total Requests', value: '15' },
                { label: 'Approved', value: '8' },
                { label: 'Pending', value: '5' },
                { label: 'Rejected', value: '2' },
              ]}
            />
            <ReportCard
              title="Freeze Duration"
              icon={BarChart3}
              data={[
                { label: 'Avg Duration', value: '32 days' },
                { label: 'Shortest', value: '15 days' },
                { label: 'Longest', value: '60 days' },
                { label: 'Total Days', value: '256' },
              ]}
            />
            <ReportCard
              title="Freeze Impact"
              icon={TrendingUp}
              data={[
                { label: 'Members Frozen', value: '8' },
                { label: 'Revenue Impact', value: '₹16,000' },
                { label: 'Approval Rate', value: '80%' },
                { label: 'Avg Processing', value: '1.2 days' },
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
