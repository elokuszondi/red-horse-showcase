
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, user-id',
}

// Azure OpenAI configuration - matching Python client exactly
const AZURE_BASE_URL = "https://azure-openai-2-g15.openai.azure.com/openai"
const API_VERSION = "2024-05-01-preview"
const VECTOR_STORE_ID = "vs_3xqhyrafPByqzpPyxd5e4Qsd"

const THINK_TANK_INSTRUCTIONS = `# Think Tank AI Knowledge Assistant

## Core Identity & Purpose

**You are the Think Tank AI Knowledge Assistant** - an intelligent consultant that provides precise, actionable insights by analyzing Think Tank's consolidated knowledge base and service history.

**Primary Function**: Deliver expert-level problem resolution and guidance by intelligently searching and synthesizing information from Think Tank's integrated data sources.

---

## Knowledge Base Access

**Your Knowledge Sources Include**:
- Think Tank Service Desk records (Ivanti Neurons ITSM)
- Resolved incidents and service request histories
- Problem root causes and documented workarounds
- Knowledge articles, troubleshooting guides, and best practices
- Vendor community websites and external forums
- Client roadmap PDF documents from SharePoint/MS Teams

**Data Integration**: All sources are consolidated and searchable through natural language queries for comprehensive problem-solving support.

---

## CRITICAL METADATA REFERENCING REQUIREMENT

**MANDATORY SOURCE ATTRIBUTION**: 
- **ALWAYS reference specific metadata when providing responses**
- **MUST include**: Document names, case numbers, article IDs, dates, sources, file paths
- **MUST cite**: Specific knowledge base entries, incident numbers, resolution timestamps
- **ALWAYS provide**: Exact document titles, SharePoint locations, ticket references
- **NEVER provide generic responses** - all answers must be traceable to specific sources
- **Include metadata in every response** such as:
  - Document: [Exact filename/title]
  - Source: [Specific system/location]
  - Case ID: [Ticket/incident number]
  - Date: [When documented/resolved]
  - Author: [Who created/resolved]
  - Location: [SharePoint path/system location]

**Example Citation Format**:
"Based on Knowledge Article KB-2024-001 'Exchange Server Migration Best Practices' (Created: 2024-01-15, Author: John Smith, Location: SharePoint/IT-Documentation/Exchange), the recommended approach is..."

---

## Response Framework

### **For Service Desk Queries**
1. **Immediate Solution**: Provide direct answer with specific document/case references
2. **Historical Context**: Reference similar resolved cases with exact case numbers and dates
3. **Root Cause Analysis**: Identify underlying causes with specific incident references
4. **Escalation Path**: Recommend next steps with documented procedure references
5. **Prevention**: Suggest measures with reference to specific best practice documents

### **For Strategic Questions**
1. **Data-Driven Insights**: Analyze trends with specific report references and dates
2. **Best Practice Recommendations**: Reference exact knowledge articles and their metadata
3. **Implementation Guidance**: Provide steps based on documented successful cases with IDs
4. **Risk Assessment**: Highlight issues based on specific historical incident data
5. **Success Metrics**: Suggest KPIs referencing specific measurement documents

---

## Communication Standards

**Professional Tone**: Communicate like an experienced Think Tank consultant with deep technical knowledge

**Precision**: Provide specific, actionable recommendations with exact source citations

**Source Attribution**: **MANDATORY** - Reference specific knowledge articles, case numbers, document titles, authors, dates, and locations in EVERY response

**Clarity**: Present complex technical information in accessible business language while maintaining detailed metadata references

**Completeness**: Ensure responses address the full scope of the query with relevant context AND complete source attribution

---

## Specialized Capabilities

**Industry Expertise**: Deliver targeted insights for retail, finance, manufacturing, education, and logistics sectors based on Think Tank's client portfolio with specific client case references

**Technical Proficiency**: Provide detailed technical guidance with exact procedure document references

**Pattern Recognition**: Identify trends from historical service data with specific incident numbers and timeframes

**Solution Optimization**: Recommend efficient resolution paths with documented case study references

**Continuous Learning**: Incorporate new resolutions with proper documentation metadata

---

## Quality Standards

**Accuracy**: All recommendations must be grounded in verified knowledge base content with exact source citations

**Relevance**: Responses must directly address the specific query context with appropriate document references

**Efficiency**: Prioritize solutions that minimize resolution time with reference to proven case studies

**Value-Add**: Provide insights that enhance understanding with supporting documentation references

**Consistency**: Maintain uniform quality and metadata citation standards across all interactions

---

## Operational Guidelines

**Query Processing**: Analyze the full context of questions and provide comprehensive responses with complete source attribution

**Knowledge Synthesis**: Combine information from multiple sources while citing each specific document and its metadata

**Escalation Awareness**: Recognize when queries require human consultant intervention and reference appropriate escalation procedures

**Documentation**: Suggest improvements to knowledge base with references to gap analysis documents

**Client Focus**: Always consider the end-client impact with reference to specific client success case studies

---

**Status**: Think Tank AI Knowledge Assistant - Active and Ready

**Mission**: Transform Think Tank's collective knowledge into instant, expert-level consulting insights with complete source traceability for maximum client value and operational efficiency.`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, file_ids = [], assistantId, threadId, continueSession = false } = await req.json()
    const userId = req.headers.get('user-id') || 'anonymous'

    // Get Azure OpenAI credentials from environment
    const apiKey = Deno.env.get('AZURE_OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('Azure OpenAI API key not configured')
    }

    const headers = {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    }

    console.log('Processing Think Tank AI request for user:', userId, 'Continue session:', continueSession)

    let finalAssistantId = assistantId;
    let finalThreadId = threadId;

    // Step 1: Create or reuse assistant
    if (!continueSession || !assistantId) {
      console.log('Creating new Think Tank AI Assistant...')
      const assistantResponse = await fetch(`${AZURE_BASE_URL}/assistants?api-version=${API_VERSION}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instructions: THINK_TANK_INSTRUCTIONS,
          name: "Think-Tank-AI",
          tools: [{ type: "file_search" }],
          model: "gpt-4o",
          tool_resources: {
            file_search: { vector_store_ids: [VECTOR_STORE_ID] }
          }
        })
      })

      if (!assistantResponse.ok) {
        const errorText = await assistantResponse.text()
        throw new Error(`Failed to create assistant: ${assistantResponse.status} - ${errorText}`)
      }

      const assistant = await assistantResponse.json()
      finalAssistantId = assistant.id
      console.log('Created Assistant ID:', finalAssistantId)
    } else {
      console.log('Reusing existing Assistant ID:', finalAssistantId)
    }

    // Step 2: Create or reuse thread
    if (!continueSession || !threadId) {
      console.log('Creating new thread for user:', userId)
      const threadResponse = await fetch(`${AZURE_BASE_URL}/threads?api-version=${API_VERSION}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })

      if (!threadResponse.ok) {
        const errorText = await threadResponse.text()
        throw new Error(`Failed to create thread: ${threadResponse.status} - ${errorText}`)
      }

      const thread = await threadResponse.json()
      finalThreadId = thread.id
      console.log('Created Thread ID:', finalThreadId)
    } else {
      console.log('Continuing existing Thread ID:', finalThreadId)
    }

    // Step 3: Add user message to thread
    console.log('Adding message to thread...')
    const messageResponse = await fetch(`${AZURE_BASE_URL}/threads/${finalThreadId}/messages?api-version=${API_VERSION}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        role: "user",
        content: message
      })
    })

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text()
      throw new Error(`Failed to add message: ${messageResponse.status} - ${errorText}`)
    }

    // Step 4: Run the assistant
    console.log('Starting assistant run...')
    const runResponse = await fetch(`${AZURE_BASE_URL}/threads/${finalThreadId}/runs?api-version=${API_VERSION}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assistant_id: finalAssistantId
      })
    })

    if (!runResponse.ok) {
      const errorText = await runResponse.text()
      throw new Error(`Failed to start run: ${runResponse.status} - ${errorText}`)
    }

    const run = await runResponse.json()
    const runId = run.id

    // Step 5: Wait for completion (matching Python client polling logic)
    console.log('Waiting for assistant to complete...')
    let runStatus = run
    const maxAttempts = 30
    let attempts = 0

    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      if (attempts >= maxAttempts) {
        throw new Error('Assistant run timeout')
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay like Python client
      
      const statusResponse = await fetch(`${AZURE_BASE_URL}/threads/${finalThreadId}/runs/${runId}?api-version=${API_VERSION}`, {
        method: 'GET',
        headers
      })

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        throw new Error(`Failed to check run status: ${statusResponse.status} - ${errorText}`)
      }

      runStatus = await statusResponse.json()
      attempts++
      console.log(`Run status: ${runStatus.status} (attempt ${attempts})`)
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus.status}`)
    }

    // Step 6: Get the assistant's response (matching Python client message retrieval)
    console.log('Retrieving assistant response...')
    const messagesResponse = await fetch(`${AZURE_BASE_URL}/threads/${finalThreadId}/messages?api-version=${API_VERSION}`, {
      method: 'GET',
      headers
    })

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text()
      throw new Error(`Failed to retrieve messages: ${messagesResponse.status} - ${errorText}`)
    }

    const messagesData = await messagesResponse.json()
    
    // Find the latest assistant message (matching Python client logic)
    const assistantMessages = messagesData.data.filter((m: any) => m.role === 'assistant')
    if (assistantMessages.length === 0 || !assistantMessages[0]?.content?.[0]?.text?.value) {
      throw new Error('No response from Think Tank AI Assistant')
    }

    const response = assistantMessages[0].content[0].text.value
    console.log('Think Tank AI response generated successfully with session persistence')

    return new Response(
      JSON.stringify({ 
        response: response,
        assistantId: finalAssistantId,
        threadId: finalThreadId,
        runId: runId,
        timestamp: new Date().toISOString(),
        sessionContinued: continueSession
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Think Tank AI Assistant error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process Think Tank AI request',
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
