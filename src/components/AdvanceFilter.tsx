// FilterComponents.tsx
import React, { useState} from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

// Types for filter logic
export type FilterCondition = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
export type FilterConjunction = 'AND' | 'OR';

export interface FilterCriteria {
  id: string;
  field: string;
  condition: FilterCondition;
  value: string;
  value2?: string; // For 'between' condition
}

export interface AdvancedFilterProps {
  columns: Array<{key: string, label: string}>;
  onFilter: (criteria: FilterCriteria[], conjunction: FilterConjunction) => void;
  onClearFilters: () => void;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({ 
  columns, 
  onFilter,
  onClearFilters 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria[]>([
    { id: '1', field: '', condition: 'contains', value: '' }
  ]);
  const [conjunction, setConjunction] = useState<FilterConjunction>('AND');
  const [activeFilters, setActiveFilters] = useState<FilterCriteria[]>([]);
  const [activeConjunction, setActiveConjunction] = useState<FilterConjunction>('AND');

  // Available conditions for different types of fields
  const getConditionsForFieldType = (fieldName: string) => {
    // Detect field type based on name conventions
    const lowercaseField = fieldName.toLowerCase();
    
    if (
      lowercaseField.includes('price') || 
      lowercaseField.includes('calorie') || 
      lowercaseField.includes('amount') || 
      lowercaseField.includes('quantity') || 
      lowercaseField.includes('count')
    ) {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'greaterThan', label: 'Greater Than' },
        { value: 'lessThan', label: 'Less Than' },
        { value: 'between', label: 'Between' }
      ];
    }
    
    // Default text conditions
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'startsWith', label: 'Starts With' },
      { value: 'endsWith', label: 'Ends With' }
    ];
  };

  // Add filter criteria
  const addFilterCriteria = () => {
    const newId = (parseInt(filterCriteria[filterCriteria.length - 1].id) + 1).toString();
    setFilterCriteria([
      ...filterCriteria,
      { id: newId, field: '', condition: 'contains', value: '' }
    ]);
  };

  // Remove filter criteria
  const removeFilterCriteria = (id: string) => {
    if (filterCriteria.length > 1) {
      setFilterCriteria(filterCriteria.filter(criteria => criteria.id !== id));
    }
  };

  // Update filter criteria
  const updateFilterCriteria = (id: string, field: keyof FilterCriteria, value: string) => {
    setFilterCriteria(filterCriteria.map(criteria => {
      if (criteria.id === id) {
        return { ...criteria, [field]: value };
      }
      return criteria;
    }));
  };

  // Apply filters
  const applyFilters = () => {
    // Only include filter criteria with both field and value
    const validCriteria = filterCriteria.filter(
      criteria => criteria.field && criteria.value
    );
    
    if (validCriteria.length > 0) {
      setActiveFilters(validCriteria);
      setActiveConjunction(conjunction);
      onFilter(validCriteria, conjunction);
    } else {
      clearFilters();
    }
    
    setIsOpen(false);
  };

  // Clear filters
  const clearFilters = () => {
    setActiveFilters([]);
    onClearFilters();
    setFilterCriteria([{ id: '1', field: '', condition: 'contains', value: '' }]);
  };

  // Handle when popover closes without applying
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to active filters when closing without applying
      if (activeFilters.length > 0) {
        setFilterCriteria([...activeFilters]);
        setConjunction(activeConjunction);
      }
    }
  };

  // Check if the current field requires a second value input
  const needsSecondValue = (criteria: FilterCriteria) => {
    return criteria.condition === 'between';
  };

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filter
              {activeFilters.length > 0 && (
                <span className="ml-2 bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4">
            <div className="space-y-4">
              <div className="font-medium text-lg flex justify-between items-center">
                <span>Advanced Filters</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
              </div>
              
              {/* Conjunction selector */}
              <div className="flex items-center space-x-2 mb-2">
                <Label className="text-sm font-medium">Match</Label>
                <Select value={conjunction} onValueChange={(value) => setConjunction(value as FilterConjunction)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Match type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">ALL filters (AND)</SelectItem>
                    <SelectItem value="OR">ANY filter (OR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filter criteria list */}
              <div className="space-y-3">
                {filterCriteria.map((criteria, index) => (
                  <div key={criteria.id} className="grid gap-2 p-2 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Filter {index + 1}</span>
                      {filterCriteria.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilterCriteria(criteria.id)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Field selector */}
                    <Select
                      value={criteria.field}
                      onValueChange={(value) => updateFilterCriteria(criteria.id, 'field', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => (
                          <SelectItem key={column.key} value={column.key}>
                            {column.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Condition selector */}
                    {criteria.field && (
                      <Select
                        value={criteria.condition}
                        onValueChange={(value) => updateFilterCriteria(criteria.id, 'condition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {getConditionsForFieldType(criteria.field).map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              {condition.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {/* Value input */}
                    {criteria.field && (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Value"
                          value={criteria.value}
                          onChange={(e) => updateFilterCriteria(criteria.id, 'value', e.target.value)}
                        />
                        
                        {/* Second value input for 'between' condition */}
                        {needsSecondValue(criteria) && (
                          <Input
                            type="text"
                            placeholder="Second Value"
                            value={criteria.value2 || ''}
                            onChange={(e) => updateFilterCriteria(criteria.id, 'value2', e.target.value)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Add criteria button */}
              <Button
                variant="outline"
                size="sm"
                onClick={addFilterCriteria}
                className="w-full border-dashed border-2 bg-gray-50 hover:bg-gray-100"
              >
                + Add Filter
              </Button>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={applyFilters}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="text-sm text-gray-500 flex items-center">
              <span className="mr-2">Active filters:</span>
              <span className="text-amber-600 font-medium">{activeConjunction}</span>
            </div>
            {activeFilters.map((filter) => {
              const column = columns.find(col => col.key === filter.field);
              return (
                <div 
                  key={filter.id}
                  className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-sm"
                >
                  <span>{column?.label || filter.field}</span>
                  <span className="text-xs opacity-75">{filter.condition}</span>
                  <span className="font-medium">{filter.value}</span>
                  {filter.value2 && <span className="font-medium">- {filter.value2}</span>}
                </div>
              );
            })}
            <Button
              variant="ghost" 
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-red-500 h-7 px-2"
            >
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};