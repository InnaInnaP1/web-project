class Mole {
  #element;
  #isActive = false;
  #holeElement;

  constructor(holeElement, index) {
    this.#holeElement = holeElement;

    this.#element = document.createElement('div');
    this.#element.className = 'mole';
    this.#element.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23855E42'/%3E%3Ccircle cx='35' cy='40' r='5' fill='%23000'/%3E%3Ccircle cx='65' cy='40' r='5' fill='%23000'/%3E%3Cpath d='M40 65 Q50 75 60 65' stroke='%23000' stroke-width='3' fill='none'/%3E%3Cellipse cx='50' cy='30' rx='10' ry='5' fill='%23000'/%3E%3C/svg%3E")`;

    holeElement.appendChild(this.#element);
    this.#holeElement.addEventListener('click', () => this.bonk());
  }

  get isActive() {
    return this.#isActive;
  }

  show() {
    this.#isActive = true;
    this.#holeElement.classList.add('active');
  }

  hide() {
    this.#isActive = false;
    this.#holeElement.classList.remove('active', 'bonked');
  }

  bonk() {
    if (this.#isActive) {
      this.#isActive = false;
      this.#holeElement.classList.add('bonked', 'shake');

      setTimeout(() => {
        this.#holeElement.classList.remove('shake');
      }, 300);

      const event = new CustomEvent('molebonk', { bubbles: true });
      this.#holeElement.dispatchEvent(event);

      return true;
    }
    return false;
  }
}

class MoleGame {
  #moles = [];
  #score = 0;
  #timeLeft = 30;
  #gameActive = false;
  #timerInterval;
  #popUpInterval;
  #gameBoard;
  #scoreElement;
  #timerElement;
  #startButton;
  #difficulty = 1000;

  constructor() {
    this.#gameBoard = document.getElementById('board');
    this.#scoreElement = document.getElementById('score');
    this.#timerElement = document.getElementById('timer');
    this.#startButton = document.getElementById('start');

    this.#createBoard();

    this.#startButton.addEventListener('click', () => this.startGame());
    document.getElementById('restart').addEventListener('click', () => {
      document.getElementById('modal').classList.add('hidden');
      this.startGame();
    });

    document.addEventListener('molebonk', () => {
      this.#score++;
      this.#scoreElement.textContent = this.#score;

      if (this.#score % 5 === 0 && this.#difficulty > 400) {
        this.#difficulty -= 50;
      }
    });

    this.#loadHighScores();
  }

  #createBoard() {
    this.#gameBoard.innerHTML = '';
    this.#moles = [];

    for (let i = 0; i < 9; i++) {
      const hole = document.createElement('div');
      hole.className = 'hole w-full pt-[100%]';
      this.#gameBoard.appendChild(hole);

      const mole = new Mole(hole, i);
      this.#moles.push(mole);
    }
  }

  startGame() {
    this.#score = 0;
    this.#timeLeft = 30;
    this.#gameActive = true;
    this.#difficulty = 1000;

    this.#scoreElement.textContent = '0';
    this.#timerElement.textContent = '30';
    this.#startButton.disabled = true;
    this.#startButton.classList.add('bg-gray-400');
    this.#startButton.classList.remove('bg-green-500', 'hover:bg-green-600');

    this.#timerInterval = setInterval(() => {
      this.#timeLeft--;
      this.#timerElement.textContent = this.#timeLeft;

      if (this.#timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);

    this.#popUpMole();
  }

  #popUpMole() {
    if (!this.#gameActive) return;

    this.#moles.forEach((mole) => mole.hide());

    const randomIndex = Math.floor(Math.random() * this.#moles.length);
    const selectedMole = this.#moles[randomIndex];

    selectedMole.show();

    const showTime = Math.max(800, 1500 - this.#score * 10);
    setTimeout(() => {
      if (selectedMole.isActive) {
        selectedMole.hide();
      }
    }, showTime);

    this.#popUpInterval = setTimeout(() => {
      this.#popUpMole();
    }, this.#difficulty);
  }

  endGame() {
    this.#gameActive = false;
    clearInterval(this.#timerInterval);
    clearTimeout(this.#popUpInterval);

    this.#moles.forEach((mole) => mole.hide());

    this.#startButton.disabled = false;
    this.#startButton.classList.remove('bg-gray-400');
    this.#startButton.classList.add('bg-green-500', 'hover:bg-green-600');

    this.#saveScore(this.#score);

    document.getElementById('result').textContent = this.#score;
    document.getElementById('modal').classList.remove('hidden');
  }

  #saveScore(score) {
    try {
      let scores = JSON.parse(localStorage.getItem('moleGameScores')) || [];

      const newScore = {
        score: score,
        date: new Date().toISOString(),
      };
      scores.push(newScore);
      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 10);

      const isHighScore = scores.findIndex(
        (s) => s.score === score && s.date === newScore.date
      ) < 3;
      document.getElementById('new-high').classList.toggle('hidden', !isHighScore);

      localStorage.setItem('moleGameScores', JSON.stringify(scores));
      this.#loadHighScores();
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }

  #loadHighScores() {
    try {
      const scores = JSON.parse(localStorage.getItem('moleGameScores')) || [];
      const scoresContainer = document.getElementById('scores');

      if (scores.length === 0) {
        scoresContainer.innerHTML = `
          <tr>
            <td class="py-2 px-4" colspan="3">No high scores yet</td>
          </tr>
        `;
        return;
      }

      scoresContainer.innerHTML = scores
        .map(
          (score, index) => `
        <tr class="${index < 3 ? 'font-bold' : ''}">
          <td class="py-2 px-4">${index + 1}</td>
          <td class="py-2 px-4">${score.score}</td>
          <td class="py-2 px-4">${new Date(score.date).toLocaleDateString()}</td>
        </tr>
      `
        )
        .join('');
    } catch (error) {
      console.error('Error loading high scores:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MoleGame();
});