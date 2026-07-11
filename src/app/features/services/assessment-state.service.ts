import { Injectable } from '@angular/core';

export interface AssessmentAnswer {
  questionId: string;
  value: any;
  timestamp: number;
}

export interface AssessmentState {
  testId: string | null;
  gender: string;
  birthYear: number;
  startTime: number;
  tiempoTranscurrido: number;
  answers: AssessmentAnswer[];
  finished: boolean;
}

@Injectable({ providedIn: 'root' })
export class AssessmentStateService {
  private state: AssessmentState = this.getEmptyState();

  private getEmptyState(): AssessmentState {
    return {
      testId: null,
      gender: 'No definido',
      birthYear: 0,
      startTime: Date.now(),
      tiempoTranscurrido: 0,
      answers: [],
      finished: false,
    };
  }

  setTestId(testId: string): void {
    this.state.testId = testId;
  }

  setDemographics(gender: string, birthYear: number, startTime: number): void {
    this.state.gender = gender;
    this.state.birthYear = birthYear;
    this.state.startTime = startTime;
  }

  saveAnswer(questionId: string, value: any): void {
    const existing = this.state.answers.findIndex(a => a.questionId === questionId);
    const entry: AssessmentAnswer = { questionId, value, timestamp: Date.now() };
    if (existing >= 0) {
      this.state.answers[existing] = entry;
    } else {
      this.state.answers.push(entry);
    }
  }

  getCurrentState(): AssessmentState {
    return { ...this.state, answers: [...this.state.answers] };
  }

  finishAssessment(tiempoTranscurrido: number): void {
    this.state.finished = true;
    this.state.tiempoTranscurrido = tiempoTranscurrido;
  }

  clearState(): void {
    this.state = this.getEmptyState();
  }
}
