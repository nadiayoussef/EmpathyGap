export type QuizDataPoint = {
  x: number;
  yesPercent: number;
};

export type QuizData = {
  data: QuizDataPoint[];
  totalResponses: number;
};

const API_KEY = '$2a$10$kJKCv7tKOSVEcERtR2jxpeFG9mRkHBasPVyP54BIA6QiXvJXvZB5K';
const BIN_ID = '693c489d43b1c97be9e9b4b9';

export const fetchQuizData = async (): Promise<QuizData> => {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const json = await response.json();

    const responses = json.record.responses || [];

    const yesCounts = new Array(10).fill(0);
    responses.forEach((response: boolean[]) => {
      response.forEach((answer, index) => {
        if (answer) yesCounts[index]++;
      });
    });

    const data = yesCounts.map((count, i) => ({
      x: i + 1,
      yesPercent: responses.length > 0 ? (count / responses.length) * 100 : 0
    }));

    return { data, totalResponses: responses.length };
  } catch (error) {
    console.error('Error fetching data:', error);
    // Return empty data on error
    return {
      data: Array.from({ length: 10 }, (_, i) => ({
        x: i + 1,
        yesPercent: 0
      })),
      totalResponses: 0
    };
  }
};