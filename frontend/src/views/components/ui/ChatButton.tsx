import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button.js'; // Import dari folder yang sama
import api from '../../../services/api/axios.js';
import { useAuth } from '../../../context/AuthContext.js';

interface ChatButtonProps {
  storeId: number;
  className?: string;
}

const ChatButton: React.FC<ChatButtonProps> = ({ storeId, className }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleChatClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah klik tembus jika tombol ada dalam card
    e.preventDefault();  // Mencegah link default jika dibungkus <a>

    if (!user) {
      alert("Silakan login untuk chat penjual");
      navigate('/login');
      return;
    }

    // Redirect ke ChatPage dengan init_store_id parameter
    // ChatPage akan handle initiate call
    navigate(`/chat?init_store_id=${storeId}`);
  };

  return (
    <Button 
      onClick={handleChatClick} 
      disabled={loading}
      className={`flex items-center gap-2 ${className}`}
      variant="ghost"
      size="sm"
    >
      <img 
        src="/assets/icons/message-circle.svg" 
        alt="Chat" 
        className="w-[18px] h-[18px] opacity-70" 
      />
      {loading ? '...' : 'Chat Penjual'}
    </Button>
  );
};

export default ChatButton;