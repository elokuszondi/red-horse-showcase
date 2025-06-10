
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced system prompt for Think Tank AI
const THINK_TANK_SYSTEM_PROMPT = `# Think Tank AI — Enterprise Intelligence Platform

## CORE IDENTITY
You are **Think Tank AI**, an advanced enterprise-grade assistant deployed within Azure's secure cloud infrastructure. You serve as the intelligent interface for Think Tank organization stakeholders—from analysts and project managers to executives and consultants.

## PURPOSE & SCOPE
**Primary Objective**: Transform enterprise data into actionable business intelligence through seamless integration of organizational knowledge systems.

## ENHANCED CAPABILITIES

### Strategic Business Intelligence
- **Executive Decision Support**: Transform complex data into executive-ready strategic insights
- **Market Analysis**: Comprehensive market research and competitive intelligence
- **Risk Assessment**: Multi-dimensional risk analysis with mitigation strategies
- **Performance Analytics**: KPI analysis with trend identification and forecasting

### Operational Excellence
- **Process Optimization**: Identify efficiency gains and operational improvements
- **Resource Planning**: Strategic resource allocation and capacity planning
- **Quality Assurance**: Quality metrics analysis and improvement recommendations
- **Cost Optimization**: Cost-benefit analysis with ROI projections

## COMMUNICATION STANDARDS
### Professional Voice
- **Tone**: Executive-level professionalism with consultative expertise
- **Style**: Clear, authoritative, and solution-oriented
- **Approach**: Strategic business partner focused on driving organizational value

### Engagement Principles
- Deliver comprehensive yet concise responses that connect business insights
- Prioritize business relevance and practical application
- Maintain strict confidentiality as a core business requirement

## RESPONSE FRAMEWORK
### Communication Structure
- **Format**: Professional business communication with logical hierarchy
- **Accessibility**: Executive summary approach with detailed backup when needed
- **Organization**: Strategic use of headings, bullets, and emphasis for rapid comprehension

### Language Standards
- **Complexity Matching**: Adapt technical depth to user role and requirements
- **Efficiency**: Every element serves business purpose—eliminate unnecessary complexity

**SYSTEM READY**: "Think Tank AI is online and ready to assist with your enterprise intelligence needs. How can I support your business objectives today?"`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, chat_history = [], selected_model = 'gpt-4o', file_ids = [], mode = 'auto' } = await req.json()

    // Get Azure OpenAI credentials from Supabase secrets
    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT') || 'https://azure-openai-2-g15.openai.azure.com/'
    const azureApiKey = Deno.env.get('AZURE_OPENAI_API_KEY') || '6wc1Wao3EgDr89EfxUS4rr6AcaPeWckQbXkG6gOtk9f2WiwxLQfUJQQJ99BFACYeBjFXJ3w3AAABACOGxaL2'
    const azureApiVersion = Deno.env.get('AZURE_OPENAI_API_VERSION') || '2024-05-01-preview'
    const assistantId = Deno.env.get('AZURE_ASSISTANT_ID') // Optional for hybrid mode

    // Model mapping for Azure deployments
    const modelMapping: { [key: string]: string } = {
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini'
    };

    const deploymentName = modelMapping[selected_model] || 'gpt-4o';

    // Prepare messages array with system prompt
    const messages = [
      { role: 'system', content: THINK_TANK_SYSTEM_PROMPT },
      ...chat_history,
      { role: 'user', content: message }
    ]

    console.log('Processing request with hybrid mode:', { model: deploymentName, mode, hasAssistant: !!assistantId })

    let response;
    let usedMode = 'chat';

    // Try Assistant API first if available and mode allows
    if (assistantId && (mode === 'assistant' || mode === 'auto')) {
      try {
        console.log('Attempting Assistant API mode...')
        response = await callAssistantAPI(azureEndpoint, azureApiKey, azureApiVersion, assistantId, message, req.headers.get('user-id') || 'anonymous');
        usedMode = 'assistant';
        console.log('Assistant API successful')
      } catch (error) {
        console.warn('Assistant API failed, falling back to chat completions:', error.message)
        response = await callChatCompletions(azureEndpoint, azureApiKey, azureApiVersion, deploymentName, messages);
        usedMode = 'chat';
      }
    } else {
      // Use chat completions
      console.log('Using chat completions mode...')
      response = await callChatCompletions(azureEndpoint, azureApiKey, azureApiVersion, deploymentName, messages);
      usedMode = 'chat';
    }

    return new Response(
      JSON.stringify({ 
        response: response,
        model: selected_model,
        mode_used: usedMode,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Chat completion error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat completion',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function callChatCompletions(endpoint: string, apiKey: string, apiVersion: string, deploymentName: string, messages: any[]) {
  const azureUrl = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`
  
  const response = await fetch(azureUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Chat Completions API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from Chat Completions API')
  }

  return data.choices[0].message.content
}

async function callAssistantAPI(endpoint: string, apiKey: string, apiVersion: string, assistantId: string, message: string, userId: string) {
  // Create or get thread for user
  const threadResponse = await fetch(`${endpoint}openai/threads?api-version=${apiVersion}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      metadata: {
        user_id: userId,
        session_type: 'enterprise_consultation'
      }
    })
  });

  if (!threadResponse.ok) {
    throw new Error(`Thread creation failed: ${threadResponse.status}`);
  }

  const thread = await threadResponse.json();
  const threadId = thread.id;

  // Add message to thread
  await fetch(`${endpoint}openai/threads/${threadId}/messages?api-version=${apiVersion}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      role: 'user',
      content: message,
      metadata: {
        priority: 'high',
        classification: 'business_critical'
      }
    })
  });

  // Run assistant
  const runResponse = await fetch(`${endpoint}openai/threads/${threadId}/runs?api-version=${apiVersion}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      assistant_id: assistantId,
      instructions: "Provide executive-level strategic analysis with actionable recommendations.",
      temperature: 0.7,
      top_p: 0.9,
      max_prompt_tokens: 8000,
      max_completion_tokens: 4000
    })
  });

  if (!runResponse.ok) {
    throw new Error(`Run creation failed: ${runResponse.status}`);
  }

  const run = await runResponse.json();
  const runId = run.id;

  // Wait for completion
  let runStatus = run;
  const maxAttempts = 30;
  let attempts = 0;

  while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
    if (attempts >= maxAttempts) {
      throw new Error('Assistant run timeout');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await fetch(`${endpoint}openai/threads/${threadId}/runs/${runId}?api-version=${apiVersion}`, {
      method: 'GET',
      headers: {
        'api-key': apiKey
      }
    });

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }

    runStatus = await statusResponse.json();
    attempts++;
  }

  if (runStatus.status !== 'completed') {
    throw new Error(`Assistant run failed with status: ${runStatus.status}`);
  }

  // Get messages
  const messagesResponse = await fetch(`${endpoint}openai/threads/${threadId}/messages?api-version=${apiVersion}`, {
    method: 'GET',
    headers: {
      'api-key': apiKey
    }
  });

  if (!messagesResponse.ok) {
    throw new Error(`Messages retrieval failed: ${messagesResponse.status}`);
  }

  const messagesData = await messagesResponse.json();
  const assistantMessage = messagesData.data
    .filter((m: any) => m.role === 'assistant')
    .sort((a: any, b: any) => b.created_at - a.created_at)[0];

  if (!assistantMessage?.content?.[0]?.text?.value) {
    throw new Error('No response from assistant');
  }

  return assistantMessage.content[0].text.value;
}
