import { renderQuestionContent, renderSingleChoice, renderMultipleChoice, renderFillBlank, renderTrueFalse, renderCoding, renderShortAnswer, renderExplanation, getUserAnswer, checkAnswer, getQuestionTypeName, getQuestionTypeColor, getDifficultyName, getDifficultyColor } from './question.js';
import { ExamManager, loadQuestions, filterQuestions, formatDuration, runJavaScriptCode } from './exam.js';
import { clearExamState, saveExamResult } from './storage.js';
// 全局状态
let examManager = null;
let allQuestions = [];
let currentMode = 'practice';
/**
 * 初始化应用
 */
async function initApp() {
    // 加载题目数据
    allQuestions = await loadQuestions();
    // 绑定事件
    bindEvents();
    // 显示首页
    showHomePage();
}
/**
 * 绑定事件
 */
function bindEvents() {
    // 模式选择
    document.getElementById('mode-practice')?.addEventListener('click', () => startExam('practice'));
    document.getElementById('mode-exam')?.addEventListener('click', () => startExam('exam'));
    // 筛选
    document.getElementById('filter-type')?.addEventListener('change', applyFilters);
    document.getElementById('filter-difficulty')?.addEventListener('change', applyFilters);
    document.getElementById('search-keyword')?.addEventListener('input', applyFilters);
    // 答题页面按钮
    document.getElementById('btn-prev')?.addEventListener('click', prevQuestion);
    document.getElementById('btn-next')?.addEventListener('click', nextQuestion);
    document.getElementById('btn-submit')?.addEventListener('click', submitAnswer);
    document.getElementById('btn-back-home')?.addEventListener('click', showHomePage);
    // 结果页面按钮
    document.getElementById('btn-retry')?.addEventListener('click', () => {
        if (examManager) {
            examManager.reset();
            renderCurrentQuestion();
        }
    });
    document.getElementById('btn-back-home-result')?.addEventListener('click', showHomePage);
    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboard);
}
/**
 * 显示首页
 */
function showHomePage() {
    hideAllPages();
    document.getElementById('home-page').classList.remove('hidden');
    renderQuestionList();
}
/**
 * 显示答题页面
 */
function showExamPage() {
    hideAllPages();
    document.getElementById('exam-page').classList.remove('hidden');
}
/**
 * 显示结果页面
 */
function showResultPage() {
    hideAllPages();
    document.getElementById('result-page').classList.remove('hidden');
}
/**
 * 隐藏所有页面
 */
function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
}
/**
 * 渲染题目列表
 */
function renderQuestionList() {
    const container = document.getElementById('question-list');
    if (!container)
        return;
    const filter = {
        type: document.getElementById('filter-type')?.value || undefined,
        difficulty: document.getElementById('filter-difficulty')?.value || undefined,
        keyword: document.getElementById('search-keyword')?.value || undefined
    };
    const filtered = filterQuestions(allQuestions, filter);
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">没有找到符合条件的题目</div>';
        return;
    }
    let html = '<div class="question-grid">';
    filtered.forEach((question, index) => {
        const typeColor = getQuestionTypeColor(question.type);
        const difficultyColor = getDifficultyColor(question.difficulty);
        html += `
      <div class="question-card" data-id="${question.id}" data-index="${index}">
        <div class="card-header">
          <span class="type-badge" style="background-color: ${typeColor}">${getQuestionTypeName(question.type)}</span>
          <span class="difficulty-badge" style="background-color: ${difficultyColor}">${getDifficultyName(question.difficulty)}</span>
        </div>
        <div class="card-body">
          <h3>${question.title}</h3>
          <p class="question-preview">${question.content.substring(0, 100)}${question.content.length > 100 ? '...' : ''}</p>
        </div>
        <div class="card-footer">
          <span class="points">${question.points}分</span>
          <button class="btn-start" data-id="${question.id}">开始答题</button>
        </div>
      </div>
    `;
    });
    html += '</div>';
    container.innerHTML = html;
    // 绑定开始答题按钮事件
    container.querySelectorAll('.btn-start').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            if (id) {
                const index = allQuestions.findIndex(q => q.id === id);
                if (index !== -1) {
                    // 如果没有考试管理器，先创建一个练习模式的
                    if (!examManager) {
                        currentMode = 'practice';
                        examManager = new ExamManager(allQuestions, 'practice');
                    }
                    examManager.goToQuestion(index);
                    renderCurrentQuestion();
                    showExamPage();
                }
            }
        });
    });
}
/**
 * 应用筛选
 */
function applyFilters() {
    renderQuestionList();
}
/**
 * 开始考试
 */
function startExam(mode) {
    currentMode = mode;
    clearExamState();
    examManager = new ExamManager(allQuestions, mode);
    showExamPage();
    renderCurrentQuestion();
}
/**
 * 渲染当前题目
 */
function renderCurrentQuestion() {
    if (!examManager)
        return;
    const question = examManager.getCurrentQuestion();
    if (!question)
        return;
    const container = document.getElementById('question-container');
    if (!container)
        return;
    const userAnswer = examManager.getUserAnswer(question.id);
    const showAnswer = currentMode === 'practice' && userAnswer !== undefined;
    // 更新进度
    updateProgress();
    // 更新导航
    updateNavigation();
    // 渲染题目内容
    let html = renderQuestionContent(question);
    // 根据题型渲染答题区域
    switch (question.type) {
        case 'single_choice':
            html += renderSingleChoice(question, userAnswer?.answer, showAnswer);
            break;
        case 'multiple_choice':
            html += renderMultipleChoice(question, userAnswer?.answer, showAnswer);
            break;
        case 'fill_blank':
            html += renderFillBlank(question, userAnswer?.answer, showAnswer);
            break;
        case 'true_false':
            html += renderTrueFalse(question, userAnswer?.answer, showAnswer);
            break;
        case 'coding':
            html += renderCoding(question, userAnswer?.answer, showAnswer);
            break;
        case 'short_answer':
            html += renderShortAnswer(question, userAnswer?.answer, showAnswer);
            break;
    }
    // 显示解析（练习模式）
    if (showAnswer) {
        html += renderExplanation(question, userAnswer.isCorrect);
    }
    container.innerHTML = html;
    // 绑定选项点击事件
    bindOptionEvents(question);
    // 绑定运行代码按钮（编程题）
    if (question.type === 'coding' && !showAnswer) {
        document.getElementById('run-code')?.addEventListener('click', () => runCode());
    }
}
/**
 * 绑定选项事件
 */
function bindOptionEvents(question) {
    const container = document.getElementById('question-container');
    if (!container)
        return;
    const options = container.querySelectorAll('.option-item');
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const input = target.querySelector('input');
            if (!input || input.disabled)
                return;
            if (question.type === 'single_choice' || question.type === 'true_false') {
                // 单选：取消其他选中状态
                options.forEach(opt => {
                    const inp = opt.querySelector('input');
                    if (inp)
                        inp.checked = false;
                    opt.classList.remove('selected');
                });
                input.checked = true;
                target.classList.add('selected');
            }
            else if (question.type === 'multiple_choice') {
                // 多选：切换选中状态
                input.checked = !input.checked;
                target.classList.toggle('selected', input.checked);
            }
            if (currentMode === 'practice' && question.type !== 'multiple_choice') {
                // 练习模式：单选/判断自动提交，多选需要手动点击提交
                submitAnswer();
            }
        });
    });
}
/**
 * 更新进度
 */
function updateProgress() {
    if (!examManager)
        return;
    const current = examManager.getCurrentIndex() + 1;
    const total = examManager.getTotalCount();
    const answered = examManager.getAnsweredCount();
    document.getElementById('current-num').textContent = String(current);
    document.getElementById('total-num').textContent = String(total);
    document.getElementById('answered-count').textContent = String(answered);
    const progressPercent = (current / total) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    // 更新正确/错误统计
    const correctCount = examManager.getCorrectCount();
    const wrongCount = examManager.getWrongCount();
    const statCorrect = document.getElementById('stat-correct');
    const statWrong = document.getElementById('stat-wrong');
    if (statCorrect)
        statCorrect.textContent = String(correctCount);
    if (statWrong)
        statWrong.textContent = String(wrongCount);
}
/**
 * 更新导航
 */
function updateNavigation() {
    if (!examManager)
        return;
    const container = document.getElementById('nav-numbers');
    if (!container)
        return;
    const current = examManager.getCurrentIndex();
    const total = examManager.getTotalCount();
    let html = '';
    for (let i = 0; i < total; i++) {
        const question = examManager.getQuestions()[i];
        const status = examManager.getAnswerStatus(question.id);
        let className = 'nav-number';
        if (i === current)
            className += ' current';
        else if (status === 'correct')
            className += ' correct';
        else if (status === 'wrong')
            className += ' wrong';
        else if (status === 'answered')
            className += ' answered';
        html += `<span class="${className}" data-index="${i}">${i + 1}</span>`;
    }
    container.innerHTML = html;
    // 绑定导航点击事件
    container.querySelectorAll('.nav-number').forEach(num => {
        num.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index || '0');
            examManager?.goToQuestion(index);
            renderCurrentQuestion();
        });
    });
    // 更新按钮状态
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    if (btnPrev)
        btnPrev.disabled = current === 0;
    if (btnNext)
        btnNext.disabled = current === total - 1;
    // 更新提交按钮文本
    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) {
        if (currentMode === 'practice') {
            const question = examManager.getCurrentQuestion();
            const hasAnswered = question ? examManager.isAnswered(question.id) : false;
            btnSubmit.textContent = hasAnswered ? '已提交' : '提交答案';
            btnSubmit.disabled = hasAnswered;
        }
        else {
            btnSubmit.textContent = current === total - 1 ? '提交试卷' : '下一题';
            btnSubmit.disabled = false;
        }
    }
}
/**
 * 上一题
 */
function prevQuestion() {
    if (examManager?.prevQuestion()) {
        renderCurrentQuestion();
    }
}
/**
 * 下一题
 */
function nextQuestion() {
    if (currentMode === 'exam') {
        // 考试模式：保存当前答案
        const question = examManager?.getCurrentQuestion();
        if (question) {
            const answer = getUserAnswer(question);
            if (answer !== null) {
                const isCorrect = checkAnswer(question, answer);
                examManager?.submitAnswer(question.id, answer, isCorrect);
            }
        }
    }
    if (examManager?.nextQuestion()) {
        renderCurrentQuestion();
    }
    else if (currentMode === 'exam') {
        // 最后一题，提交试卷
        submitExam();
    }
}
/**
 * 提交答案
 */
function submitAnswer() {
    if (!examManager)
        return;
    const question = examManager.getCurrentQuestion();
    if (!question)
        return;
    const answer = getUserAnswer(question);
    if (answer === null) {
        alert('请先选择答案');
        return;
    }
    const isCorrect = checkAnswer(question, answer);
    examManager.submitAnswer(question.id, answer, isCorrect);
    if (currentMode === 'practice') {
        // 练习模式：显示答案和解析
        renderCurrentQuestion();
    }
    else {
        // 考试模式：下一题
        nextQuestion();
    }
}
/**
 * 提交试卷
 */
function submitExam() {
    if (!examManager)
        return;
    if (!confirm('确定要提交试卷吗？'))
        return;
    const result = examManager.submitExam();
    saveExamResult(result);
    showResult(result);
}
/**
 * 显示结果
 */
function showResult(result) {
    showResultPage();
    // 更新统计信息
    document.getElementById('result-total').textContent = String(result.totalQuestions);
    document.getElementById('result-answered').textContent = String(result.answeredQuestions);
    document.getElementById('result-correct').textContent = String(result.correctCount);
    document.getElementById('result-wrong').textContent = String(result.wrongCount);
    document.getElementById('result-score').textContent = String(result.obtainedPoints);
    document.getElementById('result-total-points').textContent = String(result.totalPoints);
    document.getElementById('result-duration').textContent = formatDuration(result.duration);
    // 正确率
    const accuracy = result.totalQuestions > 0
        ? Math.round((result.correctCount / result.totalQuestions) * 100)
        : 0;
    document.getElementById('result-accuracy').textContent = `${accuracy}%`;
    // 渲染错题列表
    const wrongList = document.getElementById('wrong-list');
    if (wrongList) {
        if (result.wrongQuestionIds.length === 0) {
            wrongList.innerHTML = '<div class="empty-state">恭喜！没有错题</div>';
        }
        else {
            let html = '<div class="wrong-questions">';
            result.wrongQuestionIds.forEach(id => {
                const question = allQuestions.find(q => q.id === id);
                if (question) {
                    html += `
            <div class="wrong-item">
              <div class="wrong-title">
                <span class="type-badge" style="background-color: ${getQuestionTypeColor(question.type)}">${getQuestionTypeName(question.type)}</span>
                ${question.title}
              </div>
              <div class="wrong-content">${question.content.substring(0, 200)}...</div>
            </div>
          `;
                }
            });
            html += '</div>';
            wrongList.innerHTML = html;
        }
    }
}
/**
 * 运行代码
 */
function runCode() {
    const editor = document.getElementById('code-editor');
    const output = document.getElementById('code-output');
    if (!editor || !output)
        return;
    const code = editor.value;
    if (!code.trim()) {
        output.innerHTML = '<div class="error">请输入代码</div>';
        return;
    }
    const result = runJavaScriptCode(code);
    if (result.success) {
        output.innerHTML = `<pre>${result.output}</pre>`;
    }
    else {
        output.innerHTML = `<div class="error">${result.error}</div>`;
    }
}
/**
 * 键盘快捷键处理
 */
function handleKeyboard(e) {
    // 只在答题页面生效
    if (document.getElementById('exam-page')?.classList.contains('hidden'))
        return;
    switch (e.key) {
        case 'ArrowLeft':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                prevQuestion();
            }
            break;
        case 'ArrowRight':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                nextQuestion();
            }
            break;
        case 'Enter':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                submitAnswer();
            }
            break;
    }
}
// 初始化
initApp().catch(console.error);
//# sourceMappingURL=main.js.map