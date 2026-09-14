import { useEffect, useRef, useState, type DragEvent } from "react";
import { Camera, FolderUp, RefreshCw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { cn } from "@/lib/utils.ts";
import { resolveMediaUrl } from "@/lib/mediaUrl.ts";
import { toast } from "sonner";

const MAX_LICENSE_BYTES = 50 * 1024 * 1024;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function acceptImageFile(file: File | undefined | null): file is File {
  if (!file) return false;
  if (!file.type.startsWith("image/")) {
    toast.error("Please choose an image file");
    return false;
  }
  if (file.size > MAX_LICENSE_BYTES) {
    toast.error("License image must be 50MB or smaller");
    return false;
  }
  return true;
}

export function LicenseImageCapture({
  id,
  label = "License Image",
  previewUrl,
  onSelect,
  onClear,
  required = true,
}: {
  id: string;
  label?: string;
  previewUrl?: string;
  onSelect: (file: File) => void;
  onClear: () => void;
  required?: boolean;
}) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraFallbackRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  const closeCamera = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
    setCameraOpen(false);
  };

  useEffect(() => () => stopStream(streamRef.current), []);

  const handleFile = (file: File | undefined | null) => {
    if (!acceptImageFile(file)) return;
    onSelect(file);
    closeCamera();
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
    const files = Array.from(event.dataTransfer.files);
    const image = files.find((file) => file.type.startsWith("image/"));
    if (!image) {
      toast.error("Please drop an image file");
      return;
    }
    handleFile(image);
  };

  const dropHandlers = { onDragEnter, onDragOver, onDragLeave, onDrop };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraFallbackRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
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
      cameraFallbackRef.current?.click();
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error("Camera is not ready yet");
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
        handleFile(new File([blob], `license-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs" htmlFor={`${id}-upload`}>
        {label}
        {required ? " *" : ""}
      </Label>

      {cameraOpen ? (
        <div className="space-y-2 rounded-lg border border-border/50 bg-background/70 p-2">
          <video
            ref={videoRef}
            className="aspect-video w-full rounded-md bg-black object-cover"
            playsInline
            muted
            autoPlay
          />
          <div className="flex flex-wrap gap-2">
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
            <Button type="button" variant="outline" size="sm" className="h-8 cursor-pointer" onClick={closeCamera}>
              Cancel
            </Button>
          </div>
        </div>
      ) : previewUrl ? (
        <div
          className={cn("space-y-2 rounded-lg", isDragging && "bg-primary/5 ring-2 ring-primary/40")}
          {...dropHandlers}
        >
          <a href={resolveMediaUrl(previewUrl)} target="_blank" rel="noopener noreferrer" className="inline-block">
            <img
              src={resolveMediaUrl(previewUrl)}
              alt={`${label} preview`}
              className="h-20 w-28 rounded-md border border-border/40 bg-black object-contain"
            />
          </a>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 cursor-pointer" onClick={openCamera}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retake
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer"
              onClick={() => uploadRef.current?.click()}
            >
              <FolderUp className="h-3.5 w-3.5" />
              Reupload
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 cursor-pointer text-muted-foreground" onClick={onClear}>
              <X className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
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
              ? "Drop an image to upload"
              : "Upload a photo, drag one here, or capture the license with the camera"}
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
            <Button type="button" size="sm" className="h-8 cursor-pointer" onClick={openCamera}>
              <Camera className="h-3.5 w-3.5" />
              Capture via camera
            </Button>
          </div>
        </div>
      )}

      <input
        id={`${id}-upload`}
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={cameraFallbackRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
