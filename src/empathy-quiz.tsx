import React, { useState } from 'react';

const EmpathyQuiz = () => {
  const [screen, setScreen] = useState('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const questions = [
    "Have you taken a stranger's photo for them?",
    "Have you held the door open for someone recently?",
    "Have you recently started a conversation with a stranger?",
    "Have you listened to a friend share their feelings recently?",
    "Would you help someone who asks for directions?",
    "When you entered, did anyone hold the door for you?",
    "If you dropped something, would anyone help?",
    "Would people here compliment you?",
    "Would anyone here comfort you if you cried in public?",
    "Would anyone here invite you to join their group?"
  ];

  const saveToJSONBin = async (answers: boolean[]) => {
    const API_KEY = '$2a$10$2SJqBeF.2mExcuqvz0lO.e/VxRbWDCz0mEk/lWJs7vrWgVYFf1aR6';
    const BIN_ID = '69304915ae596e708f80f833';

    try {
      // First, fetch existing data
      const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Master-Key': API_KEY }
      });
      const existingData = await getResponse.json();

      // Get existing responses array (or create empty one)
      const responses = existingData.record?.responses || [];

      // Add new response (just the boolean array)
      responses.push(answers);

      // Save updated data back to JSONBin
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify({ responses })
      });

      console.log('Response saved! Total responses:', responses.length);
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  };

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      saveToJSONBin(newAnswers);
      setScreen('result');
    }
  };

  const getResult = () => {
    const yesCount = answers.filter(a => a).length;
    const ratio = yesCount / answers.length;

    if (ratio > 2/3) {
      return 'no-gap';
    } else if (ratio < 1/3) {
      return 'rude';
    } else {
      return 'gap';
    }
  };

  const resetQuiz = () => {
    setScreen('intro');
    setCurrentQuestion(0);
    setAnswers([]);
  };

  const progress = ((currentQuestion) / questions.length) * 100;

  if (screen === 'intro') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex flex-col items-center justify-center p-8">
        <h1 className="text-6xl md:text-8xl font-bold text-[#4A4A4A] mb-12 text-center">
          What would<br />YOU do?
        </h1>
        <button
          onClick={() => setScreen('quiz')}
          className="bg-[#7FB3D5] hover:bg-[#6BA3C5] text-white text-2xl font-medium px-12 py-4 rounded-lg transition-colors flex items-center gap-3"
        >
          Find out 🤝
        </button>
      </div>
    );
  }

  if (screen === 'quiz') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex flex-col p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">✋</span>
            <div className="flex-1 mx-4 h-8 bg-white/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#7FB3D5] to-[#7FB3D5] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-2xl">💗</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-medium text-[#4A4A4A] mb-4">
            Question {currentQuestion + 1}
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-[#4A4A4A] mb-16 text-center">
            {questions[currentQuestion]}
          </h3>

          <div className="flex gap-8">
            <button
              onClick={() => handleAnswer(true)}
              className="bg-[#B8E6B8] hover:bg-[#A8D6A8] text-[#4A4A4A] text-3xl font-bold px-16 py-8 rounded-2xl transition-colors min-w-[200px]"
            >
              YES
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="bg-[#F5C6CB] hover:bg-[#E5B6BB] text-[#4A4A4A] text-3xl font-bold px-16 py-8 rounded-2xl transition-colors min-w-[200px]"
            >
              NO
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'result') {
    const result = getResult();

    return (
      <div className="min-h-screen bg-[#F5F1E8] flex flex-col items-center justify-center p-8">
        {result === 'gap' && (
          <>
            <h1 className="text-5xl md:text-7xl font-bold text-[#4A4A4A] mb-8 text-center">
              You have an<br />empathy gap
            </h1>
            <button
              onClick={resetQuiz}
              className="text-xl text-[#4A4A4A] underline hover:text-[#7FB3D5] mt-8"
            >
              Learn about empathy gaps →
            </button>
          </>
        )}

        {result === 'no-gap' && (
          <>
            <h1 className="text-5xl md:text-7xl font-bold text-[#4A4A4A] mb-8 text-center">
              You don't have an<br />empathy gap
            </h1>
            <button
              onClick={resetQuiz}
              className="text-xl text-[#4A4A4A] underline hover:text-[#7FB3D5] mt-8"
            >
              Learn about empathy gaps →
            </button>
          </>
        )}

        {result === 'rude' && (
          <>
            <h1 className="text-5xl md:text-7xl font-bold text-[#4A4A4A] mb-8 text-center">
              Hmm... you might<br />just be rude...
            </h1>
            <button
              onClick={resetQuiz}
              className="text-xl text-[#4A4A4A] underline hover:text-[#7FB3D5] mt-8"
            >
              Learn about empathy gaps anyway →
            </button>
          </>
        )}

        <button
          onClick={resetQuiz}
          className="mt-8 bg-[#7FB3D5] hover:bg-[#6BA3C5] text-white text-lg font-medium px-8 py-3 rounded-lg transition-colors"
        >
          Take Quiz Again
        </button>
      </div>
    );
  }

  return null;
};

export default EmpathyQuiz;