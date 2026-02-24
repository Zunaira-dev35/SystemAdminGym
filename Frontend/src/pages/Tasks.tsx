import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Circle, Clock, ListTodo, User, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { useAuth } from '@/contexts/AuthContext';

const mockTasks = [
  {
    id: '1',
    title: 'Follow up with expired members',
    description: 'Contact all members whose membership expired in the last 7 days and offer renewal discount',
    assignedTo: 'Staff Member',
    assignedBy: 'Admin',
    priority: 'high',
    status: 'pending',
    dueDate: '2025-01-15',
    createdDate: '2025-01-10',
    category: 'Membership',
  },
  {
    id: '2',
    title: 'Monthly equipment maintenance',
    description: 'Check and service all gym equipment including treadmills, ellipticals, and weight machines',
    assignedTo: 'Trainer Alex',
    assignedBy: 'David Manager',
    priority: 'medium',
    status: 'in-progress',
    dueDate: '2025-01-20',
    createdDate: '2025-01-08',
    category: 'Maintenance',
  },
  {
    id: '3',
    title: 'Organize yoga workshop',
    description: 'Plan and schedule a weekend yoga workshop for intermediate members. Arrange instructor and venue.',
    assignedTo: 'Trainer Lisa',
    assignedBy: 'Admin',
    priority: 'low',
    status: 'pending',
    dueDate: '2025-01-25',
    createdDate: '2025-01-12',
    category: 'Events',
  },
  {
    id: '4',
    title: 'Update member attendance records',
    description: 'Verify and update attendance records for December 2024. Fix any discrepancies found.',
    assignedTo: 'Staff Member',
    assignedBy: 'David Manager',
    priority: 'high',
    status: 'completed',
    dueDate: '2025-01-10',
    createdDate: '2025-01-05',
    completedDate: '2025-01-09',
    category: 'Administrative',
  },
  {
    id: '5',
    title: 'Process freeze requests',
    description: 'Review and approve/reject pending membership freeze requests in the system',
    assignedTo: 'Trainer Lisa',
    assignedBy: 'Admin',
    priority: 'medium',
    status: 'in-progress',
    dueDate: '2025-01-18',
    createdDate: '2025-01-11',
    category: 'Membership',
  },
];

export default function Tasks() {
  const { userRole } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const filteredTasks = mockTasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
      case 'in-progress':
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-chart-5/10 text-chart-5 border-chart-5/20';
      case 'medium':
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      default:
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
    }
  };

  const statusCounts = {
    total: mockTasks.length,
    pending: mockTasks.filter((t) => t.status === 'pending').length,
    inProgress: mockTasks.filter((t) => t.status === 'in-progress').length,
    completed: mockTasks.filter((t) => t.status === 'completed').length,
  };

  const handleMarkComplete = (taskId: string) => {
    console.log('Marking task as complete:', taskId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and track assigned tasks</p>
        </div>
        {userRole === 'admin' && (
          <Button data-testid="button-create-task">
            <ListTodo className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <ListTodo className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All assigned tasks</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Circle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Not started yet</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCounts.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCounts.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully done</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Task List</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40" data-testid="select-priority-filter">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="hover-elevate cursor-pointer"
                    data-testid={`row-task-${task.id}`}
                    onClick={() => {
                      setSelectedTask(task);
                      setDetailDrawerOpen(true);
                    }}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.category}</Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {task.assignedTo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {task.dueDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        <span className="mr-1">{getStatusIcon(task.status)}</span>
                        {task.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkComplete(task.id);
                          }}
                          data-testid={`button-complete-task-${task.id}`}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        title="Task Details"
        description={selectedTask ? `Task ID: ${selectedTask.id}` : ''}
      >
        {selectedTask && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Task Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium text-lg">{selectedTask.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedTask.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline">{selectedTask.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant="outline" className={getPriorityColor(selectedTask.priority)}>
                      {selectedTask.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline" className={getStatusColor(selectedTask.status)}>
                      <span className="mr-1">{getStatusIcon(selectedTask.status)}</span>
                      {selectedTask.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{selectedTask.dueDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Assignment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedTask.assignedTo}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned By</p>
                  <p className="font-medium">{selectedTask.assignedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created Date</p>
                  <p className="font-medium">{selectedTask.createdDate}</p>
                </div>
                {selectedTask.completedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Date</p>
                    <p className="font-medium">{selectedTask.completedDate}</p>
                  </div>
                )}
              </div>
            </div>

            {selectedTask.status !== 'completed' && (
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleMarkComplete(selectedTask.id)}
                  data-testid="button-mark-complete-drawer"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
                <Button variant="outline" className="flex-1" data-testid="button-update-status-drawer">
                  Update Status
                </Button>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
