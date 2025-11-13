import React, { useState, useMemo, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface CaseData {
  slug: string;
  data: {
    case_id: string;
    title: string;
    description: string;
    victim_name: string;
    incident_date: string;
    city: string;
    county: string;
    age?: number;
    race?: string;
    gender?: string;
    agencies: string[];
    cause_of_death?: string;
    armed_status?: string;
    investigation_status?: string;
    charges_filed?: boolean;
    civil_lawsuit_filed?: boolean;
    bodycam_available?: boolean;
  };
}

interface FilterableCasesListProps {
  cases: CaseData[];
}

export default function FilterableCasesList({ cases }: FilterableCasesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedArmedStatus, setSelectedArmedStatus] = useState<string[]>([]);
  const [selectedCauseOfDeath, setSelectedCauseOfDeath] = useState<string[]>([]);
  const [bodycamFilter, setBodycamFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const cities = new Set<string>();
    const counties = new Set<string>();
    const agencies = new Set<string>();
    const armedStatuses = new Set<string>();
    const causesOfDeath = new Set<string>();

    cases.forEach(caseItem => {
      cities.add(caseItem.data.city);
      counties.add(caseItem.data.county);
      caseItem.data.agencies.forEach(agency => agencies.add(agency));
      if (caseItem.data.armed_status) armedStatuses.add(caseItem.data.armed_status);
      if (caseItem.data.cause_of_death) causesOfDeath.add(caseItem.data.cause_of_death);
    });

    return {
      cities: Array.from(cities).sort(),
      counties: Array.from(counties).sort(),
      agencies: Array.from(agencies).sort(),
      armedStatuses: Array.from(armedStatuses).sort(),
      causesOfDeath: Array.from(causesOfDeath).sort(),
    };
  }, [cases]);

  // Filter and search logic
  const filteredCases = useMemo(() => {
    return cases.filter(caseItem => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          caseItem.data.victim_name.toLowerCase().includes(query) ||
          caseItem.data.title.toLowerCase().includes(query) ||
          caseItem.data.description.toLowerCase().includes(query) ||
          caseItem.data.agencies.some(agency => agency.toLowerCase().includes(query)) ||
          caseItem.data.city.toLowerCase().includes(query) ||
          caseItem.data.county.toLowerCase().includes(query) ||
          (caseItem.data.armed_status && caseItem.data.armed_status.toLowerCase().includes(query)) ||
          (caseItem.data.cause_of_death && caseItem.data.cause_of_death.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // City filter
      if (selectedCities.length > 0 && !selectedCities.includes(caseItem.data.city)) {
        return false;
      }

      // County filter
      if (selectedCounties.length > 0 && !selectedCounties.includes(caseItem.data.county)) {
        return false;
      }

      // Agency filter
      if (selectedAgencies.length > 0) {
        const hasMatchingAgency = caseItem.data.agencies.some(agency => 
          selectedAgencies.includes(agency)
        );
        if (!hasMatchingAgency) return false;
      }

      // Armed status filter
      if (selectedArmedStatus.length > 0) {
        if (!caseItem.data.armed_status || !selectedArmedStatus.includes(caseItem.data.armed_status)) {
          return false;
        }
      }

      // Cause of death filter
      if (selectedCauseOfDeath.length > 0) {
        if (!caseItem.data.cause_of_death || !selectedCauseOfDeath.includes(caseItem.data.cause_of_death)) {
          return false;
        }
      }

      // Bodycam filter
      if (bodycamFilter !== 'all') {
        const hasBodycam = caseItem.data.bodycam_available === true;
        if (bodycamFilter === 'yes' && !hasBodycam) return false;
        if (bodycamFilter === 'no' && hasBodycam) return false;
      }

      // Date range filter
      if (dateFrom) {
        if (new Date(caseItem.data.incident_date) < new Date(dateFrom)) {
          return false;
        }
      }
      if (dateTo) {
        if (new Date(caseItem.data.incident_date) > new Date(dateTo)) {
          return false;
        }
      }

      return true;
    });
  }, [cases, searchQuery, selectedCities, selectedCounties, selectedAgencies, 
      selectedArmedStatus, selectedCauseOfDeath, bodycamFilter, dateFrom, dateTo]);

  // Sort filtered cases by date (most recent first)
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => 
      new Date(b.data.incident_date).getTime() - new Date(a.data.incident_date).getTime()
    );
  }, [filteredCases]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCities([]);
    setSelectedCounties([]);
    setSelectedAgencies([]);
    setSelectedArmedStatus([]);
    setSelectedCauseOfDeath([]);
    setBodycamFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedCities.length > 0 || selectedCounties.length > 0 ||
    selectedAgencies.length > 0 || selectedArmedStatus.length > 0 || selectedCauseOfDeath.length > 0 ||
    bodycamFilter !== 'all' || dateFrom || dateTo;

  const toggleMultiSelect = (value: string, selected: string[], setter: (val: string[]) => void) => {
    if (selected.includes(value)) {
      setter(selected.filter(item => item !== value));
    } else {
      setter([...selected, value]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by victim name, agency, location, incident details..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              showFilters 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
            {hasActiveFilters && !showFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-red-600 text-white rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Summary */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {selectedCities.map(city => (
              <span key={city} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm rounded-full">
                City: {city}
                <button onClick={() => toggleMultiSelect(city, selectedCities, setSelectedCities)} className="hover:text-red-600">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            {selectedCounties.map(county => (
              <span key={county} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm rounded-full">
                County: {county}
                <button onClick={() => toggleMultiSelect(county, selectedCounties, setSelectedCounties)} className="hover:text-red-600">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            {selectedAgencies.map(agency => (
              <span key={agency} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm rounded-full">
                Agency: {agency}
                <button onClick={() => toggleMultiSelect(agency, selectedAgencies, setSelectedAgencies)} className="hover:text-red-600">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="To"
                />
              </div>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City ({selectedCities.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-900">
                {filterOptions.cities.map(city => (
                  <label key={city} className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city)}
                      onChange={() => toggleMultiSelect(city, selectedCities, setSelectedCities)}
                      className="mr-2 rounded text-red-600 focus:ring-red-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{city}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* County Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                County ({selectedCounties.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-900">
                {filterOptions.counties.map(county => (
                  <label key={county} className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCounties.includes(county)}
                      onChange={() => toggleMultiSelect(county, selectedCounties, setSelectedCounties)}
                      className="mr-2 rounded text-red-600 focus:ring-red-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{county}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Agency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agency ({selectedAgencies.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-900">
                {filterOptions.agencies.map(agency => (
                  <label key={agency} className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAgencies.includes(agency)}
                      onChange={() => toggleMultiSelect(agency, selectedAgencies, setSelectedAgencies)}
                      className="mr-2 rounded text-red-600 focus:ring-red-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{agency}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level of Threat (Armed Status) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Level of Threat ({selectedArmedStatus.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-900">
                {filterOptions.armedStatuses.map(status => (
                  <label key={status} className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedArmedStatus.includes(status)}
                      onChange={() => toggleMultiSelect(status, selectedArmedStatus, setSelectedArmedStatus)}
                      className="mr-2 rounded text-red-600 focus:ring-red-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level of Force (Cause of Death) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Level of Force ({selectedCauseOfDeath.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-900">
                {filterOptions.causesOfDeath.map(cause => (
                  <label key={cause} className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCauseOfDeath.includes(cause)}
                      onChange={() => toggleMultiSelect(cause, selectedCauseOfDeath, setSelectedCauseOfDeath)}
                      className="mr-2 rounded text-red-600 focus:ring-red-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cause}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Body Camera Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Body Camera Footage
              </label>
              <div className="space-y-2">
                <label className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="bodycam"
                    checked={bodycamFilter === 'all'}
                    onChange={() => setBodycamFilter('all')}
                    className="mr-2 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">All Cases</span>
                </label>
                <label className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="bodycam"
                    checked={bodycamFilter === 'yes'}
                    onChange={() => setBodycamFilter('yes')}
                    className="mr-2 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">With Body Camera</span>
                </label>
                <label className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="bodycam"
                    checked={bodycamFilter === 'no'}
                    onChange={() => setBodycamFilter('no')}
                    className="mr-2 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Without Body Camera</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {sortedCases.length} of {cases.length} cases
      </div>

      {/* Cases Grid */}
      {sortedCases.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedCases.map(caseItem => (
            <article key={caseItem.slug} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  <a href={`/cases/${caseItem.slug}`} className="hover:text-red-600 dark:hover:text-red-500">
                    {caseItem.data.victim_name}
                  </a>
                </h2>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {caseItem.data.description}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  {new Date(caseItem.data.incident_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {caseItem.data.agencies.map(agency => (
                    <span key={agency} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded border border-gray-300 dark:border-gray-600">
                      {agency}
                    </span>
                  ))}
                </div>

                {caseItem.data.bodycam_available && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                      📹 Body Camera Available
                    </span>
                  </div>
                )}

                <a 
                  href={`/cases/${caseItem.slug}`}
                  className="inline-block text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium"
                >
                  Read more →
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-lg">No cases match your search criteria.</p>
          <button
            onClick={clearAllFilters}
            className="mt-4 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
