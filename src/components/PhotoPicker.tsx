import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';

interface PhotoPickerProps {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

export default function PhotoPicker({ file, onChange, disabled = false }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (candidate: File | undefined) => {
    if (candidate) onChange(candidate);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) handleFile(event.dataTransfer.files[0]);
  };

  if (previewUrl) {
    return (
      <div className="animate-scale-in relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
        <img src={previewUrl} alt="Selected item preview" className="max-h-72 w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Remove photo"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-stone-950/70 text-white backdrop-blur transition hover:bg-stone-950 disabled:opacity-60"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition duration-200 ${
        dragging
          ? 'border-teal-700 bg-teal-50 dark:border-teal-400 dark:bg-teal-400/10'
          : 'border-stone-300 bg-stone-50 hover:border-teal-700 hover:bg-teal-50/60 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-teal-400 dark:hover:bg-teal-400/5'
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-900 dark:bg-teal-400/15 dark:text-teal-300">
        <ImagePlus className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-stone-800 dark:text-stone-200">Add a photo</p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Drop an image here or click to browse. JPG, PNG, or WebP up to 5 MB.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
