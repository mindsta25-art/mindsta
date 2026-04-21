import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download,
  Settings,
  PlayCircle,
  Loader2,
  RotateCcw,
  FastForward
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
  /** Optional lesson ID used to namespace localStorage resume position */
  lessonId?: string;
  enableDownload?: boolean;
  /** Seek to this position (seconds) on load — set from saved progress */
  startAt?: number;
  onDurationDetected?: (minutes: number) => void;
  /** Fires every ~5 seconds with current position in seconds */
  onTimeUpdate?: (seconds: number) => void;
  /** Fires at watch-percent milestones (10, 25, 50, 75, 90, 100) */
  onProgress?: (percent: number) => void;
  /** Fires when the video ends */
  onEnded?: () => void;
}

const POSITION_SAVE_INTERVAL = 5000; // ms
const LS_KEY = (id: string) => `mindsta_video_pos_${id}`;

export const VideoPlayer = ({
  videoUrl,
  title,
  lessonId,
  enableDownload = true,
  startAt,
  onDurationDetected,
  onTimeUpdate,
  onProgress,
  onEnded,
}: VideoPlayerProps) => {
  const { toast } = useToast();
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState('720p');
  const [isLoading, setIsLoading] = useState(true);
  const [watchPercent, setWatchPercent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const reportedMilestonesRef = useRef<Set<number>>(new Set());
  const lastSavedPositionRef = useRef<number>(0);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect YouTube vs native video
  useEffect(() => {
    const ytRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/?|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = videoUrl?.match(ytRegex);
    if (match && match[1]) {
      setIsYouTube(true);
      setYoutubeId(match[1]);
    } else {
      setIsYouTube(false);
      setYoutubeId(null);
    }
    // Reset tracking state when URL changes
    reportedMilestonesRef.current = new Set();
    lastSavedPositionRef.current = 0;
    setWatchPercent(0);
    setCurrentTime(0);
    setDuration(0);
  }, [videoUrl]);

  // YouTube IFrame API: detect duration + periodic position polling
  useEffect(() => {
    if (!isYouTube) return;

    let hasDurationFired = false;
    let ytDuration = 0;
    let ytCurrentTime = 0;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const dur =
          data?.info?.duration ||
          data?.info?.videoData?.lengthSeconds ||
          data?.info?.progressState?.duration;
        const ct = data?.info?.currentTime || data?.info?.progressState?.currentTime;

        if (dur && Number(dur) > 0) {
          ytDuration = Number(dur);
          if (!hasDurationFired) {
            hasDurationFired = true;
            setDuration(ytDuration);
            if (onDurationDetected) onDurationDetected(Math.ceil(ytDuration / 60));
          }
        }
        if (ct !== undefined && Number(ct) >= 0) {
          ytCurrentTime = Number(ct);
          setCurrentTime(ytCurrentTime);
          if (ytDuration > 0) {
            const pct = Math.floor((ytCurrentTime / ytDuration) * 100);
            updateWatchPercent(pct);
            if (onTimeUpdate) onTimeUpdate(ytCurrentTime);
          }
        }
      } catch {
        // ignore non-JSON
      }
    };

    window.addEventListener('message', handleMessage);

    const sendListening = () => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: 1 }),
        '*'
      );
    };
    const initTimer = setTimeout(sendListening, 1500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(initTimer);
    };
  }, [isYouTube, youtubeId, onDurationDetected, onTimeUpdate]);

  // Save position to localStorage every POSITION_SAVE_INTERVAL ms
  useEffect(() => {
    if (!lessonId) return;
    saveTimerRef.current = setInterval(() => {
      const pos = videoRef.current?.currentTime ?? currentTime;
      if (pos > 0 && Math.abs(pos - lastSavedPositionRef.current) > 2) {
        lastSavedPositionRef.current = pos;
        localStorage.setItem(LS_KEY(lessonId), String(Math.floor(pos)));
      }
    }, POSITION_SAVE_INTERVAL);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [lessonId, currentTime]);

  const updateWatchPercent = useCallback((pct: number) => {
    setWatchPercent(pct);
    const milestones = [10, 25, 50, 75, 90, 100];
    for (const m of milestones) {
      if (pct >= m && !reportedMilestonesRef.current.has(m)) {
        reportedMilestonesRef.current.add(m);
        if (onProgress) onProgress(m);
      }
    }
  }, [onProgress]);

  const handleNativeTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const ct = v.currentTime;
    const dur = v.duration;
    setCurrentTime(ct);
    const pct = Math.floor((ct / dur) * 100);
    updateWatchPercent(pct);
    if (onTimeUpdate) onTimeUpdate(ct);
  }, [onTimeUpdate, updateWatchPercent]);

  const handleNativeLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const dur = v.duration;
    setDuration(dur);
    if (!isNaN(dur) && dur > 0 && onDurationDetected) {
      onDurationDetected(Math.max(1, Math.ceil(dur / 60)));
    }
    // Restore saved position
    const resumePos = startAt ?? (lessonId ? Number(localStorage.getItem(LS_KEY(lessonId)) || '0') : 0);
    if (resumePos > 5) {
      v.currentTime = resumePos;
    }
  }, [startAt, lessonId, onDurationDetected]);

  const handleNativeEnded = useCallback(() => {
    if (lessonId) localStorage.removeItem(LS_KEY(lessonId));
    updateWatchPercent(100);
    if (onEnded) onEnded();
  }, [lessonId, onEnded, updateWatchPercent]);

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
  };

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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * duration;
  };

  const handleDownload = async () => {
    if (isYouTube && youtubeId) {
      toast({ title: "Download Video", description: "Opening download options in a new tab..." });
      window.open(`https://www.y2mate.com/youtube/${youtubeId}`, '_blank');
    } else {
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
        toast({ title: "Download Started", description: "Your video is being downloaded." });
      } catch {
        toast({ title: "Download Failed", description: "Unable to download the video. Please try again.", variant: "destructive" });
      }
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getYouTubeEmbedUrl = () => {
    if (!youtubeId) return '';
    const startParam = startAt && startAt > 5 ? `&start=${Math.floor(startAt)}` : '';
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1&controls=1&fs=1&enablejsapi=1${startParam}`;
  };

  if (isYouTube && youtubeId) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div ref={playerRef} className="relative aspect-video w-full bg-black group">
            <iframe
              ref={iframeRef}
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
            {/* Download overlay */}
            {enableDownload && !isLoading && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="gap-2 bg-black/70 hover:bg-black/90 text-white border-white/20">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(`https://www.y2mate.com/youtube/${youtubeId}`, '_blank')}>
                      <Download className="w-4 h-4 mr-2" />Download with Y2Mate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`https://ytmp3.nu/youtube-to-mp4/?v=${youtubeId}`, '_blank')}>
                      <Download className="w-4 h-4 mr-2" />Download with YTMP3
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`https://ssyoutube.com/watch?v=${youtubeId}`, '_blank')}>
                      <Download className="w-4 h-4 mr-2" />Download with SSYouTube
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Watch progress bar */}
          {watchPercent > 0 && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Watch progress</span>
                <span>{watchPercent}% watched</span>
              </div>
              <Progress value={watchPercent} className="h-1.5" />
            </div>
          )}


        </CardContent>
      </Card>
    );
  }

  // Native video player (MP4, WebM, etc.)
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div ref={playerRef} className="relative aspect-video w-full bg-black group">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadStart={() => setIsLoading(true)}
            onLoadedData={() => setIsLoading(false)}
            onLoadedMetadata={handleNativeLoadedMetadata}
            onTimeUpdate={handleNativeTimeUpdate}
            onEnded={handleNativeEnded}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {/* Progress/seek bar */}
          {duration > 0 && (
            <div
              className="absolute bottom-14 left-0 right-0 px-4 cursor-pointer group/seek"
              onClick={handleSeek}
            >
              <div className="h-1 group-hover/seek:h-2 bg-white/30 rounded-full transition-all relative">
                <div
                  className="h-full bg-primary rounded-full relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/seek:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePlayPause} className="text-white hover:bg-white/20 p-1.5 h-auto">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }} className="text-white hover:bg-white/20 p-1.5 h-auto">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }} className="text-white hover:bg-white/20 p-1.5 h-auto">
                <FastForward className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleMuteToggle} className="text-white hover:bg-white/20 p-1.5 h-auto">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <span className="text-white text-xs tabular-nums ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div className="flex-1" />

              {/* Playback speed */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 text-xs font-medium px-2 h-auto">
                    {playbackRate}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
                    <DropdownMenuItem key={r} onClick={() => handlePlaybackRateChange(r)}>
                      {r === 1 ? 'Normal' : `${r}x`} {playbackRate === r ? '✓' : ''}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quality */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-1.5 h-auto">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {['1080p', '720p', '480p', '360p'].map((q) => (
                    <DropdownMenuItem key={q} onClick={() => setQuality(q)}>
                      {q} {quality === q ? '✓' : ''}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {enableDownload && (
                <Button variant="ghost" size="sm" onClick={handleDownload} className="text-white hover:bg-white/20 p-1.5 h-auto">
                  <Download className="w-4 h-4" />
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={handleFullscreen} className="text-white hover:bg-white/20 p-1.5 h-auto">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Watch progress bar */}
        {watchPercent > 0 && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Watch progress</span>
              <span>{watchPercent}% watched</span>
            </div>
            <Progress value={watchPercent} className="h-1.5" />
          </div>
        )}

        <div className="p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <PlayCircle className="w-4 h-4" />
              <span>Quality: {quality}</span>
            </div>
            {enableDownload && (
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />Download Video
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};