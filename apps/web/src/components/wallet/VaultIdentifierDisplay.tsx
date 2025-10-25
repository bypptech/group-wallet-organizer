/**
 * VaultIdentifierDisplay Component
 *
 * Display vault information with various identifier formats
 * - Short address
 * - Full address
 * - CAIP-10 format
 * - Copy to clipboard
 * - Link to block explorer
 */

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import type { VaultIdentifier } from '@shared/types/identifiers'
import { getExplorerAddressUrl } from '@shared/utils/identifiers'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface VaultIdentifierDisplayProps {
  vaultIdentifier: VaultIdentifier
  format?: 'short' | 'full' | 'caip10' | 'name'
  showCopy?: boolean
  showExplorer?: boolean
  showChainBadge?: boolean
  className?: string
}

export function VaultIdentifierDisplay({
  vaultIdentifier,
  format = 'short',
  showCopy = true,
  showExplorer = true,
  showChainBadge = false,
  className = '',
}: VaultIdentifierDisplayProps) {
  const [copied, setCopied] = useState(false)

  const getDisplayText = () => {
    switch (format) {
      case 'short':
        return vaultIdentifier.shortAddress
      case 'full':
        return vaultIdentifier.address
      case 'caip10':
        return vaultIdentifier.caip10
      case 'name':
        return vaultIdentifier.name
      default:
        return vaultIdentifier.shortAddress
    }
  }

  const getCopyValue = () => {
    switch (format) {
      case 'caip10':
        return vaultIdentifier.caip10
      default:
        return vaultIdentifier.address
    }
  }

  const handleCopy = async () => {
    const value = getCopyValue()
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const explorerUrl = getExplorerAddressUrl(vaultIdentifier.chainId, vaultIdentifier.address)

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Display Text */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {getDisplayText()}
            </code>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="text-xs">
                <span className="font-semibold">Name:</span> {vaultIdentifier.name}
              </p>
              <p className="text-xs">
                <span className="font-semibold">Address:</span> {vaultIdentifier.address}
              </p>
              <p className="text-xs">
                <span className="font-semibold">Chain ID:</span> {vaultIdentifier.chainId}
              </p>
              <p className="text-xs">
                <span className="font-semibold">CAIP-10:</span> {vaultIdentifier.caip10}
              </p>
              {vaultIdentifier.uuid && (
                <p className="text-xs">
                  <span className="font-semibold">UUID:</span> {vaultIdentifier.uuid}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Chain Badge */}
      {showChainBadge && (
        <Badge variant="outline" className="text-xs">
          Chain {vaultIdentifier.chainId}
        </Badge>
      )}

      {/* Copy Button */}
      {showCopy && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Explorer Link */}
      {showExplorer && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => window.open(explorerUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View on block explorer</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

/**
 * Compact vault display for cards
 */
interface VaultCardDisplayProps {
  vaultIdentifier: VaultIdentifier
  className?: string
}

export function VaultCardDisplay({ vaultIdentifier, className = '' }: VaultCardDisplayProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{vaultIdentifier.name}</h3>
        <Badge variant="outline" className="text-xs">
          Chain {vaultIdentifier.chainId}
        </Badge>
      </div>
      <VaultIdentifierDisplay
        vaultIdentifier={vaultIdentifier}
        format="short"
        showCopy
        showExplorer
      />
    </div>
  )
}

/**
 * Full vault details display
 */
interface VaultDetailsDisplayProps {
  vaultIdentifier: VaultIdentifier
  className?: string
}

export function VaultDetailsDisplay({ vaultIdentifier, className = '' }: VaultDetailsDisplayProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="text-sm font-medium text-muted-foreground">Vault Name</label>
        <p className="text-base font-semibold">{vaultIdentifier.name}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">Address</label>
        <VaultIdentifierDisplay
          vaultIdentifier={vaultIdentifier}
          format="full"
          showCopy
          showExplorer
        />
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">CAIP-10 Identifier</label>
        <VaultIdentifierDisplay
          vaultIdentifier={vaultIdentifier}
          format="caip10"
          showCopy={false}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">Chain ID</label>
        <p className="text-base">{vaultIdentifier.chainId}</p>
      </div>

      {vaultIdentifier.uuid && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">UUID</label>
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded block">
            {vaultIdentifier.uuid}
          </code>
        </div>
      )}

      {vaultIdentifier.salt && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">CREATE2 Salt</label>
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded block overflow-x-auto">
            {vaultIdentifier.salt}
          </code>
        </div>
      )}

      {vaultIdentifier.factoryAddress && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Factory Address</label>
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded block">
            {vaultIdentifier.factoryAddress}
          </code>
        </div>
      )}
    </div>
  )
}
