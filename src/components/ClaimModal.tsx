import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { createClaim } from '@/lib/items';
import { errorTextClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '@/lib/styles';

const MIN_PROOF_LENGTH = 10;
const MAX_PROOF_LENGTH = 1000;

interface ClaimModalProps {
  itemId: string;
  itemTitle: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ClaimModal({ itemId, itemTitle, onClose, onSubmitted }: ClaimModalProps) {
  const [proof, setProof] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmedProof = proof.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmedProof.length < MIN_PROOF_LENGTH) {
      setError(`Please describe your proof in at least ${MIN_PROOF_LENGTH} characters.`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await createClaim(itemId, trimmedProof);
      onSubmitted();
    } catch {
      setError("We couldn't submit your claim. You may have already sent one for this item.");
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Claim this item" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Share proof that <span className="font-medium text-stone-900 dark:text-stone-100">{itemTitle}</span> is
          yours or that you found it. Describe details only the owner would know, such as contents, scratches,
          or serial digits. Do not post full sensitive numbers.
        </p>

        <div>
          <label htmlFor="claim-proof" className={labelClass}>Proof of ownership</label>
          <textarea
            id="claim-proof"
            rows={5}
            value={proof}
            maxLength={MAX_PROOF_LENGTH}
            onChange={(e) => setProof(e.target.value)}
            placeholder="e.g. Inside the card slot there is a library card with my initials, and the zipper pull has a red tag."
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1.5 text-right text-xs text-stone-500 dark:text-stone-400">
            {proof.length}/{MAX_PROOF_LENGTH}
          </p>
        </div>

        {error && (
          <p role="alert" className={`${errorTextClass} animate-scale-in`}>
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Submitting...' : 'Submit claim'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
