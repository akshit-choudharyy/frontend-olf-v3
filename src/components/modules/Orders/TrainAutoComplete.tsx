import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { olfService } from '@/utils/axiosInstance';

interface TrainAutocompleteProps {
  onTrainNumberChange?: (trainNumber: any) => void;
  onTrainNameChange?: (trainName: any) => void;
}

const fetchTrains = async() => {
  const response = await olfService.get('/trains');
  return response?.data;
};

// Helper function to format running days
const getRunningDaysText = (runningDays: string): string => {
  if (!runningDays) return "Daily";
  
  // Split by comma if multiple days
  const days = runningDays.split(',').map(d => d.trim().toLowerCase());
  
  // List of all weekdays
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  // const shortDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  // Check if it runs all 7 days
  const isAllDays = allDays.every(day => 
    days.includes(day) || days.includes(day.slice(0, 3))
  );
  
  if (isAllDays) {
    return "Daily";
  }
  
  // Otherwise format the days nicely (capitalize first letter)
  return days
    .map(day => day.charAt(0).toUpperCase() + day.slice(1))
    .join(', ');
};

export default function TrainAutocomplete({
  onTrainNumberChange,
  onTrainNameChange,
}: TrainAutocompleteProps) {
  const [value, setValue] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: trains = [], isLoading, error } = useQuery({
    queryKey: ['trains'],
    queryFn: fetchTrains,
  });

  // Filter trains based on search term (either train number or train name)
  const filteredTrains = trains.filter((train: any) => {
    const searchLower = search.toLowerCase();
    return (
      train.trainNumber.toLowerCase().includes(searchLower) ||
      train.trainName.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (trainId: number) => {
    setValue(trainId);
    
    const train = trains.find((t: any) => t.trainId === trainId);
    if (train) {
      setSearch(train.trainNumberAndName || `${train.trainNumber} - ${train.trainName}`);
      onTrainNumberChange?.(train.trainNumber);
      onTrainNameChange?.(train.trainName);
      setIsFocused(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    setSearch(newValue);
    if (!newValue) {
      setValue(null);
      onTrainNumberChange?.(null);
      onTrainNameChange?.(null);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking within the command component
    if (commandRef.current && commandRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    
    // Small delay to allow click events to process
    setTimeout(() => {
      setIsFocused(false);
    }, 100);
  };

  if (error) {
    return <div className="text-red-500">Error loading trains</div>;
  }

  return (
    <div className="relative w-full">
      <Command ref={commandRef} className="rounded-lg border shadow-md">
        <CommandInput
          ref={inputRef}
          placeholder="Search for train"
          value={search}
          onValueChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
        />
        {isFocused && (
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading trains...</CommandEmpty>
            ) : filteredTrains.length === 0 ? (
              <CommandEmpty>No train found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredTrains.slice(0, 10).map((train:any) => (
                  <CommandItem
                    key={train.trainId}
                    value={train.trainNumberAndName || `${train.trainNumber} - ${train.trainName}`}
                    onSelect={() => handleSelect(train.trainId)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === train.trainId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {/* CHANGED SECTION - START */}
                    <div className="flex flex-col w-full">
                      <span className="font-medium">
                        {train.trainNumber} / {train.trainName}
                      </span>
                      {/* NEW LINE - Shows Running Days */}
                      <span className="text-xs text-gray-500 mt-1">
                        Runs: {train.runningDays ? getRunningDaysText(train.runningDays) : "Daily"}
                      </span>
                    </div>
                    {/* CHANGED SECTION - END */}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}