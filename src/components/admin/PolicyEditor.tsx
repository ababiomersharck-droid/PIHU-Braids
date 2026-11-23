import { useState, type FormEvent } from 'react';
import { Notice, PrimaryButton, SecondaryButton, TextField, Toggle, errorMessage } from '@/components/admin/AdminPrimitives';
import { savePolicy } from '@/lib/api/admin';
import type { Policy } from '@/lib/types';

interface PolicyEditorProps {
  policy: Policy | null;
  nextPosition: number;
  onClose: () => void;
  onSaved: () => void;
}

export function PolicyEditor({ policy, nextPosition, onClose, onSaved }: PolicyEditorProps) {
  const [question, setQuestion] = useState(policy?.question ?? '');
  const [answer, setAnswer] = useState(policy?.answer ?? '');
  const [isActive, setIsActive] = useState(policy?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Write the question or title first, for example "What is your cancellation policy?"');
      return;
    }
    if (!answer.trim()) {
      setError('Write the answer so clients know what to expect.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await savePolicy(
        { question: question.trim(), answer: answer.trim(), is_active: isActive, position: policy?.position ?? nextPosition },
        policy?.id ?? null,
      );
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'This could not be saved. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
      <div>
        <h3 className="pr-12 text-3xl">{policy ? 'Edit policy' : 'Add a policy'}</h3>
        <p className="mt-2 text-sm text-taupe-600">Shown in the Policies section of the website as soon as you save.</p>
      </div>

      <TextField
        label="Question or title"
        value={question}
        onChange={(v) => {
          setError(null);
          setQuestion(v);
        }}
        placeholder="What is your cancellation policy?"
      />
      <TextField
        label="Answer"
        multiline
        value={answer}
        onChange={(v) => {
          setError(null);
          setAnswer(v);
        }}
        hint="Press Enter for a new line. Line breaks are kept on the website."
      />

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream-100 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-espresso-900">Show on the website</p>
          <p className="text-xs text-taupe-600">Turn off to hide it without deleting it.</p>
        </div>
        <Toggle label="Show on the website" checked={isActive} onChange={setIsActive} />
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton busy={busy}>Save policy</PrimaryButton>
      </div>
    </form>
  );
}
