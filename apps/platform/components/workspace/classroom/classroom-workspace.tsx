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
import { useLectureVoice } from '@/lib/classroom/speech'
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
  // Drive the AI lecturer's voice (speaks each explanation, honors mute/pause/mic).
  useLectureVoice()

  return (
    <div className="h-svh w-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left — lesson resources */}
        <ResizablePanel defaultSize={22} minSize={16} maxSize={32}>
          <ClassroomSidebar onUploadClick={onUploadClick} userEmail={userEmail} profile={profile} />
        </ResizablePanel>

        <ResizableHandle />

        {/* Center — the teaching whiteboard occupies the majority of the screen */}
        <ResizablePanel defaultSize={54} minSize={38}>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-center px-4 py-2.5">
              <ModeSwitcher />
            </div>
            <Separator className="shrink-0" />
            <div className="min-h-0 flex-1">
              <ClassroomBoardPanel />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right — the interaction panel (conversation, timeline, session) */}
        <ResizablePanel defaultSize={24} minSize={18} maxSize={34}>
          <ClassroomChatPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
