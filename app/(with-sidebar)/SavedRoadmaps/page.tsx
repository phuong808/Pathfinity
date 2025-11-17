"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "../Catalog/roadmap.module.css";
import { CAMPUSES } from "@/lib/course-mapper";
import { pathwayToTimeline } from "../Catalog/utils";
import { TimelineItem, PathwayData } from "../Catalog/types";
import { TimelineView } from "../Catalog/components/TimelineView";
import { DetailsPanel } from "../Catalog/components/DetailsPanel";
import { normalizePathwayData } from "@/lib/pathway-json";

export default function SavedRoadmapsPage() {
  const [selectedCampus, setSelectedCampus] = useState<string>("manoa");
  const [pathwayData, setPathwayData] = useState<PathwayData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // On mount: try to load a pathway JSON from sessionStorage first, then localStorage
  useEffect(() => {
    let pd: PathwayData | null = null;

    const loadDraft = (get: (k: string) => string | null, remove: (k: string) => void) => {
      try {
        const raw = get("pathfinity.roadmapDraft");
        if (!raw || !raw.trim()) return;
        const parsed = JSON.parse(raw);
        const normalized = normalizePathwayData(parsed);
        if (normalized) {
          pd = normalized;
        }
        remove("pathfinity.roadmapDraft");
      } catch {
        // ignore storage parsing errors
      }
    };

    // Prefer sessionStorage first for immediate handoff reliability
    if (typeof sessionStorage !== 'undefined') {
      loadDraft(sessionStorage.getItem.bind(sessionStorage), sessionStorage.removeItem.bind(sessionStorage));
    }
    // Fallback to localStorage if not found
    if (!pd && typeof localStorage !== 'undefined') {
      loadDraft(localStorage.getItem.bind(localStorage), localStorage.removeItem.bind(localStorage));
    }

    if (pd) {
      setPathwayData(pd);
      setError(null);
    } else {
      setError("No roadmap data found. Generate a roadmap in Chat and use 'Open in Viewer'.");
    }
  }, []);

  // Whenever pathwayData or campus changes, recompute the timeline
  useEffect(() => {
    if (!pathwayData) return;
    try {
      const { items, categories, periods } = pathwayToTimeline(pathwayData, selectedCampus);
      setTimelineData(items);
      setCategories(categories);
      setPeriods(periods);
      setSelectedItem(null);
      setError(null);
    } catch (e: any) {
      console.error("Failed to build timeline:", e);
      setError(e?.message || "Failed to render roadmap");
    }
  }, [pathwayData, selectedCampus]);

  const headerTitle = useMemo(() => {
    const campusName = CAMPUSES.find(c => c.id === selectedCampus)?.displayName || "UH";
    return `🎓 ${campusName} Roadmap Viewer`;
  }, [selectedCampus]);

  return (
    <div className={styles.container}>
      {/* Header - minimal, reuse styling */}
      <div className={styles.header}>
        <div className="flex items-center justify-between p-5 pl-16">
          <div>
            <h1 className="text-3xl font-bold text-white">{headerTitle}</h1>
            <p className="text-sm text-blue-100 mt-2 font-medium">
              This page visualizes a roadmap from locally provided JSON data. Saving to your account will be added later.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="bg-white text-gray-900 border-2 border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              {CAMPUSES.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName}</option>
              ))}
            </select>
            <button
              type="button"
              className="bg-green-600 text-white rounded-md px-3 py-1 text-sm opacity-60 cursor-not-allowed"
              title="Saving to your account will be added later"
              disabled
            >
              Save to Profile
            </button>
            <button
              type="button"
              onClick={() => setImportOpen((v) => !v)}
              className="bg-white text-gray-900 border-2 border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-50"
              title="Paste a roadmap JSON to visualize"
            >
              {importOpen ? 'Close Paste' : 'Paste JSON'}
            </button>
          </div>
        </div>
      </div>

      {importOpen && (
        <div className="px-6 py-4">
          <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-700 mb-2">
              Paste the roadmap JSON here. Supported shapes: PathwayData or [PathwayData].
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              className="w-full text-sm border border-gray-300 rounded-md p-2 font-mono"
              placeholder='{
  "program_name": "Computer Science",
  "institution": "UH Manoa",
  "total_credits": 120,
  "years": [ { "year_number": 1, "semesters": [ { "semester_name": "fall_semester", "credits": 15, "courses": [ { "name": "ICS 111", "credits": 3 } ] } ] } ]
}'
            />
            {importError && (
              <div className="mt-2 text-sm text-red-700">{importError}</div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="bg-blue-600 text-white rounded-md px-3 py-1 text-sm hover:bg-blue-700"
                onClick={() => {
                  setImportError(null);
                  try {
                    if (!importText.trim()) throw new Error('No input provided');
                    const parsed = JSON.parse(importText);
                    const normalized = normalizePathwayData(parsed);
                    if (!normalized) throw new Error('JSON does not look like a PathwayData object.');
                    setPathwayData(normalized);
                    setError(null);
                  } catch (err: any) {
                    console.error('Paste import error:', err);
                    setImportError(err?.message || 'Failed to parse JSON');
                  }
                }}
              >
                Load JSON
              </button>
              <button
                type="button"
                className="bg-gray-100 text-gray-900 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-200"
                onClick={() => { setImportText(''); setImportError(null); }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.timelineContainer}>
        {error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3">
              {error}
            </div>
          </div>
        ) : (
          <div className={styles.timelineGrid}>
            <TimelineView
              timelineData={timelineData}
              categories={categories}
              periods={periods}
              selectedItem={selectedItem}
              onItemSelect={setSelectedItem}
            />
          </div>
        )}
      </div>

      <DetailsPanel
        selectedItem={selectedItem}
        selectedCampus={selectedCampus}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
