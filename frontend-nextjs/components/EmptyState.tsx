"use client";

const EmptyState = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-100">
      <div className="text-center px-4 py-10 sm:px-6 lg:px-8">
        <h3 className="mt-2 text-2xl font-semibold text-gray-900">
          Select a chat or start a new conversation
        </h3>
        <p className="mt-2 text-gray-500">
          Choose from your existing conversations or start a new one to begin messaging.
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
