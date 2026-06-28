import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
// Check this import to ensure it points to your initialized Base44 client
import { base44 } from '@/lib/base44'; 

export default function MyChildrenPage() {
  const { user: currentUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChildrenSafely = async () => {
      // Wait until the parent's context is loaded
      if (!currentUser?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Let the backend do all the heavy lifting and bypass security blocks!
        const response = await base44.functions.invoke("linkParentToChild", {
          method: "get_children"
        });

        if (response.data && response.data.success) {
          setChildren(response.data.children || []);
        } else {
          throw new Error(response.data?.error || "Failed to fetch student profiles.");
        }

      } catch (err) {
        console.error("Backend fetch failure:", err);
        setError("Failed to load children. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildrenSafely();
  }, [currentUser]);

  // ==========================================
  // RENDER UI
  // ==========================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg mx-4 mt-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
          Link Account
        </button>
      </div>

      {children.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No linked accounts</h3>
          <p className="text-gray-500 mb-6">You haven't linked any student accounts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <div key={child.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold">
                  {child.full_name?.charAt(0) || child.student_id?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {child.full_name || child.nickname || 'Student Account'}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {child.student_id}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                <button className="text-sm text-primary font-medium hover:underline">
                  View Progress &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}