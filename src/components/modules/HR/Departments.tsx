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
  Building2, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { olfService } from '@/utils/axiosInstance';

// Import your service - replace 'olfService' with your actual service name

const Department = () => {
  const [searchTerm, setSearchTerm] = useState<any>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<any>(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({ name: '' });
  
  const queryClient = useQueryClient();

  // Fetch departments using TanStack Query
  const {
    isPending,
    error: queryError,
    data: allDepartments = [],
    refetch,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: () =>
      olfService.get('/departments').then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        // Sort by dept_id in descending order (latest on top)
        
        return res.data.data.rows || [];
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Create department mutation
  const createMutation = useMutation({
    mutationFn: (departmentData: { name: string }) =>
      olfService.post('/department', departmentData).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to create department');
        }
        return res.data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsEditDialogOpen(false);
      setEditFormData({ name: '' });
      setEditingDepartment(null);
    },
    onError: (error) => {
      console.error('Failed to create department:', error);
      alert('Failed to create department. Please try again.');
    },
  });

  // Update department mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }:{id:any,data:any}) =>
      olfService.put(`/department/${id}`, data).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to update department');
        }
        return res.data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsEditDialogOpen(false);
      setEditFormData({ name: '' });
      setEditingDepartment(null);
    },
    onError: (error) => {
      console.error('Failed to update department:', error);
      alert('Failed to update department. Please try again.');
    },
  });

  // Delete department mutation
  const deleteMutation = useMutation({
    mutationFn: (id) =>
      olfService.delete(`/department/${id}`).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to delete department');
        }
        return res.data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      console.error('Failed to delete department:', error);
      alert('Failed to delete department. Please try again.');
    },
  });

  // Filter departments based on search
  const filteredDepartments = allDepartments.filter((dept:any) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle edit button click
  const handleEdit = (department:any) => {
    setEditingDepartment(department);
    setEditFormData({ name: department.name });
    setIsEditDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editFormData.name.trim()) return;

    if (editingDepartment?.dept_id) {
      // Update existing department
      updateMutation.mutate({
        id: editingDepartment.dept_id,
        data: { name: editFormData.name.trim() }
      });
    } else {
      // Create new department
      createMutation.mutate({ name: editFormData.name.trim() });
    }
  };

  // Handle delete
  const handleDelete = (departmentId:any) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(departmentId);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingDepartment(null);
    setEditFormData({ name: '' });
  };

  // Handle add new department
  const handleAddNew = () => {
    setEditingDepartment(null);
    setEditFormData({ name: '' });
    setIsEditDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString:any) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle retry on error
  const handleRetry = () => {
    refetch();
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading departments...</span>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load departments</p>
          <p className="text-sm text-gray-600 mb-4">{queryError.message}</p>
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
                <Building2 className="w-8 h-8 text-blue-600" />
                Department Management
              </h1>
              <p className="text-gray-600 mt-1">Manage your company departments and teams</p>
            </div>
          </div>
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Department
          </Button>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-md">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Departments</p>
                  <p className="text-2xl font-bold">{allDepartments.length}</p>
                </div>
                <Building2 className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Departments</CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Department Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Updated</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((department:any) => (
                    <tr key={department.dept_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="font-mono">
                          {department.dept_id}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{department.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(department.created_at)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(department.updated_at)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(department)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(department.dept_id)}
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
              
              {filteredDepartments.length === 0 && !isPending && (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No departments found</p>
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
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editingDepartment && (
              <div>
                <Label htmlFor="dept-id">Department ID</Label>
                <Input
                  id="dept-id"
                  value={editingDepartment.dept_id || ''}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="dept-name">Department Name</Label>
              <Input
                id="dept-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ name: e.target.value })}
                placeholder="Enter department name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={!editFormData.name.trim() || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingDepartment ? 'Save Changes' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Department;