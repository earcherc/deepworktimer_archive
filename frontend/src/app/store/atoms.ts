import { atom } from 'jotai';

export enum TimerMode {
  Countdown = 'Timer',
  OpenSession = 'Stopwatch',
}

export const timerModeAtom = atom<TimerMode>(TimerMode.Countdown);