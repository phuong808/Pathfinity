import React from 'react';
import { CourseCatalog } from '../types';

interface CourseCardProps {
  course: CourseCatalog;
}

// Memoized Course Card Component for better performance
export const CourseCard = React.memo(({ course }: CourseCardProps) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-blue-600">
            {course.course_prefix} {course.course_number}
          </h3>
          <p className="text-gray-900 font-semibold">{course.course_title}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          {course.num_units} {course.num_units === '1' ? 'credit' : 'credits'}
        </span>
      </div>
      <p className="text-gray-700 mb-3">{course.course_desc}</p>
      {course.metadata && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
          {course.metadata}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return prevProps.course.course_prefix === nextProps.course.course_prefix &&
         prevProps.course.course_number === nextProps.course.course_number;
});

CourseCard.displayName = 'CourseCard';
