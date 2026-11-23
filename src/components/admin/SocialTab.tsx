import { useState, type ReactNode } from 'react';
import { useConfirm, useToast } from '@/components/admin/AdminFeedback';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SocialIcon } from '@/components/ui/SocialIcon';
import { Notice, PrimaryButton, SectionCard, errorMessage } from '@/components/admin/AdminPrimitives';
import { SocialEditor } from '@/components/admin/SocialEditor';
import { deleteSocial, reorderSocials } from '@/lib/api/admin';
import { socialHandleText, socialName, socialUrl } from '@/lib/social';
import type { SocialLink } from '@/lib/types';

interface SocialTabProps {
  socials: SocialLink[];
  ready: boolean;
  onChanged: () => void;
}

export function SocialTab({ socials, ready, onChanged }: SocialTabProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [editing, setEditing] = useState<SocialLink | 'new' | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextPosition = socials.reduce((max, s) => Math.max(max, s.position), 0) + 1;

  const remove = async (link: SocialLink) => {
    const ok = await confirm({
      title: 'Remove this account?',
      message: `${[socialName(link), socialHandleText(link)].filter(Boolean).join(' ')} will no longer appear on your website.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    setBusyId(link.id);
    setError(null);
    try {
      await deleteSocial(link.id);
      notify('Account removed');
      onChanged();
    } catch (err) {
      setError(errorMessage(err, 'This could not be removed. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= socials.length) return;
    const next = [...socials];
    [next[index], next[target]] = [next[target], next[index]];
    setBusyId(socials[index].id);
    setError(null);
    try {
      await reorderSocials(next);
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
      <SectionCard title="Social media">
        <Notice tone="error">
          The social media table has not been created in your database yet. Run the file
          "20261123150000_add_social_links.sql" in the Supabase SQL Editor, then refresh this page.
        </Notice>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Notice tone="error">{error}</Notice>}

      <SectionCard
        title="Social media"
        description="Accounts shown in the footer of your website. Add as many as you like, and remove any you no longer use."
      >
        <div className="mb-6 flex justify-end">
          <PrimaryButton type="button" onClick={() => setEditing('new')}>
            <Plus className="mr-1 h-4 w-4" />
            Add an account
          </PrimaryButton>
        </div>

        {socials.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-taupe-300 px-6 py-10 text-center text-sm text-taupe-600">
            No social media accounts yet. Add your Instagram, TikTok or any other page and it will appear in the footer.
          </div>
        ) : (
          <ul className="divide-y divide-taupe-100">
            {socials.map((link, index) => {
              const href = socialUrl(link);
              const handleText = socialHandleText(link);
              return (
                <li key={link.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-espresso-800 text-bronze-300">
                      <SocialIcon platform={link.platform} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-espresso-900">
                        {socialName(link)}
                        {handleText && <span className="ml-2 font-normal text-taupe-600">{handleText}</span>}
                      </p>
                      <p className="truncate text-sm text-taupe-600">
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer noopener" className="hover:text-bronze-700 hover:underline">
                            {href}
                          </a>
                        ) : (
                          'This link is not valid. Edit it to fix it.'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconAction label={`Move ${socialName(link)} up`} disabled={busyId !== null || index === 0} onClick={() => void move(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </IconAction>
                    <IconAction
                      label={`Move ${socialName(link)} down`}
                      disabled={busyId !== null || index === socials.length - 1}
                      onClick={() => void move(index, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </IconAction>
                    <IconAction label={`Edit ${socialName(link)}`} onClick={() => setEditing(link)}>
                      <Pencil className="h-4 w-4" />
                    </IconAction>
                    <IconAction label={`Remove ${socialName(link)}`} danger disabled={busyId === link.id} onClick={() => void remove(link)}>
                      <Trash2 className="h-4 w-4" />
                    </IconAction>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <Modal open={editing !== null} onClose={closeEditor} label="Social media account editor" size="lg">
        {editing !== null && (
          <SocialEditor link={editing === 'new' ? null : editing} nextPosition={nextPosition} onClose={closeEditor} onSaved={finishEditor} />
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
