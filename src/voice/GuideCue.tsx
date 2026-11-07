import type { Guide } from './guides'
export default function GuideCue({ guide }: { guide: Guide }) {
  return <span hidden data-voice-cue={guide.id} data-voice-text={guide.text} data-voice-target={guide.target} data-voice-existing={guide.existing} data-voice-announce={guide.announce} data-voice-next-label={guide.nextLabelTarget} data-voice-narration={guide.narration ? JSON.stringify(guide.narration) : undefined} data-voice-quiet={guide.quiet ? 'true' : undefined} data-voice-always={guide.always ? 'true' : undefined} data-voice-no-bubble={guide.noBubble ? 'true' : undefined} data-voice-focus-line={guide.lineFocus?.line} data-voice-focus-target={guide.lineFocus?.target} />
}
