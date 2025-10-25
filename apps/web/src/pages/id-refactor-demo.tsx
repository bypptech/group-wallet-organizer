/**
 * ID Design Refactor Demo Page
 *
 * Phase 1-4で実装した新しいID設計機能のデモページ
 */

import { VaultIdentifierDisplay } from '@/components/wallet/VaultIdentifierDisplay';
import { CustomConnectButton } from '@/components/wallet/CustomConnectButton';

export function IdRefactorDemo() {
  // サンプルVault識別子データ
  const sampleVaultIdentifier = {
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    chainId: 84532,
    caip10: 'eip155:84532:0x1234567890123456789012345678901234567890' as const,
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Sample Family Wallet',
    shortAddress: '0x1234...7890',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            ID Design Refactor Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Phase 1-4実装完了: bytes32 → Ethereum Address + CAIP-10
          </p>
        </header>

        {/* Wallet Connection */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
            1. Wallet Connection
          </h2>
          <div className="flex justify-center">
            <CustomConnectButton />
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            RainbowKitを使用したカスタムウォレット接続ボタン
          </p>
        </section>

        {/* VaultIdentifier Display Components */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
            2. VaultIdentifier Display Components
          </h2>

          {/* Short Format */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Short Format
            </h3>
            <VaultIdentifierDisplay
              vaultIdentifier={sampleVaultIdentifier}
              format="short"
              showCopy={true}
              showExplorer={true}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              短縮アドレス形式（0x1234...7890）
            </p>
          </div>

          {/* Full Format */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Full Format
            </h3>
            <VaultIdentifierDisplay
              vaultIdentifier={sampleVaultIdentifier}
              format="full"
              showCopy={true}
              showExplorer={true}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              完全なEthereumアドレス表示
            </p>
          </div>

          {/* CAIP-10 Format */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              CAIP-10 Format
            </h3>
            <VaultIdentifierDisplay
              vaultIdentifier={sampleVaultIdentifier}
              format="caip10"
              showCopy={true}
              showChainBadge={true}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Multi-chain対応のCAIP-10識別子（eip155:chainId:address）
            </p>
          </div>

          {/* Name Format */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Name Format
            </h3>
            <VaultIdentifierDisplay
              vaultIdentifier={sampleVaultIdentifier}
              format="name"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Vault名のみを表示
            </p>
          </div>
        </section>

        {/* Implementation Details */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
            3. Implementation Details
          </h2>

          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-lg mb-2">✅ Phase 1: Foundation</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>VaultFactory.sol with CREATE2 deployment</li>
                <li>GuardianModule refactored (bytes32 → address)</li>
                <li>TypeScript types and utilities for identifiers</li>
                <li>Comprehensive unit tests</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">✅ Phase 2: Database & Services</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Database schema v2 with address, chainId, caip10, uuid</li>
                <li>VaultService for CRUD operations</li>
                <li>SessionService for JWT authentication</li>
                <li>Migration scripts (forward & rollback)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">✅ Phase 3: Frontend Integration</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>useVaultFactory hook for contract interaction</li>
                <li>useSession hook for authentication</li>
                <li>useVaultIdentifier hook for unified vault lookup</li>
                <li>VaultIdentifierDisplay components</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">✅ Phase 4: Testing & Deployment</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Integration tests for VaultService & SessionService</li>
                <li>E2E tests for vault creation & authentication flows</li>
                <li>Migration execution guide (Japanese)</li>
                <li>Deployment checklist (Japanese)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
            4. Technical Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">Before</h3>
              <code className="text-sm text-gray-600 dark:text-gray-300">
                bytes32 vaultId<br />
                32 bytes (64 hex chars)<br />
                No chain info<br />
                UUID-based
              </code>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">After</h3>
              <code className="text-sm text-gray-600 dark:text-gray-300">
                address vaultAddress<br />
                20 bytes (40 hex chars)<br />
                Multi-chain support<br />
                CREATE2 deterministic
              </code>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-300">
              CAIP-10 Format
            </h3>
            <code className="text-sm text-blue-700 dark:text-blue-400 break-all">
              eip155:84532:0x1234567890123456789012345678901234567890
            </code>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              namespace:chainId:address → Multi-chain standardized identifier
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          <p>
            🧪 Generated with Claude Code | ID Design Refactor Phase 1-4 Complete
          </p>
        </footer>
      </div>
    </div>
  );
}

export default IdRefactorDemo;
