import React, { useState, useEffect } from 'react';

// Replace these with your actual image paths
const artboard11 = '/path/to/artboard-1-1.png';
const artboard1 = '/path/to/artboard-1.png';
const untitledArtwork21 = '/path/to/untitled-artwork-2-1.png';

const API_KEY = '$2a$10$2SJqBeF.2mExcuqvz0lO.e/VxRbWDCz0mEk/lWJs7vrWgVYFf1aR6';
const BIN_ID = '69304915ae596e708f80f833';

const EmpathyQuiz = () => {
  const [screen, setScreen] = useState('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [responseCount, setResponseCount] = useState(0);

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
    try {
      const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Master-Key': API_KEY }
      });
      const existingData = await getResponse.json();
      const responses = existingData.record?.responses || [];
      responses.push(answers);

      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify({ responses })
      });

      console.log('Response saved! Total responses:', responses.length);
      setResponseCount(responses.length);
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  };

  // Poll for new responses when on results screen
  useEffect(() => {
    if (screen !== 'result') return;

    const checkForNewResponses = async () => {
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
          headers: { 'X-Master-Key': API_KEY }
        });
        const data = await response.json();
        const newCount = data.record?.responses?.length || 0;
        
        if (newCount !== responseCount) {
          setResponseCount(newCount);
          window.dispatchEvent(new CustomEvent('quizDataUpdated'));
        }
      } catch (error) {
        console.error('Error checking for new responses:', error);
      }
    };

    const interval = setInterval(checkForNewResponses, 3000);
    
    return () => clearInterval(interval);
  }, [screen, responseCount]);

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
      <main className="bg-[#fef6e3] overflow-hidden w-full min-h-screen relative">
        {/* Decorative wave patterns - left side */}
        <img
          className="absolute top-0 left-0 h-full w-auto object-cover"
          alt="Decorative wave pattern background layer"
          src={artboard11}
        />
        <img
          className="absolute top-0 left-0 h-full w-auto object-cover"
          alt="Decorative wave pattern background layer"
          src={artboard1}
        />
        
        {/* Pink background bar */}
        <div
          className="absolute top-0 left-0 w-[341px] h-full bg-[#f8c0cc]"
          aria-hidden="true"
        />
        
        {/* Main content */}
        <div className="relative min-h-screen flex flex-col items-center justify-center px-8">
          <h1 className="font-['Rokkitt',serif] font-bold text-[#403027] text-7xl md:text-9xl text-center tracking-[0] leading-tight mb-12">
            What would<br />YOU do?
          </h1>
          
          {/* Button */}
          <button
            onClick={() => setScreen('quiz')}
            className="bg-[#7ca0c2] rounded-[17px] px-16 py-6 font-['Rokkitt',serif] font-bold italic text-[#fef6e3] text-4xl md:text-5xl tracking-[0] cursor-pointer hover:opacity-90 transition-opacity"
            aria-label="Find out what you would do"
          >
            Find out
          </button>
        </div>
        
        {/* Hand illustration - bottom left */}
        <img
          className="absolute bottom-8 left-8 w-[150px] h-[150px] object-cover"
          alt="Decorative hand illustration"
          src={untitledArtwork21}
        />
      </main>
    );
  }

  if (screen === 'quiz') {
    return (
      <div className="min-h-screen bg-[#fef6e3] flex flex-col p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">✋</span>
            <div className="flex-1 mx-4 h-8 bg-white/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#7ca0c2] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-2xl">💗</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-medium text-[#403027] mb-4 font-['Rokkitt',serif]">
            Question {currentQuestion + 1}
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-[#403027] mb-16 text-center font-['Rokkitt',serif]">
            {questions[currentQuestion]}
          </h3>

          <div className="flex gap-8">
            <button
              onClick={() => handleAnswer(true)}
              className="bg-[#B8E6B8] hover:bg-[#A8D6A8] text-[#403027] text-3xl font-bold px-16 py-8 rounded-2xl transition-colors min-w-[200px] font-['Rokkitt',serif]"
            >
              YES
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="bg-[#f8c0cc] hover:bg-[#e8b0bc] text-[#403027] text-3xl font-bold px-16 py-8 rounded-2xl transition-colors min-w-[200px] font-['Rokkitt',serif]"
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
      <div className="min-h-screen bg-[#fef6e3] flex flex-col items-center justify-center p-8">
        {result === 'gap' && (
          <h1 className="text-5xl md:text-7xl font-bold text-[#403027] mb-8 text-center font-['Rokkitt',serif]">
            You have an<br />empathy gap
          </h1>
        )}

        {result === 'no-gap' && (
          <h1 className="text-5xl md:text-7xl font-bold text-[#403027] mb-8 text-center font-['Rokkitt',serif]">
            You don't have an<br />empathy gap
          </h1>
        )}

        {result === 'rude' && (
          <h1 className="text-5xl md:text-7xl font-bold text-[#403027] mb-8 text-center font-['Rokkitt',serif]">
            Hmm... you might<br />just be rude...
          </h1>
        )}

        <button
          onClick={resetQuiz}
          className="mt-8 bg-[#7ca0c2] hover:opacity-90 text-[#fef6e3] text-lg font-bold px-8 py-3 rounded-[17px] transition-opacity font-['Rokkitt',serif] italic"
        >
          Take Quiz Again
        </button>
      </div>
    );
  }

  return null;
};

export default EmpathyQuiz;