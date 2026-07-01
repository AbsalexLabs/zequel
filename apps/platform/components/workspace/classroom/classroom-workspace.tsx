'use client'

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@zequel/ui/components/resizable'
import { Separator } from '@zequel/ui/components/separator'
import { ModeSwitcher } from '../mode-switcher'
import { ClassroomSidebar } from './classroom-sidebar'
import { ClassroomBoardPanel } from './classroom-board-panel'
import { ClassroomChatPanel } from './classroom-chat-panel'
import type { Profile } from '@zequel/types'

interface ClassroomWorkspaceProps {
  onUploadClick: () => void
  userEmail?: string
  profile?: Profile | null
}

// Desktop Classroom layout: a left sidebar of lesson resources plus a main
// workspace split vertically into the teaching whiteboard (top) and the
// lecturer <-> student conversation (bottom).
export function ClassroomWorkspace({
  onUploadClick,
  userEmail,
  profile,
}: ClassroomWorkspaceProps) {
  return (
    <div className="h-svh w-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left — lesson resources */}
        <ResizablePanel defaultSize={22} minSize={16} maxSize={32}>
          <ClassroomSidebar onUploadClick={onUploadClick} userEmail={userEmail} profile={profile} />
        </ResizablePanel>

        <ResizableHandle />

        {/* Main workspace */}
        <ResizablePanel defaultSize={78} minSize={50}>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-center px-4 py-2.5">
              <ModeSwitcher />
            </div>
            <Separator className="shrink-0" />

            {/* Whiteboard (top) + conversation (bottom) */}
            <div className="min-h-0 flex-1">
              <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={64} minSize={35}>
                  <ClassroomBoardPanel />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={36} minSize={20}>
                  <ClassroomChatPanel />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
