import React, { useState, useEffect } from 'react';
import leftGapPic from './assets/images/leftGap.png';
import rightGapPic from './assets/images/rightGap.png';
import handPic from './assets/images/hand.png';
import fingerPointPic from './assets/images/fingerPointPic.png';
import heartPic from './assets/images/heartPic.png';

const API_KEY = '$2a$10$2SJqBeF.2mExcuqvz0lO.e/VxRbWDCz0mEk/lWJs7vrWgVYFf1aR6';
const BIN_ID = '69304915ae596e708f80f833';

const EmpathyQuiz = () => {
  const [screen, setScreen] = useState('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [responseCount, setResponseCount] = useState(0);

  const questions = [
    "When you entered, did anyone hold the door for you?",
    "If you dropped something, would anyone help?",
    "Would people here compliment you?",
    "Would anyone here comfort you if you cried in public?",
    "Would anyone here invite you to join their group?",
    "Have you taken a stranger's photo for them?",
    "Have you held the door open for someone recently?",
    "Have you recently started a conversation with a stranger?",
    "Have you listened to a friend share their feelings recently?",
    "Would you help someone who asks for directions?"
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
      <main 
        style={{ 
          backgroundColor: '#fef6e3',
          width: '100vw', 
          height: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Left wavy border */}
        <img
          src={leftGapPic}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: 'auto',
            opacity: 0.5
          }}
        />

        {/* Right wavy border */}
        <img
          src={rightGapPic}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: 'auto',
            opacity: 0.5
          }}
        />
        
        {/* Main content - centered using absolute positioning */}
        <div 
          style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            textAlign: 'center'
          }}
        >
          <h1 
            style={{ 
              fontFamily: "'Rockwell', serif",
              fontWeight: 'bold',
              color: '#403027',
              fontSize: '8rem',
              lineHeight: 1.1,
              marginBottom: '2rem',
              margin: '0 0 2rem 0'
            }}
          >
            What would<br />YOU do?
          </h1>
          
          {/* Button */}
          <button
            onClick={() => setScreen('quiz')}
            style={{
              backgroundColor: '#7ca0c2',
              borderRadius: '17px',
              padding: '1.5rem 4rem',
              fontFamily: "'Rockwell', serif",
              fontWeight: 'bold',
              fontStyle: 'italic',
              color: '#fef6e3',
              fontSize: '3rem',
              cursor: 'pointer',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            Find out
            <img 
              src={handPic} 
              alt="" 
              style={{ 
                width: '60px', 
                height: '60px',
                objectFit: 'contain'
              }} 
            />
          </button>
        </div>
      </main>
    );
  }

  if (screen === 'quiz') {
    return (
      <div 
        style={{
          backgroundColor: '#fef6e3',
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 4rem'
        }}
      >
        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            position: 'relative',
            height: '60px'
          }}>
            {/* Progress track with stripes */}
            <div style={{
              flex: 1,
              height: '24px',
              borderRadius: '12px',
              background: `repeating-linear-gradient(
                -45deg,
                #7ca0c2,
                #7ca0c2 10px,
                #fef6e3 10px,
                #fef6e3 20px
              )`,
              position: 'relative'
            }}>
              {/* Hand indicator */}
              <img 
                src={fingerPointPic}
                alt="Progress"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${progress}%`,
                  transform: 'translate(-50%, -50%) scaleX(-1)',
                  width: '50px',
                  height: '50px',
                  transition: 'left 0.5s ease'
                }}
              />
            </div>
            {/* Heart at end */}
            <img 
              src={heartPic}
              alt="Heart"
              style={{
                width: '50px',
                height: '50px',
                marginLeft: '1rem'
              }}
            />
          </div>
        </div>

        {/* Question content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%'
        }}>
          <h2 style={{
            fontFamily: "'Rockwell', serif",
            fontWeight: 'normal',
            color: '#403027',
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            Question {currentQuestion + 1}
          </h2>
          <h3 style={{
            fontFamily: "'Rockwell', serif",
            fontWeight: 'bold',
            color: '#403027',
            fontSize: '3rem',
            textAlign: 'center',
            marginBottom: '4rem',
            lineHeight: 1.2
          }}>
            {questions[currentQuestion]}
          </h3>

          {/* Answer Buttons */}
          <div style={{ display: 'flex', gap: '2rem' }}>
            <button
              onClick={() => handleAnswer(true)}
              style={{
                backgroundColor: '#f66fac',
                color: '#fef6e3',
                fontFamily: "'Rockwell', serif",
                fontWeight: 'normal',
                fontStyle: 'italic',
                fontSize: '2.5rem',
                padding: '1.5rem 4rem',
                borderRadius: '17px',
                border: 'none',
                cursor: 'pointer',
                minWidth: '200px',
                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
              }}
            >
              YES
            </button>
            <button
              onClick={() => handleAnswer(false)}
              style={{
                backgroundColor: '#f09924',
                color: '#fef6e3',
                fontFamily: "'Rockwell', serif",
                fontWeight: 'normal',
                fontStyle: 'italic',
                fontSize: '2.5rem',
                padding: '1.5rem 4rem',
                borderRadius: '17px',
                border: 'none',
                cursor: 'pointer',
                minWidth: '200px',
                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
              }}
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
          <h1 className="text-5xl md:text-7xl font-bold text-[#403027] mb-8 text-center font-['Rockwell',serif]">
            You have an<br />empathy gap
          </h1>
        )}

        {result === 'no-gap' && (
          <h1 className="text-5xl md:text-7xl font-bold text-[#403027] mb-8 text-center font-['Rockwell',serif]">
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