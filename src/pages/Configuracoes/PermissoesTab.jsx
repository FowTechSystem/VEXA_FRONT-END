import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  Chip,
  Skeleton,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Link,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add,
  CheckCircle,
  Warning,
  CancelOutlined,
  Edit,
  PersonOff,
  ArrowForward,
  Search,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { usuariosService } from "../../api/usuariosService";
import { listRoles } from "../../api/rolesService";
import { showSuccess, showError } from "../../utils/notifications";
import { badgeStyleForPerfil, getPermissionsMatrixForPerfil, VEX, configUiPalette } from "./configuracoesHelpers";

function initials(nome) {
  if (!nome?.trim()) return "?";
  const p = nome.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return nome.slice(0, 2).toUpperCase();
}

function LevelCell({ level, label, mutedColor }) {
  if (level === "full") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: VEX.success }}>
        <CheckCircle fontSize="small" />
        <Typography variant="body2">{label}</Typography>
      </Box>
    );
  }
  if (level === "limited" || level === "own") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: VEX.warning }}>
        <Warning fontSize="small" />
        <Typography variant="body2">{label}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: mutedColor }}>
      <CancelOutlined fontSize="small" />
      <Typography variant="body2">{label}</Typography>
    </Box>
  );
}

async function buildUpdatePayloadFromApi(userId) {
  const u = await usuariosService.getById(userId);
  const enderecos = Array.isArray(u.enderecos)
    ? u.enderecos
    : u.endereco
      ? [
          {
            id: u.endereco.id,
            cep: u.endereco.cep || "",
            rua: u.endereco.rua || "",
            numero: String(u.endereco.numero || ""),
            complemento: u.endereco.complemento || "",
            bairro: u.endereco.bairro || "",
            cidade: u.endereco.cidade || "",
            estado: u.endereco.estado || "",
          },
        ]
      : [];
  return {
    id: u.id,
    nome: u.nome?.trim() || "",
    email: u.email?.trim() || "",
    login: (u.login || u.email || "").trim(),
    cargo: u.cargo?.trim() || "",
    cpf: u.cpf?.replace(/\D/g, "") || undefined,
    rg: u.rg?.trim() || undefined,
    telefone: u.telefone?.trim() || undefined,
    whatsApp: (u.whatsApp || u.telefone || "").replace(/\D/g, "") || undefined,
    dataNascimento: u.dataNascimento || null,
    perfil: u.perfil || undefined,
    departamento: u.departamento || undefined,
    observacoes: u.observacoes?.trim() || undefined,
    ativo: u.ativo !== false,
    permissaoIds: Array.isArray(u.permissaoIds) ? u.permissaoIds : [],
    podeVender: !!u.podeVender,
    podeEditarEstoque: !!u.podeEditarEstoque,
    podeEditarProduto: !!u.podeEditarProduto,
    podeAbrirFecharCaixa: !!u.podeAbrirFecharCaixa,
    podeEmitirRelatorios: !!u.podeEmitirRelatorios,
    podeCadastrarFornecedores: !!u.podeCadastrarFornecedores,
    enderecos,
    fotoUrl: u.fotoUrl ?? null,
    novaSenha: null,
    fotoBase64: null,
  };
}

export default function PermissoesTab() {
  const theme = useTheme();
  const ui = useMemo(() => configUiPalette(theme), [theme]);
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [roles, setRoles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    perfil: "",
    senha: "",
    forcePw: true,
  });
  const [confirmRoleOpen, setConfirmRoleOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState("");
  const [confirmInactiveOpen, setConfirmInactiveOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usuariosService.getAll({ pagina: 1, tamanho: 500, valor: search.trim() || undefined });
      setUsuarios(res.usuarios || []);
    } catch {
      setUsuarios([]);
      showError("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [loadUsers]);

  useEffect(() => {
    listRoles().then(setRoles).catch(() => setRoles([]));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    usuariosService
      .getById(selectedId)
      .then((u) => {
        if (!cancelled) setDetail(u);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => {
      const nome = (u.nome || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const perfil = (u.perfil || "").toLowerCase();
      return nome.includes(q) || email.includes(q) || perfil.includes(q);
    });
  }, [usuarios, search]);

  const selected = detail;

  const openCreate = () => {
    setEditId(null);
    setForm({ nome: "", email: "", perfil: "", senha: "", forcePw: true });
    setModalOpen(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setEditId(selected.id);
    setForm({
      nome: selected.nome || "",
      email: selected.email || "",
      perfil: selected.perfil || "",
      senha: "",
      forcePw: false,
    });
    setModalOpen(true);
  };

  const gerarSenha = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, senha: s }));
  };

  const saveUserModal = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.perfil) {
      showError("Preencha nome, e-mail e perfil.");
      return;
    }
    if (!editId && !form.senha) {
      showError("Informe uma senha temporária ou gere uma.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const base = await buildUpdatePayloadFromApi(editId);
        await usuariosService.update(editId, {
          ...base,
          nome: form.nome.trim(),
          email: form.email.trim(),
          login: form.email.trim(),
          perfil: form.perfil,
          cargo: form.perfil,
          novaSenha: form.senha?.trim() ? form.senha.trim() : null,
        });
        showSuccess("Usuário atualizado.");
      } else {
        await usuariosService.create({
          nome: form.nome.trim(),
          email: form.email.trim(),
          login: form.email.trim(),
          cargo: form.perfil,
          perfil: form.perfil,
          senhaHash: form.senha,
          ativo: true,
          permissaoIds: [],
          enderecos: [],
          podeVender: false,
          podeEditarEstoque: false,
          podeEditarProduto: false,
          podeAbrirFecharCaixa: false,
          podeEmitirRelatorios: false,
          podeCadastrarFornecedores: false,
          fotoBase64: null,
        });
        showSuccess("Usuário criado.");
      }
      setModalOpen(false);
      loadUsers();
      if (editId) setSelectedId(editId);
    } catch (e) {
      showError(e?.response?.data?.message || "Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const applyRoleChange = async (newPerfil) => {
    if (!selected) return;
    setSaving(true);
    try {
      const base = await buildUpdatePayloadFromApi(selected.id);
      await usuariosService.update(selected.id, {
        ...base,
        perfil: newPerfil,
        cargo: newPerfil,
      });
      showSuccess("Perfil atualizado.");
      setConfirmRoleOpen(false);
      loadUsers();
      const u = await usuariosService.getById(selected.id);
      setDetail(u);
    } catch {
      showError("Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (checked) => {
    if (!selected) return;
    if (!checked) {
      setConfirmInactiveOpen(true);
      return;
    }
    setSaving(true);
    try {
      await usuariosService.setAtivo(selected.id, true);
      showSuccess("Usuário ativado.");
      loadUsers();
      const u = await usuariosService.getById(selected.id);
      setDetail(u);
    } catch {
      showError("Erro ao ativar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDesativar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await usuariosService.setAtivo(selected.id, false);
      showSuccess("Usuário desativado.");
      setConfirmInactiveOpen(false);
      loadUsers();
      const u = await usuariosService.getById(selected.id);
      setDetail(u);
    } catch {
      showError("Erro ao desativar.");
    } finally {
      setSaving(false);
    }
  };

  const matrix = useMemo(() => getPermissionsMatrixForPerfil(selected?.perfil), [selected?.perfil]);

  const panelSx = {
    borderRadius: VEX.radiusCard,
    border: `1px solid ${ui.border}`,
    bgcolor: ui.bgCard,
    color: ui.textPrimary,
    overflow: "hidden",
  };

  const listPanel = (
    <Paper elevation={0} sx={{ ...panelSx, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${ui.border}` }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Usuários
        </Typography>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={openCreate}
          sx={{
            mb: 1.5,
            textTransform: "none",
            bgcolor: ui.accent,
            color: ui.accentContrast,
            borderRadius: VEX.radiusInput,
            "&:hover": {
              bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark,
            },
          }}
        >
          Novo usuário
        </Button>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nome, e-mail ou perfil..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: ui.bgInput,
              borderRadius: VEX.radiusInput,
              color: ui.textPrimary,
            },
          }}
        />
        <Typography variant="body2" sx={{ mt: 1.25, color: "text.secondary", fontSize: "14px" }}>
          {filtered.length} {filtered.length === 1 ? "usuário" : "usuários"}
        </Typography>
      </Box>
      <TableContainer
        sx={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          minHeight: 280,
          maxHeight: { xs: 360, md: "min(520px, calc(100vh - 260px))" },
          overflow: "auto",
          bgcolor: ui.bgCard,
        }}
      >
        {loading ? (
          <Table size="medium">
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton variant="rounded" height={48} sx={{ bgcolor: ui.skeletonBg }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    fontSize: "13px",
                    py: 2,
                  }}
                >
                  USUÁRIO
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px", py: 2 }}>
                  E-MAIL
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px", py: 2 }}>
                  PERFIL
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px", py: 2 }}>
                  STATUS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <Typography variant="body2">Nenhum usuário encontrado.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u, index) => {
                  const bs = badgeStyleForPerfil(u.perfil, ui);
                  const active = u.ativo !== false;
                  const sel = selectedId === u.id;
                  return (
                    <TableRow
                      key={u.id}
                      hover
                      onClick={() => setSelectedId(u.id)}
                      sx={{
                        cursor: "pointer",
                        borderBottom:
                          index === filtered.length - 1 ? "none" : "1px solid",
                        borderColor: "divider",
                        bgcolor: sel ? "action.selected" : undefined,
                        "&:hover": {
                          bgcolor: sel ? "action.selected" : "action.hover",
                        },
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: bs.color,
                              color: "#111",
                              width: 40,
                              height: 40,
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            {initials(u.nome)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                            {u.nome || "—"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "14px", maxWidth: 160 }}>
                        <Typography variant="body2" noWrap title={u.email}>
                          {u.email || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.perfil || bs.label}
                          size="small"
                          sx={{
                            bgcolor: "action.hover",
                            color: "text.primary",
                            fontWeight: 500,
                            fontSize: "12px",
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={active ? "Ativo" : "Inativo"}
                          size="small"
                          sx={{
                            bgcolor: active ? "success.light" : "action.hover",
                            color: active ? "success.dark" : "text.secondary",
                            fontWeight: 500,
                            fontSize: "12px",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Paper>
  );

  const detailPanel = (
    <Paper elevation={0} sx={{ ...panelSx, minHeight: 420 }}>
      {!selected ? (
        <Box sx={{ py: 10, textAlign: "center", color: ui.textSecondary }}>
          <PersonOff sx={{ fontSize: 56, mb: 2, opacity: 0.5 }} />
          <Typography variant="body1">Selecione um usuário para ver as permissões.</Typography>
        </Box>
      ) : (
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start", mb: 3 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: badgeStyleForPerfil(selected.perfil, ui).color, color: "#111", fontSize: 28 }}>
              {initials(selected.nome)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selected.nome}
              </Typography>
              <Typography variant="body2" sx={{ color: ui.textSecondary }}>
                {selected.email}
              </Typography>
              <Typography variant="caption" sx={{ color: ui.textMuted, display: "block", mt: 0.5 }}>
                Criado em: {selected.created_at ? new Date(selected.created_at).toLocaleString("pt-BR") : "—"} · Último acesso:{" "}
                {selected.last_login_at ? new Date(selected.last_login_at).toLocaleString("pt-BR") : "—"}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                <FormControlLabel
                  control={<Switch checked={selected.ativo !== false} onChange={(e) => toggleAtivo(e.target.checked)} disabled={saving} />}
                  label={selected.ativo !== false ? "Ativo" : "Inativo"}
                  sx={{ color: ui.textSecondary }}
                />
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={openEdit}
                  sx={{ textTransform: "none", borderColor: ui.borderActive, color: ui.textPrimary }}
                >
                  Editar usuário
                </Button>
              </Box>
            </Box>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1, color: ui.accent }}>
            Perfil de acesso
          </Typography>
          <FormControl fullWidth size="small" sx={{ maxWidth: 360, mb: 3 }}>
            <InputLabel sx={{ color: ui.textSecondary }}>Perfil</InputLabel>
            <Select
              label="Perfil"
              value={selected.perfil || ""}
              onChange={(e) => {
                setPendingRole(e.target.value);
                setConfirmRoleOpen(true);
              }}
              sx={{ bgcolor: ui.bgInput, color: ui.textPrimary, borderRadius: VEX.radiusInput }}
            >
              {roles.map((r) => (
                <MenuItem key={r.id || r.name} value={r.label}>
                  {r.label}
                </MenuItem>
              ))}
              {!roles.some((r) => r.label === selected.perfil) && selected.perfil && (
                <MenuItem value={selected.perfil}>{selected.perfil}</MenuItem>
              )}
            </Select>
          </FormControl>

          {matrix.map((mod) => (
            <Box key={mod.module} sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: ui.textMuted, letterSpacing: 1 }}>
                MÓDULO: {mod.module}
              </Typography>
              <TableContainer sx={{ mt: 1, border: `1px solid ${ui.border}`, borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: ui.tableHeadBg }}>
                      <TableCell sx={{ color: ui.textSecondary, fontWeight: 600 }}>Permissão</TableCell>
                      <TableCell sx={{ color: ui.textSecondary, fontWeight: 600 }}>Nível</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mod.rows.map((row) => (
                      <TableRow key={row.permission_key}>
                        <TableCell sx={{ color: ui.textPrimary }}>{row.label}</TableCell>
                        <TableCell>
                          <LevelCell level={row.level} label={row.level_label} mutedColor={ui.textMuted} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}

          <Typography variant="caption" sx={{ color: ui.textMuted, display: "block", mb: 1 }}>
            As permissões são definidas pelo perfil. Para permissões personalizadas, crie um fluxo de perfis customizados no backend.
          </Typography>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => navigate("/usuarios")}
            sx={{ color: ui.accent, display: "inline-flex", alignItems: "center", gap: 0.5 }}
          >
            Gerenciar perfis → <ArrowForward fontSize="inherit" />
          </Link>
        </Box>
      )}
    </Paper>
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: isMdUp ? "row" : "column",
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box sx={{ flex: isMdUp ? "0 0 340px" : "none", minWidth: 0 }}>{listPanel}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>{detailPanel}</Box>
      </Box>

      <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: ui.bgCard, border: `1px solid ${ui.border}` } }}>
        <DialogTitle sx={{ color: ui.textPrimary }}>{editId ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Nome completo" required fullWidth value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { bgcolor: ui.bgInput } }} InputLabelProps={{ sx: { color: ui.textSecondary } }} />
          <TextField label="E-mail" required fullWidth type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { bgcolor: ui.bgInput } }} />
          <FormControl fullWidth>
            <InputLabel sx={{ color: ui.textSecondary }}>Perfil</InputLabel>
            <Select label="Perfil" value={form.perfil} onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value }))} sx={{ bgcolor: ui.bgInput }}>
              {roles.map((r) => (
                <MenuItem key={r.id || r.name} value={r.label}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!editId && (
            <>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  label="Senha temporária"
                  fullWidth
                  type="text"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: ui.bgInput } }}
                />
                <Button variant="outlined" onClick={gerarSenha} sx={{ flexShrink: 0, color: ui.accent, borderColor: ui.borderActive }}>
                  Gerar
                </Button>
              </Box>
              <FormControlLabel control={<Switch checked={form.forcePw} onChange={(e) => setForm((f) => ({ ...f, forcePw: e.target.checked }))} />} label="Forçar troca de senha no primeiro acesso" sx={{ color: ui.textSecondary }} />
            </>
          )}
          {editId && (
            <TextField label="Nova senha (opcional)" fullWidth type="password" value={form.senha} onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { bgcolor: ui.bgInput } }} />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)} disabled={saving} sx={{ color: ui.textSecondary }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={saveUserModal} disabled={saving} sx={{ bgcolor: ui.accent, color: ui.accentContrast, textTransform: "none", "&:hover": { bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark } }}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmRoleOpen} onClose={() => setConfirmRoleOpen(false)}>
        <DialogTitle>Trocar perfil?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Tem certeza? Isso altera todas as permissões efetivas do usuário.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRoleOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => applyRoleChange(pendingRole)} sx={{ bgcolor: ui.accent, color: ui.accentContrast, "&:hover": { bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark } }}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmInactiveOpen} onClose={() => setConfirmInactiveOpen(false)}>
        <DialogTitle>Desativar usuário?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmInactiveOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmDesativar}>
            Desativar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
