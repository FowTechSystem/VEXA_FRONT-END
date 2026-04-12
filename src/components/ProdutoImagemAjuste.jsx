import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { Box, Slider, Button, Typography, Stack, Tooltip } from "@mui/material";
import ZoomIn from "@mui/icons-material/ZoomIn";
import ZoomOut from "@mui/icons-material/ZoomOut";
import CropFree from "@mui/icons-material/CropFree";

const VIEW = 280;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.05;
const EXPORT_SIZE = 800;
const JPEG_QUALITY = 0.92;
const MAX_BYTES = 5 * 1024 * 1024;

function clampPan(pan, minP, maxP) {
  if (minP > maxP) return 0;
  return Math.max(minP, Math.min(maxP, pan));
}

/**
 * Pré-visualização quadrada com zoom + arraste; exporta o que aparece na moldura.
 * @param {{ src: string, onAdjusted: (p: { dataUrl: string, file: File }) => void, onError?: (msg: string) => void, sx?: object }} props
 */
export function ProdutoImagemAjuste({ src, onAdjusted, onError, sx }) {
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const imgRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  useEffect(() => {
    setZoom(ZOOM_MIN);
    setPanX(0);
    setPanY(0);
    setNatural({ w: 0, h: 0 });
  }, [src]);

  const onImgLoad = useCallback((e) => {
    const el = e.target;
    setNatural({ w: el.naturalWidth, h: el.naturalHeight });
  }, []);

  const { w: W, h: H } = natural;
  const k = W > 0 && H > 0 ? zoom * Math.max(VIEW / W, VIEW / H) : 1;
  const dispW = W * k;
  const dispH = H * k;
  const minPanX = W > 0 ? (VIEW - dispW) / 2 : 0;
  const maxPanX = W > 0 ? (dispW - VIEW) / 2 : 0;
  const minPanY = H > 0 ? (VIEW - dispH) / 2 : 0;
  const maxPanY = H > 0 ? (dispH - VIEW) / 2 : 0;

  const ox = W > 0 ? (VIEW - dispW) / 2 + panX : 0;
  const oy = H > 0 ? (VIEW - dispH) / 2 + panY : 0;

  const clampedPan = useCallback(
    (px, py) => ({
      x: clampPan(px, minPanX, maxPanX),
      y: clampPan(py, minPanY, maxPanY),
    }),
    [minPanX, maxPanX, minPanY, maxPanY],
  );

  useEffect(() => {
    setPanX((p) => clampPan(p, minPanX, maxPanX));
    setPanY((p) => clampPan(p, minPanY, maxPanY));
  }, [zoom, W, H, minPanX, maxPanX, minPanY, maxPanY]);

  useLayoutEffect(() => {
    const end = () => {
      dragRef.current.active = false;
    };
    const move = (e) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const next = clampedPan(dragRef.current.panX + dx, dragRef.current.panY + dy);
      setPanX(next.x);
      setPanY(next.y);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [clampedPan]);

  const handlePointerDown = (e) => {
    if (W <= 0) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      panX,
      panY,
    };
    e.preventDefault();
  };

  const aplicarRecorte = useCallback(() => {
    const img = imgRef.current;
    if (!img || !W || !H || !src) {
      onError?.("Imagem ainda não carregou.");
      return;
    }
    let ix0 = -ox / k;
    let iy0 = -oy / k;
    let sw = VIEW / k;
    let sh = VIEW / k;
    ix0 = Math.max(0, Math.min(W - sw, ix0));
    iy0 = Math.max(0, Math.min(H - sh, iy0));
    sw = Math.min(sw, W - ix0);
    sh = Math.min(sh, H - iy0);

    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onError?.("Não foi possível processar a imagem.");
      return;
    }
    try {
      ctx.drawImage(img, ix0, iy0, sw, sh, 0, 0, EXPORT_SIZE, EXPORT_SIZE);
    } catch {
      onError?.(
        "Não foi possível recortar esta imagem (URL externa pode bloquear o navegador). Use upload de arquivo ou outra URL.",
      );
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onError?.("Falha ao gerar a imagem.");
          return;
        }
        if (blob.size > MAX_BYTES) {
          onError?.("Imagem após ajuste ainda muito grande. Reduza o zoom ou use foto menor.");
          return;
        }
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        const file = new File([blob], `produto-${Date.now()}.jpg`, { type: "image/jpeg" });
        onAdjusted?.({ dataUrl, file });
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  }, [W, H, k, ox, oy, src, onAdjusted, onError]);

  if (!src) return null;

  return (
    <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 420, alignItems: "center", ...sx }}>
      <Box
        onPointerDown={handlePointerDown}
        sx={{
          width: VIEW,
          height: VIEW,
          overflow: "hidden",
          position: "relative",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
          cursor: zoom > ZOOM_MIN || dispW > VIEW || dispH > VIEW ? "grab" : "default",
          touchAction: "none",
          userSelect: "none",
          "&:active": { cursor: "grabbing" },
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          crossOrigin="anonymous"
          onLoad={onImgLoad}
          onError={() => onError?.("Não foi possível carregar a imagem para ajuste.")}
          draggable={false}
          style={{
            position: "absolute",
            left: ox,
            top: oy,
            width: dispW,
            height: dispH,
            maxWidth: "none",
            pointerEvents: "none",
          }}
        />
      </Box>

      <Box sx={{ width: "100%", px: 0.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
          Aproximar / afastar
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ZoomOut sx={{ color: "text.secondary", fontSize: 20 }} />
          <Slider
            size="small"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(_, v) => setZoom(v)}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
            sx={{ flex: 1 }}
          />
          <ZoomIn sx={{ color: "text.secondary", fontSize: 20 }} />
        </Stack>
      </Box>

      <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", px: 1 }}>
        Arraste na moldura para escolher o que aparece no quadrado.
      </Typography>

      <Tooltip title="Gera nova imagem quadrada com o enquadramento atual (recomendado antes de salvar).">
        <span>
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<CropFree />}
            onClick={aplicarRecorte}
            disabled={!W || !H}
            sx={{ textTransform: "none" }}
          >
            Aplicar recorte
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}
