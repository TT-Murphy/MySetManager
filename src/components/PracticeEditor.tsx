"use client";

import React, { useState, useEffect } from "react";
import {
  parseSwimSet,
  formatSwimSet,
  calculateTotalYardage,
  calculateEstimatedTime,
} from "../lib/parseSwimSet";
import { ParsedSwimSet, Group, SavedPractice } from "../types/swimSet";
import jsPDF from "jspdf";
import { useAuth } from "./AuthContext";

interface PracticeEditorProps {
  onBackToDashboard?: () => void;
  existingPractice?: SavedPractice | null;
}

const PracticeEditor: React.FC<PracticeEditorProps> = ({
  onBackToDashboard,
  existingPractice,
}) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [parsedSet, setParsedSet] = useState<ParsedSwimSet | null>(null);
  const [formattedText, setFormattedText] = useState("");
  const [totalYardage, setTotalYardage] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [practiceDate, setPracticeDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [practiceTitle, setPracticeTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentPracticeId, setCurrentPracticeId] = useState<string | null>(
    null
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Example practice text for demonstration
  const exampleText = `Warm up
4x100 Free easy 2:00
4x50 Back easy 1:15

Kick set
10x50 kick choice on 1:00
4x25 fly 25 left arm 25 right arm

Main set 
3x
4x50 Free fast 1:00
2x100 IM moderate 2:30
1 min rest

Sprint set
8x25 free sprint to 15m 0:30

Cool down
200 Free easy
100 choice easy`;

  // Load existing practice if provided
  useEffect(() => {
    if (existingPractice) {
      setInputText(existingPractice.content);
      setPracticeTitle(existingPractice.title);
      setPracticeDate(existingPractice.date);
      setCurrentPracticeId(existingPractice.id);
      setSelectedGroupId(existingPractice.groupId || null);
    }
    loadGroups();
  }, [existingPractice]);

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
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  };

  useEffect(() => {
    if (inputText.trim()) {
      const parsed = parseSwimSet(inputText);
      setParsedSet(parsed);
      setFormattedText(formatSwimSet(parsed));
      setTotalYardage(calculateTotalYardage(parsed));
      setEstimatedTime(calculateEstimatedTime(parsed));
      setDifficulty(parsed.difficulty);
    } else {
      setParsedSet(null);
      setFormattedText("");
      setTotalYardage(0);
      setEstimatedTime(0);
      setDifficulty(0);
    }
  }, [inputText]);

  const handleExampleLoad = () => {
    setInputText(exampleText);
  };

  const handleClear = () => {
    setInputText("");
    setPracticeTitle("");
    setCurrentPracticeId(null);
    setSelectedGroupId(null);
  };

  const handleSave = async () => {
    if (!user) {
      alert("You must be logged in to save practices");
      return;
    }

    if (!practiceTitle.trim()) {
      alert("Please enter a practice title");
      return;
    }

    if (!inputText.trim()) {
      alert("Please enter practice content");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = currentPracticeId
        ? `/api/practices/${currentPracticeId}`
        : "/api/practices";
      const method = currentPracticeId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: practiceTitle,
          date: practiceDate,
          content: inputText,
          totalYardage,
          estimatedTime,
          difficulty,
          groupId: selectedGroupId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!currentPracticeId) {
          setCurrentPracticeId(data.practice.id);
        }
        alert(
          `Practice ${currentPracticeId ? "updated" : "saved"} successfully!`
        );
      } else {
        const errorData = await response.json();
        alert(`Failed to save practice: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save practice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportToPDF = () => {
    if (!formattedText) return;

    const doc = new jsPDF();
    const formattedDate = new Date(practiceDate).toLocaleDateString();

    // Date section at the top
    doc.setFontSize(12);
    doc.text(`Date: ${formattedDate}`, 20, 20);

    // Add practice content
    doc.setFontSize(9);
    const lines = formattedText.split("\n");
    let yPosition = 35;

    for (const line of lines) {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 5;
    }

    // Bottom right totals
    const bottomY = 280;
    doc.setFontSize(10);
    doc.text(`Total: ${totalYardage} yards`, 200, bottomY - 25, {
      align: "right",
    });
    doc.text(`Duration: ${formatTime(estimatedTime)}`, 200, bottomY - 15, {
      align: "right",
    });
    doc.text(`Difficulty: ${difficulty}/100`, 200, bottomY - 5, {
      align: "right",
    });

    // Generate filename with group name
    const groupName = selectedGroupId
      ? groups.find((g) => g.id === selectedGroupId)?.name || "ungrouped"
      : "ungrouped";
    const safeGroupName = groupName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const filename = `${safeGroupName}_practice_${practiceDate}.pdf`;
    doc.save(filename);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-600 bg-clip-text text-transparent mb-4">
              MySetManager
            </h1>
            <p className="text-xl text-slate-300 font-light tracking-wide">
              Transform your swim practice notes into professional formatted
              sets
            </p>
          </div>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-6 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>

        {/* Practice Title */}
        {user && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-400 font-medium block mb-2">
                  Practice Title *
                </label>
                <input
                  type="text"
                  value={practiceTitle}
                  onChange={(e) => setPracticeTitle(e.target.value)}
                  placeholder="Enter practice title..."
                  className="w-full bg-slate-800/50 backdrop-blur border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSave}
                  disabled={
                    isSaving || !practiceTitle.trim() || !inputText.trim()
                  }
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  <span>
                    {isSaving
                      ? "Saving..."
                      : currentPracticeId
                      ? "Update Practice"
                      : "Save Practice"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-8 flex flex-wrap justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">
              {totalYardage}
            </div>
            <div className="text-sm text-slate-400 font-medium">
              Total Yards
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">
              {formatTime(estimatedTime)}
            </div>
            <div className="text-sm text-slate-400 font-medium">
              Estimated Time
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {difficulty}
            </div>
            <div className="text-sm text-slate-400 font-medium">Difficulty</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {parsedSet?.sets?.length || 0}
            </div>
            <div className="text-sm text-slate-400 font-medium">Sets</div>
          </div>
          <div className="text-center">
            <div className="mb-2">
              <label className="text-sm text-slate-400 font-medium block mb-1">
                Practice Date
              </label>
              <input
                type="date"
                value={practiceDate}
                onChange={(e) => setPracticeDate(e.target.value)}
                className="bg-slate-800/50 backdrop-blur border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50"
              />
            </div>
          </div>
          <div className="text-center">
            <div className="mb-2">
              <label className="text-sm text-slate-400 font-medium block mb-1">
                Assign to Group
              </label>
              <select
                value={selectedGroupId || ""}
                onChange={(e) => setSelectedGroupId(e.target.value || null)}
                className="bg-slate-800/50 backdrop-blur border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 min-w-[150px]"
              >
                <option value="">Ungrouped</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Practice Input</h2>
              <div className="space-x-3">
                <button
                  onClick={handleExampleLoad}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-cyan-500/25"
                >
                  Load Example
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-white/10 backdrop-blur text-white text-sm rounded-xl hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your swim practice here...

Example formats:
Warm up
4x100 Free easy 2:00
4x50 Back easy 1:15

Kick set
10x50 kick choice on 1:00

Main set
3x
4x50 Free fast 1:00
2x100 IM moderate 2:30
1 min rest

Cool down  
200 Free easy

Tips:
- Use empty lines to separate sets
- Comments appear where you write them
- Use '3x' to indicate set multipliers
- Distance formats: '200', '4x50'
- Strokes: Free, Back, Breast, Fly, IM, Drill, Kick
- Intervals: '2:50', 'on 1:30', '@1:00'
- Rest: '1 min rest', 'Rest 2:00'"
              className="w-full h-96 p-4 bg-slate-800/50 backdrop-blur border border-white/20 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 font-mono text-sm text-white placeholder-slate-400 transition-all duration-200"
            />

            <div className="mt-6 p-4 bg-slate-800/30 rounded-xl text-sm text-slate-300 border border-white/10">
              <strong className="text-cyan-400">Supported formats:</strong>
              <ul className="list-disc list-inside mt-3 space-y-2 leading-relaxed">
                <li>
                  <strong>Empty lines</strong> separate sets automatically
                </li>
                <li>
                  <strong>Inline comments</strong> appear where you write them
                </li>
                <li>Set multipliers: "3x", "2 rounds"</li>
                <li>Smart stroke parsing: "kick choice" → "Kick (Choice)"</li>
                <li>Intervals: "on 1:30", "@1:00", "1:30"</li>
                <li>
                  Strokes: Free, Back, Breast, Fly, IM, Drill, Kick, Choice
                </li>
                <li>Pace: fast, easy, moderate, build, descend</li>
                <li>Rest periods: "1 min rest", "Rest 2:00"</li>
              </ul>
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Formatted Practice
              </h2>
              {formattedText && (
                <button
                  onClick={exportToPDF}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center space-x-3 font-medium shadow-lg hover:shadow-emerald-500/25"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 4v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                    <path d="M6 6h8v2H6V6zm0 4h8v2H6v-2z" />
                  </svg>
                  <span>Export PDF</span>
                </button>
              )}
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-white/20 p-6 h-96 overflow-y-auto">
              {formattedText ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-100 leading-relaxed">
                  {formattedText}
                </pre>
              ) : (
                <div className="text-slate-400 italic text-center py-20 font-light text-lg">
                  Enter practice text to see formatted output...
                </div>
              )}
            </div>

            {parsedSet && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-slate-500/20 backdrop-blur rounded-xl text-sm border border-blue-400/20">
                <strong className="text-cyan-400 text-base">
                  Practice Summary:
                </strong>
                <div className="grid grid-cols-2 gap-6 mt-3 text-slate-200">
                  <div>
                    Total Yardage:{" "}
                    <span className="font-bold text-cyan-400">
                      {totalYardage} yards
                    </span>
                  </div>
                  <div>
                    Estimated Duration:{" "}
                    <span className="font-bold text-emerald-400">
                      {formatTime(estimatedTime)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions Panel */}
        <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            How to Use MySetManager
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="font-bold text-cyan-400 mb-3 text-lg">
                Input Format
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Type your practice using natural language. Don't worry about
                perfect formatting!
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="font-bold text-blue-400 mb-3 text-lg">
                Live Preview
              </h4>
              <p className="text-slate-300 leading-relaxed">
                See your practice formatted in real-time as you type in the
                input box.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="font-bold text-emerald-400 mb-3 text-lg">
                Auto Calculate
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Automatic yardage and time calculations help you plan practice
                duration.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h4 className="font-bold text-slate-400 mb-3 text-lg">
                Export PDF
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Save your formatted practice as a professional PDF for printing
                or sharing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeEditor;
