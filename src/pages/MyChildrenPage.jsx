import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export default function MyChildrenPage() {
  const { user: currentUser } = useAuth();
  
  // States for displaying children
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for the Link Account feature
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkMethod, setLinkMethod] = useState('student_id'); // 'student_id' or 'link_code'
  const [linkInput, setLinkInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkMessage, setLinkMessage] = useState({ type: '', text: '' });

  // Wrapped in useCallback so we can call it after linking a new child
  const fetchChildrenSafely = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
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
  }, [currentUser]);

  useEffect(() => {
    fetchChildrenSafely();
  }, [fetchChildrenSafely]);

  // ==========================================
  // HANDLE LINK SUBMISSION
  // ==========================================
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkInput.trim()) return;

    setIsSubmitting(true);
    setLinkMessage({ type: '', text: '' });

    try {
      // Send either { method: 'student_id', student_id: '...' } 
      // OR { method: 'link_code', link_code: '...' }
      const payload = {
        method: linkMethod,
        [linkMethod]: linkInput.trim()
      };

      const response = await base44.functions.invoke("linkParentToChild", payload);

      if (response.data && response.data.success) {
        setLinkMessage({ type: 'success', text: response.data.message });
        setLinkInput(''); // Clear the input
        
        // If they used a link code, the connection is instant! Refresh the list.
        if (linkMethod === 'link_code') {
          fetchChildrenSafely();
        }
      } else {
        setLinkMessage({ type: 'error', text: response.data?.error || "Failed to link account." });
      }
    } catch (err) {
      console.error("Linking error:", err);
      setLinkMessage({ type: 'error', text: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  if (isLoading && children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl relative">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
        
        {/* THIS BUTTON NOW OPENS THE MODAL! */}
        <button 
          onClick={() => {
            setShowLinkModal(true);
            setLinkMessage({ type: '', text: '' });
          }}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          + Link Account
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-500 bg-red-50 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* CHILDREN GRID */}
      {children.length === 0 && !error ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No linked accounts</h3>
          <p className="text-gray-500 mb-6">You haven't linked any student accounts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <div key={child.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold uppercase">
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

      {/* ========================================== */}
      {/* LINK ACCOUNT MODAL (POPUP)                 */}
      {/* ========================================== */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Link Student Account</h2>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="p-6">
              
              {/* Toggle Between Student ID or Link Code */}
              <div className="flex gap-4 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="linkMethod" 
                    checked={linkMethod === 'student_id'}
                    onChange={() => setLinkMethod('student_id')}
                    className="text-primary"
                  />
                  <span className="text-sm font-medium">Use Student ID</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="linkMethod" 
                    checked={linkMethod === 'link_code'}
                    onChange={() => setLinkMethod('link_code')}
                    className="text-primary"
                  />
                  <span className="text-sm font-medium">Use Link Code</span>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {linkMethod === 'student_id' ? 'Enter Student ID (e.g., SQ-123456)' : 'Enter Link Code'}
                </label>
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder={linkMethod === 'student_id' ? 'SQ-XXXXXX' : 'Enter secret code'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {linkMethod === 'student_id' 
                    ? 'This will send a request to the student. They must approve it on their dashboard.' 
                    : 'This will instantly link the accounts if the code is valid.'}
                </p>
              </div>

              {/* Status Messages */}
              {linkMessage.text && (
                <div className={`p-3 mb-4 text-sm rounded-lg ${
                  linkMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                }`}>
                  {linkMessage.text}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !linkInput}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Link Account'}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}
      
    </div>
  );
}