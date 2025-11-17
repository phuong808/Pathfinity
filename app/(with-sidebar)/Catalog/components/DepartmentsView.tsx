import React, { useState, useMemo } from 'react';
import { Button } from "@/app/components/ui/button";
import { BookOpen, GraduationCap } from "lucide-react";
import { ViewMode } from '../types';

interface DepartmentsViewProps {
  departments: string[];
  loadingDepartments: boolean;
  selectedCampus: string;
  onDepartmentSelect: (department: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export function DepartmentsView({
  departments,
  loadingDepartments,
  onDepartmentSelect,
  onViewModeChange,
}: DepartmentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter departments based on search term
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    
    const searchLower = searchTerm.toLowerCase();
    return departments.filter(dept => 
      dept.toLowerCase().includes(searchLower)
    );
  }, [departments, searchTerm]);

  return (
    <div className="p-8">
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search for a department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>
      
      {loadingDepartments ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading departments...</p>
          </div>
        </div>
      ) : filteredDepartments.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Found {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''}
            {searchTerm && ` (${departments.length} total)`}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => (
              <button
                key={dept}
                onClick={() => onDepartmentSelect(dept)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all border-2 border-gray-200 hover:border-blue-500 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {dept}
                    </h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
            <div className="text-6xl mb-4">{searchTerm ? '🔍' : '📚'}</div>
            <p className="text-gray-700 text-xl font-semibold mb-2">No Departments Found</p>
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Try a different search term' : 'No departments available for this campus'}
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">Or explore degree pathways by major</p>
        <Button
          onClick={() => onViewModeChange('majors')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          Explore Majors
        </Button>
      </div>
    </div>
  );
}
