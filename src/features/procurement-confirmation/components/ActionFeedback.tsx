import { Alert } from 'antd';
import type { ProcurementFeedbackEntry } from '../types';

export function ActionFeedback({ entry }: { entry: ProcurementFeedbackEntry | null }) {
  if (!entry) {
    return null;
  }

  return (
    <Alert
      data-testid="procurement-action-feedback"
      type={entry.tone}
      showIcon
      message={entry.title}
      description={entry.description}
    />
  );
}
