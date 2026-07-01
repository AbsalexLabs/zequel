'use client'

import { useWorkspaceStore } from '@/lib/store'
import { useClassroom } from './use-classroom'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@zequel/ui/components/tooltip'
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react'

// Small round control used across the voice bar.
function VoiceBtn({
  label,
  icon,
  onClick,
  active,
  disabled,
  tone = 'default',
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  tone?: 'default' | 'mic'
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40',
            active && tone === 'mic'
              ? 'bg-destructive text-background'
              : active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent className="font-mono text-[10px] uppercase tracking-wider">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

// Voice-first toolbar. Narration is not generated yet — these controls drive
// the placeholder voice state so the real voice lecturer can be wired in later
// without changing the interface.
export function ClassroomVoiceBar() {
  const { classroomVoice, setClassroomVoice, classroomStatus, isClassroomBusy } =
    useWorkspaceStore()
  const { pauseLesson, resumeLesson, repeatTopic } = useClassroom()

  const isTeaching = classroomStatus === 'teaching'
  const isPaused = classroomStatus === 'paused'
  const speaking = (isTeaching || classroomVoice.playing) && !classroomVoice.muted
  const listening = classroomVoice.micActive

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2]
    const idx = speeds.indexOf(classroomVoice.speed)
    setClassroomVoice({ speed: speeds[(idx + 1) % speeds.length] })
  }

  const VolumeIcon =
    classroomVoice.muted || classroomVoice.volume === 0
      ? VolumeX
      : classroomVoice.volume < 50
        ? Volume1
        : Volume2

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* AI speaking indicator — the anchor of the voice-first experience */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
          speaking
            ? 'border-foreground/30 bg-secondary/60'
            : 'border-border bg-transparent'
        )}
        aria-label={speaking ? 'Instructor is speaking' : 'Instructor is idle'}
      >
        {/* Animated waveform bars (decorative; static when idle) */}
        <span className="flex h-4 items-end gap-[2px]" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                'w-[2px] rounded-full',
                speaking ? 'bg-foreground animate-pulse' : 'h-1 bg-muted-foreground/40'
              )}
              style={
                speaking
                  ? {
                      height: `${[8, 14, 16, 11, 6][i]}px`,
                      animationDelay: `${i * 0.12}s`,
                      animationDuration: '0.9s',
                    }
                  : undefined
              }
            />
          ))}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">
          {classroomVoice.muted
            ? 'Muted'
            : speaking
              ? 'Speaking'
              : isPaused
                ? 'Paused'
                : 'Idle'}
        </span>
      </div>

      {/* Student microphone — interrupt the lecture at any time (placeholder) */}
      <VoiceBtn
        label={listening ? 'Stop microphone' : 'Speak to interrupt'}
        tone="mic"
        active={listening}
        icon={listening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        onClick={() => setClassroomVoice({ micActive: !listening })}
      />

      {/* Pause / resume the live lecture */}
      {isTeaching ? (
        <VoiceBtn
          label="Pause lecture"
          icon={<Pause className="h-4 w-4" />}
          onClick={pauseLesson}
          disabled={isClassroomBusy}
        />
      ) : (
        <VoiceBtn
          label="Resume lecture"
          icon={<Play className="h-4 w-4" />}
          onClick={resumeLesson}
          disabled={isClassroomBusy || classroomStatus === 'idle'}
          active={isPaused}
        />
      )}

      {/* Replay last explanation */}
      <VoiceBtn
        label="Replay last explanation"
        icon={<RotateCcw className="h-4 w-4" />}
        onClick={repeatTopic}
        disabled={isClassroomBusy || classroomStatus === 'idle'}
      />

      <div className="flex-1" />

      {/* Voice speed */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={cycleSpeed}
            aria-label="Voice speed"
            className="flex h-8 items-center gap-1 rounded-md px-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Gauge className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px]">{classroomVoice.speed}x</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="font-mono text-[10px] uppercase tracking-wider">
          Voice speed
        </TooltipContent>
      </Tooltip>

      {/* Volume — mute toggle plus a compact slider */}
      <div className="flex items-center gap-1.5">
        <VoiceBtn
          label={classroomVoice.muted ? 'Unmute AI' : 'Mute AI'}
          icon={<VolumeIcon className="h-4 w-4" />}
          onClick={() => setClassroomVoice({ muted: !classroomVoice.muted })}
          active={classroomVoice.muted}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={classroomVoice.muted ? 0 : classroomVoice.volume}
          onChange={(e) =>
            setClassroomVoice({ volume: Number(e.target.value), muted: false })
          }
          aria-label="Voice volume"
          className="hidden h-1 w-20 cursor-pointer appearance-none rounded-full bg-secondary accent-foreground sm:block"
        />
      </div>
    </div>
  )
}
