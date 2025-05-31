import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Bug {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string;
  created_at: string;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusIcons = {
  open: <AlertCircle className="h-5 w-5 text-red-500" />,
  in_progress: <Clock className="h-5 w-5 text-yellow-500" />,
  resolved: <CheckCircle className="h-5 w-5 text-green-500" />,
  closed: <CheckCircle className="h-5 w-5 text-gray-500" />,
};

const BugList = () => {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const { data, error } = await supabase
          .from('bugs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBugs(data || []);
      } catch (error) {
        console.error('Error fetching bugs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBugs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Bug Reports</h2>
      <div className="grid gap-6">
        {bugs.map((bug) => (
          <div key={bug.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-800">{bug.title}</h3>
                <p className="text-gray-600">{bug.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[bug.priority as keyof typeof priorityColors]}`}>
                  {bug.priority}
                </span>
                {statusIcons[bug.status as keyof typeof statusIcons]}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Assigned to: {bug.assigned_to}</span>
              <span>Created: {new Date(bug.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BugList;