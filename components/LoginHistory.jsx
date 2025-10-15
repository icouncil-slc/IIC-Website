"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function LoginHistory() {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // For the initial component load
  const [isFetchingMore, setIsFetchingMore] = useState(false); // For the "Load More" button

  useEffect(() => {
    const fetchHistory = async () => {
      // Set the correct loading state based on which action is happening
      if (page === 1) setIsLoading(true);
      else setIsFetchingMore(true);

      try {
        const { data } = await axios.get(`/api/admin/login-history?page=${page}`);
        
        // Append new history records, or set them if it's the first page
        setHistory(prev => page === 1 ? data.history : [...prev, ...data.history]);
        
        // A more reliable way to check if there's more data to load
        if ((page * 10) >= data.total) {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Could not fetch login history", error);
        // Optional: Show a toast error here
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    };

    fetchHistory();
  }, [page]); // This effect re-runs every time the `page` state changes

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Recent Login Activity
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.length === 0 ? (
              <tr><td colSpan="3" className="text-center p-6 text-gray-500">No login activity found.</td></tr>
            ) : history.map((log) => (
              <tr key={log._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(log.timestamp), 'PPpp')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ipAddress || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="mt-4 text-center">
          <Button onClick={() => setPage(p => p + 1)} variant="outline" disabled={isFetchingMore}>
            {isFetchingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
