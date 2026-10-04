/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Trello, Calendar, Clock } from 'lucide-react';
import KanbanPages from './KanbanPages';
import CalendarPages from './CalendarPages';
import TimelinePages from './TimelinePages';
import { User, Task, Project, Comment } from '../types';

interface TugasPagesProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  comments?: Comment[];
  onOpenAddTaskModal: (initialStatus?: Task['status'], targetProjectId?: string) => void;
  onUpdateTaskStatus: (
    taskId: string, 
    newStatus: Task['status'],
    targetNeighborTaskId?: string,
    insertBefore?: boolean
  ) => void;
  onOpenTaskDetail: (task: Task) => void;
}

export default function TugasPages({
  currentPage,
  setCurrentPage,
  currentUser,
  users,
  projects,
  tasks,
  comments,
  onOpenAddTaskModal,
  onUpdateTaskStatus,
  onOpenTaskDetail
}: TugasPagesProps) {
  const isPM = currentUser.role === 'PM';
  const isPapan = currentPage === 'P07' || currentPage === 'P08';
  const isTimeline = currentPage === 'P20';
  const isKalender = currentPage === 'P15' || currentPage === 'P16';

  // Synchronize initial page state with URL search param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = searchParams.get('view');

    if (viewParam === 'kalender') {
      setCurrentPage('P15');
    } else if (viewParam === 'timeline') {
      setCurrentPage('P20');
    } else if (viewParam === 'papan') {
      setCurrentPage(isPM ? 'P07' : 'P08');
    }
  }, []);

  const handleTabChange = (tab: 'papan' | 'timeline' | 'kalender') => {
    if (tab === 'papan') {
      setCurrentPage(isPM ? 'P07' : 'P08');
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?view=papan';
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } else if (tab === 'timeline') {
      setCurrentPage('P20');
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?view=timeline';
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } else {
      setCurrentPage('P15');
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?view=kalender';
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto font-sans select-none text-gray-900">
      
      {/* Tab Switcher Header (Kanban | Timeline | Kalender) */}
      <div className="sticky top-0 z-20 bg-morkhe-white -mx-8 px-8 pt-4 pb-0 -mt-8 mb-6 border-b border-gray-200">
        <div className="flex gap-6 -mb-px">
          {/* 1. Kanban Tab */}
          <button
            id="tab-kanban"
            onClick={() => handleTabChange('papan')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              isPapan 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            <Trello className="h-4 w-4" />
            <span>Kanban</span>
          </button>

          {/* 2. Timeline Tab */}
          <button
            id="tab-timeline"
            onClick={() => handleTabChange('timeline')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              isTimeline 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Timeline</span>
          </button>

          {/* 3. Kalender Tab */}
          <button
            id="tab-kalender"
            onClick={() => handleTabChange('kalender')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              isKalender 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Kalender</span>
          </button>
        </div>
      </div>

      {/* Embedded Component views */}
      {isTimeline ? (
        <TimelinePages 
          currentUser={currentUser}
          tasks={tasks}
          projects={projects}
          users={users}
          onOpenTaskDetail={onOpenTaskDetail}
          onOpenAddTaskModal={onOpenAddTaskModal}
          setCurrentPage={setCurrentPage}
        />
      ) : isKalender ? (
        <CalendarPages 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
          tasks={tasks}
          projects={projects}
          onOpenTaskDetail={onOpenTaskDetail}
          isNested={true}
          onOpenAddTaskModal={onOpenAddTaskModal}
        />
      ) : (
        <KanbanPages 
          currentUser={currentUser}
          users={users}
          projects={projects}
          tasks={tasks}
          comments={comments}
          onOpenAddTaskModal={onOpenAddTaskModal}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onOpenTaskDetail={onOpenTaskDetail}
          isNested={true}
          setCurrentPage={setCurrentPage}
        />
      )}

    </div>
  );
}
