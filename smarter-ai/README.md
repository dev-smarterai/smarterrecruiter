# Tremor – Dashboard

`Dashboard` is a SaaS application template from [Tremor](https://tremor.so). It's built
using [`Tremor Raw`](https://raw.tremor.so/docs/getting-started/installation)
and [Next.js](https://nextjs.org).

## Getting started

1. Install the dependencies. We recommend using pnpm. If you want to use `npm`,
   just replace `pnpm` with `npm`.

```bash
pnpm install
```

2. Then, start the development server:

```bash
pnpm run dev
```

3. Visit [http://localhost:3000](http://localhost:3000) in your browser to view
   the template.

## Notes

This project uses
[`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to
automatically optimize and load Inter, a custom Google Font.

This project uses
[`Tremor Raw`](https://raw.tremor.so/docs/getting-started/installation)
components for the UI.

## License

This site template is a commercial product and is licensed under the
[Tremor License](https://blocks.tremor.so/license).

## Learn more

For a deeper understanding of the technologies used in this template, check out
the resources listed below:

- [Tremor Raw](https://raw.tremor.so) - Tremor Raw documentation
- [Tailwind CSS](https://tailwindcss.com) - A utility-first CSS framework
- [Next.js](https://nextjs.org/docs) - Next.js documentation
- [Radix UI](https://www.radix-ui.com) - Radix UI Website
- [Recharts](https://recharts.org) - Recharts documentation and website
- [Tanstack](https://tanstack.com/table/latest) - TanStack table documentation

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
