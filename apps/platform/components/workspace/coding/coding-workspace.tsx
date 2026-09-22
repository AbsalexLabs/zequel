'use client'

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@zequel/ui/components/resizable'
import { CodingFilesPanel } from './coding-files-panel'
import { CodingAssistantPanel } from './coding-assistant-panel'
import { CodingToolbar } from './coding-toolbar'
import { CodingCenter } from './coding-center'
import { CodingTerminal } from './coding-terminal'
import { useCodingIdeStore } from '@/lib/coding/coding-ide-store'
import { useWorkspaceStore } from '@/lib/store'
import type { Profile } from '@zequel/types'

interface CodingWorkspaceProps {
  userEmail?: string
  profile?: Profile | null
}

/**
 * Desktop Coding Mode IDE layout.
 *
 *   ┌───────────────────── toolbar ─────────────────────┐
 *   │ files │ editor / preview / split │ AI assistant    │
 *   │       │──────── terminal ────────│                 │
 *   └────────────────────────────────────────────────────┘
 *
 * All panels are resizable; the terminal and assistant collapse via the toolbar
 * toggles. Every runtime action is routed through the CodingRuntime abstraction.
 */
export function CodingWorkspace({ userEmail, profile }: CodingWorkspaceProps) {
  const { setPendingCodingAction } = useWorkspaceStore()
  const { terminalOpen, setTerminalOpen, assistantOpen } = useCodingIdeStore()

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      <CodingToolbar userEmail={userEmail} profile={profile} />

      <div className="min-h-0 flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left — file explorer */}
          <ResizablePanel defaultSize={20} minSize={14} maxSize={30}>
            <CodingFilesPanel hideHeader userEmail={userEmail} profile={profile} />
          </ResizablePanel>

          <ResizableHandle />

          {/* Center — editor / preview / split over terminal */}
          <ResizablePanel defaultSize={assistantOpen ? 56 : 80} minSize={30}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={terminalOpen ? 62 : 100} minSize={20}>
                <CodingCenter onAction={setPendingCodingAction} />
              </ResizablePanel>
              {terminalOpen && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={38} minSize={12}>
                    <CodingTerminal onClose={() => setTerminalOpen(false)} />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Right — Zequel AI coding assistant */}
          {assistantOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={24} minSize={16} maxSize={34}>
                <CodingAssistantPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
