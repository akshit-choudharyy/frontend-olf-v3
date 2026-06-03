import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Users, UserCheck, UserX } from 'lucide-react';
import EmployeeTable from './EmployeesTable';
import EmployeeFormDialog from './EmployeeFormDialog';
import EmployeeViewDialog from './EmployeeViewDialog';
import DeleteEmployeeDialog from './EmployeeDelete';

const EmployeeManagement: React.FC = () => {
  // Sample data - in real app, this would come from API
  const [employees, setEmployees] = useState<any>([
    {
      id: '1',
      staffPhoto: '',
      emp_id: 'EMP001',
      role: 'Software Developer',
      department: 'Engineering',
      name: 'John Doe',
      phone: '+91 9876543210',
      email: 'john.doe@company.com',
      dob: '1990-05-15',
      gender: 'Male',
      father_name: 'Robert Doe',
      mother_name: 'Jane Doe',
      qualification: 'B.Tech Computer Science',
      work_experience: '3 years',
      current_address: '123 Tech Street, Bangalore, Karnataka 560001',
      permanent_address: '456 Home Street, Mumbai, Maharashtra 400001',
      basic_salary: 750000,
      contract_type: 'Full-time',
      work_shift: 'Morning',
      job_location: 'Bangalore',
      date_of_joining: '2023-01-15',
      bank_details: {
        accountTitle: 'John Doe',
        bankName: 'HDFC Bank',
        branchName: 'Koramangala',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
      },
      isActive: true,
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2023-01-15T10:00:00Z',
    },
    {
      id: '2',
      staffPhoto: '',
      emp_id: 'EMP002',
      role: 'UI/UX Designer',
      department: 'Design',
      name: 'Sarah Wilson',
      phone: '+91 9876543211',
      email: 'sarah.wilson@company.com',
      dob: '1992-08-22',
      gender: 'Female',
      father_name: 'Michael Wilson',
      mother_name: 'Emma Wilson',
      qualification: 'B.Des Visual Communication',
      work_experience: '2 years',
      current_address: '789 Design Ave, Pune, Maharashtra 411001',
      permanent_address: '321 Creative Lane, Delhi, Delhi 110001',
      basic_salary: 650000,
      contract_type: 'Full-time',
      work_shift: 'Flexible',
      job_location: 'Pune',
      date_of_joining: '2023-03-01',
      bank_details: {
        accountTitle: 'Sarah Wilson',
        bankName: 'SBI',
        branchName: 'Pune Main',
        accountNumber: '9876543210',
        ifscCode: 'SBIN0001234',
      },
      isActive: true,
      createdAt: '2023-03-01T10:00:00Z',
      updatedAt: '2023-03-01T10:00:00Z',
    },
  ]);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState<any>(false);
  const [viewDialogOpen, setViewDialogOpen] = useState<any>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<any>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<any>('create');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((emp:any) => emp.isActive).length;
  const inactiveEmployees = totalEmployees - activeEmployees;

  // Filter employees
  const filteredEmployees = employees.filter((employee:any) => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = 
      departmentFilter === 'all' || employee.department === departmentFilter;

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && employee.isActive) ||
      (statusFilter === 'inactive' && !employee.isActive);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Get unique departments
  const departments = Array.from(new Set(employees.map((emp:any) => emp.department)));

  // Handlers
  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setDialogMode('create');
    setFormDialogOpen(true);
  };

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setDialogMode('edit');
    setFormDialogOpen(true);
  };

  const handleViewEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setViewDialogOpen(true);
  };

  const handleDeleteEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (dialogMode === 'create') {
      const newEmployee: any = {
        ...formData,
        id: `EMP${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEmployees((prev:any) => [...prev, newEmployee]);
    } else if (selectedEmployee) {
      setEmployees((prev:any) =>
        prev.map((emp:any) =>
          emp.id === selectedEmployee.id
            ? { ...emp, ...formData, updatedAt: new Date().toISOString() }
            : emp
        )
      );
    }
  };

  const handleDeleteConfirm = (employeeId: string) => {
    setEmployees((prev:any) => prev.filter((emp:any) => emp.id !== employeeId));
  };



  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-sm text-gray-600">
            Manage your organization's employee data and records
          </p>
        </div>
        <Button onClick={handleCreateEmployee} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Statistics Cards - Compact Flex Layout */}
      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[180px]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Total Employees
                </p>
                <p className="text-lg font-bold text-gray-900">{totalEmployees}</p>
              </div>
              <div className="h-7 w-7 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[180px]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Active Staff
                </p>
                <p className="text-lg font-bold text-green-600">{activeEmployees}</p>
              </div>
              <div className="h-7 w-7 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-3.5 w-3.5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[180px]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Inactive Staff
                </p>
                <p className="text-lg font-bold text-red-600">{inactiveEmployees}</p>
              </div>
              <div className="h-7 w-7 bg-red-100 rounded-full flex items-center justify-center">
                <UserX className="h-3.5 w-3.5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Compact Card with Toggle */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(searchTerm || departmentFilter !== 'all' || statusFilter !== 'all') && (
                <Badge variant="destructive" className="text-xs h-5 px-2">
                  {[
                    searchTerm && 'search',
                    departmentFilter !== 'all' && departmentFilter,
                    statusFilter !== 'all' && statusFilter
                  ].filter(Boolean).length}
                </Badge>
              )}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 px-2"
            >
              {showFilters ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0 pb-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-8">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept:any) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || departmentFilter !== 'all' || statusFilter !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t">
                <span className="text-xs text-gray-500">Active:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs h-5">
                    "{searchTerm}"
                  </Badge>
                )}
                {departmentFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs h-5">
                    {departmentFilter}
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs h-5">
                    {statusFilter}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setDepartmentFilter('all');
                    setStatusFilter('all');
                  }}
                  className="h-5 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Employee Table - Compact Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Employee List
            </CardTitle>
            <Badge variant="outline" className="text-xs h-5">
              {filteredEmployees.length} of {totalEmployees}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <EmployeeTable
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            onView={handleViewEmployee}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EmployeeFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        employee={selectedEmployee}
        onSubmit={handleFormSubmit}
        mode={dialogMode}
      />

      <EmployeeViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        employee={selectedEmployee}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
      />

      <DeleteEmployeeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        employee={selectedEmployee}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default EmployeeManagement;