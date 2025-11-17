'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './roadmap.module.css';
import { CAMPUSES, getMajorsByCampus, type MajorData } from "@/lib/course-mapper";
import { pathwayToTimeline } from './utils';
import { TimelineItem, PathwayRecord, CourseCatalog, ViewMode } from './types';
import { RoadmapHeader } from './components/RoadmapHeader';
import { DepartmentsView } from './components/DepartmentsView';
import { DepartmentCoursesView } from './components/DepartmentCoursesView';
import { MajorsView } from './components/MajorsView';
import { TimelineView } from './components/TimelineView';
import { DetailsPanel } from './components/DetailsPanel';

export default function RoadmapPage() {
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [pathways, setPathways] = useState<PathwayRecord[]>([]);
  const [selectedPathwayId, setSelectedPathwayId] = useState<number | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<PathwayRecord | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<string>('manoa');
  const [campusOpen, setCampusOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('courses');
  const [selectedMajor, setSelectedMajor] = useState<MajorData | null>(null);
  const [majorSearchTerm, setMajorSearchTerm] = useState('');
  
  // States for department and courses
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [departmentCourses, setDepartmentCourses] = useState<CourseCatalog[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Fetch pathways on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/pathways');
        if (response.ok) {
          const data = await response.json();
          setPathways(data);
        }
      } catch (error) {
        console.error('Error fetching pathways:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch departments when campus changes
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await fetch(`/api/courses/departments?campus=${selectedCampus}`);
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.departments);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [selectedCampus]);

  // Fetch courses when department changes with abort controller for optimization
  useEffect(() => {
    if (selectedDepartment) {
      const abortController = new AbortController();
      
      const fetchCourses = async () => {
        setLoadingCourses(true);
        try {
          const response = await fetch(
            `/api/courses?campus=${selectedCampus}&department=${encodeURIComponent(selectedDepartment)}`,
            { signal: abortController.signal }
          );
          if (response.ok) {
            const data = await response.json();
            setDepartmentCourses(data.courses);
          }
        } catch (error) {
          // Ignore abort errors
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          console.error('Error fetching courses:', error);
        } finally {
          if (!abortController.signal.aborted) {
            setLoadingCourses(false);
          }
        }
      };
      fetchCourses();
      
      // Cleanup function to abort the request if component unmounts or dependencies change
      return () => {
        abortController.abort();
      };
    } else {
      setDepartmentCourses([]);
    }
  }, [selectedDepartment, selectedCampus]);

  const handleCampusSelect = (campusId: string) => {
    setSelectedCampus(campusId);
    setCampusOpen(false);
    
    // Clear department and courses when campus changes
    setSelectedDepartment(null);
    setDepartmentCourses([]);
    
    // Clear selected major when campus changes in majors mode
    if (viewMode === 'majors') {
      setSelectedMajor(null);
    }
    
    // Reload the pathway with the new campus if one is selected
    if (selectedPathwayId && viewMode === 'courses') {
      const pathway = pathways.find(p => p.id === selectedPathwayId);
      if (pathway?.pathwayData) {
        const { items, categories: pathwayCategories, periods: pathwayPeriods } = pathwayToTimeline(pathway.pathwayData, campusId);
        setTimelineData(items);
        setCategories(pathwayCategories);
        setPeriods(pathwayPeriods);
        setSelectedItem(null);
      }
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedMajor(null);
    // Clear course data when switching to majors
    if (mode === 'majors') {
      setTimelineData([]);
      setSelectedPathwayId(null);
      setSelectedPathway(null);
      setSelectedItem(null);
    }
    // Clear department selection when switching modes
    setSelectedDepartment(null);
    setDepartmentCourses([]);
  };

  const handleDepartmentSelect = (department: string) => {
    setSelectedDepartment(department);
  };

  // Handle major selection and load its pathway
  const handleMajorSelect = (major: MajorData) => {
    // If the major has pathway data, load it into the timeline
    if (major.pathwayData && major.pathwayData.years && major.pathwayData.years.length > 0) {
      const { items, categories: pathwayCategories, periods: pathwayPeriods } = pathwayToTimeline(major.pathwayData, selectedCampus);
      setTimelineData(items);
      setCategories(pathwayCategories);
      setPeriods(pathwayPeriods);
      setSelectedItem(null);
      setSelectedMajor(major); // Set selected major for display in header
      
      // Switch to courses view to display the timeline
      setViewMode('courses');
    } else {
      // If no pathway data available, show an alert or message
      alert('This program does not have detailed pathway information available yet.');
    }
  };

  // Compute majors list based on current campus and search term
  const filteredMajors = useMemo(() => {
    if (viewMode !== 'majors') return [];
    const allMajors = getMajorsByCampus(selectedCampus);
    if (!majorSearchTerm.trim()) return allMajors;
    const searchLower = majorSearchTerm.toLowerCase();
    return allMajors.filter(major => 
      major.majorName.toLowerCase().includes(searchLower)
    );
  }, [viewMode, selectedCampus, majorSearchTerm]);

  // Compute dynamic header title based on selections
  const headerTitle = useMemo(() => {
    const campusName = CAMPUSES.find(c => c.id === selectedCampus)?.displayName || "UH";
    
    // If viewing a specific major's pathway
    if (selectedMajor && viewMode === 'courses' && timelineData.length > 0) {
      return `🎓 ${campusName} Degree Pathway`;
    }
    
    // If viewing a department's courses
    if (selectedDepartment && viewMode === 'courses') {
      return `📚 ${campusName} Courses Offered`;
    }
    
    // If in majors view mode
    if (viewMode === 'majors') {
      return `🎓 ${campusName} Degree Pathway`;
    }
    
    // If in courses view with a pathway loaded
    if (viewMode === 'courses' && timelineData.length > 0) {
      return `🎓 ${campusName} Degree Pathway`;
    }
    
    // Default - browsing departments/courses
    return `📚 ${campusName} Courses Offered`;
  }, [selectedCampus, viewMode, selectedMajor, selectedDepartment, timelineData.length]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <RoadmapHeader
          headerTitle={headerTitle}
          selectedCampus={selectedCampus}
          campusOpen={campusOpen}
          setCampusOpen={setCampusOpen}
          onCampusSelect={handleCampusSelect}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          selectedMajor={selectedMajor}
          selectedPathway={selectedPathway}
          timelineDataLength={timelineData.length}
        />
      </div>

      {/* Main Timeline Area */}
      <div className={styles.timelineContainer}>
        {viewMode === 'courses' ? (
          // Courses View
          <div className={styles.timelineGrid}>
            {/* Show department courses if a department is selected */}
            {selectedDepartment && departmentCourses.length > 0 ? (
              <DepartmentCoursesView
                selectedDepartment={selectedDepartment}
                departmentCourses={departmentCourses}
                loadingCourses={loadingCourses}
                onBack={() => setSelectedDepartment(null)}
              />
            ) : selectedDepartment && !loadingCourses ? (
              <DepartmentCoursesView
                selectedDepartment={selectedDepartment}
                departmentCourses={departmentCourses}
                loadingCourses={loadingCourses}
                onBack={() => setSelectedDepartment(null)}
              />
            ) : timelineData.length === 0 ? (
              /* Show departments grid when no department is selected */
              <DepartmentsView
                departments={departments}
                loadingDepartments={loadingDepartments}
                selectedCampus={selectedCampus}
                onDepartmentSelect={handleDepartmentSelect}
                onViewModeChange={handleViewModeChange}
              />
            ) : (
              <TimelineView
                timelineData={timelineData}
                categories={categories}
                periods={periods}
                selectedItem={selectedItem}
                onItemSelect={setSelectedItem}
              />
            )}
          </div>
        ) : (
          // Majors View
          <MajorsView
            filteredMajors={filteredMajors}
            selectedCampus={selectedCampus}
            selectedMajor={selectedMajor}
            majorSearchTerm={majorSearchTerm}
            onMajorSearchChange={setMajorSearchTerm}
            onMajorSelect={handleMajorSelect}
          />
        )}
      </div>

      {/* Details Panel - Only show for course items, not for major selection */}
      <DetailsPanel
        selectedItem={selectedItem}
        selectedCampus={selectedCampus}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}