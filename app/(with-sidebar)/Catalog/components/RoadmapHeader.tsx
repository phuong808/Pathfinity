import React from 'react';
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Check, ChevronsUpDown, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMPUSES, type MajorData } from "@/lib/course-mapper";
import { PathwayRecord, ViewMode } from '../types';

interface RoadmapHeaderProps {
  headerTitle: string;
  selectedCampus: string;
  campusOpen: boolean;
  setCampusOpen: (open: boolean) => void;
  onCampusSelect: (campusId: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedMajor: MajorData | null;
  selectedPathway: PathwayRecord | null;
  timelineDataLength: number;
}

export function RoadmapHeader({
  headerTitle,
  selectedCampus,
  campusOpen,
  setCampusOpen,
  onCampusSelect,
  viewMode,
  onViewModeChange,
  selectedMajor,
  selectedPathway,
  timelineDataLength,
}: RoadmapHeaderProps) {
  return (
    <div className="flex flex-col p-5 pl-16 gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {headerTitle}
          </h1>
          {selectedMajor && viewMode === 'courses' && timelineDataLength > 0 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewModeChange('majors')}
                className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300"
              >
                ← Back to Majors
              </Button>
              <p className="text-sm text-blue-100 font-medium">
                {selectedMajor.majorName} • {selectedMajor.pathwayData?.total_credits || 0} Total Credits • {CAMPUSES.find(c => c.id === selectedCampus)?.displayName}
              </p>
            </div>
          )}
          {!selectedMajor && selectedPathway && viewMode === 'courses' && (
            <p className="text-sm text-blue-100 mt-2 font-medium">
              {selectedPathway.programName} • {selectedPathway.totalCredits} Total Credits • {CAMPUSES.find(c => c.id === selectedCampus)?.displayName}
            </p>
          )}
          {viewMode === 'majors' && (
            <p className="text-sm text-blue-100 mt-2 font-medium">
              Explore Majors at {CAMPUSES.find(c => c.id === selectedCampus)?.displayName}
            </p>
          )}
          {viewMode === 'courses' && !selectedMajor && !selectedPathway && (
            <p className="text-sm text-blue-100 mt-2 font-medium">
              Explore courses at {CAMPUSES.find(c => c.id === selectedCampus)?.displayName}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {/* Campus Selector */}
          <Popover open={campusOpen} onOpenChange={setCampusOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={campusOpen}
                className="w-[200px] justify-between bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 hover:border-blue-600 font-medium"
              >
                <span className="truncate">
                  {CAMPUSES.find((c) => c.id === selectedCampus)?.displayName || "Select campus..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search campus..." />
                <CommandList>
                  <CommandEmpty>No campus found.</CommandEmpty>
                  <CommandGroup>
                    {CAMPUSES.map((campus) => (
                      <CommandItem
                        key={campus.id}
                        value={campus.id}
                        onSelect={() => onCampusSelect(campus.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCampus === campus.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {campus.displayName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-white rounded-lg p-1 border-2 border-gray-300">
            <Button
              variant={viewMode === 'majors' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('majors')}
              className={cn(
                "flex items-center gap-2",
                viewMode === 'majors' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <GraduationCap className="h-4 w-4" />
              Majors
            </Button>
            <Button
              variant={viewMode === 'courses' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('courses')}
              className={cn(
                "flex items-center gap-2",
                viewMode === 'courses' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <BookOpen className="h-4 w-4" />
              Courses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
