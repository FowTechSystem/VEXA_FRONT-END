import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { montarDadosNotificacaoMovimentacaoApi } from "../utils/movimentacaoCaixa";

const SEEN_KEY = "vexa_caixa_mov_seen_keys";
const INIT_KEY = "vexa_caixa_mov_notif_init";
const NOTIF_KEY = "vexa_inapp_notifications_v1";
const MAX_NOTIFICACOES = 40;
const MAX_SEEN = 800;

const TITULO_CAIXA = "Movimentação de caixa";

function loadSeenSet() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeenSet(set) {
  const arr = [...set].slice(-MAX_SEEN);
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
}

function isInicializado() {
  return localStorage.getItem(INIT_KEY) === "1";
}

function marcarInicializado() {
  localStorage.setItem(INIT_KEY, "1");
}

function loadNotificacoesPersistidas() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.map((n) => {
      if (!n || typeof n !== "object") return n;
      if (n.dataISO) return n;
      if (typeof n.createdAt === "number" && !Number.isNaN(n.createdAt)) {
        return { ...n, dataISO: new Date(n.createdAt).toISOString() };
      }
      return n;
    });
  } catch {
    return [];
  }
}

function saveNotificacoes(arr) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(arr.slice(0, MAX_NOTIFICACOES)));
}

const InAppNotificationContext = createContext(null);

export function InAppNotificationProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState(() => loadNotificacoesPersistidas());

  const persistLista = useCallback((updater) => {
    setNotificacoes((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveNotificacoes(next);
      return next;
    });
  }, []);

  const adicionarNotificacaoCaixa = useCallback(
    (texto, dataISO, chave) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const resolvedIso =
        dataISO && String(dataISO).trim() !== ""
          ? String(dataISO).trim()
          : new Date().toISOString();
      const item = {
        id,
        titulo: TITULO_CAIXA,
        texto,
        dataISO: resolvedIso,
        lida: false,
        chave,
        createdAt: Date.now(),
      };
      persistLista((prev) => [item, ...prev].slice(0, MAX_NOTIFICACOES));
    },
    [persistLista],
  );

  /** Lista bruta de movimentações do GET /caixa/resumo. Na 1ª execução só registra chaves (sem notificar). */
  const sincronizarMovimentacoesDoCaixa = useCallback(
    (listaBruta) => {
      if (!Array.isArray(listaBruta) || listaBruta.length === 0) {
        return;
      }

      const seen = loadSeenSet();
      const primeiroCiclo = !isInicializado();

      for (const m of listaBruta) {
        let dados;
        try {
          dados = montarDadosNotificacaoMovimentacaoApi(m);
        } catch {
          continue;
        }
        const { chave, texto, dataISO } = dados;

        if (primeiroCiclo) {
          seen.add(chave);
          continue;
        }

        if (!seen.has(chave)) {
          seen.add(chave);
          adicionarNotificacaoCaixa(texto, dataISO, chave);
        }
      }

      if (primeiroCiclo) marcarInicializado();
      saveSeenSet(seen);
    },
    [adicionarNotificacaoCaixa],
  );

  /** Após criar movimentação manual (POST). */
  const registrarMovimentacaoManualCriada = useCallback(
    ({ idBackend, descricao, valor, entrada }) => {
      const v = Number(valor) || 0;
      const abs = Math.abs(v);
      const valorFmt = entrada ? abs : -abs;
      const sinal = valorFmt >= 0 ? "+" : "-";
      const rotulo = entrada ? "Entrada no caixa" : "Saída no caixa";
      const texto = `${rotulo}: ${String(descricao || "").trim() || "Sem descrição"} — ${sinal} R$ ${abs.toFixed(2)}`;
      const chave =
        idBackend != null && String(idBackend).trim() !== ""
          ? `id:${String(idBackend)}`
          : `manual:${Date.now()}`;
      const seen = loadSeenSet();
      seen.add(chave);
      saveSeenSet(seen);
      adicionarNotificacaoCaixa(texto, new Date().toISOString(), chave);
    },
    [adicionarNotificacaoCaixa],
  );

  const marcarTodasComoLidas = useCallback(() => {
    persistLista((prev) => prev.map((n) => ({ ...n, lida: true })));
  }, [persistLista]);

  /** Uma linha no formato da API (ex.: logo após registrar venda no caixa). Só notifica se a chave ainda não foi vista. */
  const emitirSeNovaMovimentacao = useCallback(
    (itemBrutoApi) => {
      if (!itemBrutoApi || typeof itemBrutoApi !== "object") return;
      let dados;
      try {
        dados = montarDadosNotificacaoMovimentacaoApi(itemBrutoApi);
      } catch {
        return;
      }
      const seen = loadSeenSet();
      if (seen.has(dados.chave)) return;
      seen.add(dados.chave);
      saveSeenSet(seen);
      adicionarNotificacaoCaixa(dados.texto, dados.dataISO, dados.chave);
    },
    [adicionarNotificacaoCaixa],
  );

  const valor = useMemo(
    () => ({
      notificacoes,
      sincronizarMovimentacoesDoCaixa,
      registrarMovimentacaoManualCriada,
      emitirSeNovaMovimentacao,
      marcarTodasComoLidas,
    }),
    [
      notificacoes,
      sincronizarMovimentacoesDoCaixa,
      registrarMovimentacaoManualCriada,
      emitirSeNovaMovimentacao,
      marcarTodasComoLidas,
    ],
  );

  return (
    <InAppNotificationContext.Provider value={valor}>
      {children}
    </InAppNotificationContext.Provider>
  );
}

export function useInAppNotifications() {
  const ctx = useContext(InAppNotificationContext);
  if (!ctx) {
    throw new Error("useInAppNotifications deve ser usado dentro de InAppNotificationProvider");
  }
  return ctx;
}
