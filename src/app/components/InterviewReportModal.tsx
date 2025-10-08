"use client";
import React from "react";

interface InterviewReport {
  summary: string;
  excitement: number;
  rapport: number;
  notes: string[];
  rbrGroup: string;
  englishProficiency: number;
  communication: number;
  confidence: number;
  insights: string[];
}

interface InterviewReportModalProps {
  isLoading: boolean;
  report: InterviewReport | null;
  error: string | null;
  onStartNew: () => void;
  onClose: () => void;
}

const englishLevelMap: { [key: number]: string } = {
  0: "Beginner",
  1: "Proficient",
  2: "Expert",
  3: "Native",
};

export default function InterviewReportModal({
  isLoading,
  report,
  error,
  onStartNew,
  onClose,
}: InterviewReportModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Generating Report
            </h2>
            <p className="text-gray-600">Please wait while we analyze the interview...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-16">
            <div className="text-red-500 text-5xl mb-6">⚠</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-8 text-center">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Close
            </button>
          </div>
        ) : report ? (
          <>
            <div className="p-8 overflow-y-auto flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Interview Report
              </h2>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Summary</h3>
                <p className="text-gray-600 leading-relaxed">{report.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">
                    Excitement
                  </h4>
                  <div className="text-3xl font-bold text-blue-600">
                    {report.excitement}/10
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Rapport</h4>
                  <div className="text-3xl font-bold text-green-600">
                    {report.rapport}/10
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">
                    Communication
                  </h4>
                  <div className="text-3xl font-bold text-purple-600">
                    {report.communication}/10
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">
                    Confidence
                  </h4>
                  <div className="text-3xl font-bold text-orange-600">
                    {report.confidence}/10
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    English Proficiency
                  </h4>
                  <div className="text-lg font-semibold text-gray-800">
                    {englishLevelMap[report.englishProficiency] || "Unknown"}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    RBR Group
                  </h4>
                  <div className="text-lg font-semibold text-gray-800">
                    {report.rbrGroup}
                  </div>
                </div>
              </div>

              {report.notes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Key Notes
                  </h3>
                  <ul className="space-y-2">
                    {report.notes.map((note, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2 mt-1">•</span>
                        <span className="text-gray-700">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.insights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Insights
                  </h3>
                  <ul className="space-y-2">
                    {report.insights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2 mt-1">✓</span>
                        <span className="text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={onStartNew}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Start New Interview
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

