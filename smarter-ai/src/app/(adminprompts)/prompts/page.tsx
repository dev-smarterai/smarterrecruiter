"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PromptsAdminPage() {
  const prompts = useQuery(api.prompts.listAll) || [];
  const updatePrompt = useMutation(api.prompts.updateByName);
  const initPrompts = useMutation(api.prompts.initPrompts);
  
  const [selectedPrompt, setSelectedPrompt] = useState<string>('cv_analysis');
  const [promptContent, setPromptContent] = useState<string>('');
  const [promptDescription, setPromptDescription] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  
  // Find the currently selected prompt
  const currentPrompt = prompts.find(p => p.name === selectedPrompt);
  
  // Update the form when the selected prompt changes
  useEffect(() => {
    if (currentPrompt) {
      setPromptContent(currentPrompt.content);
      setPromptDescription(currentPrompt.description || '');
    } else {
      setPromptContent('');
      setPromptDescription('');
    }
  }, [currentPrompt, selectedPrompt]);
  
  // Handle prompt update
  const handleSavePrompt = async () => {
    if (!selectedPrompt) return;
    
    try {
      setSaveStatus('Saving...');
      await updatePrompt({
        name: selectedPrompt,
        content: promptContent,
        description: promptDescription,
      });
      setSaveStatus('Saved successfully!');
      
      // Clear the status after 3 seconds
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    } catch (error) {
      console.error('Error saving prompt:', error);
      setSaveStatus('Error saving prompt');
    }
  };
  
  // Handle initialization of prompts
  const handleInitializePrompts = async () => {
    try {
      setIsInitializing(true);
      await initPrompts({});
      setIsInitializing(false);
      setSaveStatus('Prompts initialized successfully!');
      
      // Clear the status after 3 seconds
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    } catch (error) {
      console.error('Error initializing prompts:', error);
      setSaveStatus('Error initializing prompts');
      setIsInitializing(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>System Prompts Management</CardTitle>
            <Button 
              onClick={handleInitializePrompts} 
              disabled={isInitializing}
              variant="outline"
            >
              {isInitializing ? 'Initializing...' : 'Initialize Prompts'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="cv_analysis" 
            value={selectedPrompt} 
            onValueChange={setSelectedPrompt}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="cv_analysis">CV Analysis</TabsTrigger>
              <TabsTrigger value="interview_analysis">Interview Analysis</TabsTrigger>
              {prompts.filter(p => 
                p.name !== 'cv_analysis' && p.name !== 'interview_analysis'
              ).map(prompt => (
                <TabsTrigger key={prompt.name} value={prompt.name}>
                  {prompt.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={selectedPrompt} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promptDescription">Description</Label>
                <Input
                  id="promptDescription"
                  value={promptDescription}
                  onChange={(e) => setPromptDescription(e.target.value)}
                  placeholder="Prompt description"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promptContent">Prompt Content</Label>
                <Textarea
                  id="promptContent"
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="Enter prompt content here"
                  className="h-96 font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-green-600">{saveStatus}</p>
                <Button onClick={handleSavePrompt}>Save Prompt</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 