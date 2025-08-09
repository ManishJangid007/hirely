import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Candidate } from '../types';
import DatePicker from './DatePicker';
import Select from './Select';

interface CandidateFiltersProps {
    candidates: Candidate[];
    positions: string[];
    onFiltersChange: (filteredCandidates: Candidate[]) => void;
}

interface Filters {
    search: string;
    position: string;
    status: string;
    interviewDate: string;
}

const CandidateFilters: React.FC<CandidateFiltersProps> = ({
    candidates,
    positions,
    onFiltersChange
}) => {
    const [filters, setFilters] = useState<Filters>({
        search: '',
        position: '',
        status: '',
        interviewDate: ''
    });

    const [isExpanded, setIsExpanded] = useState(false);

    const applyFilters = (newFilters: Filters) => {
        let filtered = [...candidates];

        // Search by name
        if (newFilters.search) {
            filtered = filtered.filter(candidate =>
                candidate.fullName.toLowerCase().includes(newFilters.search.toLowerCase())
            );
        }

        // Filter by position
        if (newFilters.position) {
            filtered = filtered.filter(candidate =>
                candidate.position === newFilters.position
            );
        }

        // Filter by status
        if (newFilters.status) {
            filtered = filtered.filter(candidate =>
                candidate.status === newFilters.status
            );
        }

        // Filter by interview date
        if (newFilters.interviewDate) {
            filtered = filtered.filter(candidate => {
                if (!candidate.interviewDate) return false;
                // Direct string comparison since both are in YYYY-MM-DD format
                return candidate.interviewDate === newFilters.interviewDate;
            });
        }

        onFiltersChange(filtered);
    };

    const handleFilterChange = (field: keyof Filters, value: string) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        applyFilters(newFilters);
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            position: '',
            status: '',
            interviewDate: ''
        };
        setFilters(clearedFilters);
        onFiltersChange(candidates);
    };

    const hasActiveFilters = filters.search || filters.position || filters.status || filters.interviewDate;

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search candidates by name..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`inline-flex items-center px-4 py-2 border rounded-lg shadow-sm text-sm font-medium transition-all duration-200 ${hasActiveFilters
                                ? 'border-blue-500 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                                }`}
                        >
                            <FunnelIcon className="w-4 h-4 mr-2" />
                            Filters
                            {hasActiveFilters && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                    Active
                                </span>
                            )}
                        </button>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                <XMarkIcon className="w-4 h-4 mr-1" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Expanded Filters */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Position Filter */}
                            <div>
                                <label htmlFor="position-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Position
                                </label>
                                <Select
                                    value={filters.position}
                                    onChange={(val) => handleFilterChange('position', val)}
                                    options={[{ value: '', label: 'All Positions' }, ...positions.map(p => ({ value: p, label: p }))]}
                                    placeholder="All Positions"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status
                                </label>
                                <Select
                                    value={filters.status}
                                    onChange={(val) => handleFilterChange('status', val)}
                                    options={[
                                        { value: '', label: 'All Statuses' },
                                        { value: 'Not Interviewed', label: 'Not Interviewed' },
                                        { value: 'Passed', label: 'Passed' },
                                        { value: 'Rejected', label: 'Rejected' },
                                        { value: 'Maybe', label: 'Maybe' }
                                    ]}
                                    placeholder="All Statuses"
                                />
                            </div>

                            {/* Interview Date Filter */}
                            <div>
                                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Interview Date
                                </label>
                                <DatePicker
                                    value={filters.interviewDate}
                                    onChange={(date) => handleFilterChange('interviewDate', date)}
                                    placeholder="Filter by date"
                                    className="w-full"
                                />
                            </div>

                            {/* Results Count */}
                            <div className="flex items-end">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {candidates.length} total candidates
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateFilters; 