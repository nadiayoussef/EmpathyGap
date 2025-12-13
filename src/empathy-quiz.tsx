import React, { useState, useEffect } from 'react';

const API_KEY = '$2a$10$2WaSjbnj2iTAd3ctRGEey.NxuNOK2hFD3lo5xw9NMNPm.U0paSkvm';
const BIN_ID = '693d99f343b1c97be9ebe948';

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

  // Only poll for new responses when on results screen
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

    const interval = setInterval(checkForNewResponses, 5000);
    
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
        <img
          src="/assets/images/restingGap2.png"
          alt=""
          style={{
            position: 'absolute',
            bottom: '0.5%',
            left: 0,
            width: '100%',
            height: 'auto',
            zIndex: 1
          }}
        />
        <img
          src="/assets/images/restingGap1.png"
          alt=""
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 'auto',
            zIndex: 1
          }}
        />
        
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
              src="/assets/images/hand.png"
              alt=""
              style={{ width: '60px', height: '60px', objectFit: 'contain' }}
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
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            position: 'relative',
            height: '60px'
          }}>
            <div style={{
              display: 'flex',
              flex: 1,
              height: '24px',
              position: 'relative'
            }}>
              <img 
                src="/assets/images/fingerPointPic.png"
                alt="Progress"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `calc(${((currentQuestion + 1) / 10) * 100}%)`,
                  transform: 'translate(-50%, -50%)',
                  width: '70px',
                  height: '70px',
                  zIndex: 10,
                  opacity: currentQuestion === 9 ? 0.0 : 1,
                  transition: 'left 0.5s ease, opacity 0.5s ease',
                }}
              />
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '100%',
                    backgroundColor: '#7ca0c2',
                    position: 'relative',
                    opacity: i <= currentQuestion ? 1 : 0.4,
                    clipPath: i === 0 
                      ? 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)' 
                      : i === 9 
                        ? 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)'
                        : 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)'
                  }}
                />
              ))}
            </div>
            
            <img 
              src="/assets/images/heartPic.png"
              alt="Heart"
              style={{ width: '50px', height: '50px', marginLeft: '1rem' }}
            />
          </div>
        </div>

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
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>
            Question {currentQuestion + 1}
          </h2>
          <h3 style={{
            fontFamily: "'Rockwell', serif",
            fontWeight: 'bold',
            color: '#403027',
            fontSize: '6rem',
            textAlign: 'center',
            marginBottom: '4rem',
            lineHeight: 1.2
          }}>
            {questions[currentQuestion]}
          </h3>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <button
              onClick={() => handleAnswer(true)}
              style={{
                backgroundColor: '#f66fac',
                color: '#fef6e3',
                fontFamily: "'Rockwell', serif",
                fontWeight: 'normal',
                fontStyle: 'italic',
                fontSize: '5rem',
                padding: '3rem 8rem',
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
                fontSize: '5rem',
                padding: '3rem 8rem',
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

    const resultConfig: { [key: string]: { bgColor: string; wave1: string; wave2: string; showDoneButton: boolean } } = {
      'gap': {
        bgColor: '#fef6e3',
        wave1: '/assets/images/pinkGap1.png',
        wave2: '/assets/images/pinkGap2.png',
        showDoneButton: true
      },
      'no-gap': {
        bgColor: '#cad4d6',
        wave1: '/assets/images/blueGap1.png',
        wave2: '/assets/images/blueGap2.png',
        showDoneButton: true
      },
      'rude': {
        bgColor: '#fef6e3',
        wave1: '/assets/images/orangeGap1.png',
        wave2: '/assets/images/orangeGap2.png',
        showDoneButton: true
      }
    };

    const config = resultConfig[result];

    return (
      <div 
        style={{
          backgroundColor: config.bgColor,
          width: '100vw',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {result === 'no-gap' ? (
          <>
            <img src={config.wave1} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', zIndex: 1 }} />
            <img src={config.wave2} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', zIndex: 2 }} />
          </>
        ) : (
          <>
            <img src={config.wave2} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', zIndex: 1 }} />
            <img src={config.wave1} alt="" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'auto', zIndex: 1 }} />
          </>
        )}

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginTop: '15%' }}>
          {result === 'gap' && (
            <h1 style={{ fontFamily: "'Rockwell', serif", color: '#403027', fontSize: '4rem', marginBottom: '2rem', fontWeight: 'normal' }}>
              You have an <span style={{ fontWeight: 'bold' }}>empathy gap</span>
            </h1>
          )}
          {result === 'no-gap' && (
            <h1 style={{ fontFamily: "'Rockwell', serif", color: '#403027', fontSize: '4rem', marginBottom: '2rem', fontWeight: 'normal' }}>
              You don't have an <span style={{ fontWeight: 'bold' }}>empathy gap</span>
            </h1>
          )}
          {result === 'rude' && (
            <h1 style={{ fontFamily: "'Rockwell', serif", color: '#403027', fontSize: '4rem', marginBottom: '2rem', fontWeight: 'normal' }}>
              Hmm... you might<br />just be rude...
            </h1>
          )}

          <div style={{ marginTop: '2rem' }}>
            <p style={{ fontFamily: "'Rockwell', serif", color: '#403027', fontSize: result === 'rude' ? '1.8rem' : '2.5rem', marginBottom: '0.5rem' }}>
              {result === 'rude' ? 'Learn about empathy gaps anyway' : 'Learn about empathy gaps'}
            </p>
            <svg width="200" height="24" viewBox="0 0 200 24" fill="none" style={{ marginTop: '0.5rem' }}>
              <line x1="0" y1="12" x2="180" y2="12" stroke="#403027" strokeWidth="2"/>
              <path d="M175 6 L185 12 L175 18" stroke="#403027" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          {config.showDoneButton && (
            <button
              onClick={resetQuiz}
              style={{
                backgroundColor: '#7ca0c2',
                color: '#fef6e3',
                fontFamily: "'Rockwell', serif",
                fontStyle: 'italic',
                fontSize: '2rem',
                padding: '1rem 3rem',
                borderRadius: '17px',
                border: 'none',
                cursor: 'pointer',
                marginTop: '2rem',
                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
              }}
            >
              DONE
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default EmpathyQuiz;