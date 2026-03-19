import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { submitSuggestion } from '@/api/suggestions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SuggestionBoxProps {
  variant?: 'card' | 'button' | 'inline';
  defaultGrade?: string;
  defaultSubject?: string;
}

export const SuggestionBox = ({ 
  variant = 'card',
  defaultGrade,
  defaultSubject 
}: SuggestionBoxProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    subject: defaultSubject || '',
    grade: defaultGrade || '',
  });

  const handleTopicChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, topic: e.target.value }));
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, subject: e.target.value }));
  }, []);

  const handleGradeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, grade: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic for your suggestion.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitSuggestion({
        topic: formData.topic,
        description: formData.description,
        subject: formData.subject,
        grade: formData.grade,
      });

      toast({
        title: 'Success!',
        description: 'Your suggestion has been submitted. Thank you for your feedback!',
      });

      // Reset form
      setFormData({
        topic: '',
        description: '',
        subject: defaultSubject || '',
        grade: defaultGrade || '',
      });
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error submitting suggestion:', error);
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Failed to submit suggestion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestionForm = useMemo(() => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="topic" className="text-sm font-medium">
          Topic / Content Suggestion *
        </label>
        <Input
          id="topic"
          placeholder="e.g., Algebra equations, Photosynthesis..."
          value={formData.topic}
          onChange={handleTopicChange}
          maxLength={200}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="grade" className="text-sm font-medium">
            Grade (Optional)
          </label>
          <Select
            value={formData.grade}
            onValueChange={handleGradeChange}
          >
            <SelectTrigger id="grade">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Grade</SelectItem>
              <SelectItem value="1">Grade 1</SelectItem>
              <SelectItem value="2">Grade 2</SelectItem>
              <SelectItem value="3">Grade 3</SelectItem>
              <SelectItem value="4">Grade 4</SelectItem>
              <SelectItem value="5">Grade 5</SelectItem>
              <SelectItem value="6">Grade 6</SelectItem>
              <SelectItem value="Common Entrance">Common Entrance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-medium">
            Subject (Optional)
          </label>
          <Input
            id="subject"
            placeholder="e.g., Mathematics, Science"
            value={formData.subject}
            onChange={handleSubjectChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Additional Details (Optional)
        </label>
        <Textarea
          id="description"
          placeholder="Provide more details about what you'd like to learn..."
          value={formData.description}
          onChange={handleDescriptionChange}
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {formData.description.length}/500 characters
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Suggestion
            </>
          )}
        </Button>
        {variant === 'button' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  ), [formData, isSubmitting, variant, handleSubmit, handleTopicChange, handleGradeChange, handleSubjectChange, handleDescriptionChange]);

  // Card variant - always visible
  if (variant === 'card') {
    return (
      <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Suggest Content</CardTitle>
              <CardDescription>
                Help us improve by suggesting topics you'd like to learn
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {suggestionForm}
        </CardContent>
      </Card>
    );
  }

  // Button variant - opens a dialog
  if (variant === 'button') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/50 dark:to-cyan-950/50 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggest Content
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-indigo-600" />
              Suggest New Content
            </DialogTitle>
            <DialogDescription>
              Share your ideas for new topics, lessons, or content you'd like to see on the platform.
            </DialogDescription>
          </DialogHeader>
          {suggestionForm}
        </DialogContent>
      </Dialog>
    );
  }

  // Inline variant - minimal floating button
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
        title="Suggest Content"
      >
        <Lightbulb className="w-6 h-6 text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Suggest New Content</CardTitle>
                        <CardDescription>
                          Help us improve by suggesting topics you'd like to learn
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {suggestionForm}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
