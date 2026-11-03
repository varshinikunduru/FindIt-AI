import { useState, type FormEvent } from 'react';
import { Loader2, PackageMinus, PackagePlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createItem, removeItemPhoto, uploadItemPhoto } from '@/lib/items';
import { navigateTo } from '@/lib/navigation';
import { CATEGORIES, CATEGORY_LABELS, type Category, type ItemKind } from '@/lib/types';
import { errorTextClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '@/lib/styles';
import PhotoPicker from '@/components/PhotoPicker';

function todayLocal(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

const KIND_OPTIONS: { value: ItemKind; title: string; description: string; Icon: typeof PackageMinus }[] = [
  { value: 'lost', title: 'I lost something', description: 'Post it so people can find you.', Icon: PackageMinus },
  { value: 'found', title: 'I found something', description: 'Help someone get it back.', Icon: PackagePlus },
];

export default function ItemForm() {
  const { user } = useAuth();
  const [kind, setKind] = useState<ItemKind>('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [color, setColor] = useState('');
  const [locationText, setLocationText] = useState('');
  const [occurredOn, setOccurredOn] = useState(todayLocal);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): string | null => {
    if (!title.trim()) return 'Give your item a short title.';
    if (!category) return 'Choose a category.';
    if (!locationText.trim()) return 'Tell us where the item was lost or found.';
    if (!occurredOn || occurredOn > todayLocal()) return 'The date cannot be in the future.';
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!category) return;

    setError(null);
    setSubmitting(true);

    let imagePath: string | null = null;
    if (file) {
      try {
        imagePath = await uploadItemPhoto(user.id, file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'The photo could not be uploaded.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const itemId = await createItem({
        kind,
        title: title.trim(),
        description: description.trim(),
        category,
        color: color.trim(),
        location_text: locationText.trim(),
        occurred_on: occurredOn,
        image_path: imagePath,
      });
      navigateTo(`/items/${itemId}`);
    } catch {
      if (imagePath) await removeItemPhoto(imagePath).catch(() => undefined);
      setError("We couldn't save your report. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <fieldset>
        <legend className={labelClass}>What happened?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {KIND_OPTIONS.map(({ value, title: optionTitle, description: optionDescription, Icon }) => {
            const active = kind === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                aria-pressed={active}
                className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition duration-200 ${
                  active
                    ? 'border-teal-700 bg-teal-50 ring-4 ring-teal-700/10 dark:border-teal-400 dark:bg-teal-400/10 dark:ring-teal-400/10'
                    : 'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-teal-700 text-white dark:bg-teal-400 dark:text-stone-950'
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-bold">{optionTitle}</span>
                  <span className="mt-0.5 block text-sm text-stone-600 dark:text-stone-400">{optionDescription}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="item-title" className={labelClass}>Title</label>
          <input
            id="item-title"
            type="text"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Black leather wallet with a blue card"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="item-category" className={labelClass}>Category</label>
          <select
            id="item-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | '')}
            className={inputClass}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="item-color" className={labelClass}>Main color</label>
          <input
            id="item-color"
            type="text"
            value={color}
            maxLength={40}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g. Black"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="item-location" className={labelClass}>Where was it {kind === 'lost' ? 'lost' : 'found'}?</label>
          <input
            id="item-location"
            type="text"
            value={locationText}
            maxLength={200}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="e.g. Central Station, platform 4"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="item-date" className={labelClass}>Date {kind === 'lost' ? 'lost' : 'found'}</label>
          <input
            id="item-date"
            type="date"
            value={occurredOn}
            max={todayLocal()}
            onChange={(e) => setOccurredOn(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="item-description" className={labelClass}>Description</label>
          <textarea
            id="item-description"
            rows={4}
            value={description}
            maxLength={2000}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Distinguishing marks, contents, condition. Avoid sharing sensitive details publicly."
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>Photo (optional)</span>
        <PhotoPicker file={file} onChange={setFile} disabled={submitting} />
      </div>

      {error && (
        <p role="alert" className={`${errorTextClass} animate-scale-in`}>
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:justify-end dark:border-stone-800">
        <a href="#/" className={secondaryButtonClass}>
          Cancel
        </a>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Publishing...' : 'Publish report'}
        </button>
      </div>
    </form>
  );
}
