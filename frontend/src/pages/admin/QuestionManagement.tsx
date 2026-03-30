import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/components/AdminLayout';
import {
  MessageSquare,
  ThumbsUp,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye
} from 'lucide-react';
import { getAllCourseQuestions, addCourseAnswer, acceptAnswer } from '@/api/courseQuestions';
import { useToast } from '@/hooks/use-toast';
import { formatUserName } from '@/lib/stringUtils';

const QuestionManagement = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'answered' | 'closed'>('all');
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const [submittingAnswer, setSubmittingAnswer] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getAllCourseQuestions();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch questions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText[questionId]?.trim()) return;

    setSubmittingAnswer(questionId);
    try {
      await addCourseAnswer(questionId, answerText[questionId]);
      
      toast({
        title: 'Answer posted!',
        description: 'Your answer has been added to the question.'
      });

      // Refresh questions
      await fetchQuestions();
      setAnswerText({ ...answerText, [questionId]: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to post answer',
        variant: 'destructive'
      });
    } finally {
      setSubmittingAnswer(null);
    }
  };

  const handleAcceptAnswer = async (questionId: string, answerId: string) => {
    try {
      await acceptAnswer(questionId, answerId);
      
      toast({
        title: 'Answer accepted!',
        description: 'This answer has been marked as the accepted solution.'
      });

      // Refresh questions
      await fetchQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to accept answer',
        variant: 'destructive'
      });
    }
  };

  const filteredQuestions = questions
    .filter(q => {
      const matchesSearch = 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: questions.length,
    open: questions.filter(q => q.status === 'open').length,
    answered: questions.filter(q => q.status === 'answered').length,
    closed: questions.filter(q => q.status === 'closed').length
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Question Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage and respond to student questions across all lessons
            </p>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Answered</p>
                <p className="text-2xl font-bold">{stats.answered}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold">{stats.closed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search questions, students, or subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="answered">Answered</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No questions found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{question.question}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">{formatUserName(question.studentName)}</span>
                      <span>•</span>
                      <span>{question.subject} - Grade {question.grade}</span>
                      {question.term && (
                        <>
                          <span>•</span>
                          <span>{question.term}</span>
                        </>
                      )}
                      {question.lessonTitle && (
                        <>
                          <span>•</span>
                          <span>{question.lessonTitle}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(question.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        question.status === 'open'
                          ? 'destructive'
                          : question.status === 'answered'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {question.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{question.upvotes}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{question.views}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Existing Answers */}
                {question.answers && question.answers.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <h4 className="font-semibold text-sm">Answers ({question.answers.length})</h4>
                    {question.answers.map((answer: any) => (
                      <div
                        key={answer._id}
                        className={`border rounded-lg p-4 ${
                          answer.isAccepted ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatUserName(answer.userName)}</span>
                            {answer.isInstructor && (
                              <Badge variant="default" className="text-xs">Instructor</Badge>
                            )}
                            {answer.isAccepted && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Accepted
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <ThumbsUp className="w-3 h-3" />
                              <span>{answer.upvotes}</span>
                            </div>
                            {!answer.isAccepted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAcceptAnswer(question._id, answer._id)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm mb-1">{answer.answer}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(answer.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer Form */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-3">Add Your Answer</h4>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write your answer as an instructor..."
                      value={answerText[question._id] || ''}
                      onChange={(e) =>
                        setAnswerText({ ...answerText, [question._id]: e.target.value })
                      }
                      rows={3}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSubmitAnswer(question._id)}
                      disabled={
                        submittingAnswer === question._id ||
                        !answerText[question._id]?.trim()
                      }
                    >
                      {submittingAnswer === question._id ? (
                        'Posting...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </AdminLayout>
  );
};

export default QuestionManagement;
