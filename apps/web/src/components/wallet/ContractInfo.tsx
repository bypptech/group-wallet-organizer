import { useAccount, useChainId } from 'wagmi'
import { useReadEscrowRegistry } from '@/hooks/contracts/useEscrowRegistry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

export function ContractInfo() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { address: contractAddress } = useReadEscrowRegistry()

  const getExplorerUrl = (addr: string) => {
    if (chainId === 8453) {
      return `https://basescan.org/address/${addr}`
    }
    return `https://sepolia.basescan.org/address/${addr}`
  }

  const getChainName = () => {
    if (chainId === 8453) return 'Base Mainnet'
    if (chainId === 84532) return 'Base Sepolia'
    return `Chain ${chainId}`
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contract Information</h3>
        <Badge variant="outline">{getChainName()}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        EscrowRegistry contract details
      </p>
      <div>
        <p className="text-sm text-muted-foreground mb-1">Contract Address</p>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {contractAddress}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(getExplorerUrl(contractAddress), '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isConnected && address && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Your Address</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {address}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(getExplorerUrl(address), '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="pt-2">
        <p className="text-sm text-muted-foreground mb-2">Status</p>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Connected</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-sm">Not connected</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
