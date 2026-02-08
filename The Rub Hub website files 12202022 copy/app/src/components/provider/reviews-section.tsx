type Review = {
  id: number;
  content: string;
  status: string;
  createdAt: Date | string;
};

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const approved = reviews.filter((r) => r.status === "approved");
  if (approved.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">
        Reviews ({approved.length})
      </h2>
      <div className="mt-4 space-y-3">
        {approved.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border border-zinc-200 p-4"
          >
            <p className="text-sm text-zinc-700">{review.content}</p>
            <p className="mt-2 text-xs text-zinc-400">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
