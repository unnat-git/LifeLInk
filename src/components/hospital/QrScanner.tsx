import { RefObject } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface QrScannerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
  isFetching?: boolean;
}

export function QrScanner({ videoRef, isScanning, isFetching }: QrScannerProps) {
  return (
    <div className="relative w-full aspect-[4/3] max-w-md mx-auto bg-black rounded-xl overflow-hidden shadow-inner border border-border">
      {/* Video element for camera feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Scanning overlays */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Darken edges slightly */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Clear center area */}
          <div className="relative w-3/4 aspect-square max-w-[250px]">
            {/* Cutout (simulate clear center) */}
            <div className="absolute inset-0 border-2 border-primary/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-lg" />
            
            {/* Animated scanning line */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.5)] z-10"
              animate={{
                y: ["0%", "100%", "0%"]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm animate-pulse">
              Scanning...
            </span>
          </div>
        </div>
      )}

      {/* Idle state overlay */}
      {!isScanning && !isFetching && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <p className="text-muted-foreground text-sm font-medium">Camera is inactive</p>
        </div>
      )}

      {/* Fetching state overlay */}
      {isFetching && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-foreground font-medium animate-pulse">Fetching Patient Data...</p>
        </div>
      )}
    </div>
  );
}
