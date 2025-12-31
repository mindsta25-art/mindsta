import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download,
  Settings,
  PlayCircle,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  enableDownload?: boolean;
}

export const VideoPlayer = ({ videoUrl, title, enableDownload = true }: VideoPlayerProps) => {
  const { toast } = useToast();
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState('720p');
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if the URL is a YouTube URL
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(ytRegex);
    
    if (match && match[1]) {
      setIsYouTube(true);
      setYoutubeId(match[1]);
    } else {
      setIsYouTube(false);
    }
  }, [videoUrl]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (playerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    }
  };

  const handleDownload = async () => {
    if (isYouTube && youtubeId) {
      // For YouTube videos, we'll provide download options
      toast({
        title: "Download Video",
        description: "Opening download options in a new tab...",
      });
      
      // Open a reliable YouTube downloader service
      window.open(`https://www.y2mate.com/youtube/${youtubeId}`, '_blank');
    } else {
      // For direct video files
      try {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Started",
          description: "Your video is being downloaded.",
        });
      } catch (error) {
        toast({
          title: "Download Failed",
          description: "Unable to download the video. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getYouTubeEmbedUrl = () => {
    if (!youtubeId) return '';
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1&controls=1&fs=1&enablejsapi=1`;
  };

  if (isYouTube && youtubeId) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div ref={playerRef} className="relative aspect-video w-full bg-black group">
            <iframe
              src={getYouTubeEmbedUrl()}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
              onLoad={() => setIsLoading(false)}
            />
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
            )}

            {/* Download Button Overlay */}
            {enableDownload && !isLoading && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2 bg-black/70 hover:bg-black/90 text-white border-white/20"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      window.open(`https://www.y2mate.com/youtube/${youtubeId}`, '_blank');
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Download with Y2Mate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      window.open(`https://ytmp3.nu/youtube-to-mp4/?v=${youtubeId}`, '_blank');
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Download with YTMP3
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      window.open(`https://ssyoutube.com/watch?v=${youtubeId}`, '_blank');
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Download with SSYouTube
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {/* Video Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <PlayCircle className="w-4 h-4" />
                <span>YouTube Video</span>
              </div>
              {enableDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Options
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For direct video files (MP4, WebM, etc.)
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div ref={playerRef} className="relative aspect-video w-full bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadStart={() => setIsLoading(true)}
            onLoadedData={() => setIsLoading(false)}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {/* Custom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              <div className="flex-1" />

              {enableDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20 gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setQuality('1080p')}>
                    1080p HD
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQuality('720p')}>
                    720p HD
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQuality('480p')}>
                    480p
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQuality('360p')}>
                    360p
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <PlayCircle className="w-4 h-4" />
              <span>Quality: {quality}</span>
            </div>
            {enableDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download Video
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
