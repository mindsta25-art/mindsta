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
  // Image size state for new insertions
  const [imageWidth, setImageWidth] = useState<'full' | '75' | '50' | '25' | 'original' | 'custom'>('full');
  const [imageCustomWidthValue, setImageCustomWidthValue] = useState('50');
  const [imageUnit, setImageUnit] = useState<'%' | 'px'>('%');
  // Image alignment for new insertions
  const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right'>('left');
  // Selected image inside the editor (for the inline resize bar)
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [floatingCustomW, setFloatingCustomW] = useState('50');
  const [floatingUnit, setFloatingUnit] = useState<'%' | 'px'>('%');

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
      const style = buildImgStyleStr();
      document.execCommand('insertHTML', false, `<img src="${url}" alt="" style="${style}" />`);
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
    const style = buildImgStyleStr(); // capture at upload time
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, `<img src="${dataUrl}" alt="" style="${style}" />`);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Build a CSS style string for an inserted image based on current size + alignment state
  const buildImgStyleStr = (): string => {
    let w = '';
    if (imageWidth === 'full') w = '100%';
    else if (imageWidth === '75') w = '75%';
    else if (imageWidth === '50') w = '50%';
    else if (imageWidth === '25') w = '25%';
    else if (imageWidth === 'custom') w = `${imageCustomWidthValue}${imageUnit}`;
    const widthPart = w ? `width:${w};` : '';
    const alignStyle =
      imageAlign === 'center' ? 'display:block;margin-left:auto;margin-right:auto;'
      : imageAlign === 'right'  ? 'display:block;margin-left:auto;margin-right:0;'
      : 'display:block;margin-left:0;margin-right:auto;';
    return `${widthPart}max-width:100%;height:auto;${alignStyle}`;
  };

  // Apply alignment to the currently-selected image in the editor
  const applySelectedImgAlign = (align: 'left' | 'center' | 'right') => {
    if (!selectedImg) return;
    if (align === 'center') {
      selectedImg.style.display = 'block';
      selectedImg.style.marginLeft = 'auto';
      selectedImg.style.marginRight = 'auto';
    } else if (align === 'right') {
      selectedImg.style.display = 'block';
      selectedImg.style.marginLeft = 'auto';
      selectedImg.style.marginRight = '0';
    } else {
      selectedImg.style.display = 'block';
      selectedImg.style.marginLeft = '0';
      selectedImg.style.marginRight = 'auto';
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // Apply a width to the currently-selected image in the editor
  const applySelectedImgWidth = (width: string) => {
    if (!selectedImg) return;
    if (width === 'auto') {
      selectedImg.style.removeProperty('width');
    } else {
      selectedImg.style.width = width;
    }
    selectedImg.style.maxWidth = '100%';
    selectedImg.style.height = 'auto';
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // Detect clicks on <img> elements inside the editor
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setSelectedImg(target as HTMLImageElement);
    } else {
      setSelectedImg(null);
    }
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
            {/* Image size picker */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs text-muted-foreground">Display Size</Label>
              <div className="flex flex-wrap gap-1.5">
                {(['full', '75', '50', '25', 'original', 'custom'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setImageWidth(val)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      imageWidth === val
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {val === 'full' ? 'Full Width' : val === 'original' ? 'Original' : val === 'custom' ? 'Custom' : `${val}%`}
                  </button>
                ))}
              </div>
              {imageWidth === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={imageCustomWidthValue}
                    onChange={(e) => setImageCustomWidthValue(e.target.value)}
                    className="w-20 h-8 text-sm"
                    min="1"
                    max={imageUnit === '%' ? 100 : 5000}
                  />
                  <div className="flex border rounded overflow-hidden">
                    {(['%', 'px'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setImageUnit(u)}
                        className={`text-xs px-2 py-1 font-mono transition-colors ${
                          imageUnit === u ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Image alignment picker */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs text-muted-foreground">Alignment</Label>
              <div className="flex gap-1.5">
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setImageAlign(a)}
                    className={`flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded border transition-colors ${
                      imageAlign === a
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {a === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                    {a === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                    {a === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmInsertImage} disabled={!urlInput.trim()}>Insert Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={`border rounded-md ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}`} >
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

        {/* Inline image resize bar — appears when an image inside the editor is clicked */}
        {selectedImg && (
          <div
            className="flex flex-wrap items-center gap-1 p-1.5 border-b bg-purple-50 dark:bg-purple-950/20"
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300 mr-1 shrink-0">🖼 Image size:</span>
            {(['25%', '50%', '75%', '100%', 'auto'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); applySelectedImgWidth(w); }}
                className="text-xs px-2 py-0.5 rounded border bg-white dark:bg-card hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-700 transition-colors"
              >
                {w === 'auto' ? 'Original' : w}
              </button>
            ))}
            <Separator orientation="vertical" className="h-4 mx-0.5" />
            <input
              type="number"
              value={floatingCustomW}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => setFloatingCustomW(e.target.value)}
              className="w-12 h-6 text-xs border rounded px-1 bg-white dark:bg-card border-purple-200 dark:border-purple-700"
              min="1"
              max={floatingUnit === '%' ? 100 : 5000}
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setFloatingUnit((u) => (u === '%' ? 'px' : '%')); }}
              className="text-xs w-7 h-6 rounded border bg-white dark:bg-card hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-700 font-mono transition-colors"
            >
              {floatingUnit}
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applySelectedImgWidth(`${floatingCustomW}${floatingUnit}`); }}
              className="text-xs px-2 h-6 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              Set
            </button>
            <Separator orientation="vertical" className="h-4 mx-0.5" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300 shrink-0">Align:</span>
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); applySelectedImgAlign(a); }}
                className="h-6 w-6 flex items-center justify-center rounded border bg-white dark:bg-card hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-700 transition-colors"
                title={`Align ${a}`}
              >
                {a === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                {a === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                {a === 'right' && <AlignRight className="w-3.5 h-3.5" />}
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setSelectedImg(null); }}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground px-1"
            >
              ✕ Done
            </button>
          </div>
        )}
        {/* Editor Content */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onClick={handleEditorClick}
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
