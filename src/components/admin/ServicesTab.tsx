import { type ReactNode, useState } from 'react';
import { useConfirm, useToast } from '@/components/admin/AdminFeedback';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { AddonEditor } from '@/components/admin/AddonEditor';
import { Notice, PrimaryButton, SectionCard, errorMessage } from '@/components/admin/AdminPrimitives';
import { ServiceEditor } from '@/components/admin/ServiceEditor';
import { Modal } from '@/components/ui/Modal';
import { deleteAddon, deleteService } from '@/lib/api/admin';
import { formatDuration, formatMoney } from '@/lib/format';
import type { Addon, Service } from '@/lib/types';

interface ServicesTabProps {
  services: Service[];
  addons: Addon[];
  onChanged: () => void;
}

type EditTarget = { kind: 'service'; item: Service | null } | { kind: 'addon'; item: Addon | null };

function nextPositionOf(items: Array<{ position: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.position), 0) + 1;
}

function priceLine(usd: number, ghs: number | null): string {
  return `${formatMoney(usd, 'USD')}  /  ${ghs == null ? 'auto cedis' : formatMoney(ghs, 'GHS')}`;
}

export function ServicesTab({ services, addons, onChanged }: ServicesTabProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const remove = async (id: string, name: string, kind: 'service' | 'addon') => {
    const message =
      kind === 'service'
        ? `Remove "${name}" from the site? Past bookings keep their record.`
        : `Remove the add-on "${name}"?`;
    const ok = await confirm({
      title: kind === 'service' ? 'Remove this style?' : 'Remove this add-on?',
      message,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    setRemovingId(id);
    setActionError(null);
    try {
      if (kind === 'service') await deleteService(id);
      else await deleteAddon(id);
      notify(kind === 'service' ? 'Style removed' : 'Add-on removed');
      onChanged();
    } catch (err) {
      setActionError(errorMessage(err, 'This could not be removed. Please try again.'));
    } finally {
      setRemovingId(null);
    }
  };

  const closeEditor = () => setEditing(null);
  const finishEditor = () => {
    setEditing(null);
    onChanged();
  };

  return (
    <div className="space-y-6">
      {actionError && <Notice tone="error">{actionError}</Notice>}

      <SectionCard title="Hairstyles" description="Each style is a bookable service with its own photo, price and duration.">
        <div className="mb-6 flex justify-end">
          <PrimaryButton type="button" onClick={() => setEditing({ kind: 'service', item: null })}>
            <Plus className="mr-1 h-4 w-4" />
            Add a style
          </PrimaryButton>
        </div>
        {services.length === 0 ? (
          <EmptyState text="No styles yet. Add your first style to start taking bookings." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex gap-4 rounded-2xl border border-taupe-200 bg-cream-50 p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <Thumb src={service.image_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-espresso-900">{service.name}</p>
                      <p className="text-xs uppercase tracking-wider text-taupe-500">{service.category}</p>
                    </div>
                    {!service.is_active && (
                      <span className="shrink-0 rounded-full bg-taupe-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-taupe-700">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-espresso-800">{priceLine(service.price_usd, service.price_ghs)}</p>
                  <p className="mt-1 text-xs text-taupe-600">
                    {formatDuration(service.duration_minutes)} · {service.deposit_percent}% deposit
                  </p>
                  <div className="mt-3 flex gap-2">
                    <IconAction label={`Edit ${service.name}`} onClick={() => setEditing({ kind: 'service', item: service })}>
                      <Pencil className="h-4 w-4" />
                    </IconAction>
                    <IconAction
                      label={`Remove ${service.name}`}
                      danger
                      disabled={removingId === service.id}
                      onClick={() => void remove(service.id, service.name, 'service')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconAction>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Add-ons" description="Optional extras clients can add to any style.">
        <div className="mb-6 flex justify-end">
          <PrimaryButton type="button" onClick={() => setEditing({ kind: 'addon', item: null })}>
            <Plus className="mr-1 h-4 w-4" />
            Add an add-on
          </PrimaryButton>
        </div>
        {addons.length === 0 ? (
          <EmptyState text="No add-ons yet. Extras like hair wash or longer length appear here." />
        ) : (
          <ul className="divide-y divide-taupe-100">
            {addons.map((addon) => (
              <li key={addon.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-espresso-900">
                    {addon.name}
                    {!addon.is_active && <span className="ml-2 text-xs font-bold uppercase tracking-wider text-taupe-500">Hidden</span>}
                  </p>
                  <p className="mt-1 text-sm text-taupe-600">
                    {priceLine(addon.price_usd, addon.price_ghs)}
                    {addon.extra_minutes > 0 && ` · adds ${formatDuration(addon.extra_minutes)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <IconAction label={`Edit ${addon.name}`} onClick={() => setEditing({ kind: 'addon', item: addon })}>
                    <Pencil className="h-4 w-4" />
                  </IconAction>
                  <IconAction
                    label={`Remove ${addon.name}`}
                    danger
                    disabled={removingId === addon.id}
                    onClick={() => void remove(addon.id, addon.name, 'addon')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Modal open={editing !== null} onClose={closeEditor} label={editing?.kind === 'addon' ? 'Add-on editor' : 'Style editor'} size="lg">
        {editing?.kind === 'service' && (
          <ServiceEditor
            service={editing.item}
            nextPosition={nextPositionOf(services)}
            onClose={closeEditor}
            onSaved={finishEditor}
          />
        )}
        {editing?.kind === 'addon' && (
          <AddonEditor addon={editing.item} nextPosition={nextPositionOf(addons)} onClose={closeEditor} onSaved={finishEditor} />
        )}
      </Modal>
    </div>
  );
}

function Thumb({ src }: { src: string | null }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream-200">
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-taupe-400" />}
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
      className={`flex h-11 w-11 items-center justify-center rounded-full text-taupe-600 transition duration-300 disabled:opacity-50 ${
        danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-bronze-50 hover:text-bronze-700'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-taupe-300 px-6 py-10 text-center text-sm text-taupe-600">{text}</div>
  );
}
