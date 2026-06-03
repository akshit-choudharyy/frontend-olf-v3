import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, Calendar, Loader2, UserCheck, UserX, MapPin, Search } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { olfService } from '@/utils/axiosInstance';
import { useState, useMemo } from 'react';

const EmployeesTable = ({
  onEdit,
  onView,
  onDelete,
}: {
  onEdit: (employee: any) => void;
  onView: (employee: any) => void;
  onDelete?: (employee: any) => void;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Assignment dialog state
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedStations, setSelectedStations] = useState<number[]>([]);
  const [selectedOutlets, setSelectedOutlets] = useState<number[]>([]);
  const [stationSearch, setStationSearch] = useState('');
  const [outletSearch, setOutletSearch] = useState('');

  // Fetch employees using TanStack Query
  const {
    isPending: employeesLoading,
    error: employeesError,
    data: allEmployees = [],
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () =>
      olfService.get('/employees').then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        // Sort by emp_id in descending order (latest on top)
        return res.data.data.rows || [];
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch roles for lookup
  const {
    data: allRoles = [],
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () =>
      olfService.get('/roles').then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        return res.data.data.rows || [];
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch departments for lookup
  const {
    data: allDepartments = [],
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

  // Fetch stations for assignment
  const {
    data: allStations = [],
  } = useQuery({
    queryKey: ['stations'],
    queryFn: () =>
      olfService.get('/stations').then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        return res.data.data.rows || [];
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch outlets (restaurants) for assignment
  const {
    data: allOutlets = [],
  } = useQuery({
    queryKey: ['outlets'],
    queryFn: () =>
      olfService.get('/restraunts', {
        params: { 
          status: 1,
          verified: 1 
        }
      }).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Unexpected response status');
        }
        return res?.data?.data?.rows || [];
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Delete employee mutation
  const deleteMutation:any = useMutation({
    mutationFn: (id) =>
      olfService.delete(`/employee/${id}`).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to delete employee');
        }
        return res.data;
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      alert('Employee deleted successfully!');
      
      // Call onDelete callback if provided
      if (onDelete) {
        const deletedEmployee = allEmployees.find((emp:any) => emp.emp_id === variables);
        if (deletedEmployee) {
          onDelete(deletedEmployee);
        }
      }
    },
    onError: (error) => {
      console.error('Failed to delete employee:', error);
      alert('Failed to delete employee. Please try again.');
    },
  });

  // Update employee status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      olfService.put(`/employee/${id}`, { is_active }).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to update employee status');
        }
        return res.data;
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      const statusText = variables.is_active ? 'activated' : 'deactivated';
      alert(`Employee ${statusText} successfully!`);
    },
    onError: (error) => {
      console.error('Failed to update employee status:', error);
      alert('Failed to update employee status. Please try again.');
    },
  });

  // Assign stations and outlets mutation
  const assignmentMutation = useMutation({
    mutationFn: ({ id, stations, outlets }: { id: number; stations: number[]; outlets: number[] }) =>
      olfService.put(`/employee/${id}`, { stations, outlets }).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to assign stations and outlets');
        }
        return res.data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      alert('Stations and outlets assigned successfully!');
      setAssignmentDialogOpen(false);
      resetAssignmentState();
    },
    onError: (error) => {
      console.error('Failed to assign stations and outlets:', error);
      alert('Failed to assign stations and outlets. Please try again.');
    },
  });

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(salary);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role name by ID
  const getRoleName = (roleId: number) => {
    const role = allRoles.find((role:any) => role.role_id === roleId);
    return role?.name || 'Unknown Role';
  };

  // Get department name by role ID
  const getDepartmentName = (roleId: number) => {
    const role = allRoles.find((role:any) => role.role_id === roleId);
    if (role?.dept_id) {
      const department = allDepartments.find((dept:any) => dept.dept_id === role.dept_id);
      return department?.name || 'Unknown Department';
    }
    return 'Unknown Department';
  };

  // Get station name by ID
  const getStationName = (stationId: number) => {
    const station = allStations.find((station: any) => station.station_id === stationId);
    return station?.station_name || `Station ${stationId}`;
  };

  // Get outlet name by ID
  const getOutletName = (outletId: number) => {
    const outlet = allOutlets.find((outlet: any) => outlet.outlet_id === outletId);
    return outlet?.outlet_name || `Outlet ${outletId}`;
  };

  // Get assigned stations for employee
  const getAssignedStations = (employee: any) => {
    if (!employee.stations || !Array.isArray(employee.stations)) return [];
    return employee.stations.map((stationId: number) => ({
      id: stationId,
      name: getStationName(stationId)
    }));
  };

  // Get assigned outlets for employee
  const getAssignedOutlets = (employee: any) => {
    if (!employee.outlets || !Array.isArray(employee.outlets)) return [];
    return employee.outlets.map((outletId: number) => ({
      id: outletId,
      name: getOutletName(outletId)
    }));
  };

  // Convert gender number to text
  const getGenderText = (gender: number) => {
    switch (gender) {
      case 1: return 'Male';
      case 2: return 'Female';
      case 3: return 'Other';
      default: return 'Unknown';
    }
  };

  // Handle delete with confirmation
  const handleDelete = (employee: any) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      deleteMutation.mutate(employee.emp_id);
    }
  };

  // Handle status update with confirmation
  const handleStatusUpdate = (employee: any) => {
    const newStatus = !employee.is_active;
    const actionText = newStatus ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${actionText} ${employee.name}?`)) {
      updateStatusMutation.mutate({
        id: employee.emp_id,
        is_active: newStatus
      });
    }
  };

  // Handle opening assignment dialog
  const handleOpenAssignment = (employee: any) => {
    setSelectedEmployee(employee);
    
    // Pre-populate with currently assigned stations and outlets
    const currentStations = employee.stations || [];
    const currentOutlets = employee.outlets || [];
    
    setSelectedStations(Array.isArray(currentStations) ? currentStations : []);
    setSelectedOutlets(Array.isArray(currentOutlets) ? currentOutlets : []);
    setStationSearch('');
    setOutletSearch('');
    setAssignmentDialogOpen(true);
  };

  // Reset assignment state
  const resetAssignmentState = () => {
    setSelectedEmployee(null);
    setSelectedStations([]);
    setSelectedOutlets([]);
    setStationSearch('');
    setOutletSearch('');
  };

  // Handle assignment submission
  const handleAssignmentSubmit = () => {
    if (!selectedEmployee) return;
    
    assignmentMutation.mutate({
      id: selectedEmployee.emp_id,
      stations: selectedStations,
      outlets: selectedOutlets
    });
  };

  // Toggle station selection
  const toggleStationSelection = (stationId: number) => {
    setSelectedStations(prev => 
      prev.includes(stationId) 
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  // Toggle outlet selection
  const toggleOutletSelection = (outletId: number) => {
    setSelectedOutlets(prev => 
      prev.includes(outletId) 
        ? prev.filter(id => id !== outletId)
        : [...prev, outletId]
    );
  };

  // Filtered stations based on search
  const filteredStations = useMemo(() => {
    return allStations.filter((station: any) =>
      station.station_name?.toLowerCase().includes(stationSearch.toLowerCase()) ||
      station.station_code?.toLowerCase().includes(stationSearch.toLowerCase())
    );
  }, [allStations, stationSearch]);

  // Filtered outlets based on search
  const filteredOutlets = useMemo(() => {
    return allOutlets.filter((outlet: any) =>
      outlet.outlet_name?.toLowerCase().includes(outletSearch.toLowerCase())
    );
  }, [allOutlets, outletSearch]);

  // Handle retry on error
  const handleRetry = () => {
    refetchEmployees();
  };

  // Check if any mutation is pending for a specific employee
  const isMutationPending = (employeeId: number) => {
    return (deleteMutation.isPending && deleteMutation.variables === employeeId) ||
           (updateStatusMutation.isPending && updateStatusMutation.variables?.id === employeeId) ||
           (assignmentMutation.isPending && selectedEmployee?.emp_id === employeeId);
  };

  if (employeesLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading employees...</span>
        </div>
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load employees</p>
          <p className="text-sm text-gray-600 mb-4">{employeesError.message}</p>
          <Button onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Staff ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Salary</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned Stations</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned Outlets</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allEmployees.map((employee: any) => {
              const assignedStations = getAssignedStations(employee);
              const assignedOutlets = getAssignedOutlets(employee);
              
              return (
                <tr
                  key={employee.emp_id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onView(employee)}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={employee.profile_url}
                          alt={employee.name}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-600">
                          {getGenderText(employee.gender)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-sm">
                    {employee.emp_id}
                  </td>
                  <td className="py-4 px-4">{getRoleName(employee.role_id)}</td>
                  <td className="py-4 px-4">{getDepartmentName(employee.role_id)}</td>
                  <td className="py-4 px-4">{employee.phone || 'N/A'}</td>
                  <td className="py-4 px-4 max-w-[200px] truncate">
                    {employee.email}
                  </td>
                  <td className="py-4 px-4">
                    {employee.basic_salary ? formatSalary(employee.basic_salary) : 'N/A'}
                  </td>
                  <td className="py-4 px-4 max-w-[200px]">
                    {assignedStations.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedStations.slice(0, 2).map((station:any) => (
                          <Badge
                            key={station.id}
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {station.name}
                          </Badge>
                        ))}
                        {assignedStations.length > 2 && (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                            +{assignedStations.length - 2} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No stations</span>
                    )}
                  </td>
                  <td className="py-4 px-4 max-w-[200px]">
                    {assignedOutlets.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedOutlets.slice(0, 2).map((outlet:any) => (
                          <Badge
                            key={outlet.id}
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200"
                          >
                            {outlet.name}
                          </Badge>
                        ))}
                        {assignedOutlets.length > 2 && (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                            +{assignedOutlets.length - 2} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No outlets</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={employee.is_active ? 'default' : 'secondary'}
                      className={
                        employee.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-red-100 text-red-800 hover:bg-red-100'
                      }
                    >
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(employee);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(employee);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({to: `/attendance/${employee.emp_id}`});
                          }}
                          className="text-blue-600"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          View Attendance
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignment(employee);
                          }}
                          className="text-purple-600"
                          disabled={isMutationPending(employee.emp_id)}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Assign Stations & Outlets
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(employee);
                          }}
                          className={employee.is_active ? "text-orange-600" : "text-green-600"}
                          disabled={isMutationPending(employee.emp_id)}
                        >
                          {updateStatusMutation.isPending && updateStatusMutation.variables?.id === employee.emp_id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : employee.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(employee);
                          }}
                          className="text-red-600"
                          disabled={isMutationPending(employee.emp_id)}
                        >
                          {deleteMutation.isPending && deleteMutation.variables === employee.emp_id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {allEmployees.length === 0 && !employeesLoading && (
        <div className="flex h-32 items-center justify-center text-gray-500">
          No employees found
        </div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Assign Stations & Outlets</DialogTitle>
            <DialogDescription>
              Assign railway stations and outlets to {selectedEmployee?.name}
              {selectedEmployee && (
                <div className="mt-2 text-sm">
                  <div className="text-blue-600">
                    Currently assigned: {(selectedEmployee.stations || []).length} station(s), {(selectedEmployee.outlets || []).length} outlet(s)
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
            {/* Stations Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Railway Stations</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search stations..."
                    value={stationSearch}
                    onChange={(e) => setStationSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
                {filteredStations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No stations found</p>
                ) : (
                  <div className="space-y-2">
                    {filteredStations.map((station: any) => {
                      const isSelected = selectedStations.includes(station.station_id);
                      const isCurrentlyAssigned = selectedEmployee?.stations?.includes(station.station_id);
                      
                      return (
                        <div
                          key={station.station_id}
                          className={`flex items-center space-x-2 p-2 hover:bg-gray-50 rounded ${
                            isCurrentlyAssigned ? 'bg-blue-50 border border-blue-200' : ''
                          }`}
                        >
                          <Checkbox
                            id={`station-${station.station_id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleStationSelection(station.station_id)}
                          />
                          <label
                            htmlFor={`station-${station.station_id}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{station.station_name}</span>
                              {isCurrentlyAssigned && (
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                  Currently Assigned
                                </Badge>
                              )}
                            </div>
                            {station.station_code && (
                              <div className="text-gray-500 text-xs">{station.station_code}</div>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {selectedStations.length > 0 && (
                <div className="text-sm text-gray-600">
                  Selected: {selectedStations.length} station(s)
                </div>
              )}
            </div>

            {/* Outlets Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Outlets</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search outlets..."
                    value={outletSearch}
                    onChange={(e) => setOutletSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
                {filteredOutlets.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No outlets found</p>
                ) : (
                  <div className="space-y-2">
                    {filteredOutlets.map((outlet: any) => {
                      const isSelected = selectedOutlets.includes(outlet.outlet_id);
                      const isCurrentlyAssigned = selectedEmployee?.outlets?.includes(outlet.outlet_id);
                      
                      return (
                        <div
                          key={outlet.outlet_id}
                          className={`flex items-center space-x-2 p-2 hover:bg-gray-50 rounded ${
                            isCurrentlyAssigned ? 'bg-green-50 border border-green-200' : ''
                          }`}
                        >
                          <Checkbox
                            id={`outlet-${outlet.outlet_id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleOutletSelection(outlet.outlet_id)}
                          />
                          <label
                            htmlFor={`outlet-${outlet.outlet_id}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{outlet.outlet_name}</span>
                              {isCurrentlyAssigned && (
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                  Currently Assigned
                                </Badge>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {selectedOutlets.length > 0 && (
                <div className="text-sm text-gray-600">
                  Selected: {selectedOutlets.length} outlet(s)
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAssignmentDialogOpen(false)}
              disabled={assignmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignmentSubmit}
              disabled={assignmentMutation.isPending}
            >
              {assignmentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Assignment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesTable;