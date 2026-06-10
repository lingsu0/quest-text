import type { 
  Question, 
  ExamMode, 
  ExamState, 
  ExamResult, 
  UserAnswer,
  QuestionFilter,
  AnswerStatus
} from './types.js';
import { saveExamState, loadExamState, clearExamState, saveUserAnswer } from './storage.js';

/**
 * 考试管理类
 */
export class ExamManager {
  private questions: Question[] = [];
  private state: ExamState;
  private mode: ExamMode;

  constructor(questions: Question[], mode: ExamMode = 'practice') {
    this.questions = questions;
    this.mode = mode;
    
    // 尝试恢复状态
    const savedState = loadExamState();
    if (savedState && savedState.mode === mode) {
      this.state = savedState;
    } else {
      this.state = {
        mode,
        currentIndex: 0,
        answers: {},
        startTime: Date.now(),
        questionIds: questions.map(q => q.id),
        isSubmitted: false
      };
      this.saveState();
    }
  }

  /**
   * 获取当前题目
   */
  getCurrentQuestion(): Question | null {
    return this.questions[this.state.currentIndex] || null;
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this.state.currentIndex;
  }

  /**
   * 获取题目总数
   */
  getTotalCount(): number {
    return this.questions.length;
  }

  /**
   * 切换到指定题目
   */
  goToQuestion(index: number): boolean {
    if (index >= 0 && index < this.questions.length) {
      this.state.currentIndex = index;
      this.saveState();
      return true;
    }
    return false;
  }

  /**
   * 下一题
   */
  nextQuestion(): boolean {
    return this.goToQuestion(this.state.currentIndex + 1);
  }

  /**
   * 上一题
   */
  prevQuestion(): boolean {
    return this.goToQuestion(this.state.currentIndex - 1);
  }

  /**
   * 提交答案
   */
  submitAnswer(questionId: string, answer: unknown, isCorrect: boolean): void {
    const userAnswer: UserAnswer = {
      questionId,
      answer: answer as string | string[] | boolean,
      isCorrect,
      answeredAt: Date.now()
    };
    
    this.state.answers[questionId] = userAnswer;
    saveUserAnswer(questionId, userAnswer);
    this.saveState();
  }

  /**
   * 获取用户答案
   */
  getUserAnswer(questionId: string): UserAnswer | undefined {
    return this.state.answers[questionId];
  }

  /**
   * 获取答题状态
   */
  getAnswerStatus(questionId: string): AnswerStatus {
    const answer = this.state.answers[questionId];
    if (!answer) return 'unanswered';
    return answer.isCorrect ? 'correct' : 'wrong';
  }

  /**
   * 是否已答题
   */
  isAnswered(questionId: string): boolean {
    return !!this.state.answers[questionId];
  }

  /**
   * 获取已答题数量
   */
  getAnsweredCount(): number {
    return Object.keys(this.state.answers).length;
  }

  /**
   * 获取正确题数
   */
  getCorrectCount(): number {
    return Object.values(this.state.answers).filter(a => a.isCorrect).length;
  }

  /**
   * 获取错误题数
   */
  getWrongCount(): number {
    return Object.values(this.state.answers).filter(a => !a.isCorrect).length;
  }

  /**
   * 获取得分
   */
  getScore(): number {
    let score = 0;
    Object.values(this.state.answers).forEach(answer => {
      if (answer.isCorrect) {
        const question = this.questions.find(q => q.id === answer.questionId);
        if (question) {
          score += question.points;
        }
      }
    });
    return score;
  }

  /**
   * 获取总分
   */
  getTotalPoints(): number {
    return this.questions.reduce((sum, q) => sum + q.points, 0);
  }

  /**
   * 提交考试
   */
  submitExam(): ExamResult {
    this.state.isSubmitted = true;
    const endTime = Date.now();
    
    const result: ExamResult = {
      totalQuestions: this.questions.length,
      answeredQuestions: this.getAnsweredCount(),
      correctCount: this.getCorrectCount(),
      wrongCount: this.getWrongCount(),
      totalPoints: this.getTotalPoints(),
      obtainedPoints: this.getScore(),
      startTime: this.state.startTime,
      endTime,
      duration: Math.floor((endTime - this.state.startTime) / 1000),
      answers: Object.values(this.state.answers),
      wrongQuestionIds: Object.values(this.state.answers)
        .filter(a => !a.isCorrect)
        .map(a => a.questionId)
    };
    
    this.saveState();
    return result;
  }

  /**
   * 是否已提交
   */
  isSubmitted(): boolean {
    return this.state.isSubmitted;
  }

  /**
   * 获取模式
   */
  getMode(): ExamMode {
    return this.mode;
  }

  /**
   * 获取所有题目
   */
  getQuestions(): Question[] {
    return this.questions;
  }

  /**
   * 保存状态
   */
  private saveState(): void {
    saveExamState(this.state);
  }

  /**
   * 重置考试
   */
  reset(): void {
    clearExamState();
    this.state = {
      mode: this.mode,
      currentIndex: 0,
      answers: {},
      startTime: Date.now(),
      questionIds: this.questions.map(q => q.id),
      isSubmitted: false
    };
    this.saveState();
  }
}

/**
 * 题目筛选函数
 */
export function filterQuestions(questions: Question[], filter: QuestionFilter): Question[] {
  return questions.filter(q => {
    if (filter.type && q.type !== filter.type) return false;
    if (filter.difficulty && q.difficulty !== filter.difficulty) return false;
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(keyword);
      const matchContent = q.content.toLowerCase().includes(keyword);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });
}

/**
 * 加载题目数据
 */
export async function loadQuestions(): Promise<Question[]> {
  try {
    const response = await fetch('data/questions.json');
    if (!response.ok) {
      throw new Error('加载题目数据失败');
    }
    const data = await response.json();
    return data.questions as Question[];
  } catch (error) {
    console.error('加载题目数据失败:', error);
    return [];
  }
}

/**
 * 格式化时间
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 运行 JavaScript 代码（安全沙箱）
 */
export function runJavaScriptCode(code: string): { success: boolean; output: string; error?: string } {
  try {
    // 安全检查：禁止访问危险全局对象
    const forbiddenPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /document\s*\.\s*write/i,
      /window\s*\.\s*location/i,
      /fetch\s*\(/i,
      /XMLHttpRequest/i,
      /WebSocket/i,
      /localStorage/i,
      /sessionStorage/i,
      /import\s*\(/i,
      /importScripts/i
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(code)) {
        return {
          success: false,
          output: '',
          error: '安全警告：代码包含禁止使用的 API'
        };
      }
    }

    // 创建安全的执行环境
    const consoleOutput: string[] = [];
    const mockConsole = {
      log: (...args: unknown[]) => consoleOutput.push(args.map(a => String(a)).join(' ')),
      error: (...args: unknown[]) => consoleOutput.push('Error: ' + args.map(a => String(a)).join(' ')),
      warn: (...args: unknown[]) => consoleOutput.push('Warning: ' + args.map(a => String(a)).join(' ')),
      info: (...args: unknown[]) => consoleOutput.push(args.map(a => String(a)).join(' '))
    };

    // 使用 iframe 沙箱或 Worker 更安全，这里使用受限的 Function
    const func = new Function('console', `
      "use strict";
      const window = undefined;
      const document = undefined;
      const globalThis = undefined;
      const self = undefined;
      const top = undefined;
      const parent = undefined;
      const location = undefined;
      const localStorage = undefined;
      const sessionStorage = undefined;
      const indexedDB = undefined;
      const fetch = undefined;
      const XMLHttpRequest = undefined;
      const WebSocket = undefined;
      const importScripts = undefined;
      ${code}
    `);
    func(mockConsole);

    return {
      success: true,
      output: consoleOutput.join('\n') || '代码执行成功（无输出）'
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
