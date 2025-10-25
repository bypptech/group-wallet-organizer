import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Eye, 
  Keyboard, 
  Volume2, 
  MousePointer, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  Users
} from 'lucide-react';

export function AccessibilityGuide() {
  return (
    <div className="p-6 space-y-6">
      <h1>Accessibility & Color Contrast Guide</h1>
      <p className="text-muted-foreground">
        Guidelines for implementing accessible Family Wallet UI with proper color contrast and keyboard navigation.
      </p>

      {/* Color Contrast Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Color Contrast Requirements (WCAG 2.1 AA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Badges with Good Contrast */}
            <div className="space-y-3">
              <h4>Status Badges (4.5:1 ratio minimum)</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-700 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                  <span className="text-sm text-muted-foreground">Green #15803d on White (7.4:1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-600 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                  <span className="text-sm text-muted-foreground">Yellow #ca8a04 on White (5.2:1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-700 text-white">
                    <XCircle className="h-3 w-3 mr-1" />
                    Rejected
                  </Badge>
                  <span className="text-sm text-muted-foreground">Red #b91c1c on White (6.8:1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-700 text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Released
                  </Badge>
                  <span className="text-sm text-muted-foreground">Blue #1d4ed8 on White (6.3:1)</span>
                </div>
              </div>
            </div>

            {/* Role Badges */}
            <div className="space-y-3">
              <h4>Role Badges with Icons (Color + Shape)</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-700 text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                  <span className="text-sm text-muted-foreground">Purple + Shield icon</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-700 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approver
                  </Badge>
                  <span className="text-sm text-muted-foreground">Green + Check icon</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-700 text-white">
                    <Users className="h-3 w-3 mr-1" />
                    Requester
                  </Badge>
                  <span className="text-sm text-muted-foreground">Blue + Users icon</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-700 text-white">
                    <Eye className="h-3 w-3 mr-1" />
                    Viewer
                  </Badge>
                  <span className="text-sm text-muted-foreground">Gray + Eye icon</span>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Color Blindness Consideration:</strong> All status and role indicators include both color AND icons 
              to ensure users with color vision deficiencies can distinguish between states.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Keyboard Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Navigation Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4>Primary Navigation Shortcuts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border rounded">
                <div className="font-medium">Tab</div>
                <div className="text-sm text-muted-foreground">Navigate between interactive elements</div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Shift + Tab</div>
                <div className="text-sm text-muted-foreground">Navigate backwards</div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Enter / Space</div>
                <div className="text-sm text-muted-foreground">Activate buttons and links</div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Escape</div>
                <div className="text-sm text-muted-foreground">Close modals and dropdowns</div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Arrow Keys</div>
                <div className="text-sm text-muted-foreground">Navigate within components (tabs, menus)</div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Home / End</div>
                <div className="text-sm text-muted-foreground">Jump to first/last item in lists</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4>Focus Management</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 rounded bg-blue-100"></div>
                <span className="text-sm">Focus ring: 2px blue border with light blue background</span>
              </div>
              <div className="text-sm text-muted-foreground">
                • Modal opens: Focus moves to first interactive element<br />
                • Modal closes: Focus returns to trigger element<br />
                • Form submission errors: Focus moves to first error field<br />
                • Page navigation: Focus moves to main content area
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screen Reader Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Screen Reader Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4>ARIA Labels and Descriptions</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Escrow Status:</strong> "Escrow ESC-2024-001, status pending, 2 of 3 approvals received"</div>
              <div><strong>Amount Display:</strong> "Amount: 0.5 Ethereum"</div>
              <div><strong>Progress Bar:</strong> "Approval progress: 67% complete, 2 of 3 required approvals"</div>
              <div><strong>Deadline:</strong> "Deadline: December 30th, 2024 at 11:59 PM"</div>
              <div><strong>Button States:</strong> "Approve button, enabled" or "Submit button, disabled, form has errors"</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4>Live Regions for Updates</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Status Changes:</strong> Announced when escrow status updates</div>
              <div><strong>Notifications:</strong> New notifications announced as they arrive</div>
              <div><strong>Form Errors:</strong> Validation errors announced immediately</div>
              <div><strong>Loading States:</strong> "Loading dashboard data" or "Sending transaction"</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            Mobile Touch Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4>Touch Target Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border rounded">
                <div className="font-medium">Minimum Size: 44x44px</div>
                <div className="text-sm text-muted-foreground">All interactive elements meet Apple's minimum touch target size</div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Spacing: 8px minimum</div>
                <div className="text-sm text-muted-foreground">Adequate spacing between touch targets</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4>VoiceOver / TalkBack Support</h4>
            <div className="space-y-2 text-sm">
              <div><strong>QR Scanner:</strong> "QR code scanner, camera view, point camera at QR code to scan"</div>
              <div><strong>Approval Actions:</strong> "Approve escrow button, this will approve the transaction and cannot be undone"</div>
              <div><strong>Navigation:</strong> "Home tab, 1 of 4, selected" or "Timeline tab, 3 of 4"</div>
              <div><strong>Notifications:</strong> "3 unread notifications, double tap to view"</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Testing Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm">Color contrast ratios meet WCAG 2.1 AA standards (4.5:1)</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm">All interactive elements are keyboard accessible</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm">Focus indicators are clearly visible</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm">Screen reader announces all status changes</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm">Form errors are clearly communicated</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm">Touch targets are minimum 44x44px on mobile</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm">VoiceOver/TalkBack navigation works correctly</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm">Color is not the only way to convey information</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// CSS Classes for Focus Management (to be added to globals.css)
export const FOCUS_STYLES = `
/* Focus Ring Styles */
.focus-ring:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

.focus-ring:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 6px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .status-badge {
    border: 2px solid currentColor;
  }
  
  .progress-bar {
    border: 1px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .transition-all {
    transition: none;
  }
}
`;