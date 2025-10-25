import { useState } from 'react';
import { VaultIdentifierDisplay } from './VaultIdentifierDisplay';
import { useVaultIdentifier } from '@/hooks/useVaultIdentifier';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { VaultIdentifier } from '@shared/types/identifiers';

/**
 * VaultIdentifier機能のデモコンポーネント
 * wallet-demoページで使用
 */
export function VaultIdentifierDemo() {
  const [sampleVault] = useState<VaultIdentifier>({
    address: '0x636b998315e77408806CccFCC93af4D1179afc2f' as const,
    chainId: 84532,
    caip10: 'eip155:84532:0x636b998315e77408806CccFCC93af4D1179afc2f' as const,
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Sample Family Wallet',
    shortAddress: '0x636b...afc2f',
  });

  // カスタムVaultアドレスを入力
  const [customAddress, setCustomAddress] = useState('');
  const [customVault, setCustomVault] = useState<VaultIdentifier | null>(null);
  const { createFromAddress, isLoading } = useVaultIdentifier();
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleCreateCustom = async () => {
    if (!customAddress) return;

    setLoadError(null);
    try {
      const identifier = await createFromAddress(customAddress as `0x${string}`, 84532);
      if (identifier) {
        setCustomVault(identifier);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load vault');
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vault Identifier System</h2>
          <p className="text-muted-foreground mt-1">
            Phase 1-4で実装されたID管理体系のデモ
          </p>
        </div>
        <Badge variant="outline" className="text-lg">
          CAIP-10 Compatible
        </Badge>
      </div>

      <Tabs defaultValue="display" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="display">Display Formats</TabsTrigger>
          <TabsTrigger value="custom">Custom Vault</TabsTrigger>
          <TabsTrigger value="integration">Integration Guide</TabsTrigger>
        </TabsList>

        {/* タブ1: Display Formats */}
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>各種表示フォーマット</CardTitle>
              <CardDescription>
                VaultIdentifierDisplayコンポーネントは4種類の表示形式をサポート
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Short Format */}
              <div>
                <Label className="text-sm font-medium">Short Format</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  省略形アドレス表示（0x636b...afc2f）
                </p>
                <VaultIdentifierDisplay
                  vaultIdentifier={sampleVault}
                  format="short"
                  showCopy={true}
                  showExplorer={true}
                />
              </div>

              {/* Full Format */}
              <div>
                <Label className="text-sm font-medium">Full Format</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  完全なアドレス表示
                </p>
                <VaultIdentifierDisplay
                  vaultIdentifier={sampleVault}
                  format="full"
                  showCopy={true}
                  showExplorer={true}
                />
              </div>

              {/* CAIP-10 Format */}
              <div>
                <Label className="text-sm font-medium">CAIP-10 Format</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  マルチチェーン対応標準形式（eip155:chainId:address）
                </p>
                <VaultIdentifierDisplay
                  vaultIdentifier={sampleVault}
                  format="caip10"
                  showCopy={true}
                  showChainBadge={true}
                />
              </div>

              {/* Name Format */}
              <div>
                <Label className="text-sm font-medium">Name Format</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  人間可読な名前表示
                </p>
                <VaultIdentifierDisplay
                  vaultIdentifier={sampleVault}
                  format="name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Vault詳細情報 */}
          <Card>
            <CardHeader>
              <CardTitle>Vault詳細情報</CardTitle>
              <CardDescription>サンプルVaultの識別子データ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">UUID:</span>
                  <p className="font-mono text-xs mt-1 break-all">{sampleVault.uuid}</p>
                </div>
                <div>
                  <span className="font-medium">Chain ID:</span>
                  <p className="font-mono text-xs mt-1">{sampleVault.chainId} (Base Sepolia)</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">CAIP-10:</span>
                  <p className="font-mono text-xs mt-1 break-all">{sampleVault.caip10}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Full Address:</span>
                  <p className="font-mono text-xs mt-1 break-all">{sampleVault.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* タブ2: Custom Vault */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>カスタムVaultアドレスを試す</CardTitle>
              <CardDescription>
                任意のVaultアドレスでID管理機能をテスト
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Vault Address (Base Sepolia)</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    placeholder="0x..."
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleCreateCustom}
                    disabled={isLoading || !customAddress}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load'
                    )}
                  </Button>
                </div>
              </div>

              {loadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loadError}</AlertDescription>
                </Alert>
              )}

              {customVault && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Vault loaded successfully!
                  </AlertDescription>
                </Alert>
              )}

              {customVault && (
                <div className="mt-4 space-y-4">
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <VaultIdentifierDisplay
                        vaultIdentifier={customVault}
                        format="full"
                        showCopy={true}
                        showExplorer={true}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Loaded Vault Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p className="mt-1">{customVault.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">UUID:</span>
                        <p className="font-mono text-xs mt-1">{customVault.uuid}</p>
                      </div>
                      <div>
                        <span className="font-medium">CAIP-10:</span>
                        <p className="font-mono text-xs mt-1 break-all">{customVault.caip10}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* タブ3: Integration Guide */}
        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>開発者向けガイド</CardTitle>
              <CardDescription>
                VaultIdentifierシステムの実装方法
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">1. 型のインポート</h3>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import type { VaultIdentifier } from '@shared/types/identifiers';`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. フックの使用</h3>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { useVaultIdentifier } from '@/hooks/useVaultIdentifier';

const { createFromAddress, createFromCAIP10 } = useVaultIdentifier();

// アドレスから作成
const identifier = await createFromAddress('0x...', 84532);

// CAIP-10から作成
const identifier2 = await createFromCAIP10('eip155:84532:0x...');`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. コンポーネントの使用</h3>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { VaultIdentifierDisplay } from '@/components/wallet/VaultIdentifierDisplay';

<VaultIdentifierDisplay
  vaultIdentifier={vault}
  format="short"
  showCopy={true}
  showExplorer={true}
/>`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. ユーティリティ関数</h3>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { createVaultIdentifier } from '@shared/utils/identifiers';

// Vaultオブジェクトから作成
const identifier = createVaultIdentifier({
  address: '0x...',
  chainId: 84532,
  name: 'My Vault',
  uuid: 'optional-uuid',
});`}
                </pre>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  💡 実装済み機能
                </h4>
                <ul className="text-sm space-y-2 text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>CAIP-10標準対応 - マルチチェーン識別子</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>UUID管理 - CREATE2デプロイメント対応</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>4種類の表示フォーマット (short/full/caip10/name)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>クリップボードコピー機能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Block Explorerリンク統合</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>型安全な実装 (TypeScript完全対応)</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  📚 参考資料
                </h4>
                <ul className="text-sm space-y-1 text-amber-800 dark:text-amber-200">
                  <li>• CAIP-10仕様: <code className="text-xs">https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md</code></li>
                  <li>• 実装詳細: <code className="text-xs">.kiro/specs/family_wallet/id-design-refactor.md</code></li>
                  <li>• マイグレーションガイド: <code className="text-xs">migrations/MIGRATION_GUIDE.md</code></li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
