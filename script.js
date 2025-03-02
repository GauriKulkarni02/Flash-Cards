// Store flashcards in local storage
let flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
let currentCardIndex = 0;
let score = 0;

// DOM Elements
const flashcardForm = document.getElementById('flashcard-form');
const questionInput = document.getElementById('question');
const answerInput = document.getElementById('answer');
const flashcardsContainer = document.getElementById('flashcards-container');
const flashcardElement = document.getElementById('flashcard');
const displayQuestion = document.getElementById('display-question');
const displayAnswer = document.getElementById('display-answer');
const flipBtn = document.getElementById('flip-btn');
const nextBtn = document.getElementById('next-btn');
const startQuizBtn = document.getElementById('start-quiz');
const scoreElement = document.getElementById('score');
const totalElement = document.getElementById('total');

// Fetch questions from API
async function fetchQuestions(amount = 10) {
    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=${amount}&type=multiple`);
        const data = await response.json();
        
        if (data.results) {
            // Convert API questions to flashcard format
            const newFlashcards = data.results.map(q => ({
                id: Date.now() + Math.random(),
                question: decodeHTMLEntities(q.question),
                answer: decodeHTMLEntities(q.correct_answer),
                incorrect_answers: q.incorrect_answers.map(a => decodeHTMLEntities(a))
            }));
            
            flashcards = [...flashcards, ...newFlashcards];
            saveToLocalStorage();
            displayFlashcards();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error fetching questions:', error);
        return false;
    }
}

// Helper function to decode HTML entities
function decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

// Add new flashcard
flashcardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    
    if (question && answer) {
        const flashcard = {
            id: Date.now(),
            question,
            answer
        };
        
        flashcards.push(flashcard);
        saveToLocalStorage();
        displayFlashcards();
        flashcardForm.reset();
    }
});

// Add "Fetch Questions" button to form container
const fetchButton = document.createElement('button');
fetchButton.textContent = 'Fetch Trivia Questions';
fetchButton.type = 'button';
fetchButton.className = 'fetch-button';
fetchButton.onclick = async () => {
    fetchButton.disabled = true;
    fetchButton.textContent = 'Loading...';
    const success = await fetchQuestions(5); // Fetch 5 questions at a time
    fetchButton.disabled = false;
    fetchButton.textContent = 'Fetch Trivia Questions';
    if (!success) {
        alert('Failed to fetch questions. Please try again.');
    }
};
flashcardForm.appendChild(fetchButton);

// Save flashcards to local storage
function saveToLocalStorage() {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
}

// Display all flashcards in the list
function displayFlashcards() {
    flashcardsContainer.innerHTML = '';
    flashcards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'flashcard-item';
        
        let answersHtml = '';
        if (card.incorrect_answers) {
            const allAnswers = [card.answer, ...card.incorrect_answers];
            shuffleArray(allAnswers);
            answersHtml = `
                <p><strong>Options:</strong></p>
                <ul>
                    ${allAnswers.map(answer => `<li>${answer}</li>`).join('')}
                </ul>
            `;
        }
        
        cardElement.innerHTML = `
            <p><strong>Question:</strong> ${card.question}</p>
            <p><strong>Correct Answer:</strong> ${card.answer}</p>
            ${answersHtml}
            <button onclick="deleteFlashcard(${card.id})">Delete</button>
        `;
        flashcardsContainer.appendChild(cardElement);
    });
}

// Helper function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Delete flashcard
function deleteFlashcard(id) {
    flashcards = flashcards.filter(card => card.id !== id);
    saveToLocalStorage();
    displayFlashcards();
}

// Quiz functionality
startQuizBtn.addEventListener('click', startQuiz);
flipBtn.addEventListener('click', flipCard);
nextBtn.addEventListener('click', nextCard);

function startQuiz() {
    if (flashcards.length === 0) {
        alert('Please add some flashcards or fetch questions first!');
        return;
    }
    
    currentCardIndex = 0;
    score = 0;
    shuffleFlashcards();
    updateScore();
    showCard();
    
    // Show quiz controls
    flipBtn.style.display = 'inline-block';
    nextBtn.style.display = 'inline-block';
    startQuizBtn.style.display = 'none';
}

function shuffleFlashcards() {
    for (let i = flashcards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
    }
}

function showCard() {
    if (currentCardIndex < flashcards.length) {
        const card = flashcards[currentCardIndex];
        displayQuestion.textContent = card.question;
        
        let answerContent = card.answer;
        if (card.incorrect_answers) {
            const allAnswers = [card.answer, ...card.incorrect_answers];
            shuffleArray(allAnswers);
            answerContent = `
                Correct Answer: ${card.answer}
                
                All Options:
                ${allAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n')}
            `;
        }
        
        displayAnswer.textContent = answerContent;
        flashcardElement.classList.remove('flipped');
    } else {
        endQuiz();
    }
}

function flipCard() {
    flashcardElement.classList.toggle('flipped');
}

function nextCard() {
    if (flashcardElement.classList.contains('flipped')) {
        score++;
        updateScore();
    }
    currentCardIndex++;
    showCard();
}

function updateScore() {
    scoreElement.textContent = score;
    totalElement.textContent = flashcards.length;
}

function endQuiz() {
    displayQuestion.textContent = `Quiz Complete! Your score: ${score}/${flashcards.length}`;
    displayAnswer.textContent = 'Click Start Quiz to try again!';
    flipBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    startQuizBtn.style.display = 'inline-block';
}

// Initial display
displayFlashcards(); 