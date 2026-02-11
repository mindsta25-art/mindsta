import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Facebook, Twitter, Linkedin, Mail, MessageCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareCourseDialogProps {
  course: {
    subject: string;
    grade: string;
    term: string;
    price: number;
    description: string;
  };
  trigger?: React.ReactNode;
}

export const ShareCourseDialog = ({ course, trigger }: ShareCourseDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate shareable URL
  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      subject: course.subject,
      grade: course.grade,
      term: course.term
    });
    return `${baseUrl}/browse?${params.toString()}`;
  };

  const shareUrl = generateShareUrl();
  const shareText = `Check out ${course.subject} for Grade ${course.grade} on Mindsta! ${course.description.substring(0, 100)}...`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your friends",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out ${course.subject} on Mindsta`);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${course.subject} - Mindsta`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this course</DialogTitle>
          <DialogDescription>
            Share {course.subject} with friends and family
          </DialogDescription>
        </DialogHeader>

        {/* Copy Link Section */}
        <div className="space-y-3">
          <Label htmlFor="share-url">Course Link</Label>
          <div className="flex items-center gap-2">
            <Input
              id="share-url"
              value={shareUrl}
              readOnly
              className="flex-1"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Social Media Buttons */}
        <div className="space-y-3">
          <Label>Share via</Label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-3"
              onClick={shareViaWhatsApp}
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-3"
              onClick={shareViaFacebook}
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="text-xs">Facebook</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-3"
              onClick={shareViaTwitter}
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              <span className="text-xs">Twitter</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-3"
              onClick={shareViaLinkedIn}
            >
              <Linkedin className="w-5 h-5 text-blue-700" />
              <span className="text-xs">LinkedIn</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-3"
              onClick={shareViaEmail}
            >
              <Mail className="w-5 h-5 text-gray-600" />
              <span className="text-xs">Email</span>
            </Button>

            {navigator.share && (
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-auto py-3"
                onClick={handleNativeShare}
              >
                <Share2 className="w-5 h-5 text-purple-600" />
                <span className="text-xs">More</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
