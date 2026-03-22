import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  ImagePlus,
  Code
} from 'lucide-react';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...", 
  minHeight = "200px",
  label 
}: RichTextEditorProps) => {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  // Saved selection range so we can restore it after dialog opens
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    saveSelection();
    setUrlInput('');
    setLinkDialogOpen(true);
  };

  const confirmInsertLink = () => {
    const url = urlInput.trim();
    if (url) {
      editorRef.current?.focus();
      restoreSelection();
      executeCommand('createLink', url);
    }
    setLinkDialogOpen(false);
    setUrlInput('');
  };

  const insertImage = () => {
    saveSelection();
    setUrlInput('');
    setImageDialogOpen(true);
  };

  const confirmInsertImage = () => {
    const url = urlInput.trim();
    if (url) {
      editorRef.current?.focus();
      restoreSelection();
      executeCommand('insertImage', url);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
    setImageDialogOpen(false);
    setUrlInput('');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select a valid image file (PNG, JPG, GIF, WebP).', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Image must be less than 5MB. Please compress or resize the image first.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      editorRef.current?.focus();
      executeCommand('insertImage', dataUrl);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatBlock = (tag: string) => {
    executeCommand('formatBlock', tag);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      
      {/* Insert Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => e.key === 'Enter' && confirmInsertLink()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmInsertLink} disabled={!urlInput.trim()}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insert Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image from URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.png"
              onKeyDown={(e) => e.key === 'Enter' && confirmInsertImage()}
              autoFocus
            />
            {urlInput.trim() && (
              <div className="rounded border overflow-hidden max-h-40 flex items-center justify-center bg-muted">
                <img
                  src={urlInput}
                  alt="Preview"
                  className="max-h-40 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmInsertImage} disabled={!urlInput.trim()}>Insert Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={`border rounded-md ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 border-b">
          {/* Text Formatting */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('bold')}
            title="Bold (Ctrl+B)"
            className="h-8 w-8 p-0"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('italic')}
            title="Italic (Ctrl+I)"
            className="h-8 w-8 p-0"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('underline')}
            title="Underline (Ctrl+U)"
            className="h-8 w-8 p-0"
          >
            <Underline className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('h1')}
            title="Heading 1"
            className="h-8 w-8 p-0"
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('h2')}
            title="Heading 2"
            className="h-8 w-8 p-0"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('h3')}
            title="Heading 3"
            className="h-8 w-8 p-0"
          >
            <Heading3 className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('insertUnorderedList')}
            title="Bullet List"
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('insertOrderedList')}
            title="Numbered List"
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('justifyLeft')}
            title="Align Left"
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('justifyCenter')}
            title="Align Center"
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('justifyRight')}
            title="Align Right"
            className="h-8 w-8 p-0"
          >
            <AlignRight className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Insert */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertLink}
            title="Insert Link"
            className="h-8 w-8 p-0"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertImage}
            title="Insert Image from URL"
            className="h-8 w-8 p-0"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => imageFileInputRef.current?.click()}
            title="Upload Image from File"
            className="h-8 w-8 p-0"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>
          <input
            ref={imageFileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageFileUpload}
          />

          <Separator orientation="vertical" className="h-6" />

          {/* Code */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('pre')}
            title="Code Block"
            className="h-8 w-8 p-0"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        {/* Editor Content */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="p-4 outline-none prose prose-sm max-w-none"
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
      </div>
      <style>{`
        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .prose h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
        .prose h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
        .prose h3 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; }
        .prose p { margin: 0.5em 0; }
        .prose ul, .prose ol { padding-left: 1.5em; margin: 0.5em 0; }
        .prose a { color: #3b82f6; text-decoration: underline; }
        .prose img { max-width: 100%; height: auto; }
        .prose pre { background: #1f2937; color: #f3f4f6; padding: 1em; border-radius: 0.375rem; overflow-x: auto; }
      `}</style>
    </div>
  );
};
