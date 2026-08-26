import React, { useState, useEffect } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { searchEntities } from '../../services/api';

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2) {
        try {
          const data = await searchEntities(query);
          setResults(data.results || []);
          setIsOpen(true);
        } catch (error) {
          console.error("Search error", error);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indiaGreen"
          placeholder="Search entities, phones, locations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <MagnifyingGlass className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.id}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
              onClick={() => {
                onSelect(result);
                setIsOpen(false);
                setQuery(result.name);
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-navyBlue">{result.name}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{result.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
