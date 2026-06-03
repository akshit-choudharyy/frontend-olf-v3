import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  UserCheck, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  ArrowLeft,
  Crown,
  Briefcase,
  Loader2
} from 'lucide-react';
import { olfService } from '@/utils/axiosInstance';

// Import your service - replace 'olfService' with your actual service name

const Roles = () => {
  const [searchTerm, setSearchTerm] = useState<any>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<any>(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({ 
    name: '', 
    dept_id: '', 
    level: ''
  });

  const queryClient = useQueryClient();

  // Available levels for dropdown
  const levels:any = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager'];

  // Fetch roles using TanStack Query
  const {
    isPending: rolesLoading,
    error: rolesError,
    data: allRoles = [],
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () =>
      olfService.get('/roles').then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        // Sort by role_id in descending order (latest on top)
        const sortedRoles = [...(res.data.data.rows || [])].sort((a, b) => b.role_id - a.role_id);
        return sortedRoles;
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch departments for dropdown
  const {
    data: allDepartments = [],
    isLoading: departmentsLoading,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: () =>
      olfService.get('/departments').then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        return res.data.data.rows || [];
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: (roleData) =>
      olfService.post('/role', roleData).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to create role');
        }
        return res.data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsEditDialogOpen(false);
      setEditFormData({ name: '', dept_id: '', level: '' });
      setEditingRole(null);
    },
    onError: (error) => {
      console.error('Failed to create role:', error);
      alert('Failed to create role. Please try again.');
    },
  });

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }:{id:any,data:any}) =>
      olfService.put(`/role/${id}`, data).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to update role');
        }
        return res.data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsEditDialogOpen(false);
      setEditFormData({ name: '', dept_id: '', level: '' });
      setEditingRole(null);
    },
    onError: (error) => {
      console.error('Failed to update role:', error);
      alert('Failed to update role. Please try again.');
    },
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: (id) =>
      olfService.delete(`/role/${id}`).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to delete role');
        }
        return res.data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error) => {
      console.error('Failed to delete role:', error);
      alert('Failed to delete role. Please try again.');
    },
  });

  // Filter roles based on search
  const filteredRoles = allRoles.filter(role => {
    const department = allDepartments.find((dept:any) => dept.dept_id === role.dept_id);
    const departmentName = department?.name || '';
    
    return (
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.level.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle edit button click
  const handleEdit = (role:any) => {
    setEditingRole(role);
    setEditFormData({ 
      name: role.name,
      dept_id: role.dept_id?.toString() || '',
      level: role.level
    });
    setIsEditDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editFormData.name.trim() || !editFormData.dept_id || !editFormData.level) {
      alert('Please fill in all required fields.');
      return;
    }

    const dataToSend:any = {
      name: editFormData.name.trim(),
      dept_id: parseInt(editFormData.dept_id),
      level: editFormData.level
    };

    if (editingRole?.role_id) {
      // Update existing role
      updateMutation.mutate({
        id: editingRole.role_id,
        data: dataToSend
      });
    } else {
      // Create new role
      createMutation.mutate(dataToSend);
    }
  };

  // Handle delete
  const handleDelete = (roleId:any) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteMutation.mutate(roleId);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingRole(null);
    setEditFormData({ name: '', dept_id: '', level: '' });
  };

  // Handle add new role
  const handleAddNew = () => {
    setEditingRole(null);
    setEditFormData({ name: '', dept_id: '', level: '' });
    setIsEditDialogOpen(true);
  };

  // Get level badge color
  const getLevelBadgeColor = (level:any) => {
    switch (level) {
      case 'Junior': return 'bg-green-100 text-green-700';
      case 'Mid': return 'bg-blue-100 text-blue-700';
      case 'Senior': return 'bg-purple-100 text-purple-700';
      case 'Lead': return 'bg-orange-100 text-orange-700';
      case 'Manager': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get department name by ID
  const getDepartmentName = (deptId:any) => {
    const department = allDepartments.find((dept:any) => dept.dept_id === deptId);
    return department?.name || 'Unknown Department';
  };

  // Format date
  const formatDate = (dateString:any) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle retry on error
  const handleRetry = () => {
    refetchRoles();
  };

  // Calculate statistics
  const totalRoles = allRoles.length;
  const seniorRoles = allRoles.filter(role => ['Senior', 'Lead', 'Manager'].includes(role.level)).length;

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading roles...</span>
        </div>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load roles</p>
          <p className="text-sm text-gray-600 mb-4">{rolesError.message}</p>
          <Button onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-blue-600" />
                Roles Management
              </h1>
              <p className="text-gray-600 mt-1">Manage job roles, responsibilities, and hierarchies</p>
            </div>
          </div>
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Role
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Roles</p>
                  <p className="text-2xl font-bold">{totalRoles}</p>
                </div>
                <Briefcase className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Senior Roles</p>
                  <p className="text-2xl font-bold">{seniorRoles}</p>
                </div>
                <Crown className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Job Roles</CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search roles, departments, or levels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Updated</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role.role_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="font-mono">
                          {role.role_id}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{role.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {getDepartmentName(role.dept_id)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getLevelBadgeColor(role.level)}>
                          {role.level}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(role.created_at)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(role.updated_at)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(role.role_id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRoles.length === 0 && !rolesLoading && (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No roles found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editingRole && (
              <div>
                <Label htmlFor="role-id">Role ID</Label>
                <Input
                  id="role-id"
                  value={editingRole.role_id || ''}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter role name"
              />
            </div>
            
            <div>
              <Label htmlFor="department">Department</Label>
              <Select 
                value={editFormData.dept_id} 
                onValueChange={(value) => setEditFormData({ ...editFormData, dept_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading departments...
                      </div>
                    </SelectItem>
                  ) : (
                    allDepartments.map((dept:any) => (
                      <SelectItem key={dept.dept_id} value={dept.dept_id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="level">Level</Label>
              <Select 
                value={editFormData.level} 
                onValueChange={(value) => setEditFormData({ ...editFormData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level:any) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={
                !editFormData.name.trim() || 
                !editFormData.dept_id || 
                !editFormData.level || 
                createMutation.isPending || 
                updateMutation.isPending
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Roles;