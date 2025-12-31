"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Group, SavedPractice } from "../types/swimSet";

interface DashboardProps {
  onCreateNew: () => void;
  onEditPractice: (practice: SavedPractice) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onCreateNew,
  onEditPractice,
}) => {
  const { user, logout } = useAuth();
  const [practices, setPractices] = useState<SavedPractice[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMemberCount, setNewGroupMemberCount] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "practices" | "groups" | "calendar" | "analytics"
  >("practices");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");
  const [selectedAnalyticsGroup, setSelectedAnalyticsGroup] = useState<
    string | null
  >(null);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  useEffect(() => {
    loadPractices();
    loadGroups();
  }, []);

  const loadPractices = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/practices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPractices(data.practices);
        console.log("Loaded practices:", data.practices.length);
      } else {
        console.error("Failed to load practices:", response.status);
      }
    } catch (error) {
      console.error("Failed to load practices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/groups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
        console.log("Loaded groups:", data.groups.length);
      } else {
        console.error("Failed to load groups:", response.status);
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newGroupName,
          memberCount: newGroupMemberCount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGroups([...groups, data.group]);
        setNewGroupName("");
        setNewGroupMemberCount(0);
        setShowGroupModal(false);
        alert("Group created successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to create group: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Create group error:", error);
      alert("Failed to create group. Please try again.");
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this group? This will not delete associated practices."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== groupId));
        alert("Group deleted successfully!");
      } else {
        const errorData = await response.json();

        // Check if it's a server restart issue
        if (
          errorData.error?.includes("not found") ||
          errorData.error?.includes("user has no groups")
        ) {
          alert(
            `Failed to delete group: ${errorData.error}.\n\nThis might be because the server was restarted and lost the in-memory data. Please refresh the page to reload your groups.`
          );
          if (confirm("Would you like to refresh the page to reload groups?")) {
            window.location.reload();
          }
        } else {
          alert(`Failed to delete group: ${errorData.error}`);
        }
      }
    } catch (error) {
      console.error("Delete group error:", error);
      alert("Failed to delete group. Please try again.");
    }
  };

  const deletePractice = async (practiceId: string) => {
    if (!confirm("Are you sure you want to delete this practice?")) {
      return;
    }

    console.log("Attempting to delete practice with ID:", practiceId);
    console.log(
      "Current practices:",
      practices.map((p) => ({ id: p.id, title: p.title }))
    );
    console.log("Full practice objects:", practices);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/practices/${practiceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        "Delete response status:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        console.log("Practice deleted successfully");
        setPractices(practices.filter((p) => p.id !== practiceId));
        alert("Practice deleted successfully!");
      } else {
        // Get the response text first to see what we're actually getting
        const responseText = await response.text();
        console.log("Delete failed - response text:", responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse error response as JSON:", parseError);
          errorData = {
            error: `Server error: ${response.status} - ${responseText}`,
          };
        }

        console.error("Delete failed:", errorData);

        // If it's a "not found" error, it might be because the server restarted
        if (
          errorData.error?.includes("not found") ||
          errorData.error?.includes("user has no practices")
        ) {
          alert(
            `Failed to delete practice: ${errorData.error}.\n\nThis might be because the server was restarted and lost the in-memory data. Please refresh the page to reload your practices.`
          );
          // Optionally refresh the practices list
          if (
            confirm("Would you like to refresh the page to reload practices?")
          ) {
            window.location.reload();
          }
        } else {
          alert(
            `Failed to delete practice: ${errorData.error || "Unknown error"}`
          );
        }
      }
    } catch (error) {
      console.error("Failed to delete practice:", error);
      alert("Failed to delete practice. Please try again.");
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }
  };

  const getDifficultyIndicator = (difficulty: number) => {
    const getDifficultyColor = (diff: number) => {
      if (diff >= 80) return "text-red-400";
      if (diff >= 60) return "text-orange-400";
      if (diff >= 40) return "text-yellow-400";
      if (diff >= 20) return "text-green-400";
      return "text-blue-400";
    };

    const getDifficultyLabel = (diff: number) => {
      if (diff >= 80) return "Extreme";
      if (diff >= 60) return "Hard";
      if (diff >= 40) return "Moderate";
      if (diff >= 20) return "Easy";
      return "Very Easy";
    };

    const color = getDifficultyColor(difficulty);
    const label = getDifficultyLabel(difficulty);

    return <span className={`${color} font-medium`}>{label}</span>;
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return "Ungrouped";
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : "Unknown Group";
  };

  const getPracticesForGroup = (groupId: string | null, date?: string) => {
    const targetDate = date || new Date().toISOString().split("T")[0];
    return practices.filter((p) => {
      const practiceGroupId = p.groupId || null;
      const practiceDate = p.date;
      return practiceGroupId === groupId && practiceDate === targetDate;
    });
  };

  const getGroupStats = (group: Group) => {
    const todaysPractices = getPracticesForGroup(group.id);
    return {
      memberCount: group.memberCount,
      todaysPracticeCount: todaysPractices.length,
    };
  };

  // Calendar helper functions
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + 6;
    return new Date(d.setDate(diff));
  };

  const getPracticesForDate = (date: string) => {
    return practices.filter((p) => p.date === date);
  };

  const getPracticesForDateRange = (startDate: Date, endDate: Date) => {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    return practices.filter((p) => p.date >= start && p.date <= end);
  };

  const navigateCalendar = (direction: number) => {
    const newDate = new Date(currentDate);
    if (calendarView === "month") {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setDate(newDate.getDate() + direction * 7);
    }
    setCurrentDate(newDate);
  };

  const renderCalendarView = () => {
    if (calendarView === "month") {
      return renderMonthView();
    } else {
      return renderWeekView();
    }
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    // Generate 6 weeks (42 days) to ensure complete calendar view
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-slate-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dateStr = day.toISOString().split("T")[0];
            const dayPractices = getPracticesForDate(dateStr);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 rounded-lg border transition-all duration-200 ${
                  isCurrentMonth
                    ? "bg-white/5 border-white/20"
                    : "bg-white/2 border-white/10"
                } ${isToday ? "ring-2 ring-emerald-400" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-2 ${
                    isCurrentMonth ? "text-white" : "text-slate-500"
                  } ${isToday ? "text-emerald-400" : ""}`}
                >
                  {day.getDate()}
                </div>

                <div className="space-y-1">
                  {dayPractices.slice(0, 3).map((practice, pIndex) => {
                    const group = groups.find((g) => g.id === practice.groupId);
                    return (
                      <div
                        key={pIndex}
                        onClick={() => onEditPractice(practice)}
                        className="text-xs p-1 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer transition-colors"
                        title={`${practice.title}\n${
                          group?.name || "Ungrouped"
                        }\n${practice.totalYardage} yards • ${formatTime(
                          practice.estimatedTime
                        )}`}
                      >
                        <div className="truncate font-medium">
                          {practice.title}
                        </div>
                        <div className="truncate text-emerald-400">
                          {group?.name || "Ungrouped"}
                        </div>
                        <div className="text-emerald-300">
                          {practice.totalYardage}y •{" "}
                          {formatTime(practice.estimatedTime)}
                        </div>
                      </div>
                    );
                  })}
                  {dayPractices.length > 3 && (
                    <div className="text-xs text-slate-400 text-center">
                      +{dayPractices.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => {
            const dateStr = day.toISOString().split("T")[0];
            const dayPractices = getPracticesForDate(dateStr);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[400px] p-4 rounded-xl border transition-all duration-200 bg-white/5 border-white/20 ${
                  isToday ? "ring-2 ring-emerald-400" : ""
                }`}
              >
                <div
                  className={`text-lg font-bold mb-3 text-center ${
                    isToday ? "text-emerald-400" : "text-white"
                  }`}
                >
                  <div>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-2xl">{day.getDate()}</div>
                </div>

                <div className="space-y-3">
                  {dayPractices.map((practice, pIndex) => {
                    const group = groups.find((g) => g.id === practice.groupId);
                    return (
                      <div
                        key={pIndex}
                        onClick={() => onEditPractice(practice)}
                        className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer transition-all duration-200"
                      >
                        <div className="font-medium truncate mb-1">
                          {practice.title}
                        </div>
                        <div className="text-xs text-emerald-400 mb-2">
                          {group?.name || "Ungrouped"}
                        </div>
                        <div className="text-xs space-y-1">
                          <div>{practice.totalYardage} yards</div>
                          <div>{formatTime(practice.estimatedTime)}</div>
                          <div>
                            {getDifficultyIndicator(practice.difficulty || 0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {dayPractices.length === 0 && (
                    <div className="text-center text-slate-500 text-sm py-8">
                      No practices
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Analytics helper functions
  const getAnalyticsDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (analyticsTimeRange) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "quarter":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "year":
        startDate.setDate(startDate.getDate() - 365);
        break;
    }

    return { startDate, endDate };
  };

  const getAnalyticsPractices = () => {
    const { startDate, endDate } = getAnalyticsDateRange();
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    let filteredPractices = practices.filter(
      (p) => p.date >= start && p.date <= end
    );

    if (selectedAnalyticsGroup) {
      filteredPractices = filteredPractices.filter(
        (p) => p.groupId === selectedAnalyticsGroup
      );
    }

    return filteredPractices;
  };

  const getGroupYardageData = () => {
    const { startDate, endDate } = getAnalyticsDateRange();
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dateLabels: string[] = [];
    const groupData: {
      [groupId: string]: { name: string; data: number[]; color: string };
    } = {};

    // Generate date labels
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dateLabels.push(date.toISOString().split("T")[0]);
    }

    // Initialize group data
    groups.forEach((group, index) => {
      const colors = [
        "#06b6d4",
        "#8b5cf6",
        "#f59e0b",
        "#ef4444",
        "#10b981",
        "#f97316",
        "#6366f1",
      ];
      groupData[group.id] = {
        name: group.name,
        data: new Array(days).fill(0),
        color: colors[index % colors.length],
      };
    });

    // Add ungrouped
    groupData["ungrouped"] = {
      name: "Ungrouped",
      data: new Array(days).fill(0),
      color: "#64748b",
    };

    // Populate data
    practices.forEach((practice) => {
      const dateIndex = dateLabels.indexOf(practice.date);
      if (dateIndex >= 0) {
        const groupId = practice.groupId || "ungrouped";
        if (groupData[groupId]) {
          groupData[groupId].data[dateIndex] += practice.totalYardage;
        }
      }
    });

    return { dateLabels, groupData };
  };

  const getStrokeBreakdown = () => {
    const analyticsPractices = getAnalyticsPractices();
    const strokeCounts: { [stroke: string]: number } = {};

    analyticsPractices.forEach((practice) => {
      // Parse practice content to extract stroke information
      const content = practice.content.toLowerCase();
      const strokes = {
        Free: (content.match(/\b(free|freestyle|fr)\b/g) || []).length,
        Back: (content.match(/\b(back|backstroke)\b/g) || []).length,
        Breast: (content.match(/\b(breast|breaststroke)\b/g) || []).length,
        Fly: (content.match(/\b(fly|butterfly)\b/g) || []).length,
        IM: (content.match(/\bim\b|individual medley/g) || []).length,
        Kick: (content.match(/\bkick\b/g) || []).length,
        Drill: (content.match(/\bdrill\b/g) || []).length,
      };

      Object.entries(strokes).forEach(([stroke, count]) => {
        strokeCounts[stroke] = (strokeCounts[stroke] || 0) + count;
      });
    });

    return strokeCounts;
  };

  const getRecoveryTime = () => {
    const analyticsPractices = getAnalyticsPractices();
    let totalRecoveryMinutes = 0;

    analyticsPractices.forEach((practice) => {
      const content = practice.content.toLowerCase();

      // Count recovery indicators
      const easyMatches = content.match(/\beasy\b/g) || [];
      const restMatches = content.match(/\brest\b/g) || [];
      const recoveryMatches = content.match(/\brecovery\b/g) || [];

      // Estimate recovery time (rough calculation)
      const recoveryIndicators =
        easyMatches.length + restMatches.length + recoveryMatches.length;
      totalRecoveryMinutes += recoveryIndicators * 2; // Rough estimate: 2 minutes per indicator
    });

    return totalRecoveryMinutes;
  };

  const renderBarChart = (
    data: { label: string; value: number; color: string }[],
    title: string,
    unit: string = ""
  ) => {
    const maxValue = Math.max(...data.map((d) => d.value));

    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-24 text-sm text-slate-300 font-medium truncate">
                {item.label}
              </div>
              <div className="flex-1 bg-slate-800/50 rounded-full h-8 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
                <div className="absolute inset-0 flex items-center px-3 text-white text-sm font-medium">
                  {item.value.toLocaleString()}
                  {unit}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLineChart = (data: {
    dateLabels: string[];
    groupData: {
      [key: string]: { name: string; data: number[]; color: string };
    };
  }) => {
    const maxValue = Math.max(
      ...Object.values(data.groupData).flatMap((g) => g.data)
    );
    const chartHeight = 200;

    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-6">
          Yardage Trends by Group
        </h3>

        <div className="relative" style={{ height: chartHeight + 40 }}>
          <svg
            width="100%"
            height={chartHeight + 40}
            className="overflow-visible"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="60"
                x2="100%"
                y1={chartHeight * (1 - ratio) + 20}
                y2={chartHeight * (1 - ratio) + 20}
                stroke="rgba(148, 163, 184, 0.2)"
                strokeDasharray="4 4"
              />
            ))}

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <text
                key={ratio}
                x="50"
                y={chartHeight * (1 - ratio) + 25}
                fill="rgba(148, 163, 184, 0.8)"
                fontSize="12"
                textAnchor="end"
              >
                {Math.round(maxValue * ratio).toLocaleString()}
              </text>
            ))}

            {/* Lines for each group */}
            {Object.entries(data.groupData).map(([groupId, groupInfo]) => {
              if (groupInfo.data.every((v) => v === 0)) return null;

              const points = groupInfo.data
                .map((value, index) => {
                  const x =
                    60 +
                    (index / (data.dateLabels.length - 1)) *
                      (window.innerWidth * 0.6 - 60);
                  const y = 20 + chartHeight * (1 - value / maxValue);
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <g key={groupId}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={groupInfo.color}
                    strokeWidth="3"
                    className="drop-shadow-sm"
                  />
                  {groupInfo.data.map((value, index) => {
                    const x =
                      60 +
                      (index / (data.dateLabels.length - 1)) *
                        (window.innerWidth * 0.6 - 60);
                    const y = 20 + chartHeight * (1 - value / maxValue);
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={groupInfo.color}
                        className="drop-shadow-sm"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {Object.entries(data.groupData)
            .filter(([, groupInfo]) => !groupInfo.data.every((v) => v === 0))
            .map(([groupId, groupInfo]) => (
              <div key={groupId} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: groupInfo.color }}
                />
                <span className="text-sm text-slate-300">{groupInfo.name}</span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-600 bg-clip-text text-transparent mb-2">
              MySetManager
            </h1>
            <p className="text-xl text-slate-300 font-light">
              Welcome back, {user?.name}
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-cyan-500/25 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>New Practice</span>
            </button>
            <button
              onClick={logout}
              className="px-6 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content Layout with Sidebar */}
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("practices")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    activeTab === "practices"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Practices</span>
                </button>

                <button
                  onClick={() => setActiveTab("groups")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    activeTab === "groups"
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Groups</span>
                </button>

                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    activeTab === "calendar"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Calendar</span>
                </button>

                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    activeTab === "analytics"
                      ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  <span>Analytics</span>
                </button>
              </nav>

              {/* Contextual Actions */}
              <div className="mt-6 pt-6 border-t border-white/20">
                {activeTab === "practices" ? (
                  <button
                    onClick={onCreateNew}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center space-x-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>New Practice</span>
                  </button>
                ) : activeTab === "groups" ? (
                  <button
                    onClick={() => setShowGroupModal(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25 flex items-center justify-center space-x-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Create Group</span>
                  </button>
                ) : activeTab === "calendar" ? (
                  <div className="space-y-3">
                    <button
                      onClick={onCreateNew}
                      className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center space-x-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Add Practice</span>
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCalendarView("month")}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                          calendarView === "month"
                            ? "bg-emerald-500 text-white"
                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                        }`}
                      >
                        Month
                      </button>
                      <button
                        onClick={() => setCalendarView("week")}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                          calendarView === "week"
                            ? "bg-emerald-500 text-white"
                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                        }`}
                      >
                        Week
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Time Range
                      </label>
                      <select
                        value={analyticsTimeRange}
                        onChange={(e) =>
                          setAnalyticsTimeRange(e.target.value as any)
                        }
                        className="w-full px-3 py-2 bg-slate-800/50 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="week">Past Week</option>
                        <option value="month">Past Month</option>
                        <option value="quarter">Past Quarter</option>
                        <option value="year">Past Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Focus Group
                      </label>
                      <select
                        value={selectedAnalyticsGroup || ""}
                        onChange={(e) =>
                          setSelectedAnalyticsGroup(e.target.value || null)
                        }
                        className="w-full px-3 py-2 bg-slate-800/50 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="">All Groups</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Stats Overview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-8">
              {activeTab === "practices" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-cyan-400">
                      {practices.length}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Total Practices
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-400">
                      {practices
                        .reduce((sum, p) => sum + p.totalYardage, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Total Yards
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400">
                      {formatTime(
                        practices.reduce((sum, p) => sum + p.estimatedTime, 0)
                      )}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Total Time
                    </div>
                  </div>
                </div>
              ) : activeTab === "groups" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-purple-400">
                      {groups.length}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Total Groups
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-400">
                      {groups.reduce((sum, g) => sum + g.memberCount, 0)}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Total Members
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-400">
                      {groups.reduce(
                        (sum, g) => sum + getPracticesForGroup(g.id).length,
                        0
                      )}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Today's Assignments
                    </div>
                  </div>
                </div>
              ) : activeTab === "calendar" ? (
                <div className="flex justify-between items-center">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center flex-1">
                    <div>
                      <div className="text-3xl font-bold text-emerald-400">
                        {
                          getPracticesForDateRange(
                            calendarView === "week"
                              ? getWeekStart(currentDate)
                              : new Date(
                                  currentDate.getFullYear(),
                                  currentDate.getMonth(),
                                  1
                                ),
                            calendarView === "week"
                              ? getWeekEnd(currentDate)
                              : new Date(
                                  currentDate.getFullYear(),
                                  currentDate.getMonth() + 1,
                                  0
                                )
                          ).length
                        }
                      </div>
                      <div className="text-sm text-slate-400 font-medium">
                        {calendarView === "week" ? "This Week" : "This Month"}
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-teal-400">
                        {getPracticesForDateRange(
                          calendarView === "week"
                            ? getWeekStart(currentDate)
                            : new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth(),
                                1
                              ),
                          calendarView === "week"
                            ? getWeekEnd(currentDate)
                            : new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth() + 1,
                                0
                              )
                        )
                          .reduce((sum, p) => sum + p.totalYardage, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400 font-medium">
                        Total Yards
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-cyan-400">
                        {formatTime(
                          getPracticesForDateRange(
                            calendarView === "week"
                              ? getWeekStart(currentDate)
                              : new Date(
                                  currentDate.getFullYear(),
                                  currentDate.getMonth(),
                                  1
                                ),
                            calendarView === "week"
                              ? getWeekEnd(currentDate)
                              : new Date(
                                  currentDate.getFullYear(),
                                  currentDate.getMonth() + 1,
                                  0
                                )
                          ).reduce((sum, p) => sum + p.estimatedTime, 0)
                        )}
                      </div>
                      <div className="text-sm text-slate-400 font-medium">
                        Total Time
                      </div>
                    </div>
                  </div>

                  {/* Calendar Navigation */}
                  <div className="flex items-center space-x-4 ml-8">
                    <button
                      onClick={() => navigateCalendar(-1)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <div className="text-white font-medium min-w-[140px] text-center">
                      {calendarView === "month"
                        ? currentDate.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })
                        : `Week of ${getWeekStart(
                            currentDate
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}`}
                    </div>
                    <button
                      onClick={() => navigateCalendar(1)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Today
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-orange-400">
                      {(() => {
                        const { startDate, endDate } = getAnalyticsDateRange();
                        const relevantPractices = selectedAnalyticsGroup
                          ? getPracticesForGroup(selectedAnalyticsGroup).filter(
                              (p) => {
                                const practiceDate = new Date(p.date);
                                return (
                                  practiceDate >= startDate &&
                                  practiceDate <= endDate
                                );
                              }
                            )
                          : practices.filter((p) => {
                              const practiceDate = new Date(p.date);
                              return (
                                practiceDate >= startDate &&
                                practiceDate <= endDate
                              );
                            });
                        return relevantPractices
                          .reduce((sum, p) => sum + p.totalYardage, 0)
                          .toLocaleString();
                      })()}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Total Yardage
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-400">
                      {(() => {
                        const { startDate, endDate } = getAnalyticsDateRange();
                        const relevantPractices = selectedAnalyticsGroup
                          ? getPracticesForGroup(selectedAnalyticsGroup).filter(
                              (p) => {
                                const practiceDate = new Date(p.date);
                                return (
                                  practiceDate >= startDate &&
                                  practiceDate <= endDate
                                );
                              }
                            )
                          : practices.filter((p) => {
                              const practiceDate = new Date(p.date);
                              return (
                                practiceDate >= startDate &&
                                practiceDate <= endDate
                              );
                            });
                        return relevantPractices.length;
                      })()}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Total Sessions
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-400">
                      {(() => {
                        const { startDate, endDate } = getAnalyticsDateRange();
                        const relevantPractices = selectedAnalyticsGroup
                          ? getPracticesForGroup(selectedAnalyticsGroup).filter(
                              (p) => {
                                const practiceDate = new Date(p.date);
                                return (
                                  practiceDate >= startDate &&
                                  practiceDate <= endDate
                                );
                              }
                            )
                          : practices.filter((p) => {
                              const practiceDate = new Date(p.date);
                              return (
                                practiceDate >= startDate &&
                                practiceDate <= endDate
                              );
                            });
                        const avgDifficulty =
                          relevantPractices.length > 0
                            ? Math.round(
                                relevantPractices.reduce(
                                  (sum, p) => sum + (p.difficulty || 0),
                                  0
                                ) / relevantPractices.length
                              )
                            : 0;
                        return avgDifficulty;
                      })()}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Avg Intensity
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400">
                      {selectedAnalyticsGroup
                        ? getGroupName(selectedAnalyticsGroup)
                        : "All Groups"}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      Current Focus
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === "practices" ? (
              /* Practices Tab Content */
              <div>
                {practices.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-12 text-center">
                    <div className="text-slate-400 text-lg mb-6">
                      You haven't created any practices yet.
                    </div>
                    <button
                      onClick={onCreateNew}
                      className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-cyan-500/25"
                    >
                      Create Your First Practice
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {practices.map((practice) => (
                      <div
                        key={practice.id}
                        className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-white truncate mr-2">
                            {practice.title}
                          </h3>
                          <button
                            onClick={() => deletePractice(practice.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                                clipRule="evenodd"
                              />
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l1.293 1.293a1 1 0 001.414-1.414L10.414 12l1.293-1.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-2 mb-6">
                          <div className="text-sm text-slate-400">
                            Date: {new Date(practice.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-slate-400">
                            Group:{" "}
                            <span className="text-purple-400">
                              {getGroupName(practice.groupId)}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">
                            {practice.totalYardage} yards •{" "}
                            {formatTime(practice.estimatedTime)}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">
                              Difficulty: {practice.difficulty || 0}/100
                            </span>
                            <div className="flex items-center">
                              {getDifficultyIndicator(practice.difficulty || 0)}
                            </div>
                          </div>
                          <div className="text-sm text-slate-500">
                            Created:{" "}
                            {new Date(practice.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <button
                          onClick={() => onEditPractice(practice)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                        >
                          Open Practice
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "groups" ? (
              /* Groups Tab Content */
              <div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                  {groups.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-slate-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-slate-300 mb-2">
                        No Groups Created
                      </h3>
                      <p className="mb-4">
                        Create your first group to organize practices and manage
                        swimmers!
                      </p>
                      <button
                        onClick={() => setShowGroupModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium"
                      >
                        Create Your First Group
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groups.map((group) => {
                        const stats = getGroupStats(group);
                        return (
                          <div
                            key={group.id}
                            className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-xl font-semibold text-white truncate">
                                {group.name}
                              </h3>
                              <button
                                onClick={() => deleteGroup(group.id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
                                title="Delete group"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                                    clipRule="evenodd"
                                  />
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l1.293 1.293a1 1 0 001.414-1.414L10.414 12l1.293-1.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Members:</span>
                                <span className="text-cyan-400 font-semibold">
                                  {stats.memberCount}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">
                                  Today's Practices:
                                </span>
                                <span className="text-green-400 font-semibold">
                                  {stats.todaysPracticeCount}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 pt-2 border-t border-white/10">
                                Created{" "}
                                {new Date(group.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "analytics" ? (
              /* Analytics Tab Content */
              <div className="space-y-8">
                {/* Overview Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Training Volume Over Time */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">
                      Training Volume
                    </h3>
                    <div className="h-64 overflow-hidden">
                      {(() => {
                        const data = getGroupYardageData();
                        const allValues = Object.values(data.groupData).flatMap(
                          (g) => g.data
                        );
                        const maxValue = Math.max(...allValues);
                        const chartHeight = 200;

                        // Handle case where there's no data
                        if (
                          !data.dateLabels.length ||
                          maxValue <= 0 ||
                          !isFinite(maxValue)
                        ) {
                          return (
                            <div className="flex items-center justify-center h-full text-slate-400">
                              <div className="text-center">
                                <svg
                                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <p className="text-sm">
                                  No training data available
                                </p>
                                <p className="text-xs mt-1">
                                  Create some practices to see trends
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            className="relative"
                            style={{ height: chartHeight + 40 }}
                          >
                            <svg
                              width="100%"
                              height={chartHeight + 40}
                              className="overflow-visible"
                            >
                              {/* Grid lines */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                                <line
                                  key={ratio}
                                  x1="60"
                                  x2="100%"
                                  y1={chartHeight * (1 - ratio) + 20}
                                  y2={chartHeight * (1 - ratio) + 20}
                                  stroke="rgba(148, 163, 184, 0.2)"
                                  strokeDasharray="4 4"
                                />
                              ))}

                              {/* Y-axis labels */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                                <text
                                  key={ratio}
                                  x="50"
                                  y={chartHeight * (1 - ratio) + 25}
                                  fill="rgba(148, 163, 184, 0.8)"
                                  fontSize="12"
                                  textAnchor="end"
                                >
                                  {Math.round(
                                    maxValue * ratio
                                  ).toLocaleString()}
                                </text>
                              ))}

                              {/* Lines for each group */}
                              {Object.entries(data.groupData).map(
                                ([groupId, groupInfo]) => {
                                  // Filter out invalid data points
                                  const validData = groupInfo.data.filter(
                                    (value) => isFinite(value) && value >= 0
                                  );
                                  if (validData.length === 0) return null;

                                  const pathData = groupInfo.data
                                    .map((value, index) => {
                                      if (!isFinite(value) || value < 0)
                                        return null;
                                      const x =
                                        60 +
                                        (index /
                                          Math.max(
                                            data.dateLabels.length - 1,
                                            1
                                          )) *
                                          (100 - 60);
                                      const y =
                                        chartHeight * (1 - value / maxValue) +
                                        20;
                                      return `${
                                        index === 0 ? "M" : "L"
                                      } ${x} ${y}`;
                                    })
                                    .filter(Boolean)
                                    .join(" ");

                                  return (
                                    <g key={groupId}>
                                      <path
                                        d={pathData}
                                        fill="none"
                                        stroke={groupInfo.color}
                                        strokeWidth="3"
                                        className="drop-shadow-lg"
                                      />
                                      {/* Data points */}
                                      {groupInfo.data.map((value, index) => {
                                        if (!isFinite(value) || value < 0)
                                          return null;
                                        const x =
                                          60 +
                                          (index /
                                            Math.max(
                                              data.dateLabels.length - 1,
                                              1
                                            )) *
                                            (100 - 60);
                                        const y =
                                          chartHeight * (1 - value / maxValue) +
                                          20;
                                        return (
                                          <circle
                                            key={index}
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill={groupInfo.color}
                                            className="drop-shadow-md"
                                          />
                                        );
                                      })}
                                    </g>
                                  );
                                }
                              )}
                            </svg>

                            {/* Legend */}
                            <div className="absolute top-4 right-4 space-y-1">
                              {Object.entries(data.groupData).map(
                                ([groupId, groupInfo]) => (
                                  <div
                                    key={groupId}
                                    className="flex items-center space-x-2 text-sm"
                                  >
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor: groupInfo.color,
                                      }}
                                    />
                                    <span className="text-slate-300">
                                      {groupInfo.name}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Group Comparison */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">
                      Group Comparison
                    </h3>
                    <div className="h-64 overflow-hidden">
                      {(() => {
                        const data = groups.map((g, index) => {
                          const colors = [
                            "#8B5CF6",
                            "#EC4899",
                            "#6366F1",
                            "#3B82F6",
                            "#06B6D4",
                          ];
                          const { startDate, endDate } =
                            getAnalyticsDateRange();
                          return {
                            label: g.name,
                            value: getPracticesForGroup(g.id)
                              .filter((p) => {
                                const practiceDate = new Date(p.date);
                                return (
                                  practiceDate >= startDate &&
                                  practiceDate <= endDate
                                );
                              })
                              .reduce((sum, p) => sum + p.totalYardage, 0),
                            color: colors[index % colors.length],
                          };
                        });

                        const maxValue = Math.max(...data.map((d) => d.value));

                        // Handle case where there's no data
                        if (
                          data.length === 0 ||
                          maxValue <= 0 ||
                          !isFinite(maxValue)
                        ) {
                          return (
                            <div className="flex items-center justify-center h-full text-slate-400">
                              <div className="text-center">
                                <svg
                                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                                <p className="text-sm">
                                  No group data available
                                </p>
                                <p className="text-xs mt-1">
                                  Create groups and practices to compare
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4 h-full overflow-y-auto">
                            {data.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-4"
                              >
                                <div className="w-20 text-sm text-slate-300 font-medium truncate">
                                  {item.label}
                                </div>
                                <div className="flex-1 bg-slate-800/50 rounded-full h-8 relative overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                      width: `${
                                        maxValue > 0
                                          ? Math.max(
                                              (item.value / maxValue) * 100,
                                              0
                                            )
                                          : 0
                                      }%`,
                                      backgroundColor: item.color,
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center px-3 text-white text-sm font-medium">
                                    {item.value.toLocaleString()} yards
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Stroke Breakdown */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                  <h3 className="text-xl font-bold text-white mb-6">
                    Stroke Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(() => {
                      const strokeCounts = getStrokeBreakdown();
                      const totalStrokes = Object.values(strokeCounts).reduce(
                        (sum: number, count: number) => sum + count,
                        0
                      );
                      const colors = [
                        "text-blue-400",
                        "text-green-400",
                        "text-yellow-400",
                        "text-red-400",
                        "text-purple-400",
                        "text-pink-400",
                        "text-indigo-400",
                      ];

                      return Object.entries(strokeCounts).map(
                        ([strokeName, count], index) => {
                          const percentage =
                            totalStrokes > 0
                              ? Math.round((count / totalStrokes) * 100)
                              : 0;
                          return (
                            <div key={strokeName} className="text-center">
                              <div
                                className={`text-3xl font-bold mb-2 ${
                                  colors[index % colors.length]
                                }`}
                              >
                                {percentage}%
                              </div>
                              <div className="text-sm text-slate-400 mb-2">
                                {strokeName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {count} occurrences
                              </div>
                            </div>
                          );
                        }
                      );
                    })()}
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-center">
                    <div className="text-2xl font-bold text-orange-400 mb-2">
                      {(() => {
                        const { startDate, endDate } = getAnalyticsDateRange();
                        const relevantPractices = selectedAnalyticsGroup
                          ? getPracticesForGroup(selectedAnalyticsGroup).filter(
                              (p) => {
                                const practiceDate = new Date(p.date);
                                return (
                                  practiceDate >= startDate &&
                                  practiceDate <= endDate
                                );
                              }
                            )
                          : practices.filter((p) => {
                              const practiceDate = new Date(p.date);
                              return (
                                practiceDate >= startDate &&
                                practiceDate <= endDate
                              );
                            });
                        return relevantPractices.length;
                      })()}
                    </div>
                    <div className="text-sm text-slate-400">Total Sessions</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-center">
                    <div className="text-2xl font-bold text-red-400 mb-2">
                      {(() => {
                        const { startDate, endDate } = getAnalyticsDateRange();
                        const relevantPractices = selectedAnalyticsGroup
                          ? getPracticesForGroup(selectedAnalyticsGroup).filter(
                              (p) => {
                                const practiceDate = new Date(p.date);
                                return (
                                  practiceDate >= startDate &&
                                  practiceDate <= endDate
                                );
                              }
                            )
                          : practices.filter((p) => {
                              const practiceDate = new Date(p.date);
                              return (
                                practiceDate >= startDate &&
                                practiceDate <= endDate
                              );
                            });
                        const avgDifficulty =
                          relevantPractices.length > 0
                            ? relevantPractices.reduce(
                                (sum, p) => sum + (p.difficulty || 0),
                                0
                              ) / relevantPractices.length
                            : 0;
                        return Math.round(avgDifficulty);
                      })()}
                    </div>
                    <div className="text-sm text-slate-400">Avg Intensity</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-center">
                    <div className="text-2xl font-bold text-emerald-400 mb-2">
                      {(() => {
                        const { startDate, endDate } = getAnalyticsDateRange();
                        const relevantPractices = selectedAnalyticsGroup
                          ? getPracticesForGroup(selectedAnalyticsGroup).filter(
                              (p) => {
                                const practiceDate = new Date(p.date);
                                return (
                                  practiceDate >= startDate &&
                                  practiceDate <= endDate
                                );
                              }
                            )
                          : practices.filter((p) => {
                              const practiceDate = new Date(p.date);
                              return (
                                practiceDate >= startDate &&
                                practiceDate <= endDate
                              );
                            });
                        const avgYards =
                          relevantPractices.length > 0
                            ? Math.round(
                                relevantPractices.reduce(
                                  (sum, p) => sum + p.totalYardage,
                                  0
                                ) / relevantPractices.length
                              )
                            : 0;
                        return avgYards.toLocaleString();
                      })()}
                    </div>
                    <div className="text-sm text-slate-400">
                      Avg Yards/Session
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-2">
                      {(() => {
                        const { startDate, endDate } = getAnalyticsDateRange();
                        const relevantPractices = selectedAnalyticsGroup
                          ? getPracticesForGroup(selectedAnalyticsGroup).filter(
                              (p) => {
                                const practiceDate = new Date(p.date);
                                return (
                                  practiceDate >= startDate &&
                                  practiceDate <= endDate
                                );
                              }
                            )
                          : practices.filter((p) => {
                              const practiceDate = new Date(p.date);
                              return (
                                practiceDate >= startDate &&
                                practiceDate <= endDate
                              );
                            });
                        const avgTime =
                          relevantPractices.length > 0
                            ? Math.round(
                                relevantPractices.reduce(
                                  (sum, p) => sum + p.estimatedTime,
                                  0
                                ) / relevantPractices.length
                              )
                            : 0;
                        return formatTime(avgTime);
                      })()}
                    </div>
                    <div className="text-sm text-slate-400">Avg Duration</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Calendar Tab Content */
              <div>{renderCalendarView()}</div>
            )}
          </div>

          {/* Group Creation Modal */}
          {showGroupModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-2xl p-8 border border-white/20 max-w-md w-full mx-4">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Create New Group
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., Varsity Team, Masters Group, etc."
                      className="w-full px-4 py-3 bg-slate-900 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Number of Members
                    </label>
                    <input
                      type="number"
                      value={newGroupMemberCount}
                      onChange={(e) =>
                        setNewGroupMemberCount(parseInt(e.target.value) || 0)
                      }
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-3 bg-slate-900 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowGroupModal(false);
                      setNewGroupName("");
                      setNewGroupMemberCount(0);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createGroup}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium"
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
