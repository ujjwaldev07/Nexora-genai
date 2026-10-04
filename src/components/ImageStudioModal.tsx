import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Send, 
  X, 
  Sliders, 
  RotateCw,
  Eye,
  Check,
  Wand2,
  Upload,
  Layers,
  ArrowRight,
  SplitSquareVertical,
  Maximize2,
  RefreshCw,
  Trash2,
  Palette,
  Ratio,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Copy
} from 'lucide-react';
import { GeneratedImage } from '../types';

export interface ImageStudioConfig {
  isOpen: boolean;
  initialMode?: 'create' | 'edit';
  initialImage?: string;
  initialPrompt?: string;
}

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendImageToChat: (imageUrl: string, prompt: string) => void;
  initialMode?: 'create' | 'edit';
  initialImage?: string;
  initialPrompt?: string;
}

const STYLES = [
  { id: 'photorealistic', name: 'Photorealistic', desc: 'Ultra-detailed 8K photography & natural studio lighting' },
  { id: 'cinematic', name: 'Cinematic Still', desc: 'Dramatic anamorphic lens, 35mm film color grading' },
  { id: 'minimalist-3d', name: '3D Render', desc: 'Clean isometric Octane render, soft clay shadows' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Futuristic holographic glow & moody dark atmosphere' },
  { id: 'vector-art', name: 'Vector Graphic', desc: 'Clean geometric lines, modern flat editorial palette' },
  { id: 'watercolor', name: 'Watercolor Art', desc: 'Expressive organic washes and subtle textured bleed' },
  { id: 'anime', name: 'Anime Visual', desc: 'Studio Ghibli inspired vibrant keyframe illustration' },
  { id: 'pixel-art', name: '16-Bit Pixel Art', desc: 'Nostalgic crisp pixel grid with arcade color palette' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', desc: 'Profile & Feed' },
  { id: '16:9', label: '16:9 Wide', desc: 'Hero & Desktop' },
  { id: '9:16', label: '9:16 Story', desc: 'Mobile & Vertical' },
  { id: '4:3', label: '4:3 Standard', desc: 'Card Thumbnail' },
  { id: '3:4', label: '3:4 Portrait', desc: 'Character & Poster' },
  { id: '4:1', label: '4:1 Panoramic', desc: 'Header Banner' },
];

const IMAGE_SIZES = ['512px', '1K', '2K', '4K'] as const;

const INSPIRATION_PROMPTS = [
  'A luminous cyberpunk robotics engineer working in a zero-gravity laboratory surrounded by glowing holographic blueprints',
  'An ethereal ancient glass greenhouse at golden hour, filled with bioluminescent floating flora and gentle sunbeams',
  'An isometric futuristic smart city hub with miniature bullet trains, lush sky gardens, and solar crystal towers',
  'A cinematic portrait of an astrophysicist holding a miniature spiral galaxy in their hands, deep cosmic nebula background',
  'A minimalist Bauhaus architectural villa perched on a Nordic cliff over a foggy fjord at dawn',
  'A detailed macro photograph of an intricate mechanical watch movement made of iridescent crystals and titanium gears',
];

const QUICK_EDIT_PRESETS = [
  { label: '✨ Add Neon Halo & Aura', prompt: 'Add glowing neon cyan and magenta holographic lighting effects around the subject.' },
  { label: '❄️ Winter Blizzard Scene', prompt: 'Transform the environment into a snowy winter blizzard with frosted surfaces and gentle snowfall.' },
  { label: '🌅 Golden Hour Lighting', prompt: 'Change lighting to warm golden hour sunset with rich orange hues and long dramatic soft shadows.' },
  { label: '🎨 Convert to Watercolor', prompt: 'Re-render this exact composition as an artistic watercolor painting on textured heavy paper.' },
  { label: '🏙️ Futuristic Sci-Fi Hub', prompt: 'Replace background with a high-tech utopian sci-fi megacity skyline.' },
  { label: '🌸 Anime Studio Ghibli', prompt: 'Transform this image into a hand-drawn Japanese anime aesthetic with vibrant lush colors.' },
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onSendImageToChat,
  initialMode = 'create',
  initialImage,
  initialPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'gallery'>('create');
  
  // Creation States
  const [createPrompt, setCreatePrompt] = useState(initialPrompt || '');
  const [style, setStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState<'512px' | '1K' | '2K' | '4K'>('1K');
  const [isGenerating, setIsGenerating] = useState(false);

  // Edit States
  const [baseImage, setBaseImage] = useState<string | null>(initialImage || null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editAspectRatio, setEditAspectRatio] = useState('1:1');
  const [compareMode, setCompareMode] = useState<'split' | 'side' | 'single'>('split');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [editRevisions, setEditRevisions] = useState<{ id: string; url: string; prompt: string }[]>([]);

  // Preview & Gallery
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialMode) setActiveTab(initialMode);
      if (initialImage) {
        setBaseImage(initialImage);
        setActiveTab('edit');
      }
      if (initialPrompt) {
        if (initialMode === 'edit') setEditPrompt(initialPrompt);
        else setCreatePrompt(initialPrompt);
      }
      setErrorMessage(null);
    }
  }, [isOpen, initialMode, initialImage, initialPrompt]);

  if (!isOpen) return null;

  // Handle Text-to-Image Generation
  const handleGenerate = async () => {
    if (!createPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: createPrompt.trim(),
          aspectRatio,
          style,
          imageSize,
          model: 'gemini-3.1-flash-image-preview',
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        const item: GeneratedImage = {
          id: 'img_' + Date.now(),
          url: data.imageUrl,
          prompt: createPrompt.trim(),
          style,
          aspectRatio,
          imageSize,
          timestamp: Date.now(),
          provider: data.provider || 'gemini',
          model: data.model || 'gemini-3.1-flash-image-preview',
        };
        setCurrentImage(item);
        setGallery((prev) => [item, ...prev]);
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setErrorMessage(err.message || 'Failed to generate visual asset');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Image-to-Image / Editing with gemini-3.1-flash-image-preview
  const handleEditImage = async () => {
    if (!baseImage || !editPrompt.trim() || isEditing) return;

    setIsEditing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseImage,
          editPrompt: editPrompt.trim(),
          aspectRatio: editAspectRatio,
          imageSize,
          model: 'gemini-3.1-flash-image-preview',
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        const item: GeneratedImage = {
          id: 'img_edit_' + Date.now(),
          url: data.imageUrl,
          prompt: editPrompt.trim(),
          timestamp: Date.now(),
          provider: data.provider || 'gemini',
          model: data.model || 'gemini-3.1-flash-image-preview',
          isEdit: true,
          originalImageUrl: baseImage,
          editInstruction: editPrompt.trim(),
        };
        setCurrentImage(item);
        setGallery((prev) => [item, ...prev]);
        setEditRevisions((prev) => [
          ...prev,
          { id: item.id, url: item.url, prompt: editPrompt.trim() },
        ]);
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      console.error('Image edit error:', err);
      setErrorMessage(err.message || 'Failed to edit image');
    } finally {
      setIsEditing(false);
    }
  };

  // Image File Upload for Editing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setBaseImage(base64);
      setEditRevisions([{ id: 'original', url: base64, prompt: 'Original Source' }]);
    };
    reader.readAsDataURL(file);
  };

  const handleInspirePrompt = () => {
    const randomPrompt = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
    setCreatePrompt(randomPrompt);
  };

  const handleSendToChat = () => {
    if (!currentImage) return;
    onSendImageToChat(currentImage.url, currentImage.prompt);
    onClose();
  };

  const handleCopyImageUrl = () => {
    if (!currentImage) return;
    navigator.clipboard.writeText(currentImage.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleStartEditFromCurrent = (img: GeneratedImage) => {
    setBaseImage(img.url);
    setEditRevisions([{ id: 'rev_orig', url: img.url, prompt: 'Base Image' }]);
    setActiveTab('edit');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-5xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111] shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#222222] flex items-center justify-between bg-slate-50 dark:bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Gemini Visual Creation & Image Studio
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create new illustrations or transform existing images using multi-modal prompt instructions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2A2A2A] text-xs">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'create'
                    ? 'bg-white dark:bg-[#2A2A2A] text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Image</span>
              </button>

              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'edit'
                    ? 'bg-white dark:bg-[#2A2A2A] text-purple-600 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Edit & Transform</span>
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-white dark:bg-[#2A2A2A] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Gallery ({gallery.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1F1F1F] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
          
          {/* Left Configuration Pane */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* TAB 1: CREATE IMAGE */}
            {activeTab === 'create' && (
              <div className="space-y-4 animate-fade-in">
                {/* Prompt Section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Creative Prompt</span>
                    </label>
                    <button
                      onClick={handleInspirePrompt}
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Inspire Me</span>
                    </button>
                  </div>
                  <textarea
                    value={createPrompt}
                    onChange={(e) => setCreatePrompt(e.target.value)}
                    placeholder="Describe the subject, lighting, mood, color scheme, and composition..."
                    rows={4}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-[#282828] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none text-xs leading-relaxed"
                  />
                </div>

                {/* Style Presets */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Aesthetic Style Preset
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setStyle(st.id)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          style === st.id
                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-semibold shadow-sm'
                            : 'border-slate-200 dark:border-[#242424] hover:bg-slate-50 dark:hover:bg-[#181818] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-medium text-xs text-slate-900 dark:text-white">{st.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal line-clamp-1 mt-0.5">
                          {st.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio & Quality Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Aspect Ratio
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-[#282828] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {ASPECT_RATIOS.map((ar) => (
                        <option key={ar.id} value={ar.id}>
                          {ar.label} ({ar.desc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Resolution / Size
                    </label>
                    <div className="flex gap-1">
                      {IMAGE_SIZES.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setImageSize(sz)}
                          className={`flex-1 py-2 rounded-lg border text-center font-medium transition-all ${
                            imageSize === sz
                              ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                              : 'border-slate-200 dark:border-[#242424] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181818]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Submit */}
                <button
                  onClick={handleGenerate}
                  disabled={!createPrompt.trim() || isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 shadow-md shadow-indigo-600/20 transition-all text-xs"
                >
                  {isGenerating ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing with Gemini 3.1 Flash Image...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Visual Asset</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: EDIT & TRANSFORM IMAGE */}
            {activeTab === 'edit' && (
              <div className="space-y-4 animate-fade-in">
                {/* Source Image Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-purple-500" />
                      <span>Source Image to Modify</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Local File</span>
                    </button>
                  </div>

                  {baseImage ? (
                    <div className="relative rounded-xl border border-slate-200 dark:border-[#282828] bg-slate-900 overflow-hidden flex items-center justify-center h-28 group">
                      <img
                        src={baseImage}
                        alt="Source to edit"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded bg-white text-slate-900 font-medium text-[11px]"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => setBaseImage(null)}
                          className="px-2.5 py-1 rounded bg-rose-600 text-white font-medium text-[11px]"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-[#333333] rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-slate-50/50 dark:bg-[#141414]"
                    >
                      <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Click to upload an image to edit</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP, or pick from gallery below</div>
                    </div>
                  )}
                </div>

                {/* Edit Instruction Prompt */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Transformation Instructions (Prompt)
                  </label>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g. Add a glowing cyberpunk mask to the face, replace the background with a snowy mountain at sunset, enhance lighting..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-[#282828] focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none text-xs leading-relaxed"
                  />
                </div>

                {/* Quick Edit Presets */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Quick AI Transformation Presets
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_EDIT_PRESETS.map((qp, idx) => (
                      <button
                        key={idx}
                        onClick={() => setEditPrompt(qp.prompt)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#181818] hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-[#262626] transition-colors text-[11px]"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio & Quality */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Output Aspect
                    </label>
                    <select
                      value={editAspectRatio}
                      onChange={(e) => setEditAspectRatio(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-[#282828] text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      {ASPECT_RATIOS.map((ar) => (
                        <option key={ar.id} value={ar.id}>{ar.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Quality
                    </label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value as any)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-[#282828] text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      {IMAGE_SIZES.map((sz) => (
                        <option key={sz} value={sz}>{sz} Resolution</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Submit */}
                <button
                  onClick={handleEditImage}
                  disabled={!baseImage || !editPrompt.trim() || isEditing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-50 shadow-md shadow-purple-600/20 transition-all text-xs"
                >
                  {isEditing ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Applying Transformation with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Apply AI Image Edit</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: GALLERY VIEW */}
            {activeTab === 'gallery' && (
              <div className="space-y-3 animate-fade-in max-h-[460px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="font-semibold">Session Visual History</span>
                  <span className="text-[11px]">{gallery.length} assets</span>
                </div>
                {gallery.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#222222]">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No generated or edited images yet in this session.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {gallery.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setCurrentImage(img)}
                        className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all bg-slate-950 ${
                          currentImage?.id === img.id
                            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-[#262626] opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.prompt}
                          className="w-full h-28 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-2 bg-white dark:bg-[#161616] border-t border-slate-200 dark:border-[#222222]">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#222222] text-slate-600 dark:text-slate-400">
                              {img.isEdit ? 'Edited' : 'Created'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {img.model ? img.model.replace('gemini-', '') : 'preview'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-1 mt-1 font-medium">
                            {img.prompt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error Message Toast */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1 text-[11px]">{errorMessage}</div>
              </div>
            )}
          </div>

          {/* Right Live Visual Stage & Canvas */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            
            {/* Controls Bar for Stage */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Active Canvas
                </span>
                {currentImage?.isEdit && (
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2A2A2A] text-[10px]">
                    <button
                      onClick={() => setCompareMode('split')}
                      className={`px-2 py-0.5 rounded font-medium ${compareMode === 'split' ? 'bg-white dark:bg-[#2A2A2A] text-purple-400' : 'text-slate-400'}`}
                    >
                      Split Slider
                    </button>
                    <button
                      onClick={() => setCompareMode('side')}
                      className={`px-2 py-0.5 rounded font-medium ${compareMode === 'side' ? 'bg-white dark:bg-[#2A2A2A] text-purple-400' : 'text-slate-400'}`}
                    >
                      Side by Side
                    </button>
                    <button
                      onClick={() => setCompareMode('single')}
                      className={`px-2 py-0.5 rounded font-medium ${compareMode === 'single' ? 'bg-white dark:bg-[#2A2A2A] text-purple-400' : 'text-slate-400'}`}
                    >
                      Result Only
                    </button>
                  </div>
                )}
              </div>

              {currentImage && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyImageUrl}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1A1A1A] hover:bg-slate-200 dark:hover:bg-[#242424] text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={currentImage.url}
                    download={`gemini_image_${Date.now()}.png`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1A1A1A] hover:bg-slate-200 dark:hover:bg-[#242424] text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download HD</span>
                  </a>
                  <button
                    onClick={handleSendToChat}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Attach to Chat</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Stage Canvas Viewport */}
            <div className="flex-1 min-h-[380px] rounded-2xl border border-slate-200 dark:border-[#222222] bg-[#070707] flex items-center justify-center overflow-hidden relative shadow-inner">
              {currentImage ? (
                currentImage.isEdit && currentImage.originalImageUrl && compareMode === 'split' ? (
                  /* Split Slider Comparison View */
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    {/* Background Original Image */}
                    <img
                      src={currentImage.originalImageUrl}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Foreground Modified Image Clipped */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img
                        src={currentImage.url}
                        alt="Edited"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-10 cursor-ew-resize flex items-center justify-center"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg border border-slate-300 text-[10px] font-bold">
                        ↔
                      </div>
                    </div>

                    {/* Draggable Slider Track */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-ew-resize z-20"
                    />

                    {/* Badge Overlay */}
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-white text-[10px] font-semibold">
                      Before (Original)
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-purple-600/80 backdrop-blur text-white text-[10px] font-semibold">
                      After (AI Edit)
                    </div>
                  </div>
                ) : currentImage.isEdit && currentImage.originalImageUrl && compareMode === 'side' ? (
                  /* Side-by-Side Comparison */
                  <div className="grid grid-cols-2 w-full h-full gap-2 p-2">
                    <div className="relative rounded-lg overflow-hidden bg-black/50 flex items-center justify-center">
                      <img
                        src={currentImage.originalImageUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px]">
                        Original Source
                      </span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden bg-black/50 flex items-center justify-center">
                      <img
                        src={currentImage.url}
                        alt="Edited"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-purple-600/80 text-white text-[10px]">
                        Gemini Edit
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Single Clean Image Display */
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                )
              ) : (
                <div className="text-center text-slate-500 p-8 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center mx-auto text-slate-400">
                    <ImageIcon className="w-7 h-7 opacity-50" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-300 text-sm">Visual Stage Ready</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      Type a prompt to create a new illustration or upload an image to apply prompt-driven AI edits.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Details / Prompt Metadata Footer */}
            {currentImage && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#222222] flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {currentImage.prompt}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>Model: {currentImage.model || 'gemini-3.1-flash-image-preview'}</span>
                    {currentImage.aspectRatio && <span>Aspect: {currentImage.aspectRatio}</span>}
                    {currentImage.style && <span>Style: {currentImage.style}</span>}
                  </div>
                </div>

                <button
                  onClick={() => handleStartEditFromCurrent(currentImage)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors shrink-0"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Iterate & Edit This</span>
                </button>
              </div>
            )}

            {/* Quick Gallery Bar below Stage */}
            {gallery.length > 0 && (
              <div>
                <div className="font-semibold text-[11px] text-slate-500 mb-1 px-1">
                  Recent Generated & Edited Assets ({gallery.length})
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.prompt}
                      onClick={() => setCurrentImage(img)}
                      className={`w-14 h-14 object-cover rounded-xl cursor-pointer border-2 transition-all shrink-0 ${
                        currentImage?.id === img.id
                          ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/20'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
