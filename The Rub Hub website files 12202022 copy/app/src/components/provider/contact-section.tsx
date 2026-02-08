type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isPublic: boolean;
};

export function ContactSection({ contacts }: { contacts: Contact[] }) {
  const publicContacts = contacts.filter((c) => c.isPublic);
  if (publicContacts.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Contact</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {publicContacts.map((contact) => (
          <div
            key={contact.id}
            className="rounded-lg border border-zinc-200 p-4"
          >
            <p className="font-medium text-zinc-900">
              {contact.firstName} {contact.lastName}
            </p>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="mt-1 block text-sm text-blue-600 hover:underline"
              >
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="mt-1 block text-sm text-blue-600 hover:underline"
              >
                {contact.phone}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
