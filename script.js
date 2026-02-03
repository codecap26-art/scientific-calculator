// ===== CALCULATOR STATE =====
class Calculator {
    constructor() {
        this.expression = '';
        this.result = '0';
        this.memory = 0;
        this.angleMode = 'DEG'; // 'DEG' or 'RAD'
        this.lastResult = 0;
        this.justCalculated = false;
        this.history = []; // Store calculation history

        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }

    initializeElements() {
        this.expressionDisplay = document.getElementById('expression-display');
        this.resultDisplay = document.getElementById('result-display');
        this.memoryIndicator = document.getElementById('memory-indicator');
        this.modeToggleBtn = document.getElementById('mode-toggle-btn');
        this.modeText = document.getElementById('mode-text');
        this.historyContainer = document.getElementById('history-container');
    }

    attachEventListeners() {
        // Number buttons
        document.querySelectorAll('[data-number]').forEach(btn => {
            btn.addEventListener('click', () => this.handleNumber(btn.dataset.number));
        });

        // Operator buttons
        document.querySelectorAll('[data-operator]').forEach(btn => {
            btn.addEventListener('click', () => this.handleOperator(btn.dataset.operator));
        });

        // Function buttons
        document.querySelectorAll('[data-function]').forEach(btn => {
            btn.addEventListener('click', () => this.handleFunction(btn.dataset.function));
        });

        // Constant buttons
        document.querySelectorAll('[data-constant]').forEach(btn => {
            btn.addEventListener('click', () => this.handleConstant(btn.dataset.constant));
        });

        // Action buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => this.handleAction(btn.dataset.action));
        });

        // Mode toggle
        this.modeToggleBtn.addEventListener('click', () => this.toggleAngleMode());

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // ===== INPUT HANDLERS =====
    handleNumber(num) {
        if (this.justCalculated) {
            this.expression = '';
            this.justCalculated = false;
        }

        // Prevent multiple decimal points in a number
        if (num === '.') {
            const lastNumber = this.expression.split(/[\+\-\*\/\(\)]/).pop();
            if (lastNumber.includes('.')) return;
        }

        this.expression += num;
        this.updateDisplay();
    }

    handleOperator(op) {
        if (this.justCalculated) {
            this.expression = this.lastResult.toString();
            this.justCalculated = false;
        }

        // Prevent multiple operators in a row (except for negative numbers)
        const lastChar = this.expression.slice(-1);
        if (['+', '*', '/', '('].includes(lastChar) && op === '-') {
            this.expression += op;
        } else if (['+', '-', '*', '/'].includes(lastChar)) {
            this.expression = this.expression.slice(0, -1) + op;
        } else {
            this.expression += op;
        }

        this.updateDisplay();
    }

    handleFunction(func) {
        if (this.justCalculated) {
            this.expression = '';
            this.justCalculated = false;
        }

        switch (func) {
            case 'sin':
            case 'cos':
            case 'tan':
            case 'asin':
            case 'acos':
            case 'atan':
            case 'log':
            case 'ln':
            case 'sqrt':
            case 'cbrt':
                this.expression += `${func}(`;
                break;
            case 'exp':
                this.expression += 'exp(';
                break;
            case 'square':
                this.expression += '^2';
                break;
            case 'cube':
                this.expression += '^3';
                break;
            case 'power':
                this.expression += '^';
                break;
            case 'factorial':
                this.expression += '!';
                break;
        }

        this.updateDisplay();
    }

    handleConstant(constant) {
        if (this.justCalculated) {
            this.expression = '';
            this.justCalculated = false;
        }

        switch (constant) {
            case 'pi':
                this.expression += 'π';
                break;
            case 'e':
                this.expression += 'e';
                break;
        }

        this.updateDisplay();
    }

    handleAction(action) {
        switch (action) {
            case 'ac':
                this.clear();
                break;
            case 'del':
                this.delete();
                break;
            case 'equals':
                this.calculate();
                break;
            case 'percent':
                this.handlePercent();
                break;
            case 'negate':
                this.negate();
                break;
            case 'mc':
                this.memoryClear();
                break;
            case 'mr':
                this.memoryRecall();
                break;
            case 'm+':
                this.memoryAdd();
                break;
            case 'm-':
                this.memorySubtract();
                break;
        }
    }

    // ===== CALCULATOR OPERATIONS =====
    clear() {
        this.expression = '';
        this.result = '0';
        this.justCalculated = false;
        this.updateDisplay();
    }

    delete() {
        if (this.justCalculated) {
            this.clear();
            return;
        }

        this.expression = this.expression.slice(0, -1);
        this.updateDisplay();
    }

    negate() {
        if (this.result !== '0' && this.result !== 'Error') {
            const num = parseFloat(this.result);
            this.expression = (-num).toString();
            this.result = this.expression;
            this.updateDisplay();
        }
    }

    handlePercent() {
        if (this.result !== '0' && this.result !== 'Error') {
            const num = parseFloat(this.result);
            this.expression = (num / 100).toString();
            this.result = this.expression;
            this.updateDisplay();
        }
    }

    calculate() {
        if (!this.expression) return;

        // Add calculating state animation
        this.resultDisplay.style.opacity = '0.5';

        setTimeout(() => {
            try {
                const processedExpression = this.preprocessExpression(this.expression);
                const result = this.evaluateExpression(processedExpression);

                if (!isFinite(result)) {
                    throw new Error('Invalid calculation');
                }

                this.lastResult = result;
                this.result = this.formatResult(result);

                // Add to history before clearing
                this.addToHistory(this.expression, this.result);

                this.justCalculated = true;
                this.resultDisplay.classList.remove('error');
            } catch (error) {
                this.result = 'Error';
                this.resultDisplay.classList.add('error');
            }

            // Restore opacity
            this.resultDisplay.style.opacity = '1';
            this.updateDisplay();
        }, 100);
    }

    preprocessExpression(expr) {
        // Replace constants
        expr = expr.replace(/π/g, Math.PI.toString());
        expr = expr.replace(/e(?![x])/g, Math.E.toString());

        // Handle implicit multiplication
        expr = expr.replace(/(\d)(\()/g, '$1*(');
        expr = expr.replace(/(\))(\d)/g, ')*$2');
        expr = expr.replace(/(\))(\()/g, ')*(');

        return expr;
    }

    evaluateExpression(expr) {
        // Handle factorials first
        expr = expr.replace(/(\d+\.?\d*)!/g, (match, num) => {
            return this.factorial(parseFloat(num)).toString();
        });

        // Handle power operations
        expr = expr.replace(/(\d+\.?\d*)\^(\d+\.?\d*)/g, (match, base, exp) => {
            return Math.pow(parseFloat(base), parseFloat(exp)).toString();
        });

        // Create a safe evaluation context
        const context = {
            sin: (x) => Math.sin(this.toRadians(x)),
            cos: (x) => Math.cos(this.toRadians(x)),
            tan: (x) => Math.tan(this.toRadians(x)),
            asin: (x) => this.toDegrees(Math.asin(x)),
            acos: (x) => this.toDegrees(Math.acos(x)),
            atan: (x) => this.toDegrees(Math.atan(x)),
            log: (x) => Math.log10(x),
            ln: (x) => Math.log(x),
            exp: (x) => Math.exp(x),
            sqrt: (x) => Math.sqrt(x),
            cbrt: (x) => Math.cbrt(x),
            abs: (x) => Math.abs(x),
            PI: Math.PI,
            E: Math.E
        };

        // Replace function names with context references
        Object.keys(context).forEach(func => {
            if (typeof context[func] === 'function') {
                const regex = new RegExp(`${func}\\(`, 'g');
                expr = expr.replace(regex, `context.${func}(`);
            }
        });

        // Evaluate using Function constructor (safer than eval)
        const func = new Function('context', `with(context) { return ${expr}; }`);
        return func(context);
    }

    // ===== MATHEMATICAL HELPERS =====
    toRadians(degrees) {
        if (this.angleMode === 'RAD') return degrees;
        return degrees * (Math.PI / 180);
    }

    toDegrees(radians) {
        if (this.angleMode === 'RAD') return radians;
        return radians * (180 / Math.PI);
    }

    factorial(n) {
        if (n < 0 || !Number.isInteger(n)) {
            throw new Error('Factorial only defined for non-negative integers');
        }
        if (n === 0 || n === 1) return 1;
        if (n > 170) throw new Error('Factorial overflow');

        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    formatResult(num) {
        // Handle very small or very large numbers
        if (Math.abs(num) < 1e-10 && num !== 0) {
            return num.toExponential(6);
        }
        if (Math.abs(num) > 1e10) {
            return num.toExponential(6);
        }

        // Round to avoid floating point errors
        const rounded = Math.round(num * 1e10) / 1e10;

        // Format with appropriate decimal places
        if (Number.isInteger(rounded)) {
            return rounded.toString();
        }

        return rounded.toString();
    }

    // ===== MEMORY OPERATIONS =====
    memoryClear() {
        this.memory = 0;
        this.updateMemoryIndicator();
    }

    memoryRecall() {
        this.expression = this.memory.toString();
        this.result = this.expression;
        this.updateDisplay();
    }

    memoryAdd() {
        if (this.result !== 'Error') {
            this.memory += parseFloat(this.result);
            this.updateMemoryIndicator();
        }
    }

    memorySubtract() {
        if (this.result !== 'Error') {
            this.memory -= parseFloat(this.result);
            this.updateMemoryIndicator();
        }
    }

    updateMemoryIndicator() {
        if (this.memory !== 0) {
            this.memoryIndicator.classList.add('active');
        } else {
            this.memoryIndicator.classList.remove('active');
        }
    }

    // ===== HISTORY MANAGEMENT =====
    addToHistory(expression, result) {
        // Don't add errors to history
        if (result === 'Error') return;

        // Create history item
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const historyExpression = document.createElement('div');
        historyExpression.className = 'history-expression';
        historyExpression.textContent = expression;

        const historyResult = document.createElement('div');
        historyResult.className = 'history-result';
        historyResult.textContent = `= ${result}`;

        historyItem.appendChild(historyExpression);
        historyItem.appendChild(historyResult);

        // Add click handler to reuse calculation
        historyItem.addEventListener('click', () => {
            this.expression = result;
            this.result = result;
            this.updateDisplay();
        });

        // Add to history container
        this.historyContainer.appendChild(historyItem);

        // Scroll to bottom to show newest item
        setTimeout(() => {
            this.historyContainer.scrollTop = this.historyContainer.scrollHeight;
        }, 50);

        // Store in history array
        this.history.push({ expression, result });

        // Limit history to 50 items
        if (this.history.length > 50) {
            this.history.shift();
            this.historyContainer.removeChild(this.historyContainer.firstChild);
        }
    }

    // ===== ANGLE MODE =====
    toggleAngleMode() {
        this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
        this.modeText.textContent = this.angleMode;
    }

    // ===== DISPLAY UPDATE =====
    updateDisplay() {
        // Trigger slide-up animation for expression
        this.expressionDisplay.style.animation = 'none';
        setTimeout(() => {
            this.expressionDisplay.style.animation = '';
        }, 10);

        // Update expression display
        this.expressionDisplay.textContent = this.expression || '';

        // Trigger fade-in animation for result
        this.resultDisplay.classList.add('updating');

        // Update result display
        this.resultDisplay.textContent = this.result;

        // Remove animation class after animation completes
        setTimeout(() => {
            this.resultDisplay.classList.remove('updating');
        }, 300);
    }

    // ===== KEYBOARD SUPPORT =====
    handleKeyboard(e) {
        // Numbers and decimal
        if (/^[0-9.]$/.test(e.key)) {
            e.preventDefault();
            this.handleNumber(e.key);
        }

        // Operators
        const operatorMap = {
            '+': '+',
            '-': '-',
            '*': '*',
            '/': '/',
            '(': '(',
            ')': ')'
        };

        if (operatorMap[e.key]) {
            e.preventDefault();
            this.handleOperator(operatorMap[e.key]);
        }

        // Actions
        if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            this.calculate();
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            this.clear();
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            this.delete();
        }

        if (e.key === '%') {
            e.preventDefault();
            this.handlePercent();
        }
    }
}

// ===== INITIALIZE CALCULATOR =====
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
