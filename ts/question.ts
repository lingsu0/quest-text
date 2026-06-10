import type { Question, QuestionType, UserAnswer, ExamMode } from './types.js';

/**
 * 获取题型显示名称
 */
export function getQuestionTypeName(type: QuestionType): string {
  const typeNames: Record<QuestionType, string> = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    fill_blank: '填空题',
    true_false: '判断题',
    coding: '编程题',
    short_answer: '简答题'
  };
  return typeNames[type];
}

/**
 * 获取题型标签颜色
 */
export function getQuestionTypeColor(type: QuestionType): string {
  const typeColors: Record<QuestionType, string> = {
    single_choice: '#3498db',
    multiple_choice: '#9b59b6',
    fill_blank: '#e67e22',
    true_false: '#1abc9c',
    coding: '#e74c3c',
    short_answer: '#2ecc71'
  };
  return typeColors[type];
}

/**
 * 获取难度显示名称
 */
export function getDifficultyName(difficulty: string): string {
  const difficultyNames: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };
  return difficultyNames[difficulty] || difficulty;
}

/**
 * 获取难度颜色
 */
export function getDifficultyColor(difficulty: string): string {
  const difficultyColors: Record<string, string> = {
    easy: '#27ae60',
    medium: '#f39c12',
    hard: '#e74c3c'
  };
  return difficultyColors[difficulty] || '#95a5a6';
}

/**
 * 创建题型标签 HTML
 */
export function createTypeBadge(type: QuestionType): string {
  return `<span class="type-badge" style="background-color: ${getQuestionTypeColor(type)}">${getQuestionTypeName(type)}</span>`;
}

/**
 * 创建难度标签 HTML
 */
export function createDifficultyBadge(difficulty: string): string {
  return `<span class="difficulty-badge" style="background-color: ${getDifficultyColor(difficulty)}">${getDifficultyName(difficulty)}</span>`;
}

/**
 * 渲染题目内容
 */
export function renderQuestionContent(question: Question): string {
  return `
    <div class="question-header">
      <div class="question-badges">
        ${createTypeBadge(question.type)}
        ${createDifficultyBadge(question.difficulty)}
        <span class="points-badge">${question.points}分</span>
      </div>
      <h2 class="question-title">${question.title}</h2>
    </div>
    <div class="question-body">
      <div class="question-content">${formatContent(question.content)}</div>
    </div>
  `;
}

/**
 * 格式化内容（处理换行等）
 */
function formatContent(content: string): string {
  return content.replace(/\n/g, '<br>');
}

/**
 * 渲染单选题
 */
export function renderSingleChoice(
  question: Question,
  userAnswer?: string,
  showAnswer?: boolean
): string {
  if (question.type !== 'single_choice') return '';
  
  const options = question.options || [];
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  let html = '<div class="options-list single-choice">';
  options.forEach((option, index) => {
    const label = labels[index] || String(index);
    const isSelected = userAnswer === label;
    const isCorrect = question.correctAnswer === label;
    let className = 'option-item';
    
    if (showAnswer) {
      if (isCorrect) className += ' correct';
      else if (isSelected && !isCorrect) className += ' wrong';
    } else if (isSelected) {
      className += ' selected';
    }
    
    html += `
      <label class="${className}" data-value="${label}">
        <input type="radio" name="answer" value="${label}" ${isSelected ? 'checked' : ''} ${showAnswer ? 'disabled' : ''}>
        <span class="option-label">${label}.</span>
        <span class="option-text">${escapeHtml(option)}</span>
      </label>
    `;
  });
  html += '</div>';
  
  return html;
}

/**
 * 渲染多选题
 */
export function renderMultipleChoice(
  question: Question,
  userAnswer?: string[],
  showAnswer?: boolean
): string {
  if (question.type !== 'multiple_choice') return '';
  
  const options = question.options || [];
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const userAnswers = userAnswer || [];
  const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
  
  let html = '<div class="options-list multiple-choice">';
  options.forEach((option, index) => {
    const label = labels[index] || String(index);
    const isSelected = userAnswers.includes(label);
    const isCorrect = correctAnswers.includes(label);
    let className = 'option-item';
    
    if (showAnswer) {
      if (isCorrect) className += ' correct';
      else if (isSelected && !isCorrect) className += ' wrong';
    } else if (isSelected) {
      className += ' selected';
    }
    
    html += `
      <label class="${className}" data-value="${label}">
        <input type="checkbox" name="answer" value="${label}" ${isSelected ? 'checked' : ''} ${showAnswer ? 'disabled' : ''}>
        <span class="option-label">${label}.</span>
        <span class="option-text">${escapeHtml(option)}</span>
      </label>
    `;
  });
  html += '</div>';
  
  return html;
}

/**
 * 渲染填空题
 */
export function renderFillBlank(
  question: Question,
  userAnswer?: string[],
  showAnswer?: boolean
): string {
  if (question.type !== 'fill_blank') return '';
  
  const content = question.content;
  const blanks = content.split('{{blank}}');
  const answers = userAnswer || [];
  const correctAnswers = Array.isArray(question.correctAnswer) 
    ? question.correctAnswer 
    : [question.correctAnswer];
  
  let html = '<div class="fill-blank-content">';
  blanks.forEach((part, index) => {
    html += `<span>${part}</span>`;
    if (index < blanks.length - 1) {
      const userAns = answers[index] || '';
      const correctAns = correctAnswers[index] || '';
      let inputClass = 'blank-input';
      
      if (showAnswer) {
        if (userAns.trim() === correctAns.trim()) {
          inputClass += ' correct';
        } else {
          inputClass += ' wrong';
        }
      }
      
      html += `<input type="text" class="${inputClass}" data-index="${index}" value="${userAns}" placeholder="填空${index + 1}" ${showAnswer ? 'disabled' : ''}>`;
      
      if (showAnswer && userAns.trim() !== correctAns.trim()) {
        html += `<span class="correct-answer">（正确答案：${correctAns}）</span>`;
      }
    }
  });
  html += '</div>';
  
  return html;
}

/**
 * 渲染判断题
 */
export function renderTrueFalse(
  question: Question,
  userAnswer?: boolean,
  showAnswer?: boolean
): string {
  if (question.type !== 'true_false') return '';
  
  const options = question.options || ['正确', '错误'];
  const correctAnswer = question.correctAnswer as boolean;
  
  let html = '<div class="options-list true-false">';
  options.forEach((option, index) => {
    const value = index === 0 ? 'true' : 'false';
    const boolValue = index === 0;
    const isSelected = userAnswer === boolValue;
    const isCorrect = correctAnswer === boolValue;
    let className = 'option-item';
    
    if (showAnswer) {
      if (isCorrect) className += ' correct';
      else if (isSelected && !isCorrect) className += ' wrong';
    } else if (isSelected) {
      className += ' selected';
    }
    
    html += `
      <label class="${className}" data-value="${value}">
        <input type="radio" name="answer" value="${value}" ${isSelected ? 'checked' : ''} ${showAnswer ? 'disabled' : ''}>
        <span class="option-text">${option}</span>
      </label>
    `;
  });
  html += '</div>';
  
  return html;
}

/**
 * 渲染编程题
 */
export function renderCoding(
  question: Question,
  userAnswer?: string,
  showAnswer?: boolean
): string {
  if (question.type !== 'coding') return '';
  
  const code = userAnswer || '';
  
  let html = '<div class="coding-container">';
  html += '<div class="coding-toolbar">';
  html += `<span class="language-badge">${question.language || 'javascript'}</span>`;
  if (!showAnswer) {
    html += '<button id="run-code" class="btn-run">运行代码</button>';
  }
  html += '</div>';
  html += '<textarea id="code-editor" class="code-editor" placeholder="在此编写代码..." ' + (showAnswer ? 'disabled' : '') + '>' + code + '</textarea>';
  html += '<div id="code-output" class="code-output"></div>';
  
  if (showAnswer) {
    html += '<div class="reference-answer">';
    html += '<h4>参考答案：</h4>';
    html += '<pre><code>' + escapeHtml(question.correctAnswer as string) + '</code></pre>';
    html += '</div>';
  }
  
  html += '</div>';
  
  return html;
}

/**
 * 渲染简答题
 */
export function renderShortAnswer(
  question: Question,
  userAnswer?: string,
  showAnswer?: boolean
): string {
  if (question.type !== 'short_answer') return '';
  
  const answer = userAnswer || '';
  
  let html = '<div class="short-answer-container">';
  html += '<textarea id="short-answer-input" class="short-answer-input" rows="6" placeholder="请在此输入您的答案..." ' + (showAnswer ? 'disabled' : '') + '>' + escapeHtml(answer) + '</textarea>';
  
  if (showAnswer) {
    html += '<div class="reference-answer">';
    html += '<h4>参考答案：</h4>';
    html += '<div class="reference-content">' + escapeHtml(question.correctAnswer as string) + '</div>';
    html += '</div>';
  }
  
  html += '</div>';
  
  return html;
}

/**
 * 渲染解析
 */
export function renderExplanation(question: Question, isCorrect: boolean): string {
  return `
    <div class="explanation ${isCorrect ? 'correct' : 'wrong'}">
      <div class="explanation-header">
        <span class="result-icon">${isCorrect ? '✓' : '✗'}</span>
        <span class="result-text">${isCorrect ? '回答正确！' : '回答错误！'}</span>
      </div>
      <div class="explanation-content">
        <h4>解析：</h4>
        <p>${question.explanation}</p>
      </div>
    </div>
  `;
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 获取用户答案
 */
export function getUserAnswer(question: Question): string | string[] | boolean | null {
  const container = document.getElementById('question-container');
  if (!container) return null;
  
  switch (question.type) {
    case 'single_choice': {
      const selected = container.querySelector('input[name="answer"]:checked') as HTMLInputElement;
      return selected ? selected.value : null;
    }
    case 'multiple_choice': {
      const checked = container.querySelectorAll('input[name="answer"]:checked');
      return Array.from(checked).map((input) => (input as HTMLInputElement).value);
    }
    case 'fill_blank': {
      const inputs = container.querySelectorAll('.blank-input');
      return Array.from(inputs).map((input) => (input as HTMLInputElement).value);
    }
    case 'true_false': {
      const selected = container.querySelector('input[name="answer"]:checked') as HTMLInputElement;
      return selected ? selected.value === 'true' : null;
    }
    case 'coding': {
      const editor = document.getElementById('code-editor') as HTMLTextAreaElement;
      return editor ? editor.value : null;
    }
    case 'short_answer': {
      const input = document.getElementById('short-answer-input') as HTMLTextAreaElement;
      return input ? input.value : null;
    }
    default:
      return null;
  }
}

/**
 * 检查答案是否正确
 */
export function checkAnswer(question: Question, answer: unknown): boolean {
  switch (question.type) {
    case 'single_choice':
      return answer === question.correctAnswer;
    case 'multiple_choice': {
      const correctAnswers = question.correctAnswer as string[];
      const userAnswers = (answer as string[]).sort();
      return JSON.stringify(userAnswers) === JSON.stringify(correctAnswers.sort());
    }
    case 'fill_blank': {
      const correctAnswers = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer];
      const userAnswers = answer as string[];
      return correctAnswers.every((correct, index) => 
        (userAnswers[index] || '').trim() === correct.trim()
      );
    }
    case 'true_false':
      return answer === question.correctAnswer;
    case 'coding':
      // 编程题简单对比，实际应该运行测试
      return (answer as string).trim().length > 0;
    case 'short_answer': {
      const userAnswer = (answer as string).trim();
      if (userAnswer.length === 0) return false;
      
      // 如果有keywords，检查是否包含关键词
      const keywords = (question as any).keywords as string[] | undefined;
      if (keywords && keywords.length > 0) {
        return keywords.some(keyword => userAnswer.toLowerCase().includes(keyword.toLowerCase()));
      }
      
      // 否则只要有内容就认为是正确的（练习模式）
      return true;
    }
    default:
      return false;
  }
}
