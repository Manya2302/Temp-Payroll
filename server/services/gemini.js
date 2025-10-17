import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function generateProjectTaskDistribution(projectData) {
  try {
    const {
      projectTitle,
      description,
      assignedEmployees,
      startDate,
      endDate,
      estimatedEffort,
      distributionStrategy,
      clientNotes
    } = projectData;

    const numEmployees = assignedEmployees.length;
    const employeeNames = assignedEmployees.map(emp => emp.name || 'Employee').join(', ');
    const employeeRoles = assignedEmployees.map(emp => emp.role || 'General').join(', ');

    let maxDays = estimatedEffort?.value || 5;
    if (estimatedEffort?.unit === 'hours') {
      maxDays = Math.ceil(estimatedEffort.value / 8);
    }

    if (endDate && startDate) {
      const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      if (daysDiff > 0 && daysDiff < maxDays) {
        maxDays = daysDiff;
      }
    }

    const systemPrompt = `You are an expert project manager and task distribution specialist. 
Your role is to break down projects into daily, actionable tasks with clear deliverables.
You must respond ONLY with valid JSON - no additional text, no markdown formatting, no code blocks.
The JSON must be parseable by JSON.parse().`;

    const userPrompt = `Create a detailed day-by-day task distribution plan for the following project:

**Project Title:** ${projectTitle}
**Description:** ${description}
**Number of Assigned Employees:** ${numEmployees}
**Employee Names:** ${employeeNames}
**Employee Roles:** ${employeeRoles}
**Start Date:** ${startDate}
**Maximum Days:** ${maxDays}
**Distribution Strategy:** ${distributionStrategy || 'even-load'}
**Client/Additional Notes:** ${clientNotes || 'None'}

**Instructions:**
1. Generate a realistic ${maxDays}-day project plan
2. Each day should have clear, actionable tasks
3. ${numEmployees > 1 ? 
  `Since there are ${numEmployees} employees, distribute tasks using the "${distributionStrategy}" strategy:
     - If "round-robin": Assign different days to different employees in rotation
     - If "even-load": Split each day's subtasks across employees equally
     - If "split-by-days": Some days for employee 1, other days for employee 2, etc.
     - Each employee should have clear ownership of their assigned tasks` : 
  'Since there is 1 employee, assign all tasks to that employee'}
4. Include specific deliverables and estimated hours for each day
5. Make tasks progressively build on each other (Day 1 foundation, Day 2 builds on Day 1, etc.)
6. Be realistic about what can be accomplished in one workday (6-8 hours)

**Required JSON Response Format (respond ONLY with this JSON, no other text):**
{
  "days": [
    {
      "dayNumber": 1,
      "taskSummary": "Brief summary of day's main objective",
      "subtasks": ["Subtask 1", "Subtask 2", "Subtask 3"],
      "expectedDeliverables": ["Deliverable 1", "Deliverable 2"],
      "estimatedHours": 6,
      "assigneeIndices": ${numEmployees > 1 ? '[0, 1]' : '[0]'} 
    }
  ]
}

**Important:** 
- assigneeIndices should be an array of employee indices (0 to ${numEmployees - 1}) who are assigned to work on this day
- For single employee: always [0]
- For multiple employees with "round-robin": rotate indices like [0] for day 1, [1] for day 2, [0] for day 3, etc.
- For "even-load": use all indices like [0, 1] or [0, 1, 2] so tasks are split
- Ensure estimatedHours is reasonable (4-8 hours per day)
- Provide 3-6 subtasks per day
- Make taskSummary concise but descriptive

Generate the plan now as pure JSON:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192
      },
      contents: userPrompt
    });

    const rawJson = response.text;
    console.log('[Gemini] Raw response:', rawJson);

    if (!rawJson) {
      throw new Error('Empty response from Gemini');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawJson);
    } catch (parseError) {
      console.error('[Gemini] JSON parse error:', parseError);
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract valid JSON from Gemini response');
      }
    }

    if (!parsedResponse.days || !Array.isArray(parsedResponse.days)) {
      throw new Error('Invalid response format: missing days array');
    }

    return {
      days: parsedResponse.days,
      prompt: userPrompt,
      rawResponse: rawJson
    };

  } catch (error) {
    console.error('[Gemini] Task distribution error:', error);
    throw new Error(`Failed to generate task distribution: ${error.message}`);
  }
}

async function refineProjectPlan(projectId, currentPlan, refinementInstructions) {
  try {
    const systemPrompt = `You are an expert project manager. Refine the existing project plan based on user feedback.
Respond ONLY with valid JSON - no additional text, no markdown formatting.`;

    const userPrompt = `Current project plan:
${JSON.stringify(currentPlan, null, 2)}

Refinement instructions from user:
${refinementInstructions}

Please refine the plan while maintaining the same JSON structure format. Respond with the updated days array only as pure JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7
      },
      contents: userPrompt
    });

    const rawJson = response.text;
    
    if (!rawJson) {
      throw new Error('Empty response from Gemini');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawJson);
    } catch (parseError) {
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract valid JSON from Gemini response');
      }
    }

    return {
      days: parsedResponse.days || parsedResponse,
      rawResponse: rawJson
    };

  } catch (error) {
    console.error('[Gemini] Plan refinement error:', error);
    throw new Error(`Failed to refine project plan: ${error.message}`);
  }
}

export {
  generateProjectTaskDistribution,
  refineProjectPlan
};
