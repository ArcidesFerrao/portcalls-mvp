import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Cloud, HardDrive, Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { 
  getSharePointConfig, 
  saveSharePointConfig, 
  isSharePointConfigured,
  getDefaultConfig 
} from '../lib/config';
import { validateSharePointConnection } from '../lib/sharepoint';
import { SharePointConfig, ValidationResult } from '../lib/sharepoint-types';

export function Setup() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SharePointConfig>(getDefaultConfig());
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const existingConfig = getSharePointConfig();
    if (existingConfig) {
      setConfig(existingConfig);
      setIsConfigured(true);
    }
  }, []);

  async function handleValidate() {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateSharePointConnection(config);
      setValidationResult(result);
      
      if (result.success) {
        saveSharePointConfig(config);
        setIsConfigured(true);
      }
    } catch (error: any) {
      setValidationResult({
        success: false,
        message: error.message || 'Validation failed',
      });
    } finally {
      setIsValidating(false);
    }
  }

  function handleSave() {
    saveSharePointConfig(config);
    setIsConfigured(true);
    navigate('/');
  }

  function handleSkip() {
    // Save with local storage mode
    const localConfig = { ...config, storageMode: 'Local' as const, accessMethod: 'Local Storage' as const };
    saveSharePointConfig(localConfig);
    navigate('/');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-[Syne]">Configuração de Armazenamento</h1>
          <p className="text-text-secondary text-sm">Configure onde os documentos serão guardados</p>
        </div>
      </div>

      {/* Storage Mode Selection */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-primary" />
          <h3 className="font-semibold font-[Syne]">Modo de Armazenamento</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setConfig({ ...config, storageMode: 'SharePoint', accessMethod: 'Microsoft 365' })}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              config.storageMode === 'SharePoint'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Cloud size={24} className={config.storageMode === 'SharePoint' ? 'text-primary' : 'text-text-muted'} />
              <span className="font-semibold">SharePoint</span>
            </div>
            <p className="text-xs text-text-secondary">
              Documentos guardados no SharePoint da empresa. Partilhados com todos os departamentos.
            </p>
          </button>

          <button
            onClick={() => setConfig({ ...config, storageMode: 'Local', accessMethod: 'Local Storage' })}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              config.storageMode === 'Local'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <HardDrive size={24} className={config.storageMode === 'Local' ? 'text-primary' : 'text-text-muted'} />
              <span className="font-semibold">Local</span>
            </div>
            <p className="text-xs text-text-secondary">
              Apenas metadados guardados no navegador. Sem upload real de ficheiros.
            </p>
          </button>
        </div>
      </Card>

      {/* SharePoint Configuration */}
      {config.storageMode === 'SharePoint' && (
        <Card className="p-6 space-y-5">
          <h3 className="font-semibold font-[Syne]">Configuração do SharePoint</h3>

          <div className="space-y-4">
            <Input
              label="URL do Site SharePoint"
              placeholder="https://empresa.sharepoint.com/sites/portos"
              value={config.siteUrl}
              onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
              hint="URL completo do site SharePoint"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome da Biblioteca"
                placeholder="Documentos"
                value={config.libraryName}
                onChange={(e) => setConfig({ ...config, libraryName: e.target.value })}
                hint="Nome da biblioteca de documentos"
              />

              <Input
                label="Pasta Raiz"
                placeholder="Processos"
                value={config.rootFolder}
                onChange={(e) => setConfig({ ...config, rootFolder: e.target.value })}
                hint="Pasta onde os processos serão guardados"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Microsoft 365 Credentials */}
      {config.storageMode === 'SharePoint' && (
        <Card className="p-6 space-y-5">
          <h3 className="font-semibold font-[Syne]">Credenciais Microsoft 365</h3>
          <p className="text-xs text-text-muted mb-4">
            Necessário para autenticação com Microsoft Graph API. Obtenha estas credenciais no Azure Portal.
          </p>

          <div className="space-y-4">
            <Input
              label="Tenant ID"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={config.tenantId}
              onChange={(e) => setConfig({ ...config, tenantId: e.target.value })}
              hint="ID do diretório Azure AD"
            />

            <Input
              label="Client ID (Application ID)"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              hint="ID da aplicação registada"
            />

            <Input
              label="Client Secret"
              type="password"
              placeholder="••••••••••••••••"
              value={config.clientSecret}
              onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
              hint="Secret da aplicação (mantenha confidencial)"
            />
          </div>
        </Card>
      )}

      {/* Validation Result */}
      {validationResult && (
        <Card className={`p-4 border-2 ${validationResult.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <div className="flex items-start gap-3">
            {validationResult.success ? (
              <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${validationResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {validationResult.success ? 'Conexão bem-sucedida' : 'Erro de conexão'}
              </p>
              <p className="text-sm text-text-secondary mt-1">{validationResult.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleSkip}>
          Usar modo local
        </Button>

        <div className="flex items-center gap-3">
          {config.storageMode === 'SharePoint' && (
            <Button
              variant="secondary"
              onClick={handleValidate}
              disabled={isValidating || !config.siteUrl || !config.tenantId || !config.clientId}
            >
              {isValidating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  A validar...
                </>
              ) : (
                'Validar Conexão'
              )}
            </Button>
          )}

          {isConfigured ? (
            <Button onClick={() => navigate('/')}>
              Guardar e Continuar
            </Button>
          ) : config.storageMode === 'SharePoint' && validationResult?.success ? (
            <Button onClick={handleSave}>
              Guardar Configuração
            </Button>
          ) : config.storageMode === 'Local' ? (
            <Button onClick={handleSave}>
              Continuar
            </Button>
          ) : null}
        </div>
      </div>

      {/* Help Section */}
      {config.storageMode === 'SharePoint' && (
        <Card className="p-6 bg-surface-2/50">
          <h4 className="font-semibold text-sm mb-3">Como obter as credenciais?</h4>
          <ol className="text-xs text-text-secondary space-y-2 list-decimal list-inside">
            <li>Aceda ao <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Azure Portal</a></li>
            <li>Vá a "Azure Active Directory" → "App registrations" → "New registration"</li>
            <li>Registe uma nova aplicação e copie o "Application (client) ID"</li>
            <li>Em "Certificates & secrets", crie um novo "Client secret"</li>
            <li>Em "API permissions", adicione "Sites.ReadWrite.All" e "Files.ReadWrite.All"</li>
            <li>Copie o "Tenant ID" da página "Overview" do Azure AD</li>
          </ol>
        </Card>
      )}
    </div>
  );
}
