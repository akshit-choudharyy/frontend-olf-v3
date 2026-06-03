// import React, { useState, useEffect } from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { toast } from 'react-hot-toast';
// import { format } from "date-fns";
// import { Calendar } from "@/components/ui/calendar";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import { olfService } from '@/utils/axiosInstance';

// interface AddClosureProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSuccess: () => void;
//   outletData?: { outlet_id: string | number; weeklyclosed?: string[]; [key: string]: any };
// }

// const DAYS_OF_WEEK = [
//   { id: 'SUN', label: 'Sunday' },
//   { id: 'MON', label: 'Monday' },
//   { id: 'TUE', label: 'Tuesday' },
//   { id: 'WED', label: 'Wednesday' },
//   { id: 'THU', label: 'Thursday' },
//   { id: 'FRI', label: 'Friday' },
//   { id: 'SAT', label: 'Saturday' },
// ];

// const AddClosure: React.FC<AddClosureProps> = ({ open, onOpenChange, onSuccess, outletData }) => {
//   const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
//     from: undefined,
//     to: undefined,
//   });
//   const [closureReason, setClosureReason] = useState("");
//   const [weeklyClosed, setWeeklyClosed] = useState<string[]>([]);

//   // Update weeklyClosed when outletData changes
//   useEffect(() => {
//     if (outletData?.weeklyclosed) {
//       setWeeklyClosed(outletData.weeklyclosed);
//     }
//   }, [outletData?.weeklyclosed]);

//   const userdata = localStorage.getItem("persist:root");
//   const parsedData = userdata ? JSON.parse(userdata) : null;
//   const user = JSON.parse(parsedData.auth).user;

//   const handleWeeklyClosedChange = (dayId: string) => {
//     setWeeklyClosed(prev => 
//       prev.includes(dayId) 
//         ? prev.filter(day => day !== dayId) 
//         : [...prev, dayId]
//     );
//   };

//   const handleActivate = async () => {
//     await olfService.put(`/restraunt/${outletData?.outlet_id}`, {
//       "closing_period": null,
//       "closure_reason": null,
//       "updated_by": user?.name,
//       "updated_at": format(new Date(), 'yyyy-MM-dd HH:mm')
//     });
//     toast(`Outlet Updated Successfully!`, {
//       style: {
//         borderRadius: '10px',
//         background: 'wheat',
//         color: 'red',
//       },
//       duration: 4000,
//     });
//     onSuccess();
//     onOpenChange(false);
//   }

//   const handleweeklyclosed = async () => {
//     await olfService.put(`/restraunt/${outletData?.outlet_id}`, { 
//       weeklyclosed: weeklyClosed 
//     });
//     toast(`Weekly closed Updated Successfully!`, {
//       style: {
//         borderRadius: '10px',
//         background: 'wheat',
//         color: 'red',
//       },
//       duration: 4000,
//     });
//   }

//   const handleSubmit = async () => {
//     if (!dateRange.from || !dateRange.to || !closureReason) {
//       toast.error("Please fill all fields", {
//         style: {
//           borderRadius: '10px',
//           background: 'black',
//           color: 'red',
//         },
//         duration: 4000,
//       });
//       return;
//     }

//     const closedFrom = format(dateRange.from, 'yyyy-MM-dd') + " 00:00";
//     const closedTo = format(dateRange.to, 'yyyy-MM-dd') + " 23:59";

//     const payload = {
//       closing_period: JSON.stringify([{
//         closedFrom,
//         closedTo
//       }]),
//       closure_reason: closureReason,
//       weeklyclosed: weeklyClosed,
//       updated_by: user?.name,
//       updated_at: format(new Date(), 'yyyy-MM-dd HH:mm')
//     };

//     try {
//       if (typeof outletData !== 'undefined' && outletData.outlet_id) {
//         await olfService.put(`/restraunt/${outletData.outlet_id}`, payload);
//         toast(`Outlet Updated Successfully!`, {
//           style: {
//             borderRadius: '10px',
//             background: 'wheat',
//             color: 'red',
//           },
//           duration: 4000,
//         });
//       } else {
//         toast(`No changes detected`, {
//           style: {
//             borderRadius: '10px',
//             background: 'wheat',
//             color: 'red',
//           },
//           duration: 4000,
//         });
//       }
//       onSuccess();
//       onOpenChange(false);
//     } catch (error) {
//       console.error("Error creating closure:", error);
//       toast.error(`Failed to create closure! ${error instanceof Error ? error.message : 'Unknown error'}`, {
//         style: {
//           borderRadius: '10px',
//           background: 'black',
//           color: 'red',
//         },
//         duration: 4000,
//       });
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-bold text-blue-800">Create Closure</DialogTitle>
//         </DialogHeader>
//         {outletData?.closing_period?.length > 0 ? (
//           <Button onClick={handleActivate}>Activate Outlet</Button>
//         ) : (
//           <div className="space-y-4 pt-4">
//             <div>
//               <Label className="text-blue-700">Weekly Closed Days</Label>
//               <div className="grid grid-cols-2 gap-2 mt-2">
//                 {DAYS_OF_WEEK.map((day) => (
//                   <div key={day.id} className="flex items-center space-x-2">
//                     <Checkbox
//                       id={day.id}
//                       checked={weeklyClosed.includes(day.id)}
//                       onCheckedChange={() => handleWeeklyClosedChange(day.id)}
//                     />
//                     <label htmlFor={day.id} className="text-sm font-medium leading-none cursor-pointer">
//                       {day.label}
//                     </label>
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <Button onClick={handleweeklyclosed}>Save Weekly Closed</Button>
            
//             <div>
//               <Label className="text-blue-700">Select Closure Date Range</Label>
//               <Calendar
//                 mode="range"
//                 selected={dateRange}
//                 onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
//                 className="rounded-md border border-blue-200"
//               />
//             </div>

//             <div>
//               <Label className="text-blue-700">Reason for Closure</Label>
//               <Input
//                 placeholder="Enter reason for closure"
//                 value={closureReason}
//                 onChange={(e) => setClosureReason(e.target.value)}
//                 className="border-blue-200 focus:border-blue-500"
//               />
//             </div>

//             <DialogFooter className="pt-4">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => onOpenChange(false)}
//                 className="border-blue-200 text-blue-700 hover:bg-blue-50"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="button"
//                 onClick={handleSubmit}
//                 className="bg-blue-600 hover:bg-blue-700"
//               >
//                 Create Closure
//               </Button>
//             </DialogFooter>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AddClosure;


// src/components/your/path/AddClosure.js

// src/components/your/path/AddClosure.js

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { olfService } from '@/utils/axiosInstance';

const DAYS_OF_WEEK = [
    { id: 'SUN', label: 'Sunday' },
    { id: 'MON', label: 'Monday' },
    { id: 'TUE', label: 'Tuesday' },
    { id: 'WED', label: 'Wednesday' },
    { id: 'THU', label: 'Thursday' },
    { id: 'FRI', label: 'Friday' },
    { id: 'SAT', label: 'Saturday' },
];

interface AddClosureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  outletData?: { outlet_id: string | number; weeklyclosed?: string[]; closing_period?: any[]; status?: number; [key: string]: any };
}

const AddClosure: React.FC<AddClosureProps> = ({ open, onOpenChange, onSuccess, outletData }) => {
  // State for 'Inactive' tab
  const [closureType, setClosureType] = useState<'dates' | 'days'>('dates');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [inactiveReason, setInactiveReason] = useState("");
  const [weeklyClosed, setWeeklyClosed] = useState<string[]>([]);
  
  // State for 'Close' tab
  const [permanentClosureReason, setPermanentClosureReason] = useState("");

  const userdata = localStorage.getItem("persist:root");
  const parsedData = userdata ? JSON.parse(userdata) : null;
  const user = JSON.parse(parsedData?.auth || '{}')?.user;

  // Reset all states when modal opens
  useEffect(() => {
    if (open) {
      setWeeklyClosed(outletData?.weeklyclosed || []);
      setInactiveReason("");
      setPermanentClosureReason("");
      setDateRange({ from: undefined, to: undefined });
      setClosureType('dates');
    }
  }, [open, outletData]);

  const handleWeeklyClosedChange = (dayId: string) => {
    setWeeklyClosed(prev => 
      prev.includes(dayId) 
        ? prev.filter(day => day !== dayId) 
        : [...prev, dayId]
    );
  };

  const handleActivate = async () => {
    try {
      await olfService.put(`/restraunt/${outletData?.outlet_id}`, {
        "status": 1,
        "closing_period": null,
        "closure_reason": null,
        "weeklyclosed": [],
        "updated_by": user?.name,
        "updated_at": format(new Date(), 'yyyy-MM-dd HH:mm')
      });
      toast.success(`Outlet Activated Successfully!`);
      onSuccess();
      onOpenChange(false);
    } catch(error) {
       toast.error(`Failed to activate outlet! ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Handler for setting outlet as temporarily inactive
  const handleSetInactive = async () => {
    let payload: any = {
      updated_by: user?.name,
      updated_at: format(new Date(), 'yyyy-MM-dd HH:mm'),
      status: 0, // 
    };

    if (closureType === 'dates') {
      if (!dateRange.from || !dateRange.to || !inactiveReason) {
        toast.error("Please select a date range and provide a reason.");
        return;
      }
      
      const closedFrom = format(dateRange.from, 'yyyy-MM-dd') + " 00:00";
      const closedTo = format(dateRange.to, 'yyyy-MM-dd') + " 23:59";

      payload = {
        ...payload,
        closing_period: JSON.stringify([{ closedFrom, closedTo }]),
        closure_reason: inactiveReason,
        weeklyclosed: [],
      };
    } else if (closureType === 'days') {
       if (weeklyClosed.length === 0 || !inactiveReason) {
        toast.error("Please select at least one day and provide a reason.");
        return;
      }
      payload = {
        ...payload,
        weeklyclosed: weeklyClosed,
        closing_period: null,
        closure_reason: inactiveReason,
      };
    }

    try {
      if (outletData?.outlet_id) {
        await olfService.put(`/restraunt/${outletData.outlet_id}`, payload);
        toast.success(`Outlet set to inactive successfully!`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(`Outlet ID is missing.`);
      }
    } catch (error) {
      console.error("Error setting outlet inactive:", error);
      toast.error(`Failed to set outlet inactive! ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handler for permanently closing the outlet
  const handlePermanentClose = async () => {
    if (!permanentClosureReason.trim()) {
        toast.error("Please provide a reason for permanently closing the outlet.");
        return;
    }
    
    const payload = {
        status: 2, // Set status to 2 for closed
        closure_reason: permanentClosureReason,
        closing_period: null, // Ensure temporary closure fields are cleared
        weeklyclosed: [],     // Ensure temporary closure fields are cleared
        updated_by: user?.name,
        updated_at: format(new Date(), 'yyyy-MM-dd HH:mm'),
    };

    try {
        if (outletData?.outlet_id) {
            await olfService.put(`/restraunt/${outletData.outlet_id}`, payload);
            toast.success(`Outlet has been permanently closed!`);
            onSuccess();
            onOpenChange(false);
        } else {
            toast.error(`Outlet ID is missing.`);
        }
    } catch (error) {
        console.error("Error closing outlet:", error);
        toast.error(`Failed to close outlet! ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-800">Manage Outlet Status</DialogTitle>
        </DialogHeader>
        {outletData?.status !== 1 ? (
          <div className="pt-4 text-center">
             <p className="mb-4">This outlet is currently inactive. Do you want to activate it?</p>
             <Button onClick={handleActivate} className="bg-green-600 hover:bg-green-700">Activate Outlet</Button>
          </div>
        ) : (
          <Tabs defaultValue="inactive" className="w-full pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inactive">Make Inactive</TabsTrigger>
              <TabsTrigger value="close">Close Permanently</TabsTrigger>
            </TabsList>

            {/* Inactive Tab Content */}
            <TabsContent value="inactive">
                <div className="space-y-4 pt-4">
                    <div>
                        <Label className="text-blue-700">Closure Type</Label>
                        <RadioGroup value={closureType} onValueChange={(value: 'dates' | 'days') => setClosureType(value)} className="flex space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dates" id="dates" />
                            <Label htmlFor="dates">By Date Range</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="days" id="days" />
                            <Label htmlFor="days">By Weekly Days</Label>
                        </div>
                        </RadioGroup>
                    </div>
                    
                    {closureType === 'days' && (
                    <div className="p-4 border rounded-md">
                        <Label className="text-blue-700">Select Weekly Closed Days</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                        {DAYS_OF_WEEK.map((day) => (
                            <div key={day.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={day.id}
                                checked={weeklyClosed.includes(day.id)}
                                onCheckedChange={() => handleWeeklyClosedChange(day.id)}
                            />
                            <label htmlFor={day.id} className="text-sm font-medium leading-none cursor-pointer">
                                {day.label}
                            </label>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}
                    
                    {closureType === 'dates' && (
                    <div className="p-4 border rounded-md space-y-4">
                        <div>
                        <Label className="text-blue-700">Select Closure Date Range</Label>
                        <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                            className="rounded-md border border-blue-200"
                        />
                        </div>
                    </div>
                    )}

                    <div>
                        <Label className="text-blue-700">Reason for Inactivity</Label>
                        <Input
                            placeholder="Enter reason for closure"
                            value={inactiveReason}
                            onChange={(e) => setInactiveReason(e.target.value)}
                            className="border-blue-200 focus:border-blue-500"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSetInactive} className="bg-blue-600 hover:bg-blue-700">
                            Set Inactive
                        </Button>
                    </DialogFooter>
                </div>
            </TabsContent>

            {/* Close Tab Content */}
            <TabsContent value="close">
                <div className="space-y-6 pt-4">
                    <div>
                        <p className="text-sm text-gray-500">This action will permanently close the outlet. It will no longer be available. Please provide a reason below.</p>
                    </div>
                    <div>
                        <Label htmlFor="permanent-reason" className="text-blue-700">Reason for Permanent Closure</Label>
                        <Input
                            id="permanent-reason"
                            placeholder="e.g., Business permanently closed"
                            value={permanentClosureReason}
                            onChange={(e) => setPermanentClosureReason(e.target.value)}
                            className="border-blue-200 focus:border-blue-500 mt-2"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handlePermanentClose}>
                            Close Outlet Permanently
                        </Button>
                    </DialogFooter>
                </div>
            </TabsContent>

          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddClosure;