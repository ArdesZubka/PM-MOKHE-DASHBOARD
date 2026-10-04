/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Briefcase,
  Settings,
  User as UserIcon,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { User, Task } from '../types';
import { DUMMY_USERS } from '../data/dummy';
import { getActiveTasksForUser, getWorkloadInfo } from '../utils/taskUtils';
import logoMorkheStudio from '../../assets/logoMorkheStudio.png';

interface SidebarProps {
  currentUser: User;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  tasks: Task[];
  notificationsCount: number;
  users?: User[];
}

export default function Sidebar({
  currentUser,
  currentPage,
  setCurrentPage,
  tasks,
  notificationsCount,
  users
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute active tasks count for this current user to show workload status
  const currentUserLimit = currentUser.overloadLimit || (currentUser.role === 'PM' ? 2 : 3);
  const activeUserTasks = getActiveTasksForUser(tasks, currentUser.id);
  const currentUserWorkload = getWorkloadInfo(activeUserTasks.length, currentUserLimit);

  // Sync team workload data dynamically (PM Hafidz first, then Staff members)
  const allUsersList = users || DUMMY_USERS;
  const teamMembers = [
    ...allUsersList.filter(u => u.role === 'PM'),
    ...allUsersList.filter(u => u.role === 'Staff')
  ];

  const getShortLabel = (user: User) => {
    const firstName = user.name.split(' ')[0];
    return `${firstName} (${user.position})`;
  };

  const teamWorkloads = teamMembers.map(member => {
    const activeTasks = getActiveTasksForUser(tasks, member.id);
    const limit = member.overloadLimit || (member.role === 'PM' ? 2 : 3);
    const workload = getWorkloadInfo(activeTasks.length, limit);
    return {
      member,
      activeCount: activeTasks.length,
      limit,
      workload
    };
  });

  const overloadedTeamCount = teamWorkloads.filter(w => w.workload.isOverloaded).length;

  // Check which link is active
  const isActive = (pageIds: string[]) => pageIds.includes(currentPage);

  const navItems = [
    {
      id: currentUser.role === 'PM' ? 'P04' : 'P05',
      name: 'Dasbor',
      icon: LayoutDashboard,
      roles: ['PM', 'Staff'],
      matchIds: [currentUser.role === 'PM' ? 'P04' : 'P05']
    },
    {
      id: 'P06',
      name: 'Proyek',
      icon: FolderOpen,
      roles: ['PM', 'Staff'],
      matchIds: ['P06', 'P12', 'P19']
    },
    {
      id: currentUser.role === 'PM' ? 'P07' : 'P08',
      name: 'Ruang Kerja',
      icon: Briefcase,
      roles: ['PM', 'Staff'],
      matchIds: ['P07', 'P08', 'P09', 'P10', 'P11', 'P15', 'P16', 'P20']
    }
  ];

  return (
    <aside className={`bg-morkhe-black border-r border-morkhe-black flex flex-col h-full shrink-0 select-none text-morkhe-white font-sans transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-60'}`}>
      
      {/* Agency branding header - Fixed h-14 height matching main header bar */}
      <div className={`h-14 border-b border-gray-800 flex items-center shrink-0 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        <div className="flex items-center gap-2.5">
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-lg bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center"
              title="Buka Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : (
            <>
              <img src={logoMorkheStudio} alt="Morkhe Studio Logo" className="h-8 w-8 object-contain shrink-0" />
              <div className="min-w-0">
                <h1 className="font-sans font-bold tracking-tight text-morkhe-white text-sm truncate">Morkhē Studio</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-tight font-sans font-semibold truncate">Agensi Kreatif</p>
              </div>
            </>
          )}
        </div>
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-morkhe-purple transition-all cursor-pointer p-1.5 rounded-md hover:bg-gray-800"
            title="Ciutkan Sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-3">
        {navItems.map((item) => {
          const Active = isActive(item.matchIds);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                Active
                  ? 'bg-morkhe-purple text-morkhe-white font-semibold'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-morkhe-white'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${Active ? 'text-morkhe-white' : 'text-gray-400'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </div>
            </button>
          );
        })}
      </nav>

      {/* PERSISTENT WORKLOAD INDICATOR PANEL (Double Diamond core thesis finding implementation) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800 bg-gray-900 mt-auto">
        {currentUser.role === 'PM' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Beban Kerja Tim</span>
              {overloadedTeamCount > 0 ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase">
                  <AlertTriangle className="h-3 w-3 animate-pulse" /> {overloadedTeamCount} Alert
                </span>
              ) : (
                <span className="text-[10px] font-bold text-morkhe-green uppercase">● Seimbang</span>
              )}
            </div>
            
            <div className="space-y-2 mt-2">
              {teamWorkloads.map(({ member, activeCount, limit, workload }) => (
                <div key={member.id} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-400 font-medium flex items-center gap-1 min-w-0 truncate">
                      <span className="truncate">{getShortLabel(member)}</span>
                      {member.role === 'PM' && (
                        <span className="text-[8.5px] font-bold text-morkhe-green bg-morkhe-black border border-gray-800 px-1 py-0.2 rounded shrink-0">
                          PM
                        </span>
                      )}
                    </span>
                    <span className={`font-semibold shrink-0 ml-1 ${
                      workload.isOverloaded 
                        ? 'text-red-400' 
                        : workload.isFull 
                        ? 'text-[#D97706]' 
                        : 'text-gray-300'
                    }`}>
                      {activeCount}/{limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        workload.isOverloaded 
                          ? 'bg-red-500' 
                          : workload.isFull 
                          ? 'bg-[#D97706]' 
                          : 'bg-morkhe-green'
                      }`}
                      style={{ width: `${Math.min((activeCount / limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-lg space-y-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase block tracking-wider">Kapasitas Kerja Saya</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-morkhe-white">
                {activeUserTasks.length} Tugas Aktif
              </span>
              <span className={`text-[11px] font-medium ${
                currentUserWorkload.isOverloaded 
                  ? 'text-red-400' 
                  : currentUserWorkload.isFull 
                  ? 'text-[#D97706]' 
                  : 'text-gray-400'
              }`}>
                Batas Maks: {currentUserLimit}
              </span>
            </div>
            
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentUserWorkload.isOverloaded 
                    ? 'bg-red-500' 
                    : currentUserWorkload.isFull 
                    ? 'bg-[#D97706]' 
                    : 'bg-morkhe-green'
                }`}
                style={{ width: `${Math.min((activeUserTasks.length / currentUserLimit) * 100, 100)}%` }}
              />
            </div>
            
            {currentUserWorkload.isOverloaded && (
              <p className="text-[10px] text-red-400 leading-tight flex items-start gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                <span>Kelebihan beban. Tugas menumpuk. Hubungi PM untuk redistribusi.</span>
              </p>
            )}

            {currentUserWorkload.isFull && (
              <p className="text-[10px] text-[#D97706] leading-tight font-medium">
                Kapasitas penuh
              </p>
            )}
          </div>
        )}
      </div>
      )}

    </aside>
  );
}
