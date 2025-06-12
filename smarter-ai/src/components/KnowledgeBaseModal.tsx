import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBaseModal = ({ isOpen, onClose }: KnowledgeBaseModalProps) => {
  const [knowledgeBaseContent, setKnowledgeBaseContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the default knowledge base
  const knowledgeBase = useQuery(api.knowledgeBase.getDefaultKnowledgeBase) || null;
  
  // Get the save mutation
  const saveKnowledgeBaseMutation = useMutation(api.knowledgeBase.saveKnowledgeBase);

  // Load knowledge base content when the modal opens or data changes
  useEffect(() => {
    if (isOpen) {
      if (knowledgeBase) {
        setKnowledgeBaseContent(knowledgeBase.content || "");
      }
      setIsLoading(false);
    }
  }, [isOpen, knowledgeBase]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveKnowledgeBaseMutation({ content: knowledgeBaseContent });
      console.log("Knowledge base saved successfully");
      onClose();
    } catch (error) {
      console.error("Error saving knowledge base:", error);
      alert("Error saving Knowledge Base. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Company Knowledge Base</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          <p className="text-sm text-gray-500 mb-4">
            Add company information, policies, and other details that the AI can reference during interviews.
            This knowledge will be made available to the AI as part of its context.
          </p>
          {isLoading ? (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-gray-500">Loading knowledge base...</p>
            </div>
          ) : (
            <div className="mb-4">
              <textarea
                className="w-full h-[400px] p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={knowledgeBaseContent}
                onChange={(e) => setKnowledgeBaseContent(e.target.value)}
                placeholder="Enter company information, policies, or other details that the AI should know during interviews..."
              />
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Knowledge Base"}
          </Button>
        </div>
      </div>
    </div>
  );
}; 