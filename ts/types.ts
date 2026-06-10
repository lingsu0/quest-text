/**
 * 题目类型枚举
 */
export type QuestionType = 'single_choice' | 'multiple_choice' | 'fill_blank' | 'true_false' | 'coding' | 'short_answer';

/**
 * 难度级别
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * 答题模式
 */
export type ExamMode = 'practice' | 'exam';

/**
 * 答题状态
 */
export type AnswerStatus = 'unanswered' | 'answered' | 'correct' | 'wrong';

/**
 * 基础题目接口
 */
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  title: string;
  content: string;
  explanation: string;
  difficulty: Difficulty;
  points: number;
}

/**
 * 单选题
 */
export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single_choice';
  options: string[];
  correctAnswer: string; // 正确选项索引，如 "A"
}

/**
 * 多选题
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
  correctAnswer: string[]; // 正确选项索引数组，如 ["A", "C"]
}

/**
 * 填空题
 */
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill_blank';
  correctAnswer: string | string[]; // 正确答案，支持多个空
}

/**
 * 判断题
 */
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  options: string[]; // ["正确", "错误"] 或 ["True", "False"]
  correctAnswer: boolean;
}

/**
 * 编程题
 */
export interface CodingQuestion extends BaseQuestion {
  type: 'coding';
  correctAnswer: string; // 参考代码或测试用例
  language: string; // 编程语言，如 "javascript", "python"
}

/**
 * 简答题
 */
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  correctAnswer: string; // 参考答案
  keywords?: string[]; // 关键词，用于自动评分
}

/**
 * 题目联合类型
 */
export type Question = 
  | SingleChoiceQuestion 
  | MultipleChoiceQuestion 
  | FillBlankQuestion 
  | TrueFalseQuestion 
  | CodingQuestion
  | ShortAnswerQuestion;

/**
 * 用户答案接口
 */
export interface UserAnswer {
  questionId: string;
  answer: string | string[] | boolean;
  isCorrect: boolean;
  answeredAt: number; // 时间戳
}

/**
 * 考试结果接口
 */
export interface ExamResult {
  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  wrongCount: number;
  totalPoints: number;
  obtainedPoints: number;
  startTime: number;
  endTime: number;
  duration: number; // 用时（秒）
  answers: UserAnswer[];
  wrongQuestionIds: string[];
}

/**
 * 考试状态接口（用于本地存储）
 */
export interface ExamState {
  mode: ExamMode;
  currentIndex: number;
  answers: Record<string, UserAnswer>; // questionId -> UserAnswer
  startTime: number;
  questionIds: string[];
  isSubmitted: boolean;
}

/**
 * 题目筛选条件
 */
export interface QuestionFilter {
  type?: QuestionType;
  difficulty?: Difficulty;
  keyword?: string;
  status?: AnswerStatus;
}
