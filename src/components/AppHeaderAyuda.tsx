'use client';
import GuideButton from '@/components/GuideButton';
import TooltipToggle from '@/components/TooltipToggle';
import { GUIAS, type HelpContext } from '@/lib/guias';

export default function AppHeaderAyuda({ context }: { context: HelpContext }) {
  return <div className="flex items-center justify-self-end gap-2"><GuideButton steps={GUIAS[context]} label="Guía" /><TooltipToggle /></div>;
}
