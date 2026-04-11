import React, { useRef, useCallback, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import PhotoCameraOutlined from "@mui/icons-material/PhotoCameraOutlined";
import ZoomIn from "@mui/icons-material/ZoomIn";
import ZoomOut from "@mui/icons-material/ZoomOut";

const MAX_BYTES = 5 * 1024 * 1024;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

async function getCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("unsupported");
  }
  const attempts = [
    { video: { facingMode: "user" }, audio: false },
    { video: { facingMode: { ideal: "user" } }, audio: false },
    { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: true, audio: false },
  ];
  let lastErr;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("getUserMedia failed");
}

/**
 * @param {{ onPhotoReady: (p: { dataUrl: string, file?: File }) => void, onError?: (msg: string) => void, sx?: object }} props
 */
export function FotoPerfilPicker({ onPhotoReady, onError, sx }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const galleryRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraOpenRef = useRef(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) {
      v.srcObject = null;
      v.onloadedmetadata = null;
    }
  }, []);

  const attachCamera = useCallback(async () => {
    const waitVideo = (retries = 12) =>
      new Promise((resolve) => {
        const step = (n) => {
          const el = videoRef.current;
          if (el) {
            resolve(el);
            return;
          }
          if (n <= 0) {
            resolve(null);
            return;
          }
          requestAnimationFrame(() => step(n - 1));
        };
        step(retries);
      });

    const video = await waitVideo();
    if (!video) {
      onError?.("Não foi possível preparar a prévia da câmera.");
      cameraOpenRef.current = false;
      setCameraOpen(false);
      return;
    }

    try {
      stopStream();
      const stream = await getCameraStream();
      if (!cameraOpenRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");

      const play = () =>
        video.play().catch(() => {
          /* autoplay policies: tentar de novo após gesto do usuário já ocorreu ao abrir o modal */
        });

      if (video.readyState >= 2) {
        await play();
      } else {
        video.onloadedmetadata = () => {
          void play();
        };
      }
    } catch {
      onError?.(
        "Não foi possível acessar a câmera. Permita o uso no navegador, use HTTPS (ou localhost) e verifique se nenhum outro app está usando a câmera.",
      );
      cameraOpenRef.current = false;
      setCameraOpen(false);
    }
  }, [onError, stopStream, setCameraOpen]);

  const attachCameraRef = useRef(attachCamera);
  attachCameraRef.current = attachCamera;

  const handleGalleryChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      onError?.("Imagem deve ter no máximo 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onPhotoReady?.({ dataUrl: reader.result, file });
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCamera = useCallback(() => {
    setZoom(ZOOM_MIN);
    cameraOpenRef.current = true;
    setCameraOpen(true);
  }, []);

  const handleCloseCamera = useCallback(() => {
    cameraOpenRef.current = false;
    setZoom(ZOOM_MIN);
    stopStream();
    setCameraOpen(false);
  }, [stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth) {
      onError?.("Aguarde a câmera carregar ou tente fechar e abrir de novo.");
      return;
    }

    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropW = vw / z;
    const cropH = vh / z;
    const sx = (vw - cropW) / 2;
    const sy = (vh - cropH) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, vw, vh);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (blob.size > MAX_BYTES) {
          onError?.("Foto muito grande. Tente outra posição ou iluminação.");
          return;
        }
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        onPhotoReady?.({ dataUrl, file });
        cameraOpenRef.current = false;
        setZoom(ZOOM_MIN);
        stopStream();
        setCameraOpen(false);
      },
      "image/jpeg",
      0.92,
    );
  }, [onPhotoReady, onError, stopStream, zoom]);

  return (
    <Box sx={sx}>
      <input
        ref={galleryRef}
        accept="image/*"
        style={{ display: "none" }}
        type="file"
        onChange={handleGalleryChange}
      />
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
        <Button
          type="button"
          size="small"
          variant="outlined"
          startIcon={<PhotoLibraryOutlined />}
          onClick={() => galleryRef.current?.click()}
          sx={{ textTransform: "none", fontSize: "13px" }}
        >
          Arquivo
        </Button>
        <Button
          type="button"
          size="small"
          variant="outlined"
          startIcon={<PhotoCameraOutlined />}
          onClick={handleOpenCamera}
          sx={{ textTransform: "none", fontSize: "13px" }}
        >
          Tirar foto
        </Button>
      </Stack>

      <Dialog
        open={cameraOpen}
        onClose={handleCloseCamera}
        maxWidth="sm"
        fullWidth
        TransitionProps={{
          onEntered: () => {
            void attachCameraRef.current();
          },
          onExited: () => {
            stopStream();
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Capturar foto</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box
            sx={{
              width: "100%",
              minHeight: 240,
              maxHeight: "60vh",
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "common.black",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                minHeight: 240,
                maxHeight: "60vh",
                display: "block",
                objectFit: "contain",
                transform: `translateZ(0) scale(${zoom})`,
                transformOrigin: "center center",
                backgroundColor: "#000",
              }}
            />
          </Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ mt: 1.5 }}
          >
            <Tooltip title="Afastar">
              <span>
                <IconButton
                  type="button"
                  size="small"
                  color="primary"
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() => setZoom((prev) => Math.max(ZOOM_MIN, Math.round((prev - ZOOM_STEP) * 100) / 100))}
                  aria-label="Afastar zoom"
                >
                  <ZoomOut />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 52, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <Tooltip title="Aproximar">
              <span>
                <IconButton
                  type="button"
                  size="small"
                  color="primary"
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() => setZoom((prev) => Math.min(ZOOM_MAX, Math.round((prev + ZOOM_STEP) * 100) / 100))}
                  aria-label="Aproximar zoom"
                >
                  <ZoomIn />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button type="button" onClick={handleCloseCamera} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button type="button" variant="contained" onClick={handleCapture} sx={{ textTransform: "none" }}>
            Usar esta foto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
