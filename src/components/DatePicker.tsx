import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disableClickOutside?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = "Select date", className = "", disableClickOutside = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (!value) return null;
    // Parse YYYY-MM-DD string to local date to avoid timezone issues
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  });

  // Update selectedDate when value prop changes
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (disableClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is outside both the input and the dropdown
      const isOutsideInput = !dropdownRef.current?.contains(target);
      const isOutsideDropdown = !target.closest('[data-datepicker-dropdown]');

      if (isOutsideInput && isOutsideDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [disableClickOutside]);

  const formatDate = useCallback((date: Date): string => {
    // Format date in local timezone to avoid timezone issues
    const year = date.getFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}, ${year}`;
  }, []);

  const formatDateForInput = useCallback((date: Date): string => {
    // Format date as YYYY-MM-DD in local timezone to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const getDaysInMonth = useCallback((date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month to fill first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Add days from next month to fill last week
    const lastDayOfWeek = lastDay.getDay();
    for (let day = 1; day <= 6 - lastDayOfWeek; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  }, []);

  const isToday = useCallback((date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const isSelected = useCallback((date: Date): boolean => {
    return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
  }, [selectedDate]);

  const isCurrentMonth = useCallback((date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth();
  }, [currentMonth]);

  const handleDateSelect = useCallback((date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(date);
    onChange(formatDateForInput(date));
    setIsOpen(false);
  }, [onChange, formatDateForInput]);

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  const handleInputClick = useCallback(() => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  }, [isOpen, updateDropdownPosition]);

  const goToPreviousMonth = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }, [currentMonth]);

  const goToNextMonth = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }, [currentMonth]);

  const goToToday = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
    onChange(formatDateForInput(today));
    setIsOpen(false);
  }, [onChange, formatDateForInput]);

  // Memoize computed values to prevent unnecessary recalculations
  const days = useMemo(() => getDaysInMonth(currentMonth), [getDaysInMonth, currentMonth]);
  const weekDays = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);

  return (
    <div className={`relative date-picker-container ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedDate ? formatDate(selectedDate) : ''}
          placeholder={placeholder}
          readOnly
          onClick={handleInputClick}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 cursor-pointer"
        />
        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>

      {isOpen && createPortal(
        <div
          className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          data-datepicker-dropdown
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: Math.max(dropdownPosition.width, 320), // Minimum width of 320px
            maxWidth: '80vw'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={goToPreviousMonth}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Today button */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={goToToday}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Today
            </button>
          </div>

          {/* Calendar grid */}
          <div className="p-4">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => (
                <button
                  key={index}
                  onClick={(e) => handleDateSelect(date, e)}
                  className={`
                    h-8 w-8 rounded-lg text-sm font-medium transition-colors
                    ${isToday(date) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : ''}
                    ${isSelected(date) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                    ${!isSelected(date) && !isToday(date) && isCurrentMonth(date) ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                    ${!isCurrentMonth(date) ? 'text-gray-400 dark:text-gray-500' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DatePicker; 