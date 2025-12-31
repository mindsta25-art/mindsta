import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig, getWhatsAppUrl } from "@/config/siteConfig";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export const WhatsAppButton = ({ 
  phoneNumber, 
  message 
}: WhatsAppButtonProps) => {
  const handleWhatsAppClick = () => {
    const whatsappUrl = getWhatsAppUrl(phoneNumber, message);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (!siteConfig.features.enableWhatsApp) {
    return null;
  }

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#20BA5A] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 p-0"
      aria-label="Chat on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 text-white" />
    </Button>
  );
};
