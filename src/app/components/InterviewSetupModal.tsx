"use client";
import React, { useState } from "react";

interface InterviewSetupModalProps {
  onSubmit: (data: { mood: number; talentId: string; jobId: string }) => void;
  onCancel: () => void;
}

export default function InterviewSetupModal({ onSubmit, onCancel }: InterviewSetupModalProps) {
  const [mood, setMood] = useState<number>(1);
  const [talentId, setTalentId] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (talentId.trim() && jobId.trim()) {
      onSubmit({ mood, talentId: talentId.trim(), jobId: jobId.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Interview Setup</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
              Mood
            </label>
            <select
              id="mood"
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value={1}>Friendly</option>
              <option value={2}>Neutral</option>
              <option value={3}>Rude</option>
            </select>
          </div>

          <div>
            <label htmlFor="talentId" className="block text-sm font-medium text-gray-700 mb-2">
              Talent ID
            </label>
            <input
              id="talentId"
              type="text"
              value={talentId}
              onChange={(e) => setTalentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter talent ID"
              required
            />
          </div>

          <div>
            <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-2">
              Job ID
            </label>
            <input
              id="jobId"
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter job ID"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Start Interview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

