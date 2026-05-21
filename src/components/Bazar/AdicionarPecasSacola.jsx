// src/components/Bazar/AdicionarPecasSacola.jsx
// Tela 3 — Painel "Adicionar peças à sacola" (Dialog fullScreen).
// Tabela editável inline com totais em tempo real no rodapé.
// Foco UX: digitação rápida (Tab/Enter avança, nova linha aparece sozinha,
// linhas inválidas em vermelho).
import React, { useMemo, useRef, useState } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Tooltip,
  useTheme,
  Paper,
  Stack,
  Avatar,
  Chip,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Close,
  Add,
  Delete,
  PhotoCamera,
  Save,
  WarningAmberRounded,
} from "@mui/icons-material";
import { showWarning, showError, showSuccess } from "../../utils/notifications";
import { formatBRL, getAvatarColor, getInitials } from "./bazarHelpers";
import { TAMANHOS_PADRAO, CORES_PADRAO } from "./bazarConstants";
import { bazarSacolasService } from "../../api/bazarSacolasService";

const linhaVazia = () => ({
  id: Math.random().toString(36).slice(2),
  descricao: "",
  tamanho: "",
  cor: "",
  valorCompra: "",
  valorVenda: "",
  fotos: [],
});

function AdicionarPecasSacola({ open, onClose, consignante, onSaved }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [linhas, setLinhas] = useState(() => [linhaVazia(), linhaVazia()]);
  const [salvando, setSalvando] = useState(false);
  const fotoInputsRef = useRef({});

  const atualizar = (id, campo, valor) => {
    setLinhas((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l));
      // Se a última linha começou a ser preenchida, adiciona uma nova em branco
      const ultima = next[next.length - 1];
      const ultimaTemConteudo =
        ultima.descricao.trim() ||
        ultima.tamanho.trim() ||
        ultima.cor.trim() ||
        ultima.valorCompra ||
        ultima.valorVenda;
      if (ultimaTemConteudo) next.push(linhaVazia());
      return next;
    });
  };

  const remover = (id) => {
    setLinhas((prev) => {
      const next = prev.filter((l) => l.id !== id);
      return next.length > 0 ? next : [linhaVazia()];
    });
  };

  const handleKeyDown = (e) => {
    // Enter avança para o próximo campo (mesma fileira ou próxima linha)
    if (e.key === "Enter" && !e.shiftKey) {
      const form = e.currentTarget.form;
      if (!form) return;
      const fields = Array.from(
        form.querySelectorAll("input:not([disabled]), textarea:not([disabled])"),
      );
      const idx = fields.indexOf(e.currentTarget);
      if (idx >= 0 && idx < fields.length - 1) {
        e.preventDefault();
        fields[idx + 1].focus();
      }
    }
  };

  const handleAdicionarFoto = (linhaId) => (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setLinhas((prev) =>
      prev.map((l) => {
        if (l.id !== linhaId) return l;
        const novas = [...l.fotos];
        files.forEach((f) => {
          if (novas.length < 3) {
            novas.push({
              nome: f.name,
              file: f, // arquivo real, enviado depois do create
              previewUrl: URL.createObjectURL(f),
            });
          }
        });
        return { ...l, fotos: novas };
      }),
    );
    e.target.value = "";
  };

  const removerFoto = (linhaId, idx) => {
    setLinhas((prev) =>
      prev.map((l) =>
        l.id === linhaId
          ? { ...l, fotos: l.fotos.filter((_, i) => i !== idx) }
          : l,
      ),
    );
  };

  // Linhas válidas (com pelo menos descrição e valores preenchidos)
  const linhasValidas = useMemo(
    () =>
      linhas.filter(
        (l) =>
          l.descricao.trim() &&
          l.valorCompra !== "" &&
          l.valorVenda !== "" &&
          Number(l.valorCompra) >= 0 &&
          Number(l.valorVenda) >= 0,
      ),
    [linhas],
  );

  const totais = useMemo(() => {
    let venda = 0;
    let repasse = 0;
    linhasValidas.forEach((l) => {
      venda += Number(l.valorVenda) || 0;
      repasse += Number(l.valorCompra) || 0;
    });
    return {
      pecas: linhasValidas.length,
      venda,
      repasse,
      lucro: venda - repasse,
    };
  }, [linhasValidas]);

  const handleSalvar = async () => {
    if (salvando) return;
    if (linhasValidas.length === 0) {
      showWarning(
        "Preencha ao menos uma peça com descrição, valor de compra e valor de venda.",
      );
      return;
    }
    const algumaInvalida = linhasValidas.some(
      (l) => Number(l.valorVenda) < Number(l.valorCompra),
    );
    if (algumaInvalida) {
      showWarning(
        "Há peças com valor de venda menor que o de compra. Revise antes de salvar.",
      );
      return;
    }

    setSalvando(true);
    try {
      // 1) Cria a sacola com todas as peças (sem fotos ainda)
      const payload = {
        consignanteId: consignante.id,
        pecas: linhasValidas.map((l) => ({
          descricao: l.descricao.trim(),
          tamanho: (l.tamanho || "").trim(),
          cor: (l.cor || "").trim(),
          valorCompra: Number(l.valorCompra),
          valorVenda: Number(l.valorVenda),
        })),
      };
      const sacolaCriada = await bazarSacolasService.create(payload);

      // 2) Sobe as fotos por peça (cada linha pode ter até 3)
      // O backend deve retornar { id, pecas: [{ id }, ...] } na mesma ordem.
      const pecasRetornadas = Array.isArray(sacolaCriada?.pecas)
        ? sacolaCriada.pecas
        : [];
      let uploadFalhou = false;

      await Promise.all(
        linhasValidas.map(async (linha, idx) => {
          const pecaId = pecasRetornadas[idx]?.id;
          const arquivos = linha.fotos.map((f) => f.file).filter(Boolean);
          if (!pecaId || arquivos.length === 0) return;
          try {
            await bazarSacolasService.uploadFotosPeca(pecaId, arquivos);
          } catch (err) {
            console.error(
              "[AdicionarPecasSacola] falha ao subir fotos da peça",
              pecaId,
              err,
            );
            uploadFalhou = true;
          }
        }),
      );

      if (uploadFalhou) {
        showWarning(
          "Sacola salva, mas algumas fotos não puderam ser enviadas. Edite a peça depois para anexá-las.",
        );
      } else {
        showSuccess(
          `Sacola salva com ${linhasValidas.length} peça(s).`,
        );
      }
      onSaved?.(sacolaCriada);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Não foi possível salvar a sacola.";
      showError(msg);
      console.error("[AdicionarPecasSacola] erro ao salvar:", error);
    } finally {
      setSalvando(false);
    }
  };

  const cellSx = {
    p: 0.75,
    verticalAlign: "middle",
    borderBottom: "1px solid",
    borderColor: "divider",
  };

  const inputSlotProps = {
    sx: {
      "& .MuiOutlinedInput-root": {
        fontSize: "0.875rem",
        bgcolor: "background.default",
        borderRadius: 1.5,
        "& fieldset": { borderColor: alpha(theme.palette.divider, 0.6) },
      },
      "& .MuiOutlinedInput-input": { py: 1 },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: "background.default" } }}
    >
      {/* ────────── Cabeçalho ────────── */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: "background.paper",
        }}
      >
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: getAvatarColor(consignante?.nome || ""),
            fontWeight: 700,
          }}
        >
          {getInitials(consignante?.nome || "?")}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Nova sacola
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            {consignante?.nome}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Fechar">
          <Close />
        </IconButton>
      </Box>

      {/* ────────── Conteúdo ────────── */}
      <Box
        component="form"
        onSubmit={(e) => e.preventDefault()}
        sx={{
          flex: 1,
          overflow: "auto",
          p: { xs: 1.5, md: 3 },
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 960 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.12) }}>
                  <HeaderCell width={40}>#</HeaderCell>
                  <HeaderCell>Descrição *</HeaderCell>
                  <HeaderCell width={160}>Tamanho</HeaderCell>
                  <HeaderCell width={200}>Cor</HeaderCell>
                  <HeaderCell width={130}>Valor compra *</HeaderCell>
                  <HeaderCell width={130}>Valor venda *</HeaderCell>
                  <HeaderCell width={140}>Fotos</HeaderCell>
                  <HeaderCell width={60} align="right">
                    Ações
                  </HeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linhas.map((l, idx) => {
                  const vc = Number(l.valorCompra);
                  const vv = Number(l.valorVenda);
                  const temAmbos = l.valorCompra !== "" && l.valorVenda !== "";
                  const valorInvalido = temAmbos && vv < vc;
                  return (
                    <TableRow
                      key={l.id}
                      sx={{
                        bgcolor: valorInvalido
                          ? alpha(theme.palette.error.main, isDark ? 0.12 : 0.08)
                          : "transparent",
                        "&:hover": {
                          bgcolor: valorInvalido
                            ? alpha(theme.palette.error.main, isDark ? 0.18 : 0.14)
                            : "action.hover",
                        },
                      }}
                    >
                      <TableCell sx={{ ...cellSx, color: "text.secondary", fontWeight: 600 }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Ex.: Vestido floral midi"
                          value={l.descricao}
                          onChange={(e) => atualizar(l.id, "descricao", e.target.value)}
                          onKeyDown={handleKeyDown}
                          {...inputSlotProps}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Autocomplete
                          fullWidth
                          size="small"
                          options={TAMANHOS_PADRAO}
                          value={l.tamanho || null}
                          onChange={(_, v) => atualizar(l.id, "tamanho", v || "")}
                          // freeSolo desativado: usuário não pode digitar valor livre.
                          // Filtros e relatórios dependem dessa padronização.
                          freeSolo={false}
                          autoHighlight
                          handleHomeEndKeys
                          blurOnSelect
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Selecione"
                              {...inputSlotProps}
                            />
                          )}
                          slotProps={{
                            paper: { sx: { bgcolor: "background.paper" } },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Autocomplete
                          fullWidth
                          size="small"
                          options={CORES_PADRAO}
                          value={l.cor || null}
                          onChange={(_, v) => atualizar(l.id, "cor", v || "")}
                          freeSolo={false}
                          autoHighlight
                          handleHomeEndKeys
                          blurOnSelect
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Selecione"
                              {...inputSlotProps}
                            />
                          )}
                          slotProps={{
                            paper: { sx: { bgcolor: "background.paper" } },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }}
                          placeholder="0,00"
                          value={l.valorCompra}
                          onChange={(e) => atualizar(l.id, "valorCompra", e.target.value)}
                          onKeyDown={handleKeyDown}
                          InputProps={{
                            startAdornment: (
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary", mr: 0.5 }}
                              >
                                R$
                              </Typography>
                            ),
                          }}
                          {...inputSlotProps}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Tooltip
                          title={
                            valorInvalido
                              ? "Valor de venda menor que o de compra"
                              : ""
                          }
                          placement="top"
                          arrow
                        >
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }}
                            placeholder="0,00"
                            value={l.valorVenda}
                            onChange={(e) => atualizar(l.id, "valorVenda", e.target.value)}
                            onKeyDown={handleKeyDown}
                            error={valorInvalido}
                            InputProps={{
                              startAdornment: (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary", mr: 0.5 }}
                                >
                                  R$
                                </Typography>
                              ),
                              endAdornment: valorInvalido ? (
                                <WarningAmberRounded
                                  sx={{ fontSize: 18, color: "error.main" }}
                                />
                              ) : null,
                            }}
                            {...inputSlotProps}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <input
                            ref={(el) => {
                              fotoInputsRef.current[l.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={handleAdicionarFoto(l.id)}
                          />
                          <Tooltip title="Anexar foto (até 3)">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => fotoInputsRef.current[l.id]?.click()}
                                disabled={l.fotos.length >= 3}
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                                  color: "primary.main",
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.primary.main, 0.22),
                                  },
                                }}
                              >
                                <PhotoCamera fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {l.fotos.length > 0 && (
                            <Chip
                              label={`${l.fotos.length}/3`}
                              size="small"
                              onDelete={() => removerFoto(l.id, l.fotos.length - 1)}
                              sx={{
                                bgcolor: "action.hover",
                                fontSize: 11,
                                fontWeight: 600,
                                height: 22,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={cellSx} align="right">
                        <Tooltip title="Remover linha">
                          <IconButton
                            size="small"
                            onClick={() => remover(l.id)}
                            sx={{
                              color: "text.secondary",
                              "&:hover": { color: "error.main", bgcolor: alpha(theme.palette.error.main, 0.1) },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              startIcon={<Add />}
              onClick={() =>
                setLinhas((prev) => [...prev, linhaVazia()])
              }
              sx={{
                textTransform: "none",
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              Adicionar mais uma peça
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* ────────── Rodapé fixo de totais ────────── */}
      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          px: { xs: 2, md: 3 },
          py: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Stack
            direction="row"
            spacing={3}
            flexWrap="wrap"
            useFlexGap
            sx={{ rowGap: 1 }}
          >
            <Total titulo="Peças" valor={String(totais.pecas)} />
            <Total titulo="Total de venda" valor={formatBRL(totais.venda)} />
            <Total titulo="Total de repasse" valor={formatBRL(totais.repasse)} cor={theme.palette.warning.main} />
            <Total
              titulo="Lucro previsto"
              valor={formatBRL(totais.lucro)}
              cor={
                totais.lucro >= 0
                  ? theme.palette.success.main
                  : theme.palette.error.main
              }
            />
          </Stack>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
            <Button
              onClick={onClose}
              disabled={salvando}
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={
                salvando ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Save />
                )
              }
              onClick={handleSalvar}
              disabled={salvando}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                px: 4,
                borderRadius: 2,
              }}
            >
              {salvando ? "Salvando..." : "Salvar sacola"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

function HeaderCell({ children, width, align }) {
  return (
    <TableCell
      align={align}
      sx={{
        fontWeight: 700,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "text.secondary",
        py: 1,
        width,
      }}
    >
      {children}
    </TableCell>
  );
}

function Total({ titulo, valor, cor }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {titulo}
      </Typography>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "1.1rem",
          color: cor || "text.primary",
          lineHeight: 1.1,
        }}
      >
        {valor}
      </Typography>
    </Box>
  );
}

export default AdicionarPecasSacola;
