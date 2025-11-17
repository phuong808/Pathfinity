import React, { useState, useMemo } from 'react';
import { Button } from "@/app/components/ui/button";
import { CourseCard } from './CourseCard';
import { CourseCatalog } from '../types';

interface DepartmentCoursesViewProps {
  selectedDepartment: string;
  departmentCourses: CourseCatalog[];
  loadingCourses: boolean;
  onBack: () => void;
}

export function DepartmentCoursesView({
  selectedDepartment,
  departmentCourses,
  loadingCourses,
  onBack,
}: DepartmentCoursesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return departmentCourses;
    
    const searchLower = searchTerm.toLowerCase();
    return departmentCourses.filter(course => {
      const courseCode = `${course.course_prefix}${course.course_number}`.toLowerCase();
      const courseTitle = course.course_title?.toLowerCase() || '';
      const courseDesc = course.course_desc?.toLowerCase() || '';
      
      return (
        courseCode.includes(searchLower) ||
        courseTitle.includes(searchLower) ||
        courseDesc.includes(searchLower)
      );
    });
  }, [departmentCourses, searchTerm]);

  if (!selectedDepartment) {
    return null;
  }

  if (loadingCourses) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300"
          >
            ← Back to Departments
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedDepartment}</h2>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (departmentCourses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-700 text-xl font-semibold mb-2">No Courses Found</p>
          <p className="text-gray-500 text-sm mb-4">
            No courses available for {selectedDepartment}
          </p>
          <Button
            variant="outline"
            onClick={onBack}
            className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300"
          >
            ← Back to Departments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300"
        >
          ← Back to Departments
        </Button>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{selectedDepartment}</h2>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search for a course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>
      
      <div className="mb-4 text-sm text-gray-600">
        Found {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
        {searchTerm && ` (${departmentCourses.length} total)`}
      </div>
      
      {filteredCourses.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-700 text-xl font-semibold mb-2">No Courses Found</p>
          <p className="text-gray-500 text-sm">
            Try a different search term
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCourses.map((course, index) => (
            <CourseCard 
              key={`${course.course_prefix}-${course.course_number}-${index}`}
              course={course}
            />
          ))}
        </div>
      )}
    </div>
  );
}
