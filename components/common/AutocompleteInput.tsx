
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AutocompleteSuggestion } from '../../types'; // Assuming this type is defined
import Input from './Input'; // Assuming Input is a styled text input

interface AutocompleteInputProps {
  label?: string;
  placeholder?: string;
  value: string; // The current input text value
  suggestions: AutocompleteSuggestion[];
  onChange: (newValue: string) => void; // Called when the input text changes
  onSelect: (selectedValue: string, selectedLabel?: string) => void; // Called when a suggestion is selected
  onAddNew?: (newItemLabel: string) => void; // Called when "Add new" is clicked
  addNewLabel?: string; // e.g., "Agregar nuevo cliente:"
  disabled?: boolean;
  required?: boolean;
  name?: string;
  error?: string;
  containerClassName?: string;
  showAddNewCondition?: (inputValue: string) => boolean; // Optional condition to show "Add New"
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  placeholder,
  value,
  suggestions,
  onChange,
  onSelect,
  onAddNew,
  addNewLabel = "Agregar:",
  disabled = false,
  required = false,
  name,
  error,
  containerClassName,
  showAddNewCondition,
}) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const lowerValue = value.toLowerCase();
      const newFiltered = suggestions.filter(
        suggestion => suggestion.label.toLowerCase().includes(lowerValue)
      );
      setFilteredSuggestions(newFiltered);
    } else {
      setFilteredSuggestions([]);
      setActiveSuggestionIndex(-1); // Reset active index if value is cleared
    }
  }, [value, suggestions]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true); // Show suggestions as user types
    setActiveSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    onSelect(suggestion.value, suggestion.label);
    onChange(suggestion.label); 
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleAddNewClick = () => {
    if (onAddNew && value.trim()) {
      onAddNew(value.trim());
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };
  
  const handleFocus = () => {
    if (!value) {
        setFilteredSuggestions(suggestions); // Show all suggestions if input is empty
        setShowSuggestions(true);
    } else {
        // If there is a value, re-filter and show if matches or can add new
        const lowerValue = value.toLowerCase();
        const currentFiltered = suggestions.filter(
            s => s.label.toLowerCase().includes(lowerValue)
        );
        setFilteredSuggestions(currentFiltered);
        if (currentFiltered.length > 0 || (onAddNew && value.trim() && !currentFiltered.some(s => s.label.toLowerCase() === value.trim().toLowerCase()))) {
            setShowSuggestions(true);
        }
    }
    setActiveSuggestionIndex(-1); 
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding to allow click on suggestion to process
    setTimeout(() => {
      // Check if the newly focused element is still within this autocomplete component.
      // event.relatedTarget is the element that received focus.
      // document.activeElement can also be checked as a fallback.
      const relatedTarget = event.relatedTarget as Node | null;
      const activeElement = document.activeElement as Node | null;

      const focusMovedOutside = (!wrapperRef.current?.contains(relatedTarget)) && 
                                (!wrapperRef.current?.contains(activeElement));
      
      if (focusMovedOutside) {
        setShowSuggestions(false);
      }
    }, 150); 
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isAddNewVisible = onAddNew && value.trim() && 
                            !filteredSuggestions.some(s => s.label.toLowerCase() === value.trim().toLowerCase()) &&
                            (!showAddNewCondition || showAddNewCondition(value.trim()));
    const totalSuggestionsInList = filteredSuggestions.length + (isAddNewVisible ? 1 : 0);

    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < filteredSuggestions.length) {
        handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
      } else if (isAddNewVisible && activeSuggestionIndex === filteredSuggestions.length) {
        handleAddNewClick();
      }
      setShowSuggestions(false); // Ensure it closes on Enter
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (totalSuggestionsInList > 0) {
        setActiveSuggestionIndex(prev => (prev <= 0 ? totalSuggestionsInList - 1 : prev - 1));
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (totalSuggestionsInList > 0) {
        setActiveSuggestionIndex(prev => (prev >= totalSuggestionsInList - 1 ? 0 : prev + 1));
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };
  
  const shouldShowAddNew = onAddNew && value.trim() && 
                         !filteredSuggestions.some(s => s.label.toLowerCase() === value.trim().toLowerCase()) &&
                         (!showAddNewCondition || showAddNewCondition(value.trim()));

  return (
    <div className={`relative ${containerClassName || ''}`} ref={wrapperRef}>
      <Input
        label={label}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur} // Added onBlur handler
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required={required}
        error={error}
        autoComplete="off"
      />
      {showSuggestions && (filteredSuggestions.length > 0 || shouldShowAddNew) && (
        <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion.value}
              className={`px-3 py-2 cursor-pointer hover:bg-primary-light hover:text-white dark:hover:bg-indigo-600 dark:text-slate-200 ${index === activeSuggestionIndex ? 'bg-primary-light text-white dark:bg-indigo-600' : 'text-slate-700 dark:text-slate-200'}`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setActiveSuggestionIndex(index)}
            >
              {suggestion.label}
            </li>
          ))}
          {shouldShowAddNew && (
            <li
              className={`px-3 py-2 cursor-pointer text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-700 ${filteredSuggestions.length === activeSuggestionIndex ? 'bg-emerald-50 dark:bg-emerald-700' : ''}`}
              onClick={handleAddNewClick}
              onMouseEnter={() => setActiveSuggestionIndex(filteredSuggestions.length)}
            >
              {addNewLabel} "{value.trim()}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
    