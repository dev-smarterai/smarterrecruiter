# Smarter AI - AI-Powered Recruitment Platform

**Smarter AI** is a comprehensive AI-powered recruitment and interview platform built on Next.js. The platform combines multiple AI technologies to streamline the hiring process through intelligent candidate analysis, automated interviews, and real-time communication.

## 🚀 Features

- **AI-Powered Interviews**: Automated interview sessions using OpenAI, Groq, and LiveKit for real-time voice/video interactions
- **CV Analysis**: Intelligent resume parsing and candidate evaluation using Mistral OCR and OpenAI
- **Real-time Communication**: WebSocket-based chat and voice interactions with Arabic language support
- **Candidate Management**: Complete candidate lifecycle management with profile tracking and interview scheduling
- **Multi-language Support**: Specialized Arabic interview capabilities with TTS/STT integration
- **Dashboard Analytics**: Comprehensive recruitment analytics and reporting using Tremor components

## 🛠 Technology Stack

### Core Framework
- **Next.js 14.2.23**: React framework with App Router
- **React 18.2.0**: UI library
- **TypeScript 5.8.3**: Primary language
- **Node.js**: Runtime environment
- **pnpm**: Package manager (preferred over npm/yarn)

### UI & Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Radix UI**: Headless UI primitives
- **Tremor**: Dashboard components
- **Lucide React**: Icon library
- **Framer Motion**: Animation library

### Backend & Database
- **Convex**: Real-time backend-as-a-service and database
- **Convex Auth**: Authentication system
- **Vercel**: Deployment platform

### AI & ML Services
- **OpenAI**: GPT models for analysis and chat
- **Groq**: Fast inference for real-time chat and Arabic TTS/STT
- **Anthropic Claude 3.5**: Alternative chatbot implementation
- **Mistral**: OCR for PDF processing
- **ElevenLabs**: Voice synthesis
- **LiveKit**: Real-time video/audio communication infrastructure

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **pnpm** (recommended package manager)
- **Git** for version control

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smarter-ai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory and add the following environment variables:

   ```env
   # Required API Keys
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   MISTRAL_API_KEY=your_mistral_api_key
   GROQ_API_KEY=your_groq_api_key
   
   # Convex Backend
   CONVEX_DEPLOYMENT=your_convex_deployment_url
   
   # Optional: ElevenLabs for voice synthesis
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   
   # Optional: LiveKit for real-time communication
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   ```

4. **Set up Convex backend**
   
   If you haven't set up Convex yet:
   ```bash
   npx convex dev
   ```
   
   Follow the prompts to create a new Convex project or connect to an existing one.

5. **Initialize system prompts**
   ```bash
   pnpm run init-prompts
   ```

## 🚀 Running the Application

### Development Mode

Start the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

Build the application for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## 🧪 Testing the Application

### 1. Basic Functionality Test

1. **Access the application**: Navigate to `http://localhost:3000`
2. **Sign up/Login**: Create an account or use the admin credentials (see User Setup section)
3. **Dashboard**: Verify the main dashboard loads with analytics components

### 2. CV Analysis Test

1. **Navigate to CV Analysis**: Go to the CV analysis section
2. **Upload a PDF resume**: Test the PDF upload functionality
3. **Verify analysis**: Check that the AI analysis returns structured candidate data

### 3. AI Interview Test

1. **Create a job posting**: Add a new job with requirements
2. **Start AI interview**: Test the real-time interview functionality
3. **Voice interaction**: Test voice input/output if configured
4. **Arabic support**: Test Arabic language interviews if applicable

### 4. Claude Chatbot Test

1. **Navigate to `/claude-chatbot`**
2. **Test conversation**: Send messages to verify Claude integration
3. **System prompts**: Test custom system prompt configuration

### 5. API Endpoints Test

Test the main API endpoints:

```bash
# Test CV analysis endpoint
curl -X POST http://localhost:3000/api/analyze-cv \
  -F "resume=@path/to/your/resume.pdf"

# Test other API endpoints as needed
```

## 👥 User Setup

### Setting Up Admin User

1. **Add admin user to database**:
   ```bash
   npx convex run insertSampleData:insertAdminUser
   ```

2. **Complete signup**:
   - Go to the signup page
   - Use email: `alireda@teloshouse.com`
   - Name: `Ali Reda`
   - Password: `h1n1a1y1`
   - Select "Administrator" role

3. **Add sample data** (optional):
   ```bash
   npx convex run insertSampleData:insertSampleCandidates
   npx convex run seedUsers:convertCandidatesToUsers
   ```

For detailed user setup instructions, see [SETUP_USERS.md](./SETUP_USERS.md)

## 📝 Available Scripts

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm start                  # Start production server

# Utilities
pnpm cleanup                # Clean build artifacts
pnpm init-prompts          # Initialize system prompts
pnpm generate              # Generate sample data

# Convex operations
npx convex dev             # Start Convex development
npx convex deploy          # Deploy Convex functions
```

## 🔍 Troubleshooting

### Common Issues

1. **Build failures**: 
   - Ensure all environment variables are set
   - Try `pnpm cleanup` then `pnpm build`

2. **API key errors**:
   - Verify all required API keys are in `.env.local`
   - Check API key permissions and quotas

3. **Convex connection issues**:
   - Run `npx convex dev` to ensure backend is running
   - Check `CONVEX_DEPLOYMENT` environment variable

4. **PDF upload issues**:
   - Verify Mistral API key is valid
   - Check file size limits and format

5. **Voice/Video issues**:
   - Ensure LiveKit credentials are configured
   - Check browser permissions for microphone/camera

### Getting Help

- Check the [Convex documentation](https://docs.convex.dev/)
- Review [Next.js documentation](https://nextjs.org/docs)
- Check individual AI service documentation for API issues

## 📚 Key Features Documentation

# CV Analysis API

This API uses Mistral OCR for PDF text extraction and OpenAI for CV analysis.

## Setup

1. Add the following environment variables to your `.env.local` file:
   ```
   OPENAI_API_KEY="your_openai_api_key"
   MISTRAL_API_KEY="your_mistral_api_key"
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Run the development server:
   ```
   pnpm dev
   ```

## API Endpoints

### POST /api/analyze-cv

Upload a CV/resume in PDF format to be analyzed. The API will extract text using Mistral OCR and analyze it with OpenAI.

Request:
- Form data with `resume` field containing a PDF file

Response:
- JSON object with candidate profile information

### Troubleshooting

If you encounter issues:
1. Make sure your PDF is properly formatted
2. Verify your API keys are correctly set
3. Check server logs for error messages

## Claude 3.5 Chatbot

The application includes a Claude 3.5 AI chatbot that can be accessed at `/claude-chatbot`. This chatbot uses Anthropic's Claude 3.5 Sonnet model to provide conversational AI capabilities.

### Setting Up the Chatbot

1. Create a `.env.local` file in the root of the project (or update your existing one)
2. Add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```
3. Restart the Next.js development server if it's already running

### Using System Prompts

The chatbot supports system prompts, which allow you to configure Claude's behavior and personality. To use a system prompt:

1. Click on "Configure System Prompt" at the top of the chatbot interface
2. Enter your desired system instructions in the text area
3. Click "Save System Prompt"

Example system prompts:

- **Recruitment Assistant**: "You are a recruitment assistant helping HR professionals and candidates navigate the hiring process. Provide information about job applications, interview preparation, and candidate evaluation. Always be professional, avoid discussing salary negotiations, and defer sensitive hiring decisions to human recruiters."

- **Interview Coach**: "You are an interview coach helping candidates prepare for job interviews. Provide tips on answering common questions, body language, and presentation skills. Your advice should be practical and encouraging. When given a question, show how to structure a strong answer using the STAR method where appropriate."

- **Job Description Analyzer**: "You are a job description analyzer. When provided with job descriptions, break them down into key components: required skills, preferred qualifications, responsibilities, and company culture indicators. Flag any potentially biased language and suggest improvements for inclusivity."

The system prompt will persist throughout your conversation session and influence Claude's responses accordingly.

## System Prompts

The application uses a system of predefined prompts for analyzing CVs and interview transcripts. These prompts are stored in the Convex database in the `prompts` table. The application includes:

- A prompts management page at `/prompts` for admins to view and edit prompts
- API routes that use these prompts for AI analysis tasks

### Initializing Prompts

When setting up the application for the first time, you need to initialize the system prompts. There are two ways to do this:

1. Visit the `/prompts` admin page and click the "Initialize Prompts" button
2. Run the initialization script:

```bash
node scripts/init-prompts.js
```

### Available Prompts

- **cv_analysis**: Used for analyzing candidate CVs/resumes
- **interview_analysis**: Used for analyzing interview transcripts

These prompts are used by the application's AI analysis functions to generate structured data about candidates and interviews.

# Smarter AI Platform

## AI Meeting System Prompts

The AI Meeting feature uses customizable system prompts that support dynamic templating with curly braces. These placeholders are automatically replaced with actual data from the job and candidate profiles:

### Available Template Variables

- `{{jobTitle}}` - The title of the job position
- `{{companyName}}` - The name of the company
- `{{jobDescription}}` - The full job description (intro, details, responsibilities)
- `{{candidateInfo}}` - Information about the candidate including name, email, and CV summary
- `{{requirements}}` - List of job requirements
- `{{desirables}}` - List of desired skills for the job

### How It Works

1. When starting an AI interview session, the system generates a prompt based on the job data
2. Template variables are replaced with actual data from the job and candidate profiles
3. The prompt is set on the window object and passed to the OpenAI API when the session starts
4. For Arabic interviews, additional language instructions are appended to ensure responses in Arabic

### Example System Prompt

```
You are an AI interviewer for the {{jobTitle}} position at {{companyName}}. 
    
You will conduct a professional and insightful interview for this position.

About the job:
{{jobDescription}}

About the candidate:
{{candidateInfo}}

Requirements:
{{requirements}}

Desired Skills:
{{desirables}}

For your first response, simply say: "Hi and welcome to your job interview for {{jobTitle}} at {{companyName}}." Then wait for the candidate to speak. Keep all responses concise and professional.
```

### Custom Prompts

Job listings can include custom interview prompts that will be used instead of the default template. These can be created in the AI Interviewer configuration section when creating or editing a job.
