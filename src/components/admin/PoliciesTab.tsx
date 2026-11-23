import { useState, type ReactNode } from 'react';
import { useConfirm, useToast } from '@/components/admin/AdminFeedback';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Notice, PrimaryButton, SectionCard, errorMessage } from '@/components/admin/AdminPrimitives';
import { PolicyEditor } from '@/components/admin/PolicyEditor';
import { deletePolicy, reorderPolicies } from '@/lib/api/admin';
import type { Policy } from '@/lib/types';

interface PoliciesTabProps {
  policies: Policy[];
  ready: boolean;
  onChanged: () => void;
}

export function PoliciesTab({ policies, ready, onChanged }: PoliciesTabProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [editing, setEditing] = useState<Policy | 'new' | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextPosition = policies.reduce((max, p) => Math.max(max, p.position), 0) + 1;

  const remove = async (policy: Policy) => {
    const ok = await confirm({
      title: 'Delete this policy?',
      message: `"${policy.question}" will be removed for good. If you only want to stop showing it, hide it instead.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    setBusyId(policy.id);
    setError(null);
    try {
      await deletePolicy(policy.id);
      notify('Policy deleted');
      onChanged();
    } catch (err) {
      setError(errorMessage(err, 'This could not be deleted. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= policies.length) return;
    const next = [...policies];
    [next[index], next[target]] = [next[target], next[index]];
    setBusyId(policies[index].id);
    setError(null);
    try {
      await reorderPolicies(next);
      onChanged();
    } catch (err) {
      setError(errorMessage(err, 'The order could not be saved. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const closeEditor = () => setEditing(null);
  const finishEditor = () => {
    setEditing(null);
    onChanged();
  };

  if (!ready) {
    return (
      <SectionCard title="Policies and FAQs">
        <Notice tone="error">
          The policies table has not been created in your database yet. Run the file
          "20261113120000_add_editable_policies_and_page_text.sql" in the Supabase SQL Editor, then refresh this page.
        </Notice>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Notice tone="error">{error}</Notice>}

      <SectionCard
        title="Policies and FAQs"
        description="The questions and answers shown in the Policies section of your website. The first one opens by default."
      >
        <div className="mb-6 flex justify-end">
          <PrimaryButton type="button" onClick={() => setEditing('new')}>
            <Plus className="mr-1 h-4 w-4" />
            Add a policy
          </PrimaryButton>
        </div>

        {policies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-taupe-300 px-6 py-10 text-center text-sm text-taupe-600">
            No policies yet. The Policies section is hidden on your website until you add one.
          </div>
        ) : (
          <ul className="divide-y divide-taupe-100">
            {policies.map((policy, index) => (
              <li key={policy.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-espresso-900">
                    {policy.question}
                    {!policy.is_active && (
                      <span className="ml-2 text-xs font-bold uppercase tracking-wider text-taupe-500">Hidden</span>
                    )}
                  </p>
                  <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-taupe-600">{policy.answer}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconAction label={`Move "${policy.question}" up`} disabled={busyId !== null || index === 0} onClick={() => void move(index, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </IconAction>
                  <IconAction
                    label={`Move "${policy.question}" down`}
                    disabled={busyId !== null || index === policies.length - 1}
                    onClick={() => void move(index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </IconAction>
                  <IconAction label={`Edit "${policy.question}"`} onClick={() => setEditing(policy)}>
                    <Pencil className="h-4 w-4" />
                  </IconAction>
                  <IconAction label={`Delete "${policy.question}"`} danger disabled={busyId === policy.id} onClick={() => void remove(policy)}>
                    <Trash2 className="h-4 w-4" />
                  </IconAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Modal open={editing !== null} onClose={closeEditor} label="Policy editor" size="lg">
        {editing !== null && (
          <PolicyEditor
            policy={editing === 'new' ? null : editing}
            nextPosition={nextPosition}
            onClose={closeEditor}
            onSaved={finishEditor}
          />
        )}
      </Modal>
    </div>
  );
}

function IconAction({
  label,
  children,
  onClick,
  danger = false,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-taupe-600 transition duration-300 disabled:opacity-40 ${
        danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-bronze-50 hover:text-bronze-700'
      }`}
    >
      {children}
    </button>
  );
}
