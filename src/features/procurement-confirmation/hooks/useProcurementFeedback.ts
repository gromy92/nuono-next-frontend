import { useCallback, useState } from 'react';
import { message } from 'antd';
import { createTimestamp } from '../domain';
import { createMockFeedbackEntries } from '../mockData';
import type { FeedbackTone, ProcurementFeedbackEntry } from '../types';

export function useProcurementFeedback() {
  const [feedbackEntries, setFeedbackEntries] = useState<ProcurementFeedbackEntry[]>(() => createMockFeedbackEntries());
  const [latestFeedback, setLatestFeedback] = useState<ProcurementFeedbackEntry | null>(null);

  const appendFeedback = useCallback((tone: FeedbackTone, title: string, description: string) => {
    const createdAt = createTimestamp();
    const entry: ProcurementFeedbackEntry = {
      id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
      tone,
      title,
      description,
      createdAt
    };
    setLatestFeedback(entry);
    setFeedbackEntries((currentValue) => [entry, ...currentValue].slice(0, 18));
    if (tone === 'success') {
      message.success(title);
      return;
    }
    if (tone === 'warning') {
      message.warning(title);
      return;
    }
    if (tone === 'error') {
      message.error(title);
      return;
    }
    message.info(title);
  }, []);

  return {
    appendFeedback,
    feedbackEntries,
    latestFeedback
  };
}
