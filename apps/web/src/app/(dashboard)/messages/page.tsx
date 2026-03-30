export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your conversations
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No conversations yet. Connect with someone from the Network page.</p>
      </div>
    </div>
  );
}
