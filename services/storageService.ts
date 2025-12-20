import { SessionTemplate, SessionResult, QuestionType } from '../types';

const TEMPLATES_KEY = 'mindframe_templates';
const RESULTS_KEY = 'mindframe_results';

export const getTemplates = (): SessionTemplate[] => {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load templates", e);
    return [];
  }
};

export const saveTemplate = (template: SessionTemplate): void => {
  const templates = getTemplates();
  const existingIndex = templates.findIndex(t => t.id === template.id);
  
  if (existingIndex >= 0) {
    templates[existingIndex] = template;
  } else {
    templates.push(template);
  }
  
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

export const deleteTemplate = (id: string): void => {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

export const getResults = (): SessionResult[] => {
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load results", e);
    return [];
  }
};

export const saveResult = (result: SessionResult): void => {
  const results = getResults();
  results.push(result);
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
};

// Seed initial data if empty
if (getTemplates().length === 0) {
  const depressionTemplate: SessionTemplate = {
    id: 'tmpl_depression_001',
    title: 'Depression Assessment (PHQ-9)',
    description: 'Standard screening for depression symptoms, interest levels, and daily functioning over the last 2 weeks.',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'dep_q1',
        type: QuestionType.MCQ,
        prompt: 'Over the last 2 weeks, how often have you been bothered by having little interest or pleasure in doing things?',
        required: true,
        options: [
          { id: 'dep_opt1_0', label: 'Not at all', value: '0' },
          { id: 'dep_opt1_1', label: 'Several days', value: '1' },
          { id: 'dep_opt1_2', label: 'More than half the days', value: '2' },
          { id: 'dep_opt1_3', label: 'Nearly every day', value: '3' }
        ]
      },
      {
        id: 'dep_q2',
        type: QuestionType.MCQ,
        prompt: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
        required: true,
        options: [
          { id: 'dep_opt2_0', label: 'Not at all', value: '0' },
          { id: 'dep_opt2_1', label: 'Several days', value: '1' },
          { id: 'dep_opt2_2', label: 'More than half the days', value: '2' },
          { id: 'dep_opt2_3', label: 'Nearly every day', value: '3' }
        ]
      },
      {
        id: 'dep_q3',
        type: QuestionType.SLIDER,
        prompt: 'On a scale of 1-10, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
        min: 1,
        max: 10,
        minLabel: 'Not difficult at all',
        maxLabel: 'Extremely difficult',
        required: true
      },
      {
        id: 'dep_q4',
        type: QuestionType.CHECKBOX,
        prompt: 'Which of the following symptoms have you experienced recently?',
        options: [
          { id: 'ds_1', label: 'Trouble falling or staying asleep', value: 'sleep_issues' },
          { id: 'ds_2', label: 'Feeling tired or having little energy', value: 'fatigue' },
          { id: 'ds_3', label: 'Poor appetite or overeating', value: 'appetite' },
          { id: 'ds_4', label: 'Trouble concentrating', value: 'concentration' }
        ]
      },
      {
         id: 'dep_q5',
         type: QuestionType.TEXT,
         prompt: 'Please describe any specific thoughts or situations that have been bothering you recently.',
         required: false
      }
    ]
  };

  const anxietyTemplate: SessionTemplate = {
    id: 'tmpl_anxiety_001',
    title: 'Anxiety Screening (GAD-7)',
    description: 'Screening for Generalized Anxiety Disorder symptoms including nervousness, worry, and panic.',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'anx_q1',
        type: QuestionType.MCQ,
        prompt: 'Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?',
        required: true,
        options: [
          { id: 'anx_opt1_0', label: 'Not at all', value: '0' },
          { id: 'anx_opt1_1', label: 'Several days', value: '1' },
          { id: 'anx_opt1_2', label: 'More than half the days', value: '2' },
          { id: 'anx_opt1_3', label: 'Nearly every day', value: '3' }
        ]
      },
      {
        id: 'anx_q2',
        type: QuestionType.MCQ,
        prompt: 'Have you experienced a sudden panic attack (intense fear/discomfort) in the last week?',
        required: true,
        options: [
            { id: 'anx_opt2_yes', label: 'Yes', value: 'yes' },
            { id: 'anx_opt2_no', label: 'No', value: 'no' }
        ],
        branches: [
            { optionId: 'anx_opt2_yes', targetQuestionId: 'anx_q3_panic' },
            { optionId: 'anx_opt2_no', targetQuestionId: 'anx_q4_worry' }
        ]
      },
      {
        id: 'anx_q3_panic',
        type: QuestionType.TEXT,
        prompt: 'Describe the situation where the panic attack occurred. What were you thinking at that moment?',
        required: true
      },
      {
        id: 'anx_q4_worry',
        type: QuestionType.CHECKBOX,
        prompt: 'Which of the following physical symptoms do you experience when anxious?',
        options: [
            { id: 'sym_1', label: 'Restlessness', value: 'restless' },
            { id: 'sym_2', label: 'Fatigue', value: 'fatigue' },
            { id: 'sym_3', label: 'Difficulty concentrating', value: 'concentration' },
            { id: 'sym_4', label: 'Irritability', value: 'irritability' },
            { id: 'sym_5', label: 'Muscle tension', value: 'muscle_tension' },
            { id: 'sym_6', label: 'Sleep disturbance', value: 'sleep' }
        ]
      },
      {
        id: 'anx_q5',
        type: QuestionType.TEXT,
        prompt: 'What strategies have you tried to manage your worry so far?',
        required: false
      }
    ]
  };

  const stressTemplate: SessionTemplate = {
    id: 'tmpl_stress_001',
    title: 'Stress & Coping Assessment',
    description: 'Evaluate current stress levels, identify sources of stress, and review existing coping mechanisms.',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
        {
            id: 'str_q1',
            type: QuestionType.SLIDER,
            prompt: 'Rate your overall stress level today.',
            min: 1,
            max: 10,
            minLabel: 'Relaxed',
            maxLabel: 'Overwhelmed',
            required: true
        },
        {
            id: 'str_q2',
            type: QuestionType.CHECKBOX,
            prompt: 'Identify your primary sources of stress right now.',
            options: [
                { id: 'src_1', label: 'Work/Career', value: 'work' },
                { id: 'src_2', label: 'Finances', value: 'finances' },
                { id: 'src_3', label: 'Health', value: 'health' },
                { id: 'src_4', label: 'Relationships', value: 'relationships' },
                { id: 'src_5', label: 'Future Uncertainty', value: 'future' }
            ]
        },
        {
            id: 'str_q3',
            type: QuestionType.MCQ,
            prompt: 'Do you feel you have adequate support to handle these stressors?',
            options: [
              { id: 'sup_1', label: 'Yes, I have a strong support system', value: 'strong' },
              { id: 'sup_2', label: 'I have some support, but could use more', value: 'moderate' },
              { id: 'sup_3', label: 'No, I feel I am handling this alone', value: 'none' }
            ]
        },
        {
            id: 'str_q4',
            type: QuestionType.TEXT,
            prompt: 'What is one small thing you can do today to reduce this stress?',
            required: true
        }
    ]
  };

  saveTemplate(depressionTemplate);
  saveTemplate(anxietyTemplate);
  saveTemplate(stressTemplate);
}