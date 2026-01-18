'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, Calendar, User, ChevronRight, Loader2 } from 'lucide-react';

interface Project {
  project_id: string;
  client_name: string;
  industry: string;
  brief: string;
  created_at: string;
  analysis_count: number;
}

interface Analysis {
  analysis_id: string;
  agent_type: string;
  model_used: string;
  created_at: string;
  result: any;
}

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/projects?limit=50');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      // Map database schema to component interface
      const mappedProjects = (data.projects || []).map((p: any) => ({
        ...p,
        analysis_count: parseInt(p.analysis_count) || 0,
      }));

      setProjects(mappedProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      // Show empty state if database not available
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectAnalyses = async (projectId: string) => {
    setLoadingAnalyses(true);
    setSelectedProject(projectId);
    try {
      const response = await fetch(`/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      // Map database analyses to component interface
      const mappedAnalyses = (data.analyses || []).map((a: any) => ({
        analysis_id: a.id,
        agent_type: a.agent_type,
        model_used: a.analysis_data?._meta?.model || 'Unknown',
        created_at: a.created_at,
        result: a.analysis_data,
      }));

      setAnalyses(mappedAnalyses);
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
      setAnalyses([]);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Project Management</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              View and manage your AI-analyzed projects
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{projects.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Projects</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Projects</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
                <p>No projects yet</p>
              </div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.project_id}
                  onClick={() => fetchProjectAnalyses(project.project_id)}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all
                    ${selectedProject === project.project_id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {project.client_name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
                        <User size={12} />
                        {project.industry}
                      </div>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`
                        transition-transform
                        ${selectedProject === project.project_id ? 'rotate-90' : ''}
                      `}
                    />
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">
                    {project.brief}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(project.created_at)}
                    </div>
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                      {project.analysis_count} analyses
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Analysis Details */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Analysis History</h3>
          {!selectedProject ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
              <p>Select a project to view analyses</p>
            </div>
          ) : loadingAnalyses ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <p>No analyses found for this project</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {analyses.map((analysis) => (
                <div
                  key={analysis.analysis_id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white capitalize">
                        {analysis.agent_type} Agent
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {formatDate(analysis.created_at)}
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs font-medium">
                      {analysis.model_used}
                    </div>
                  </div>
                  <details className="cursor-pointer">
                    <summary className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                      View Result
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded text-xs overflow-x-auto text-slate-900 dark:text-slate-100">
                      {JSON.stringify(analysis.result, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
