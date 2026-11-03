import ItemForm from '@/components/ItemForm';
import { cardClass } from '@/lib/styles';

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wider text-teal-700 dark:text-teal-400">New report</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Report an item</h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          The more detail you share, the easier it is for the right person to recognise their belongings.
        </p>
      </div>
      <div className={`${cardClass} p-6 sm:p-8`}>
        <ItemForm />
      </div>
    </div>
  );
}
