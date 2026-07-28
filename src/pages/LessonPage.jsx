import React, { useState, useEffect, useRef } from 'react';

/**
 * LessonPage Component
 * 
 * Fetches lesson data asynchronously and handles session timing.
 * Uses an `isMounted` flag to prevent state updates if the component unmounts mid-fetch.
 */
export default function LessonPage() {
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reference to track when the active learning session started
  const sessionStartRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLessonData() {
      try {
        setLoading(true);
        // Simulate fetching lesson data from an API endpoint
        const response = await fetch('/api/lessons/current');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          setLessonData(data);
        }
      } catch (err) {
        console.error("Gagal memuat turun data:", err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        // Runs regardless of whether try succeeded or catch threw an error
        if (isMounted) {
          sessionStartRef.current = Date.now();
          setLoading(false);
        }
      }
    }

    fetchLessonData();

    // Clean up to avoid memory leaks or state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="p-4 text-gray-600">Memuat turun data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Ralat: {error}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {lessonData?.title || "Lesson Page"}
      </h1>
      <div className="prose">
        {lessonData?.content || "Content loaded successfully."}
      </div>
    </div>
  );
}
