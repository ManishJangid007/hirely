import React, { useState } from 'react';
import { XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { Candidate, Question } from '../types';

interface ResultSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  questions: Question[];
}

const ResultSummaryModal: React.FC<ResultSummaryModalProps> = ({
  isOpen,
  onClose,
  candidate,
  questions
}) => {
  const [copied, setCopied] = useState(false);

  // Load interview result from localStorage
  const getInterviewResult = () => {
    const saved = localStorage.getItem(`interview_result_${candidate.id}`);
    return saved ? JSON.parse(saved) : null;
  };

  const interviewResult = getInterviewResult();

  const getQuestionsBySection = () => {
    const sections: { [key: string]: Question[] } = {};
    questions.forEach(question => {
      if (!sections[question.section]) {
        sections[question.section] = [];
      }
      sections[question.section].push(question);
    });
    return sections;
  };

  const generateSummaryText = () => {
    const sections = getQuestionsBySection();
    let summary = `${candidate.fullName} - ${candidate.experience.years} Years of Experience\n\n`;
    
    if (interviewResult?.description) {
      summary += `[Interviewer Description]\n${interviewResult.description}\n\n`;
    }

    Object.entries(sections).forEach(([sectionName, sectionQuestions]) => {
      const correctQuestions = sectionQuestions.filter(q => q.isCorrect === true);
      const wrongQuestions = sectionQuestions.filter(q => q.isCorrect === false);

      summary += `${sectionName}\n`;
      
      if (correctQuestions.length > 0) {
        summary += `  Knows\n`;
        correctQuestions.forEach(q => {
          summary += `    ${q.text}\n`;
        });
      }

      if (wrongQuestions.length > 0) {
        summary += `  Doesn't Know\n`;
        wrongQuestions.forEach(q => {
          summary += `    ${q.text}\n`;
        });
      }

      summary += '\n';
    });

    return summary;
  };

  const handleCopy = async () => {
    const summaryText = generateSummaryText();
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!isOpen) return null;

  const sections = getQuestionsBySection();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">Interview Result Summary</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCopy}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Candidate Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {candidate.fullName} - {candidate.experience.years} Years of Experience
            </h4>
            <p className="text-sm text-gray-600">{candidate.position}</p>
            <p className="text-sm text-gray-600">
              {candidate.experience.years} years, {candidate.experience.months} months experience
            </p>
          </div>

          {/* Interview Description */}
          {interviewResult?.description && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Interviewer Description</h4>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{interviewResult.description}</p>
              </div>
            </div>
          )}

          {/* Questions by Section */}
          <div className="space-y-6">
            {Object.entries(sections).map(([sectionName, sectionQuestions]) => {
              const correctQuestions = sectionQuestions.filter(q => q.isCorrect === true);
              const wrongQuestions = sectionQuestions.filter(q => q.isCorrect === false);

              return (
                <div key={sectionName} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="text-lg font-medium text-gray-900">{sectionName}</h4>
                  </div>
                  
                  <div className="divide-y">
                    {correctQuestions.length > 0 && (
                      <div className="p-4">
                        <h5 className="text-sm font-medium text-success-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                          Knows ({correctQuestions.length})
                        </h5>
                        <ul className="space-y-2">
                          {correctQuestions.map((question) => (
                            <li key={question.id} className="text-sm text-gray-700 pl-4">
                              {question.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {wrongQuestions.length > 0 && (
                      <div className="p-4">
                        <h5 className="text-sm font-medium text-danger-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-danger-500 rounded-full mr-2"></span>
                          Doesn't Know ({wrongQuestions.length})
                        </h5>
                        <ul className="space-y-2">
                          {wrongQuestions.map((question) => (
                            <li key={question.id} className="text-sm text-gray-700 pl-4">
                              {question.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultSummaryModal; 