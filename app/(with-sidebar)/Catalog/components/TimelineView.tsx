import React from 'react';
import { cn } from "@/lib/utils";
import { extractPrerequisites } from "@/lib/course-mapper";
import { TimelineItem } from '../types';
import { SEMESTER_COLORS, VISIBLE_CATEGORIES } from '../constants';
import { getItemColor, getTimelineColor } from '../utils';
import styles from '../roadmap.module.css';

interface TimelineViewProps {
  timelineData: TimelineItem[];
  categories: string[];
  periods: string[];
  selectedItem: TimelineItem | null;
  onItemSelect: (item: TimelineItem) => void;
}

export function TimelineView({
  timelineData,
  categories,
  periods,
  selectedItem,
  onItemSelect,
}: TimelineViewProps) {
  return (
    <>
      {/* Header row with Timeline + Category headers */}
      <div className={styles.headerRow}>
        <div className={styles.timelineHeaderCell}>
          Timeline
        </div>
        {categories.filter(cat => VISIBLE_CATEGORIES.includes(cat)).map((category) => (
          <div
            key={category}
            className={styles.categoryHeader}
            style={{ backgroundColor: SEMESTER_COLORS[category] || '#999' }}
          >
            <span className={styles.categoryHeaderLabel}>{category}</span>
          </div>
        ))}
      </div>

      {/* Content rows - each period gets a row with timeline label + content */}
      <div className={styles.contentRows}>
        {periods.map((period, periodIndex) => {
          // Extract year and semester from period string
          const match = period.match(/Year (\d+) - (.+)/);
          const year = match ? match[1] : '';
          const semester = match ? match[2] : period;
          
          // Get items for this period
          const itemsForPeriod = timelineData.filter(item => {
            const itemPeriod = item.description?.split(' • ')[1];
            return itemPeriod === period && VISIBLE_CATEGORIES.includes(item.category);
          });
          
          // Calculate total credits for this semester
          const totalCredits = itemsForPeriod.reduce((sum, item) => {
            if (item.category === 'Courses') {
              // Use credits from pathway data first, fallback to courseDetails
              const credits = item.credits || (item.courseDetails ? parseInt(item.courseDetails.num_units) : 0);
              return sum + credits;
            }
            return sum;
          }, 0);
          
          return (
            <div key={periodIndex} className={styles.contentRow}>
              {/* Timeline cell for this row - now a header */}
              <div 
                className={styles.timelineCell}
                style={{ backgroundColor: getTimelineColor(period) }}
              >
                <div className={styles.timelineLabel}>
                  <span className={styles.timelineYear}>Year {year}</span>
                  <span className={styles.timelineSemester}>{semester}</span>
                </div>
                {totalCredits > 0 && (
                  <div className={styles.semesterCredits}>
                    {totalCredits} Credits
                  </div>
                )}
              </div>
              
              {/* Course grid */}
              <div className={styles.contentColumn}>
                {itemsForPeriod.map((item) => {
                  const itemColor = getItemColor(item.id, item.category, item.description);
                  const courseDetails = item.courseDetails;
                  
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        styles.itemCard,
                        selectedItem?.id === item.id && styles.itemCardSelected
                      )}
                      style={{
                        borderLeftColor: itemColor,
                      }}
                      onClick={() => onItemSelect(item)}
                    >
                      {/* Course Header with Code and Credits */}
                      <div className={styles.courseHeader}>
                        <div className={styles.itemCardLabel}>{item.name}</div>
                        {/* Show credits badge - use pathway credits first, fallback to courseDetails */}
                        {(item.credits || (courseDetails?.num_units)) && (
                          <div className={styles.courseCredits}>
                            {item.credits || (courseDetails?.num_units)} CR
                          </div>
                        )}
                      </div>
                      
                      {/* Course Title */}
                      {courseDetails && (
                        <div className={styles.courseTitle}>
                          {courseDetails.course_title}
                        </div>
                      )}
                      
                      {/* Course Description */}
                      {courseDetails && courseDetails.course_desc && (
                        <div className={styles.courseDescription}>
                          {courseDetails.course_desc}
                        </div>
                      )}
                      
                      {/* Metadata Tags */}
                      {courseDetails && (
                        <div className={styles.courseMetadata}>
                          <div className={cn(styles.metadataTag, styles.departmentTag)}>
                            📚 {courseDetails.dept_name}
                          </div>
                          {courseDetails.metadata && extractPrerequisites(courseDetails.metadata) !== 'None' && (
                            <div className={cn(styles.metadataTag, styles.prerequisiteTag)}>
                              ⚠️ Has Prerequisites
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Fallback for non-detailed courses */}
                      {!courseDetails && (
                        <div className={styles.itemCardDetails}>
                          {item.description?.split(' • ')[0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
