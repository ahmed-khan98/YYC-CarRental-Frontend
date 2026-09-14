import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Camera, FolderUp, Upload, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { cn } from "@/lib/utils.ts";
import { mediaKindFromFile } from "@/lib/mediaUrl.ts";
import { toast } from "sonner";

export const MAX_CAR_IMAGES = 10;
export const MAX_CAR_VIDEOS = 2;
export const MAX_CAR_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_CAR_VIDEO_BYTES = 100 * 1024 * 1024;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function formatBytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

function formatRecordingDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type CameraMode = "photo" | "video";

type PreviewItem = {
  url: string;
  kind: "image" | "video";
};

export function CarMediaCapture({
  id,
  files,
  onChange,
}: {
  id: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const photoFallbackRef = useRef<HTMLInputElement>(null);
  const videoFallbackRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const filesRef = useRef(files);
  const [cameraMode, setCameraMode] = useState<CameraMode | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const dragDepthRef = useRef(0);

  filesRef.current = files;

  const imageCount = useMemo(
    () => files.filter((file) => mediaKindFromFile(file) === "image").length,
    [files],
  );
  const videoCount = useMemo(
    () => files.filter((file) => mediaKindFromFile(file) === "video").length,
    [files],
  );

  useEffect(() => {
    const next = files.map((file) => ({
      url: URL.createObjectURL(file),
      kind: mediaKindFromFile(file) ?? "image",
    }));
    setPreviews(next);
    return () => next.forEach((item) => URL.revokeObjectURL(item.url));
  }, [files]);

  const closeCamera = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.ondataavailable = null;
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setRecordingSeconds(0);
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
    setCameraMode(null);
  };

  useEffect(() => () => stopStream(streamRef.current), []);

  useEffect(() => {
    if (!recording) {
      setRecordingSeconds(0);
      return;
    }
    const startedAt = Date.now();
    setRecordingSeconds(0);
    const intervalId = window.setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [recording]);

  const addFiles = (incoming: File[]) => {
    const current = filesRef.current;
    const nextImages = current.filter((file) => mediaKindFromFile(file) === "image");
    const nextVideos = current.filter((file) => mediaKindFromFile(file) === "video");
    const added: File[] = [];
    const warnings: string[] = [];
    let skippedExtraPhotos = false;
    let skippedExtraVideos = false;

    for (const file of incoming) {
      const kind = mediaKindFromFile(file);
      if (kind === "image") {
        if (file.size > MAX_CAR_IMAGE_BYTES) {
          warnings.push(`${file.name || "Photo"} must be ${formatBytes(MAX_CAR_IMAGE_BYTES)} or smaller`);
          continue;
        }
        if (nextImages.length >= MAX_CAR_IMAGES) {
          skippedExtraPhotos = true;
          continue;
        }
        nextImages.push(file);
        added.push(file);
        continue;
      }
      if (kind === "video") {
        if (file.size > MAX_CAR_VIDEO_BYTES) {
          warnings.push(
            `${file.name || "Video"} must be ${formatBytes(MAX_CAR_VIDEO_BYTES)} or smaller. Compress it or pick a shorter clip.`,
          );
          continue;
        }
        if (nextVideos.length >= MAX_CAR_VIDEOS) {
          skippedExtraVideos = true;
          continue;
        }
        nextVideos.push(file);
        added.push(file);
        continue;
      }
      warnings.push(`${file.name || "File"} is not a photo or video`);
    }

    if (skippedExtraPhotos) warnings.push(`You can add up to ${MAX_CAR_IMAGES} photos`);
    if (skippedExtraVideos) warnings.push(`You can add up to ${MAX_CAR_VIDEOS} videos`);
    for (const warning of [...new Set(warnings)]) toast.error(warning);
    if (added.length > 0) {
      const next = [...current, ...added];
      filesRef.current = next;
      onChange(next);
    }
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  const resetDragState = () => {
    dragDepthRef.current = 0;
    setIsDragging(false);
  };

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) resetDragState();
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    resetDragState();
    addFiles(Array.from(event.dataTransfer.files));
  };

  const dropHandlers = { onDragEnter, onDragOver, onDragLeave, onDrop };

  const openCamera = async (mode: CameraMode) => {
    if (mode === "photo" && imageCount >= MAX_CAR_IMAGES) {
      toast.error(`You can add up to ${MAX_CAR_IMAGES} photos`);
      return;
    }
    if (mode === "video" && videoCount >= MAX_CAR_VIDEOS) {
      toast.error(`You can add up to ${MAX_CAR_VIDEOS} videos`);
      return;
    }
    if (mode === "video" && typeof MediaRecorder === "undefined") {
      videoFallbackRef.current?.click();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      if (mode === "photo") photoFallbackRef.current?.click();
      else videoFallbackRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === "video",
      });
      streamRef.current = stream;
      setCameraMode(mode);
      setCameraReady(false);
      requestAnimationFrame(async () => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        try {
          await video.play();
          setCameraReady(true);
        } catch {
          toast.error("Could not start the camera preview");
          closeCamera();
        }
      });
    } catch {
      if (mode === "photo") photoFallbackRef.current?.click();
      else videoFallbackRef.current?.click();
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error("Camera is not ready yet");
      return;
    }
    if (imageCount >= MAX_CAR_IMAGES) {
      toast.error(`You can add up to ${MAX_CAR_IMAGES} photos`);
      closeCamera();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      toast.error("Could not capture photo");
      return;
    }
    context.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Could not capture photo");
          return;
        }
        addFiles([new File([blob], `car-${Date.now()}.jpg`, { type: "image/jpeg" })]);
        const nextImageCount = filesRef.current.filter((file) => mediaKindFromFile(file) === "image").length;
        if (nextImageCount >= MAX_CAR_IMAGES) closeCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) {
      toast.error("Camera is not ready yet");
      return;
    }
    const mimeType = pickRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || "video/webm";
      const extension = type.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      recorderRef.current = null;
      setRecording(false);
      if (blob.size === 0) {
        toast.error("Could not record video");
        return;
      }
      if (blob.size > MAX_CAR_VIDEO_BYTES) {
        toast.error(`Video must be ${formatBytes(MAX_CAR_VIDEO_BYTES)} or smaller. Record a shorter clip.`);
        return;
      }
      addFiles([new File([blob], `car-${Date.now()}.${extension}`, { type })]);
      closeCamera();
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs" htmlFor={`${id}-upload`}>
        Car photos & videos (optional, up to {MAX_CAR_IMAGES} photos and {MAX_CAR_VIDEOS} videos)
      </Label>
      <p className="text-[11px] text-muted-foreground">
        Photos up to {formatBytes(MAX_CAR_IMAGE_BYTES)} each. Videos up to {formatBytes(MAX_CAR_VIDEO_BYTES)} each.
      </p>

      {cameraMode ? (
        <div className="space-y-2 rounded-lg border border-border/50 bg-background/70 p-2">
          <video
            ref={videoRef}
            className="aspect-video w-full rounded-md bg-black object-cover"
            playsInline
            muted
            autoPlay
          />
          <div className="flex flex-wrap items-center gap-2">
            {cameraMode === "photo" ? (
              <Button
                type="button"
                size="sm"
                className="h-8 cursor-pointer"
                disabled={!cameraReady}
                onClick={takePhoto}
              >
                <Camera className="h-3.5 w-3.5" />
                Take photo
              </Button>
            ) : recording ? (
              <Button type="button" size="sm" className="h-8 cursor-pointer" onClick={stopRecording}>
                <Video className="h-3.5 w-3.5" />
                Stop recording
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-8 cursor-pointer"
                disabled={!cameraReady}
                onClick={startRecording}
              >
                <Video className="h-3.5 w-3.5" />
                Start recording
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer"
              onClick={closeCamera}
              disabled={recording}
            >
              Cancel
            </Button>
            {recording ? (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-destructive"
                aria-live="polite"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden />
                {formatRecordingDuration(recordingSeconds)}
              </span>
            ) : null}
          </div>
          {cameraMode === "photo" && (
            <p className="text-[11px] text-muted-foreground">
              {imageCount}/{MAX_CAR_IMAGES} photos captured. Take another or cancel when done.
            </p>
          )}
        </div>
      ) : null}

      {previews.length > 0 ? (
        <div
          className={cn(
            "space-y-2 rounded-lg border border-dashed bg-background/50 p-3",
            isDragging ? "border-primary/60 bg-primary/5" : "border-border/60",
          )}
          {...dropHandlers}
        >
          <div className="grid grid-cols-3 gap-2">
            {previews.map((item, index) => (
              <div key={`${item.url}-${index}`} className="relative">
                {item.kind === "video" ? (
                  <video
                    src={item.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-14 w-20 rounded-md border border-border/40 bg-black object-contain"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={`Car media ${index + 1}`}
                    className="h-14 w-20 rounded-md border border-border/40 bg-black object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground hover:text-destructive cursor-pointer"
                  aria-label={`Remove ${item.kind}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {!cameraMode && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 cursor-pointer"
                onClick={() => uploadRef.current?.click()}
              >
                <FolderUp className="h-3.5 w-3.5" />
                Upload from device
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 cursor-pointer"
                onClick={() => openCamera("photo")}
                disabled={imageCount >= MAX_CAR_IMAGES}
              >
                <Camera className="h-3.5 w-3.5" />
                Capture via camera
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 cursor-pointer"
                onClick={() => openCamera("video")}
                disabled={videoCount >= MAX_CAR_VIDEOS}
              >
                <Video className="h-3.5 w-3.5" />
                Record / upload video
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 cursor-pointer text-muted-foreground"
                onClick={() => onChange([])}
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </Button>
            </div>
          )}
        </div>
      ) : !cameraMode ? (
        <div
          className={cn(
            "space-y-2 rounded-lg border border-dashed bg-background/50 p-3",
            isDragging ? "border-primary/60 bg-primary/5" : "border-border/60",
          )}
          {...dropHandlers}
        >
          <div className="flex items-center justify-center text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            {isDragging
              ? "Drop photos or videos to upload"
              : "Upload photos or video, drag files here, or capture with the camera"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer"
              onClick={() => uploadRef.current?.click()}
            >
              <FolderUp className="h-3.5 w-3.5" />
              Upload from device
            </Button>
            <Button type="button" size="sm" className="h-8 cursor-pointer" onClick={() => openCamera("photo")}>
              <Camera className="h-3.5 w-3.5" />
              Capture via camera
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer"
              onClick={() => openCamera("video")}
            >
              <Video className="h-3.5 w-3.5" />
              Record / upload video
            </Button>
          </div>
        </div>
      ) : null}

      <input
        id={`${id}-upload`}
        ref={uploadRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <input
        ref={photoFallbackRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <input
        ref={videoFallbackRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
    </div>
  );
}
