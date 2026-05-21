import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import "./Configuracoes.css";

const Configuracoes = () => {
  const [config, setConfig] = useState({
    nomeEmpresa: "",
    cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    logoUrl: "",
    fusoHorario: "America/Sao_Paulo",
    moeda: "BRL",
    idioma: "pt-BR",
    itensPorPagina: 20,
    metaFaturamentoMensal: 0,
    metaVendasMensal: 0,
    metaNovosClientesMensal: 0,
    temaCor: "#2196F3",
    modoEscuro: false,
    notificacoesEmail: true,
    notificacoesSistema: true,
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const response = await api.get("/configuracoes");
      setConfig(response.data);
      setLogoPreview(response.data.logoUrl);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      alert("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await api.post("/configuracoes/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setConfig((prev) => ({ ...prev, logoUrl: response.data.url }));
      setLogoPreview(response.data.url);
      alert("Logo enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar logo:", error);
      alert("Erro ao enviar logo");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.put("/configuracoes", config);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar configurações");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="configuracoes-loading">
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="configuracoes-page">
      <div className="configuracoes-header">
        <h1>⚙️ Configurações</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="config-section">
          <h2>🏢 Informações da Empresa</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nomeEmpresa">Nome da Empresa</label>
              <input
                type="text"
                id="nomeEmpresa"
                name="nomeEmpresa"
                value={config.nomeEmpresa}
                onChange={handleChange}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="form-group">
              <label htmlFor="cnpj">CNPJ</label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={config.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={config.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={config.email}
                onChange={handleChange}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="endereco">Endereço</label>
              <input
                type="text"
                id="endereco"
                name="endereco"
                value={config.endereco}
                onChange={handleChange}
                placeholder="Rua, número"
              />
            </div>
            <div className="form-group">
              <label htmlFor="cidade">Cidade</label>
              <input
                type="text"
                id="cidade"
                name="cidade"
                value={config.cidade}
                onChange={handleChange}
                placeholder="Cidade"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <input
                type="text"
                id="estado"
                name="estado"
                value={config.estado}
                onChange={handleChange}
                placeholder="Estado"
              />
            </div>
            <div className="form-group">
              <label htmlFor="cep">CEP</label>
              <input
                type="text"
                id="cep"
                name="cep"
                value={config.cep}
                onChange={handleChange}
                placeholder="00000-000"
              />
            </div>
          </div>
        </section>

        <section className="config-section">
          <h2>🖼️ Logo da Empresa</h2>
          <div className="logo-upload">
            <div className="logo-preview">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo da empresa" />
              ) : (
                <div className="logo-placeholder">📷</div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: "none" }}
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="upload-btn">
              Escolher Logo
            </label>
          </div>
        </section>

        <section className="config-section">
          <h2>🌍 Sistema</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fusoHorario">Fuso Horário</label>
              <select
                id="fusoHorario"
                name="fusoHorario"
                value={config.fusoHorario}
                onChange={handleChange}
              >
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                <option value="America/Manaus">Manaus (GMT-4)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="moeda">Moeda</label>
              <select
                id="moeda"
                name="moeda"
                value={config.moeda}
                onChange={handleChange}
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="idioma">Idioma</label>
              <select
                id="idioma"
                name="idioma"
                value={config.idioma}
                onChange={handleChange}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="itensPorPagina">Itens por Página</label>
              <input
                type="number"
                id="itensPorPagina"
                name="itensPorPagina"
                value={config.itensPorPagina}
                onChange={handleChange}
                min="5"
                max="100"
              />
            </div>
          </div>
        </section>

        <section className="config-section">
          <h2>📊 Metas</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="metaFaturamentoMensal">
                Meta Faturamento Mensal
              </label>
              <input
                type="number"
                id="metaFaturamentoMensal"
                name="metaFaturamentoMensal"
                value={config.metaFaturamentoMensal}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="metaVendasMensal">Meta Vendas Mensal</label>
              <input
                type="number"
                id="metaVendasMensal"
                name="metaVendasMensal"
                value={config.metaVendasMensal}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="metaNovosClientesMensal">
                Meta Novos Clientes
              </label>
              <input
                type="number"
                id="metaNovosClientesMensal"
                name="metaNovosClientesMensal"
                value={config.metaNovosClientesMensal}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
        </section>

        <section className="config-section">
          <h2>🎨 Aparência</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="temaCor">Cor do Tema</label>
              <input
                type="color"
                id="temaCor"
                name="temaCor"
                value={config.temaCor}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="modoEscuro"
                  checked={config.modoEscuro}
                  onChange={handleChange}
                />
                Modo Escuro
              </label>
            </div>
          </div>
        </section>

        <section className="config-section">
          <h2>🔔 Notificações</h2>
          <div className="form-row">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="notificacoesEmail"
                  checked={config.notificacoesEmail}
                  onChange={handleChange}
                />
                Notificações por Email
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="notificacoesSistema"
                  checked={config.notificacoesSistema}
                  onChange={handleChange}
                />
                Notificações do Sistema
              </label>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" disabled={salvando}>
            {salvando ? "💾 Salvando..." : "💾 Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Configuracoes;
