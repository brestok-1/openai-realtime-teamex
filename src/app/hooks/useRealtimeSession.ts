import { useCallback, useRef, useState, useEffect } from 'react';
import {
  RealtimeSession,
  RealtimeAgent,
  OpenAIRealtimeWebRTC,
} from '@openai/agents/realtime';

import { useEvent } from '../contexts/EventContext';
import { useHandleSessionHistory } from './useHandleSessionHistory';
import { SessionStatus } from '../types';
import { AudioConfig } from '../api';

export interface RealtimeSessionCallbacks {
  onConnectionChange?: (status: SessionStatus) => void;
}

export interface ConnectOptions {
  getEphemeralKey: () => Promise<string>;
  audioElement?: HTMLAudioElement;
  tools?: any[];
  audioConfig?: AudioConfig;
}

export function useRealtimeSession(callbacks: RealtimeSessionCallbacks = {}) {
  const sessionRef = useRef<RealtimeSession | null>(null);
  const [status, setStatus] = useState<
    SessionStatus
  >('DISCONNECTED');
  const { logClientEvent } = useEvent();

  const updateStatus = useCallback(
    (s: SessionStatus) => {
      setStatus(s);
      callbacks.onConnectionChange?.(s);
      logClientEvent({}, s);
    },
    [callbacks],
  );

  const { logServerEvent } = useEvent();

  const historyHandlers = useHandleSessionHistory().current;

  function handleTransportEvent(event: any) {
    // Handle additional server events that aren't managed by the session
    switch (event.type) {
      case "conversation.item.input_audio_transcription.completed": {
        historyHandlers.handleTranscriptionCompleted(event);
        break;
      }
      case "response.audio_transcript.done": {
        historyHandlers.handleTranscriptionCompleted(event);
        break;
      }
      case "response.audio_transcript.delta": {
        historyHandlers.handleTranscriptionDelta(event);
        break;
      }
      default: {
        logServerEvent(event);
        break;
      } 
    }
  }


  useEffect(() => {
    if (sessionRef.current) {
      sessionRef.current.on("error", (...args: any[]) => {
        logServerEvent({
          type: "error",
          message: args[0],
        });
      });

      sessionRef.current.on("history_updated", historyHandlers.handleHistoryUpdated);
      sessionRef.current.on("history_added", historyHandlers.handleHistoryAdded);
      sessionRef.current.on("transport_event", handleTransportEvent);
    }
  }, [sessionRef.current]);

  const connect = useCallback(
    async ({
      getEphemeralKey,
      audioElement,
      tools = [],
      audioConfig,
    }: ConnectOptions) => {
      if (sessionRef.current) return;

      updateStatus('CONNECTING');

      const ek = await getEphemeralKey();

      const agent = new RealtimeAgent({
        name: 'agent',
        tools,
      });

      const sessionConfig: any = {
        transport: new OpenAIRealtimeWebRTC({
          audioElement,
        }),
      };

      if (audioConfig) {
        sessionConfig.config = {
          audio: audioConfig,
        };
      }

      sessionRef.current = new RealtimeSession(agent, sessionConfig);

      await sessionRef.current.connect({ apiKey: ek });
      updateStatus('CONNECTED');
    },
    [callbacks, updateStatus],
  );

  const disconnect = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    updateStatus('DISCONNECTED');
  }, [updateStatus]);

  const assertconnected = () => {
    if (!sessionRef.current) throw new Error('RealtimeSession not connected');
  };

  /* ----------------------- message helpers ------------------------- */

  const interrupt = useCallback(() => {
    sessionRef.current?.interrupt();
  }, []);
  
  const sendUserText = useCallback((text: string) => {
    assertconnected();
    sessionRef.current!.sendMessage(text);
  }, []);

  const sendEvent = useCallback((ev: any) => {
    sessionRef.current?.transport.sendEvent(ev);
  }, []);

  const mute = useCallback((m: boolean) => {
    sessionRef.current?.mute(m);
  }, []);

  return {
    status,
    connect,
    disconnect,
    sendUserText,
    sendEvent,
    mute,
    interrupt,
  } as const;
}
