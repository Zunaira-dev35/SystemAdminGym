import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, Column, ExportControls } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import type { LedgerTransaction, User } from '@shared/schema';


export default function Ledger() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const { data: ledgerData = [] } = useQuery<LedgerTransaction[]>({
    queryKey: ['/api/ledger'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const filteredData = ledgerData.filter((entry) => {
    if (categoryFilter !== 'all' && entry.transactionType !== categoryFilter) return false;
    if (typeFilter !== 'all' && entry.category !== typeFilter) return false;
    if (dateFrom && entry.transactionDate && new Date(entry.transactionDate) < dateFrom) return false;
    if (dateTo && entry.transactionDate && new Date(entry.transactionDate) > dateTo) return false;
    return true;
  });

  const totalIncome = filteredData
    .filter((e) => e.transactionType === 'income')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalExpense = filteredData
    .filter((e) => e.transactionType === 'expense')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const netBalance = totalIncome - totalExpense;

  const columns: Column<LedgerTransaction>[] = [
    {
      key: 'transactionDate',
      label: 'Date',
      sortable: true,
      render: (entry) => entry.transactionDate ? new Date(entry.transactionDate).toLocaleDateString() : '-',
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (entry) => (
        <Badge variant="outline">{entry.category}</Badge>
      ),
    },
    {
      key: 'transactionType',
      label: 'Type',
      sortable: true,
      render: (entry) => (
        <Badge 
          variant="outline"
          className={entry.transactionType === 'income' ? 'bg-chart-3/10 text-chart-3 border-chart-3/20' : 'bg-chart-5/10 text-chart-5 border-chart-5/20'}
        >
          {entry.transactionType}
        </Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (entry) => (
        <span className={entry.transactionType === 'income' ? 'text-chart-3 font-medium' : 'text-chart-5 font-medium'}>
          {entry.transactionType === 'income' ? '+' : '-'}₹{(entry.amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      hideOnMobile: true,
      render: (entry) => entry.paymentMethod || '-',
    },
    {
      key: 'collectedBy',
      label: 'Collected By',
      hideOnMobile: true,
      render: (entry) => {
        if (!entry.collectedBy) return <span className="text-muted-foreground">-</span>;
        const collector = users.find(u => u.id === entry.collectedBy);
        return collector ? collector.mobile : entry.collectedBy;
      },
    },
    {
      key: 'referenceId',
      label: 'Reference',
      hideOnMobile: true,
      render: (entry) => entry.referenceId || '-',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounts & Ledger</h1>
        <p className="text-muted-foreground">Track all financial transactions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <div className="h-9 w-9 rounded-md bg-chart-3/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">₹{totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              From {filteredData.filter((e) => e.transactionType === 'income').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
            <div className="h-9 w-9 rounded-md bg-chart-5/10 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-chart-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-5">₹{totalExpense.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              From {filteredData.filter((e) => e.transactionType === 'expense').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              netBalance >= 0 ? "text-chart-3" : "text-chart-5"
            )}>
              ₹{Math.abs(netBalance).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {netBalance >= 0 ? 'Profit' : 'Loss'} from filtered period
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Ledger Entries</CardTitle>
            <ExportControls
              data={filteredData}
              selectedData={filteredData.filter(item => selectedRows.has(item.id!))}
              filename="ledger-entries"
              columns={[
                { key: 'transactionDate', label: 'Date' },
                { key: 'description', label: 'Description' },
                { key: 'category', label: 'Category' },
                { key: 'transactionType', label: 'Type' },
                { key: 'amount', label: 'Amount' },
                { key: 'paymentMethod', label: 'Payment Method' },
                { key: 'collectedBy', label: 'Collected By' },
                { key: 'referenceId', label: 'Reference' },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40" data-testid="select-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Membership">Membership</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Payroll">Payroll</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-50" data-testid="button-filter-date-from">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'PPP') : 'From Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" data-testid="popover-date-from">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  data-testid="calendar-date-from"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-50" data-testid="button-filter-date-to">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'PPP') : 'To Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" data-testid="popover-date-to">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  data-testid="calendar-date-to"
                />
              </PopoverContent>
            </Popover>

            {(categoryFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <DataTable
            data={filteredData}
            columns={columns}
            searchPlaceholder="Search transactions..."
            emptyMessage="No ledger entries found"
            selectable={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            getRowId={(item) => item.id!}
          />
        </CardContent>
      </Card>
    </div>
  );
}
