import MedicineChatbot from '@/components/medicine-chatbot';

export const metadata = {
  title: 'Medicine Chatbot - MediCheck',
  description: 'Get information about common medicines',
};

export default function ChatbotPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <MedicineChatbot />
      </div>
    </div>
  );
}
