import { atom } from 'jotai';

export enum TimerMode {
  Countdown = 'Timer',
  OpenSession = 'Stopwatch',
}

export interface TimerState {
  mode: TimerMode;
  time: number;
  isActive: boolean;
  isBreakMode: boolean;
  studyBlockId: number | null;
}

export const timerAtom = atom<TimerState>({
  mode: TimerMode.Countdown,
  time: 0,
  isActive: false,
  isBreakMode: false,
  studyBlockId: null,
});