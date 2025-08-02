import { databaseService } from '../services/database';
import { Candidate, QuestionTemplate, QuestionSection } from '../types';

// Sample data for generating random candidates
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica', 'Robert', 'Amanda',
  'William', 'Ashley', 'Christopher', 'Stephanie', 'Daniel', 'Nicole', 'Matthew', 'Elizabeth', 'Anthony', 'Megan',
  'Joshua', 'Lauren', 'Andrew', 'Rachel', 'Ryan', 'Kayla', 'Nicholas', 'Amber', 'Tyler', 'Brittany',
  'Alexander', 'Danielle', 'Nathan', 'Melissa', 'Samuel', 'Victoria', 'Benjamin', 'Rebecca', 'Christian', 'Michelle'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const positions = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist',
  'Mobile Developer', 'UI/UX Designer', 'Product Manager', 'QA Engineer', 'System Administrator',
  'Cloud Engineer', 'Security Engineer', 'Machine Learning Engineer', 'React Developer', 'Node.js Developer'
];

const statuses: Candidate['status'][] = ['Not Interviewed', 'Passed', 'Rejected', 'Maybe'];

// Sample questions for templates
const technicalQuestions = [
  {
    question: 'Explain the difference between let, const, and var in JavaScript.',
    answer: 'let and const are block-scoped, while var is function-scoped. const cannot be reassigned, let can be reassigned, and var can be redeclared and reassigned. let and const are hoisted but not initialized, while var is hoisted and initialized with undefined.'
  },
  {
    question: 'What is the event loop in JavaScript?',
    answer: 'The event loop is a mechanism that allows JavaScript to perform non-blocking operations. It continuously checks the call stack and if it\'s empty, it takes the first task from the callback queue and pushes it to the call stack. This enables asynchronous programming.'
  },
  {
    question: 'How does React handle state updates?',
    answer: 'React uses a virtual DOM to track changes. When state is updated via setState, React creates a new virtual DOM tree, compares it with the previous one (diffing), and only updates the actual DOM where changes occurred. This makes React efficient and fast.'
  },
  {
    question: 'Explain the concept of closures in JavaScript.',
    answer: 'A closure is a function that has access to variables in its outer scope even after the outer function has returned. It "remembers" the environment in which it was created, allowing for data privacy and function factories.'
  },
  {
    question: 'What is the difference between synchronous and asynchronous programming?',
    answer: 'Synchronous programming executes code sequentially, blocking until each operation completes. Asynchronous programming allows operations to run in the background, enabling non-blocking execution and better performance for I/O operations.'
  },
  {
    question: 'How would you optimize a slow database query?',
    answer: 'Add proper indexes, use query optimization techniques, limit results, use pagination, avoid SELECT *, use appropriate data types, normalize/denormalize as needed, use query caching, and analyze execution plans.'
  },
  {
    question: 'Explain the SOLID principles.',
    answer: 'SOLID stands for: Single Responsibility (one class, one reason to change), Open/Closed (open for extension, closed for modification), Liskov Substitution (subtypes are substitutable), Interface Segregation (many specific interfaces), Dependency Inversion (depend on abstractions).'
  },
  {
    question: 'What is dependency injection?',
    answer: 'Dependency injection is a design pattern where dependencies are provided to a class rather than the class creating them itself. This promotes loose coupling, testability, and flexibility by making dependencies explicit and interchangeable.'
  },
  {
    question: 'How does garbage collection work?',
    answer: 'Garbage collection automatically frees memory by identifying and removing objects that are no longer reachable. Common algorithms include mark-and-sweep, generational collection, and reference counting. It prevents memory leaks but can cause performance pauses.'
  },
  {
    question: 'Explain the concept of microservices.',
    answer: 'Microservices is an architectural style where an application is built as a collection of small, independent services. Each service runs in its own process, communicates via HTTP/REST or messaging, and can be developed, deployed, and scaled independently.'
  }
];

const behavioralQuestions = [
  {
    question: 'Tell me about a time you had to work with a difficult team member.',
    answer: 'I once worked with a team member who was resistant to new processes. I took time to understand their concerns, explained the benefits clearly, and found common ground. We ended up collaborating effectively and even improved the process together.'
  },
  {
    question: 'Describe a situation where you had to learn a new technology quickly.',
    answer: 'When our team needed to implement a new API framework, I dedicated evenings to tutorials, built a small proof-of-concept, and shared my learnings with the team. Within a week, I was able to contribute meaningfully to the project.'
  },
  {
    question: 'How do you handle tight deadlines?',
    answer: 'I prioritize tasks based on impact and urgency, break large projects into smaller milestones, communicate early about potential blockers, and sometimes work extra hours when necessary. I also learn from each deadline to improve future planning.'
  },
  {
    question: 'Tell me about a project that failed and what you learned from it.',
    answer: 'A project failed due to poor requirements gathering. I learned to ask more probing questions upfront, document assumptions clearly, and get stakeholder sign-off early. This experience made me much better at project planning.'
  },
  {
    question: 'How do you stay updated with the latest technology trends?',
    answer: 'I follow tech blogs, attend conferences, participate in online communities, take courses, and experiment with new technologies in side projects. I also share knowledge with my team through tech talks and documentation.'
  },
  {
    question: 'Describe a time when you had to make a difficult technical decision.',
    answer: 'I had to choose between two database solutions. I created a comparison matrix, consulted with senior developers, considered long-term implications, and made a decision based on our specific requirements and constraints.'
  },
  {
    question: 'How do you handle conflicting requirements from stakeholders?',
    answer: 'I gather all requirements, identify conflicts, facilitate discussions between stakeholders, propose compromises, and document decisions clearly. I focus on finding solutions that meet the core business needs.'
  },
  {
    question: 'Tell me about a time you mentored someone.',
    answer: 'I mentored a junior developer by pairing on code reviews, explaining architectural decisions, providing resources for learning, and giving constructive feedback. It was rewarding to see their growth and confidence improve.'
  },
  {
    question: 'How do you prioritize tasks when you have multiple deadlines?',
    answer: 'I use a priority matrix considering impact, urgency, and dependencies. I communicate with stakeholders about realistic timelines, focus on high-impact work first, and sometimes negotiate deadlines when necessary.'
  },
  {
    question: 'Describe a situation where you had to debug a complex issue.',
    answer: 'I systematically isolated the problem by checking logs, reproducing the issue, testing hypotheses, and using debugging tools. I documented my findings and implemented a fix with proper testing to prevent regression.'
  }
];

const systemDesignQuestions = [
  {
    question: 'Design a URL shortening service like bit.ly.',
    answer: 'Use a hash function to generate short URLs, store mappings in a database, implement caching with Redis, use CDN for global distribution, add analytics tracking, implement rate limiting, and consider using a distributed ID generator for scalability.'
  },
  {
    question: 'How would you design a chat application?',
    answer: 'Use WebSockets for real-time communication, implement message queuing with Redis/RabbitMQ, store messages in a database, use load balancers for horizontal scaling, implement user authentication, and add features like typing indicators and read receipts.'
  },
  {
    question: 'Design a recommendation system for an e-commerce platform.',
    answer: 'Use collaborative filtering, content-based filtering, and hybrid approaches. Store user behavior data, implement A/B testing, use machine learning models, cache recommendations, and update models periodically based on new data.'
  },
  {
    question: 'How would you design a distributed cache?',
    answer: 'Use consistent hashing for data distribution, implement replication for fault tolerance, use Redis or Memcached, implement cache invalidation strategies, monitor cache hit rates, and use multiple cache layers (L1, L2) for optimal performance.'
  },
  {
    question: 'Design a file sharing service like Dropbox.',
    answer: 'Use cloud storage (S3), implement file deduplication, use CDN for global access, implement versioning, add encryption, use chunked uploads for large files, implement sync algorithms, and add collaboration features.'
  },
  {
    question: 'How would you design a real-time analytics system?',
    answer: 'Use stream processing (Kafka, Flink), implement time-series databases, use data pipelines, implement real-time dashboards, use caching for frequently accessed data, and implement alerting systems for anomalies.'
  },
  {
    question: 'Design a social media feed system.',
    answer: 'Use a news feed algorithm, implement caching with Redis, use database sharding, implement push/pull hybrid model, add personalization, use CDN for media, implement real-time updates, and optimize for read-heavy workloads.'
  },
  {
    question: 'How would you design a load balancer?',
    answer: 'Use health checks, implement multiple algorithms (round-robin, least connections, IP hash), use sticky sessions when needed, implement SSL termination, add monitoring and alerting, use multiple load balancers for high availability.'
  },
  {
    question: 'Design a notification service.',
    answer: 'Use message queues for different notification types, implement retry logic, use multiple channels (email, SMS, push), implement rate limiting, add user preferences, use templates, and implement delivery tracking.'
  },
  {
    question: 'How would you design a search engine?',
    answer: 'Use inverted indexes, implement ranking algorithms, use distributed search (Elasticsearch), implement query parsing, add spell correction, use caching, implement faceted search, and optimize for relevance and speed.'
  }
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateRandomDate(start: Date, end: Date): string {
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split('T')[0];
}

function generateRandomCandidate(): Omit<Candidate, 'id' | 'createdAt'> {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const fullName = `${firstName} ${lastName}`;
  const position = getRandomElement(positions);
  const status = getRandomElement(statuses);

  // 70% chance of having an interview date if status is not "Not Interviewed"
  const hasInterviewDate = status !== 'Not Interviewed' ? Math.random() < 0.7 : Math.random() < 0.3;
  const interviewDate = hasInterviewDate ? generateRandomDate(new Date('2024-01-01'), new Date()) : undefined;

  // Generate questions for candidates (more questions for interviewed candidates)
  const questionCount = status === 'Not Interviewed' ? 0 : Math.floor(Math.random() * 8) + 3;
  const questions = [];

  if (questionCount > 0) {
    const allQuestions = [...technicalQuestions, ...behavioralQuestions, ...systemDesignQuestions];
    const selectedQuestions = getRandomElements(allQuestions, questionCount);

    for (let i = 0; i < selectedQuestions.length; i++) {
      const q = selectedQuestions[i];
      const isAnswered = Math.random() < 0.8; // 80% chance of being answered
      const isCorrect = isAnswered ? Math.random() < 0.7 : undefined; // 70% chance of being correct if answered

      questions.push({
        id: Date.now().toString() + Math.random() + i,
        text: q.question,
        section: i < 5 ? 'Technical Questions' : i < 8 ? 'Behavioral Questions' : 'System Design',
        answer: q.answer,
        isAnswered,
        isCorrect
      });
    }
  }

  return {
    fullName,
    position,
    status,
    experience: {
      years: Math.floor(Math.random() * 15) + 1,
      months: Math.floor(Math.random() * 12)
    },
    interviewDate,
    questions
  };
}

function generateRandomQuestionTemplate(): Omit<QuestionTemplate, 'id'> {
  const templateNames = [
    'Frontend Developer Interview',
    'Backend Developer Interview',
    'Full Stack Developer Interview',
    'DevOps Engineer Interview',
    'Data Scientist Interview',
    'Mobile Developer Interview',
    'UI/UX Designer Interview',
    'Product Manager Interview',
    'QA Engineer Interview',
    'System Administrator Interview'
  ];

  const name = getRandomElement(templateNames);

  const sections: QuestionSection[] = [
    {
      id: Date.now().toString() + Math.random(),
      name: 'Technical Questions',
      questions: getRandomElements(technicalQuestions, 5).map((q, index) => ({
        id: Date.now().toString() + Math.random() + index,
        text: q.question,
        section: 'Technical Questions',
        answer: q.answer,
        isAnswered: false
      }))
    },
    {
      id: Date.now().toString() + Math.random() + 1,
      name: 'Behavioral Questions',
      questions: getRandomElements(behavioralQuestions, 3).map((q, index) => ({
        id: Date.now().toString() + Math.random() + index + 10,
        text: q.question,
        section: 'Behavioral Questions',
        answer: q.answer,
        isAnswered: false
      }))
    },
    {
      id: Date.now().toString() + Math.random() + 2,
      name: 'System Design',
      questions: getRandomElements(systemDesignQuestions, 2).map((q, index) => ({
        id: Date.now().toString() + Math.random() + index + 20,
        text: q.question,
        section: 'System Design',
        answer: q.answer,
        isAnswered: false
      }))
    }
  ];

  return {
    name,
    sections
  };
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Initialize database
    await databaseService.init();
    
    // Clear existing data
    await databaseService.clearAllData();
    
    // Generate random candidates
    const candidates: Candidate[] = [];
    const candidateCount = 25; // Generate 25 random candidates
    
    for (let i = 0; i < candidateCount; i++) {
      const candidateData = generateRandomCandidate();
      const candidate: Candidate = {
        ...candidateData,
        id: Date.now().toString() + Math.random(),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
      };
      candidates.push(candidate);
    }
    
    // Generate random question templates
    const templates: QuestionTemplate[] = [];
    const templateCount = 8; // Generate 8 random templates
    
    for (let i = 0; i < templateCount; i++) {
      const templateData = generateRandomQuestionTemplate();
      const template: QuestionTemplate = {
        ...templateData,
        id: Date.now().toString() + Math.random()
      };
      templates.push(template);
    }
    
    // Add candidates to database
    console.log(`Adding ${candidates.length} candidates...`);
    for (const candidate of candidates) {
      await databaseService.addCandidate(candidate);
    }
    
    // Add templates to database
    console.log(`Adding ${templates.length} question templates...`);
    for (const template of templates) {
      await databaseService.addQuestionTemplate(template);
    }
    
    // Add interview results for candidates who have been interviewed
    console.log('Adding interview results...');
    const interviewedCandidates = candidates.filter(c => c.status !== 'Not Interviewed');
    for (const candidate of interviewedCandidates) {
      const resultDescriptions = [
        `${candidate.fullName} demonstrated strong technical skills and good communication.`,
        `${candidate.fullName} showed excellent problem-solving abilities and cultural fit.`,
        `${candidate.fullName} has solid experience but needs improvement in some areas.`,
        `${candidate.fullName} performed well in technical rounds but struggled with behavioral questions.`,
        `${candidate.fullName} showed potential but requires more experience.`,
        `${candidate.fullName} exceeded expectations in all interview rounds.`,
        `${candidate.fullName} has good technical knowledge but needs work on soft skills.`,
        `${candidate.fullName} is a strong candidate with relevant experience.`
      ];
      
      const interviewResult = {
        id: Date.now().toString() + Math.random(),
        candidateId: candidate.id,
        description: getRandomElement(resultDescriptions),
        result: candidate.status as 'Passed' | 'Rejected' | 'Maybe',
        questions: candidate.questions,
        createdAt: candidate.interviewDate ? new Date(candidate.interviewDate).toISOString() : candidate.createdAt
      };
      
      await databaseService.addInterviewResult(interviewResult);
    }
    
    // Set default positions
    const defaultPositions = [
      'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist',
      'Mobile Developer', 'UI/UX Designer', 'Product Manager', 'QA Engineer', 'System Administrator'
    ];
    await databaseService.setPositions(defaultPositions);
    
    console.log('Database seeding completed successfully!');
    console.log(`Generated ${candidates.length} candidates, ${templates.length} question templates, and ${interviewedCandidates.length} interview results.`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Export for use in other files
export { seedDatabase };

// Make seedDatabase available globally for console access
if (typeof window !== 'undefined') {
  // This will be called from the browser
  (window as any).seedDatabase = seedDatabase;
  console.log('seedDatabase function is now available. Run: window.seedDatabase()');
} 