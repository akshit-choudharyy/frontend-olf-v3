import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';
import { olfService } from '@/utils/axiosInstance';

const AddStation = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize form
  const form = useForm({
    defaultValues: {
      station_name: '',
      station_code: '',
    },
  });

  // Search stations as user types
  useEffect(() => {
    const searchStations = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await olfService.get(`/searchstationname/${searchQuery}`);
        setSearchResults(response.data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching stations:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchStations, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle station selection from dropdown
  const handleStationSelect = (station:any) => {
    form.setValue('station_name', station.stationName);
    form.setValue('station_code', station.stationCode);
    setShowDropdown(false);
    setSearchQuery('');
  };

  // Handle form submission
  const onSubmit = async (values:any) => {
    // Basic validation
    if (!values.station_name || !values.station_code) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // API call to create new station
      await olfService.post('/station', {
        station_name: values.station_name.toUpperCase(),
        station_code: values.station_code.toUpperCase(),
      });
      
      // Close dialog and show success toast
      setDialogOpen(false);
      toast.success("Station added successfully!");
      window.location.reload();
      // Reset form
      form.reset();
    } catch (error) {
      toast.error("Failed to add station. Please try again.");
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      
      <Button 
        onClick={() => setDialogOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Plus className="h-4 w-4 mr-2" /> Add Station
      </Button>

      {/* Add Station Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-green-300">
          <DialogHeader className="bg-green-50 p-4 rounded-t-lg">
            <DialogTitle className="text-green-800">Add New Station</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
              {/* Search Input */}
              <div className="relative">
                <FormLabel className="text-green-700">Search Station</FormLabel>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  placeholder="Type to search stations..."
                  className="border-green-200 focus:border-green-500"
                />
                
                {/* Loading indicator */}
                {isSearching && (
                  <div className="absolute right-2 top-8">
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                {/* Dropdown for search results */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-green-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    <ul>
                      {searchResults.map((station:any) => (
                        <li 
                          key={station.stationId}
                          className="px-3 py-2 cursor-pointer hover:bg-green-50 flex justify-between"
                          onClick={() => handleStationSelect(station)}
                        >
                          <span>{station.stationName}</span>
                          <span className="text-gray-500">{station.stationCode}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="station_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Station Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="border-green-200 focus:border-green-500"
                        placeholder="Station name will appear here"
                        readOnly
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="station_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Station Code</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="border-green-200 focus:border-green-500"
                        placeholder="Station code will appear here"
                        readOnly
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Station"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddStation;