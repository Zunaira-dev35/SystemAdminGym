import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Check, X, User, Search, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ModulePermission {
  module: string;
  description: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

interface UserInfo {
  id: string;
  name: string;
  role: string;
  email: string;
}

const mockUsers: UserInfo[] = [
  { id: '1', name: 'John Admin', role: 'admin', email: 'admin@gym.com' },
  { id: '2', name: 'Sarah Receptionist', role: 'receptionist', email: 'sarah@gym.com' },
  { id: '3', name: 'Mike Trainer', role: 'staff', email: 'mike@gym.com' },
  { id: '4', name: 'Lisa Coach', role: 'staff', email: 'lisa@gym.com' },
  { id: '5', name: 'Tom Member', role: 'member', email: 'tom@gym.com' },
];

const modules = [
  'Dashboard',
  'Members',
  'Plans',
  'Attendance',
  'Freeze Requests',
  'Employees',
  'Payroll',
  'Reports',
  'Ledger',
  'Tasks',
  'Settings',
  'Permissions',
  'Fee Collection',
];

const getDefaultPermissions = (userId: string): ModulePermission[] => {
  const user = mockUsers.find(u => u.id === userId);
  const role = user?.role || 'member';

  return modules.map(module => ({
    module,
    description: `Access to ${module.toLowerCase()} module`,
    canView: role === 'admin' || (role === 'receptionist' && ['Dashboard', 'Members', 'Plans', 'Attendance', 'Fee Collection'].includes(module)) || (role === 'staff' && ['Dashboard', 'Members', 'Attendance', 'Tasks'].includes(module)),
    canCreate: role === 'admin' || (role === 'receptionist' && ['Fee Collection'].includes(module)),
    canEdit: role === 'admin' || (role === 'receptionist' && ['Members', 'Fee Collection'].includes(module)),
    canDelete: role === 'admin',
    canExport: role === 'admin' || (role === 'receptionist' && ['Reports', 'Ledger', 'Fee Collection'].includes(module)),
  }));
};
 
export default function Permissions() {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setPermissions(getDefaultPermissions(userId));
    setHasChanges(false);
  };

  const togglePermission = (moduleIndex: number, permission: keyof Omit<ModulePermission, 'module' | 'description'>) => {
    const updated = [...permissions];
    updated[moduleIndex][permission] = !updated[moduleIndex][permission];
    setPermissions(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    toast({
      title: 'Permissions Updated',
      description: `Permissions for ${mockUsers.find(u => u.id === selectedUser)?.name} have been saved`,
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    if (selectedUser) {
      setPermissions(getDefaultPermissions(selectedUser));
      setHasChanges(false);
      toast({
        title: 'Changes Discarded',
        description: 'Permissions reset to previous state',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUserInfo = mockUsers.find(u => u.id === selectedUser);

  const permissionStats = {
    total: permissions.length,
    canView: permissions.filter(p => p.canView).length,
    canCreate: permissions.filter(p => p.canCreate).length,
    canEdit: permissions.filter(p => p.canEdit).length,
    canDelete: permissions.filter(p => p.canDelete).length,
    canExport: permissions.filter(p => p.canExport).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Permissions</h1>
          <p className="text-muted-foreground">Manage individual user permissions dynamically</p>
        </div>
        {hasChanges && selectedUser && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} data-testid="button-reset-permissions">
              Discard Changes
            </Button>
            <Button onClick={handleSave} data-testid="button-save-permissions">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 rounded-md border cursor-pointer hover-elevate ${
                    selectedUser === user.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleUserSelect(user.id)}
                  data-testid={`user-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {!selectedUser ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No User Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a user from the list to manage their permissions
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{selectedUserInfo?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{selectedUserInfo?.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{selectedUserInfo?.email}</p>
                      </div>
                    </div>
                    <Badge>{selectedUserInfo?.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{permissionStats.canView}</div>
                      <div className="text-xs text-muted-foreground mt-1">Can View</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-2">{permissionStats.canCreate}</div>
                      <div className="text-xs text-muted-foreground mt-1">Can Create</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-3">{permissionStats.canEdit}</div>
                      <div className="text-xs text-muted-foreground mt-1">Can Edit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-5">{permissionStats.canDelete}</div>
                      <div className="text-xs text-muted-foreground mt-1">Can Delete</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-4">{permissionStats.canExport}</div>
                      <div className="text-xs text-muted-foreground mt-1">Can Export</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Module Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Module</TableHead>
                          <TableHead className="text-center w-24">View</TableHead>
                          <TableHead className="text-center w-24">Create</TableHead>
                          <TableHead className="text-center w-24">Edit</TableHead>
                          <TableHead className="text-center w-24">Delete</TableHead>
                          <TableHead className="text-center w-24">Export</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permissions.map((permission, index) => (
                          <TableRow key={index} data-testid={`row-permission-${permission.module}`}>
                            <TableCell className="font-medium">{permission.module}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={permission.canView}
                                  onCheckedChange={() => togglePermission(index, 'canView')}
                                  data-testid={`switch-${permission.module}-view`}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={permission.canCreate}
                                  onCheckedChange={() => togglePermission(index, 'canCreate')}
                                  data-testid={`switch-${permission.module}-create`}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={permission.canEdit}
                                  onCheckedChange={() => togglePermission(index, 'canEdit')}
                                  data-testid={`switch-${permission.module}-edit`}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={permission.canDelete}
                                  onCheckedChange={() => togglePermission(index, 'canDelete')}
                                  data-testid={`switch-${permission.module}-delete`}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={permission.canExport}
                                  onCheckedChange={() => togglePermission(index, 'canExport')}
                                  data-testid={`switch-${permission.module}-export`}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
