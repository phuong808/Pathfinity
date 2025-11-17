import React from 'react';
import { X } from "lucide-react";
import { CAMPUSES, extractPrerequisites, extractGradeOption, extractMajorRestrictions } from "@/lib/course-mapper";
import { TimelineItem } from '../types';
import styles from '../roadmap.module.css';

interface DetailsPanelProps {
  selectedItem: TimelineItem | null;
  selectedCampus: string;
  onClose: () => void;
}

export function DetailsPanel({
  selectedItem,
  selectedCampus,
  onClose,
}: DetailsPanelProps) {
  if (!selectedItem) {
    return null;
  }

  return (
    <div className={styles.editPanel}>
      <div className={styles.editPanelHeader}>
        <h3 className="font-bold text-lg text-gray-800">
          {selectedItem?.category === 'Courses' && selectedItem.courseDetails ? '📖 Course Information' : 'ℹ️ Item Details'}
        </h3>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close details panel"
        >
          <X size={20} />
        </button>
      </div>
      <div className={styles.editPanelContent}>
        {/* Show course or item information */}
        {selectedItem.category === 'Courses' && selectedItem.courseDetails ? (
          // Detailed course information available
          <>
            <div className={styles.formGroup}>
              <label>Course Code</label>
              <p className="text-lg font-bold text-blue-600">{selectedItem.name}</p>
            </div>
                
            <div className={styles.formGroup}>
              <label>Course Title</label>
              <p className="text-base font-semibold text-gray-800">{selectedItem.courseDetails.course_title}</p>
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedItem.courseDetails.course_desc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={styles.formGroup}>
                <label>Credits</label>
                <p className="text-base font-semibold text-gray-800">{selectedItem.courseDetails.num_units}</p>
              </div>
              
              <div className={styles.formGroup}>
                <label>Department</label>
                <p className="text-sm text-gray-700">{selectedItem.courseDetails.dept_name}</p>
              </div>
            </div>

            {selectedItem.courseDetails.metadata && (
              <>
                <div className={styles.formGroup}>
                  <label>Prerequisites</label>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    {extractPrerequisites(selectedItem.courseDetails.metadata)}
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label>Grade Option</label>
                  <p className="text-sm text-gray-700">
                    {extractGradeOption(selectedItem.courseDetails.metadata)}
                  </p>
                </div>

                {extractMajorRestrictions(selectedItem.courseDetails.metadata) !== 'None' && (
                  <div className={styles.formGroup}>
                    <label>Major Restrictions</label>
                    <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg border border-red-200">
                      {extractMajorRestrictions(selectedItem.courseDetails.metadata)}
                    </p>
                  </div>
                )}
              </>
            )}
            
            <div className={styles.formGroup}>
              <label>Semester</label>
              <p className="text-sm text-gray-700">{selectedItem.description?.split(' • ')[1]}</p>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
              <p className="text-sm text-blue-900 font-medium flex items-center gap-2">
                <span className="text-lg">✓</span>
                Course information from {CAMPUSES.find(c => c.id === selectedCampus)?.displayName} catalog
              </p>
            </div>
          </>
        ) : selectedItem.category === 'Courses' ? (
          // Course without detailed information
          <>
            <div className={styles.formGroup}>
              <label>Course Code</label>
              <p className="text-lg font-bold text-blue-600">{selectedItem.name}</p>
            </div>
            
            <div className={styles.formGroup}>
              <label>Details</label>
              <p className="text-sm text-gray-700">{selectedItem.description}</p>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300">
              <p className="text-sm text-yellow-900 font-medium flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                Detailed course information not found in the database
              </p>
            </div>
          </>
        ) : (
          // Other types of items
          <>
            <div className={styles.formGroup}>
              <label>Type</label>
              <p className="text-sm text-gray-700">{selectedItem.category}</p>
            </div>
            
            <div className={styles.formGroup}>
              <label>Name</label>
              <p className="text-base font-semibold text-gray-800">{selectedItem.name}</p>
            </div>
            
            <div className={styles.formGroup}>
              <label>Details</label>
              <p className="text-sm text-gray-700">{selectedItem.description}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
