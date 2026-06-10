import type { ExamState, UserAnswer } from './types.js';

const STORAGE_KEY = 'exam_state';
const RESULTS_KEY = 'exam_results';

/**
 * 保存考试状态到 localStorage
 */
export function saveExamState(state: ExamState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('保存考试状态失败:', e);
  }
}

/**
 * 从 localStorage 加载考试状态
 */
export function loadExamState(): ExamState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as ExamState;
    }
  } catch (e) {
    console.error('加载考试状态失败:', e);
  }
  return null;
}

/**
 * 清除考试状态
 */
export function clearExamState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 保存用户答案
 */
export function saveUserAnswer(questionId: string, answer: UserAnswer): void {
  const state = loadExamState();
  if (state) {
    state.answers[questionId] = answer;
    saveExamState(state);
  }
}

/**
 * 保存考试结果
 */
export function saveExamResult(result: unknown): void {
  try {
    const results = loadExamResults();
    results.push(result);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (e) {
    console.error('保存考试结果失败:', e);
  }
}

/**
 * 加载所有考试结果
 */
export function loadExamResults(): unknown[] {
  try {
    const data = localStorage.getItem(RESULTS_KEY);
    if (data) {
      return JSON.parse(data) as unknown[];
    }
  } catch (e) {
    console.error('加载考试结果失败:', e);
  }
  return [];
}

/**
 * 清除所有考试结果
 */
export function clearExamResults(): void {
  localStorage.removeItem(RESULTS_KEY);
}
