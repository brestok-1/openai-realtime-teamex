"use client";
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import Image from "next/image";

import Transcript from "./components/Transcript";
import BottomToolbar from "./components/BottomToolbar";
import InterviewSetupModal from "./components/InterviewSetupModal";
import InterviewReportModal from "./components/InterviewReportModal";

import { SessionStatus } from "@/app/types";

import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRealtimeSession } from "./hooks/useRealtimeSession";

import useAudioDownload from "./hooks/useAudioDownload";
import { useHandleSessionHistory } from "./hooks/useHandleSessionHistory";
import { sessionService, EphemeralSessionData, InterviewReport } from "./api";
import { buildToolsFromBackend } from "./utils";

function App() { 

  const {
    addTranscriptMessage,
    transcriptItems,
    clearTranscript,
  } = useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  // Attach SDK audio element once it exists (after first render in browser)
  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

  const {
    connect,
    disconnect,
    sendUserText,
    sendEvent,
    interrupt,
    mute,
  } = useRealtimeSession({
    onConnectionChange: (s) => setSessionStatus(s as SessionStatus),
  });

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [userText, setUserText] = useState<string>("");
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(
    () => {
      if (typeof window === 'undefined') return true;
      const stored = localStorage.getItem('audioPlaybackEnabled');
      return stored ? stored === 'true' : true;
    },
  );

  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [interviewSetupData, setInterviewSetupData] = useState<{ mood: number; talentId: string; jobId: string } | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [interviewReport, setInterviewReport] = useState<InterviewReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Initialize the recording hook.
  const { startRecording, stopRecording, downloadRecording } =
    useAudioDownload();

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    try {
      sendEvent(eventObj);
      logClientEvent(eventObj, eventNameSuffix);
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }
  };

  useHandleSessionHistory();


  const fetchSessionData = async (setupData: { mood: number; talentId: string; jobId: string }): Promise<EphemeralSessionData | null> => {
    try {
      logClientEvent({ url: "/api/interview/initialize", body: setupData }, "fetch_session_token_request");
      
      const data = await sessionService.fetchEphemeralSession(setupData);
      
      logServerEvent(data, "fetch_session_token_response");
      
      return data;
    } catch (error) {
      logClientEvent({ error: error instanceof Error ? error.message : 'Unknown error' }, "error.fetch_session_failed");
      console.error("Failed to fetch session data:", error);
      setSessionStatus("DISCONNECTED");
      return null;
    }
  };

  const connectToRealtime = async (setupData: { mood: number; talentId: string; jobId: string }) => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      const data = await fetchSessionData(setupData);
      if (!data) return;

      const tools = buildToolsFromBackend(data.tools);

      await connect({
        getEphemeralKey: async () => data.ephemeralToken,
        audioElement: sdkAudioElement,
        tools,
        audioConfig: data.audioConfig,
      });

      updateSession(true);
    } catch (err) {
      console.error("Error connecting via SDK:", err);
      setSessionStatus("DISCONNECTED");
    }
  };

  const disconnectFromRealtime = async () => {
    disconnect();
    setSessionStatus("DISCONNECTED");

    if (!interviewSetupData) {
      console.warn("No interview setup data available");
      return;
    }

    setShowReportModal(true);
    setIsGeneratingReport(true);
    setReportError(null);
    setInterviewReport(null);

    try {
      const messages = transcriptItems
        .filter(item => item.type === "MESSAGE" && item.role && item.title && !item.isHidden)
        .map(item => ({
          role: item.role === "user" ? 1 : 2,
          content: item.title || "",
        }));

      const reportData = await sessionService.generateReport({
        talentId: interviewSetupData.talentId,
        jobId: interviewSetupData.jobId,
        transcription: messages,
      });

      if (reportData.successful && reportData.data) {
        setInterviewReport(reportData.data);
      } else {
        setReportError(reportData.error?.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setReportError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent({
      type: 'conversation.item.create',
      item: {
        id,
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    sendClientEvent({ type: 'response.create' }, '(simulated user text message)');
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    if (shouldTriggerResponse) {
      sendSimulatedUserMessage('hi');
    }
    return;
  }

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    interrupt();

    try {
      sendUserText(userText.trim());
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }

    setUserText("");
  };

  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      setShowSetupModal(true);
    }
  };

  const handleSetupSubmit = (data: { mood: number; talentId: string; jobId: string }) => {
    setInterviewSetupData(data);
    setShowSetupModal(false);
    connectToRealtime(data);
  };

  const handleSetupCancel = () => {
    setShowSetupModal(false);
  };

  const handleReportClose = () => {
    setShowReportModal(false);
    setInterviewReport(null);
    setReportError(null);
    clearTranscript();
    setInterviewSetupData(null);
  };

  const handleStartNewInterview = () => {
    setShowReportModal(false);
    setInterviewReport(null);
    setReportError(null);
    clearTranscript();
    setInterviewSetupData(null);
    setShowSetupModal(true);
  };


  useEffect(() => {
    localStorage.setItem(
      "audioPlaybackEnabled",
      isAudioPlaybackEnabled.toString()
    );
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.muted = false;
        audioElementRef.current.play().catch((err) => {
          console.warn("Autoplay may be blocked by browser:", err);
        });
      } else {
        // Mute and pause to avoid brief audio blips before pause takes effect.
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
      }
    }

    // Toggle server-side audio stream mute so bandwidth is saved when the
    // user disables playback. 
    try {
      mute(!isAudioPlaybackEnabled);
    } catch (err) {
      console.warn('Failed to toggle SDK mute', err);
    }
  }, [isAudioPlaybackEnabled]);

  // Ensure mute state is propagated to transport right after we connect or
  // whenever the SDK client reference becomes available.
  useEffect(() => {
    if (sessionStatus === 'CONNECTED') {
      try {
        mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn('mute sync after connect failed', err);
      }
    }
  }, [sessionStatus, isAudioPlaybackEnabled]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }

    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  return (
    <div className="text-base flex flex-col h-screen bg-gray-100 text-gray-800 relative">
      {showSetupModal && (
        <InterviewSetupModal
          onSubmit={handleSetupSubmit}
          onCancel={handleSetupCancel}
        />
      )}

      {showReportModal && (
        <InterviewReportModal
          isLoading={isGeneratingReport}
          report={interviewReport}
          error={reportError}
          onStartNew={handleStartNewInterview}
          onClose={handleReportClose}
        />
      )}

      <div className="p-5 text-lg font-semibold flex justify-between items-center">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <div>
            <Image
              src="/openai-logomark.svg"
              alt="OpenAI Logo"
              width={20}
              height={20}
              className="mr-2"
            />
          </div>
          <div>
            Realtime API <span className="text-gray-500">Agents</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-2 px-2 overflow-hidden relative">
        <Transcript
          userText={userText}
          setUserText={setUserText}
          onSendMessage={handleSendTextMessage}
          downloadRecording={downloadRecording}
          canSend={
            sessionStatus === "CONNECTED"
          }
        />
      </div>

      <BottomToolbar
        sessionStatus={sessionStatus}
        onToggleConnection={onToggleConnection}
        isAudioPlaybackEnabled={isAudioPlaybackEnabled}
        setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
      />
    </div>
  );
}

export default App;
