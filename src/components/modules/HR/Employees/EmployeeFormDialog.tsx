import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, Loader2 } from 'lucide-react';
import { olfService } from '@/utils/axiosInstance';

// Import your service - replace 'olfService' with your actual service name

const EmployeeFormDialog = ({
  open,
  onOpenChange,
  employee,
  onSubmit,
  mode,
}: {
  open: any;
  onOpenChange: (open: boolean) => void;
  employee?: any;
  onSubmit?: (data: any) => void;
  mode: 'create' | 'edit';
}) => {
  const [formData, setFormData] = useState<any>({
    profile_url: '',
    role_id: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    gender: 1, // 1 for Male, 2 for Female, 3 for Other
    father_name: '',
    mother_name: '',
    qualification: '',
    work_experience: '',
    current_address: '',
    permanent_address: '',
    basic_salary: 0,
    contract_type: 'Full-time',
    work_shift: 'Morning',
    job_location: '',
    date_of_joining: '',
    bank_details: {
      accountTitle: '',
      bankName: '',
      branchName: '',
      accountNumber: '',
      ifscCode: '',
    },
    is_active: true,
  });

  const [photoPreview, setPhotoPreview] = useState<any>('');
  
  const queryClient = useQueryClient();

  // Fetch roles for dropdown
  const {
    data: allRoles = [],
    isLoading: rolesLoading,
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

  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: (employeeData) =>
      olfService.post('/employee', employeeData).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to create employee');
        }
        return res.data;
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onOpenChange(false);
      alert('Employee created successfully!');
      
      // Reset form
      setFormData({
        profile_url: '',
        role_id: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        dob: '',
        gender: 1,
        father_name: '',
        mother_name: '',
        qualification: '',
        work_experience: '',
        current_address: '',
        permanent_address: '',
        basic_salary: 0,
        contract_type: 'Full-time',
        work_shift: 'Morning',
        job_location: '',
        date_of_joining: '',
        bank_details: {
          accountTitle: '',
          bankName: '',
          branchName: '',
          accountNumber: '',
          ifscCode: '',
        },
        is_active: true,
      });
      setPhotoPreview('');
      
      // Call onSubmit if provided for additional handling
      if (onSubmit) {
        onSubmit(data);
      }
    },
    onError: (error) => {
      console.error('Failed to create employee:', error);
      alert('Failed to create employee. Please try again.');
    },
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }:{id:any,data:any}) =>
      olfService.put(`/employee/${id}`, data).then((res) => {
        if (res.data.status !== 1) {
          throw new Error('Failed to update employee');
        }
        return res.data;
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onOpenChange(false);
      alert('Employee updated successfully!');
      
      // Call onSubmit if provided for additional handling
      if (onSubmit) {
        onSubmit(data);
      }
    },
    onError: (error) => {
      console.error('Failed to update employee:', error);
      alert('Failed to update employee. Please try again.');
    },
  });

  useEffect(() => {
    if (employee && mode === 'edit') {
      setFormData({
        profile_url: employee.profile_url || '',
        role_id: employee.role_id?.toString() || '',
        name: employee.name || '',
        email: employee.email || '',
        password: '', // Don't pre-fill password for security
        phone: employee.phone || '',
        dob: employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
        gender: employee.gender || 1,
        father_name: employee.father_name || '',
        mother_name: employee.mother_name || '',
        qualification: employee.qualification || '',
        work_experience: employee.work_experience || '',
        current_address: employee.current_address || '',
        permanent_address: employee.permanent_address || '',
        basic_salary: employee.basic_salary || 0,
        contract_type: employee.contract_type || 'Full-time',
        work_shift: employee.work_shift || 'Morning',
        job_location: employee.job_location || '',
        date_of_joining: employee.date_of_joining ? new Date(employee.date_of_joining).toISOString().split('T')[0] : '',
        bank_details: employee.bank_details || {
          accountTitle: '',
          bankName: '',
          branchName: '',
          accountNumber: '',
          ifscCode: '',
        },
        is_active: employee.is_active !== undefined ? employee.is_active : true,
      });
      setPhotoPreview(employee.profile_url || '');
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        profile_url: '',
        role_id: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        dob: '',
        gender: 1,
        father_name: '',
        mother_name: '',
        qualification: '',
        work_experience: '',
        current_address: '',
        permanent_address: '',
        basic_salary: 0,
        contract_type: 'Full-time',
        work_shift: 'Morning',
        job_location: '',
        date_of_joining: '',
        bank_details: {
          accountTitle: '',
          bankName: '',
          branchName: '',
          accountNumber: '',
          ifscCode: '',
        },
        is_active: true,
      });
      setPhotoPreview('');
    }
  }, [employee, mode, open]);

  const handleInputChange = (field: any, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBankDetailsChange = (field: any, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      bank_details: {
        ...prev.bank_details,
        [field]: value,
      },
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        handleInputChange('profile_url', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Basic validation for required fields
    if (!formData.name.trim()) {
      alert('Please enter employee name');
      return;
    }
    if (!formData.email.trim()) {
      alert('Please enter email address');
      return;
    }
    if (mode === 'create' && !formData.password.trim()) {
      alert('Please enter password');
      return;
    }
    if (!formData.role_id) {
      alert('Please select a role');
      return;
    }
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      role_id: parseInt(formData.role_id),
      basic_salary: parseInt(formData.basic_salary) || 0,
      gender: parseInt(formData.gender),
      dob: formData.dob ? new Date(formData.dob).toISOString() : null,
      date_of_joining: formData.date_of_joining ? new Date(formData.date_of_joining).toISOString() : null,
    };

    // Remove password if empty in edit mode
    if (mode === 'edit' && !submitData.password) {
      delete submitData.password;
    }

    if (mode === 'create') {
      createMutation.mutate(submitData);
    } else {
      updateMutation.mutate({
        id: employee.emp_id,
        data: submitData
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if form is valid
  const isFormValid = () => {
    const isBasicValid = formData.name.trim() && 
                        formData.email.trim() && 
                        formData.role_id;
    
    if (mode === 'create') {
      return isBasicValid && formData.password.trim();
    }
    
    return isBasicValid;
  };

  // Check if mutations are loading
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const genderOptions = [
    { value: 1, label: 'Male' },
    { value: 2, label: 'Female' },
    { value: 3, label: 'Other' },
  ];

  const contractTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const workShifts = ['Morning', 'Evening', 'Night', 'Flexible'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoPreview} alt="Employee Photo" />
                <AvatarFallback className="text-lg">
                  {formData.name ? getInitials(formData.name) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="banking">Banking</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required={mode === 'create'}
                        placeholder={mode === 'edit' ? 'Leave blank to keep current password' : 'Enter password'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={formData.gender?.toString()}
                        onValueChange={(value) => handleInputChange('gender', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="father_name">Father's Name</Label>
                      <Input
                        id="father_name"
                        value={formData.father_name}
                        onChange={(e) => handleInputChange('father_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mother_name">Mother's Name</Label>
                      <Input
                        id="mother_name"
                        value={formData.mother_name}
                        onChange={(e) => handleInputChange('mother_name', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role_id">Role *</Label>
                      <Select
                        value={formData.role_id}
                        onValueChange={(value) => handleInputChange('role_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {rolesLoading ? (
                            <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading roles...
                              </div>
                            </SelectItem>
                          ) : (
                            allRoles.map((role:any) => (
                              <SelectItem key={role.role_id} value={role.role_id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="basic_salary">Basic Salary</Label>
                      <Input
                        id="basic_salary"
                        type="number"
                        value={formData.basic_salary}
                        onChange={(e) => handleInputChange('basic_salary', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input
                        id="qualification"
                        value={formData.qualification}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="work_experience">Work Experience</Label>
                      <Input
                        id="work_experience"
                        value={formData.work_experience}
                        onChange={(e) => handleInputChange('work_experience', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contract_type">Contract Type</Label>
                      <Select
                        value={formData.contract_type}
                        onValueChange={(value) => handleInputChange('contract_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {contractTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="work_shift">Work Shift</Label>
                      <Select
                        value={formData.work_shift}
                        onValueChange={(value) => handleInputChange('work_shift', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {workShifts.map((shift) => (
                            <SelectItem key={shift} value={shift}>
                              {shift}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_location">Job Location</Label>
                      <Input
                        id="job_location"
                        value={formData.job_location}
                        onChange={(e) => handleInputChange('job_location', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_of_joining">Date of Joining</Label>
                      <Input
                        id="date_of_joining"
                        type="date"
                        value={formData.date_of_joining}
                        onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="is_active">Status</Label>
                    <Select
                      value={formData.is_active ? 'true' : 'false'}
                      onValueChange={(value) => handleInputChange('is_active', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Address Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current_address">Current Address</Label>
                    <Textarea
                      id="current_address"
                      value={formData.current_address}
                      onChange={(e) => handleInputChange('current_address', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="permanent_address">Permanent Address</Label>
                    <Textarea
                      id="permanent_address"
                      value={formData.permanent_address}
                      onChange={(e) => handleInputChange('permanent_address', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Banking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountTitle">Account Title</Label>
                      <Input
                        id="accountTitle"
                        value={formData.bank_details.accountTitle}
                        onChange={(e) => handleBankDetailsChange('accountTitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={formData.bank_details.bankName}
                        onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="branchName">Branch Name</Label>
                      <Input
                        id="branchName"
                        value={formData.bank_details.branchName}
                        onChange={(e) => handleBankDetailsChange('branchName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={formData.bank_details.accountNumber}
                        onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.bank_details.ifscCode}
                      onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={rolesLoading || !isFormValid() || isLoading}>
              {isLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {mode === 'create' ? 'Create Employee' : 'Update Employee'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;